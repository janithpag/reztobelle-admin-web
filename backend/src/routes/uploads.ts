import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';

// Cloudinary configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Type for upload result
interface UploadResult {
	public_id: string;
	url: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	bytes: number;
	created_at: string;
}

// Response schemas (JSON Schema format for Fastify 5.x)
const uploadResponseSchema = {
	type: 'object',
	properties: {
		success: { type: 'boolean' },
		data: {
			type: 'object',
			properties: {
				public_id: { type: 'string' },
				url: { type: 'string' },
				secure_url: { type: 'string' },
				width: { type: 'number' },
				height: { type: 'number' },
				format: { type: 'string' },
				bytes: { type: 'number' },
				created_at: { type: 'string' },
			},
		},
		error: { type: 'string' },
	},
	required: ['success'],
};

const deleteResponseSchema = {
	type: 'object',
	properties: {
		success: { type: 'boolean' },
		message: { type: 'string' },
		error: { type: 'string' },
	},
	required: ['success'],
};

export default async function uploadsRoutes(fastify: FastifyInstance) {
	// Register multipart support
	await fastify.register(require('@fastify/multipart'), {
		limits: {
			fileSize: 10 * 1024 * 1024, // 10MB limit
		},
	});

	// Upload single image
	fastify.post('/upload', {
		schema: {
			description: 'Upload a single image to Cloudinary',
			tags: ['uploads'],
			consumes: ['multipart/form-data'],
			response: {
				200: uploadResponseSchema,
				400: { type: 'object', properties: { error: { type: 'string' } } },
				500: { type: 'object', properties: { error: { type: 'string' } } },
			},
		},
	}, async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			// Get the uploaded file
			const data = await (request as any).file();
			
			if (!data) {
				return reply.code(400).send({
					success: false,
					error: 'No file uploaded',
				});
			}

			// Validate file type
			if (!data.mimetype.startsWith('image/')) {
				return reply.code(400).send({
					success: false,
					error: 'Only image files are allowed',
				});
			}

			// Convert buffer to base64
			const buffer = await data.toBuffer();
			const base64String = `data:${data.mimetype};base64,${buffer.toString('base64')}`;

			// Upload to Cloudinary with jewelry-specific transformations
			const uploadResult = await cloudinary.uploader.upload(base64String, {
				folder: 'reztobelle/products',
				transformation: [
					{
						quality: 'auto',
						fetch_format: 'auto',
					},
					{
						width: 1200,
						height: 1200,
						crop: 'fit',
					},
				],
				eager: [
					{
						width: 400,
						height: 400,
						crop: 'fill',
						quality: 'auto',
						fetch_format: 'auto',
					},
					{
						width: 150,
						height: 150,
						crop: 'thumb',
						quality: 'auto',
						fetch_format: 'auto',
					},
				],
			});

			return reply.send({
				success: true,
				data: {
					public_id: uploadResult.public_id,
					url: uploadResult.url,
					secure_url: uploadResult.secure_url,
					width: uploadResult.width,
					height: uploadResult.height,
					format: uploadResult.format,
					bytes: uploadResult.bytes,
					created_at: uploadResult.created_at,
				},
			});
		} catch (error) {
			console.error('Upload error:', error);
			return reply.code(500).send({
				success: false,
				error: error instanceof Error ? error.message : 'Upload failed',
			});
		}
	});

	// Upload multiple images
	fastify.post('/upload-multiple', {
		schema: {
			description: 'Upload multiple images to Cloudinary',
			tags: ['uploads'],
			consumes: ['multipart/form-data'],
			response: {
				200: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						data: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									public_id: { type: 'string' },
									url: { type: 'string' },
									secure_url: { type: 'string' },
									width: { type: 'number' },
									height: { type: 'number' },
									format: { type: 'string' },
									bytes: { type: 'number' },
									created_at: { type: 'string' },
								},
							},
						},
						errors: {
							type: 'array',
							items: { type: 'string' },
						},
					},
				},
			},
		},
	}, async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const parts = (request as any).files();
			const uploadResults: UploadResult[] = [];
			const errors: string[] = [];

			for await (const part of parts) {
				try {
					if (!part.mimetype.startsWith('image/')) {
						errors.push(`File ${part.filename}: Only image files are allowed`);
						continue;
					}

					const buffer = await part.toBuffer();
					const base64String = `data:${part.mimetype};base64,${buffer.toString('base64')}`;

					const uploadResult = await cloudinary.uploader.upload(base64String, {
						folder: 'reztobelle/products',
						transformation: [
							{
								quality: 'auto',
								fetch_format: 'auto',
							},
							{
								width: 1200,
								height: 1200,
								crop: 'fit',
							},
						],
						eager: [
							{
								width: 400,
								height: 400,
								crop: 'fill',
								quality: 'auto',
								fetch_format: 'auto',
							},
							{
								width: 150,
								height: 150,
								crop: 'thumb',
								quality: 'auto',
								fetch_format: 'auto',
							},
						],
					});

					uploadResults.push({
						public_id: uploadResult.public_id,
						url: uploadResult.url,
						secure_url: uploadResult.secure_url,
						width: uploadResult.width,
						height: uploadResult.height,
						format: uploadResult.format,
						bytes: uploadResult.bytes,
						created_at: uploadResult.created_at,
					});
				} catch (uploadError) {
					errors.push(`File ${part.filename}: ${uploadError instanceof Error ? uploadError.message : 'Upload failed'}`);
				}
			}

			return reply.send({
				success: uploadResults.length > 0,
				data: uploadResults,
				errors,
			});
		} catch (error) {
			console.error('Multiple upload error:', error);
			return reply.code(500).send({
				success: false,
				error: error instanceof Error ? error.message : 'Upload failed',
			});
		}
	});

	// Delete image from Cloudinary
	fastify.delete('/delete/:publicId', {
		schema: {
			description: 'Delete an image from Cloudinary',
			tags: ['uploads'],
			params: {
				type: 'object',
				properties: {
					publicId: { type: 'string' },
				},
				required: ['publicId'],
			},
			response: {
				200: deleteResponseSchema,
				400: { type: 'object', properties: { error: { type: 'string' } } },
				500: { type: 'object', properties: { error: { type: 'string' } } },
			},
		},
	}, async (request: FastifyRequest<{
		Params: { publicId: string };
	}>, reply: FastifyReply) => {
		try {
			const { publicId } = request.params;
			
			// Replace URL encoding
			const decodedPublicId = decodeURIComponent(publicId);
			
			const result = await cloudinary.uploader.destroy(decodedPublicId);
			
			if (result.result === 'ok') {
				return reply.send({
					success: true,
					message: 'Image deleted successfully',
				});
			} else {
				return reply.code(400).send({
					success: false,
					error: 'Failed to delete image or image not found',
				});
			}
		} catch (error) {
			console.error('Delete error:', error);
			return reply.code(500).send({
				success: false,
				error: error instanceof Error ? error.message : 'Delete failed',
			});
		}
	});

	// Get image transformations
	fastify.get('/transformations/:publicId', {
		schema: {
			description: 'Get available transformations for an image',
			tags: ['uploads'],
			params: {
				type: 'object',
				properties: {
					publicId: { type: 'string' },
				},
				required: ['publicId'],
			},
		},
	}, async (request: FastifyRequest<{
		Params: { publicId: string };
	}>, reply: FastifyReply) => {
		try {
			const { publicId } = request.params;
			const decodedPublicId = decodeURIComponent(publicId);

			// Generate different transformation URLs
			const transformations = {
				original: cloudinary.url(decodedPublicId, { secure: true }),
				thumbnail: cloudinary.url(decodedPublicId, {
					secure: true,
					transformation: [
						{ width: 150, height: 150, crop: 'thumb', quality: 'auto' }
					]
				}),
				medium: cloudinary.url(decodedPublicId, {
					secure: true,
					transformation: [
						{ width: 400, height: 400, crop: 'fill', quality: 'auto' }
					]
				}),
				large: cloudinary.url(decodedPublicId, {
					secure: true,
					transformation: [
						{ width: 1200, height: 1200, crop: 'fit', quality: 'auto' }
					]
				}),
				zoom: cloudinary.url(decodedPublicId, {
					secure: true,
					transformation: [
						{ width: 2000, height: 2000, crop: 'fit', quality: 'auto' }
					]
				}),
			};

			return reply.send({
				success: true,
				data: transformations,
			});
		} catch (error) {
			console.error('Transformations error:', error);
			return reply.code(500).send({
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get transformations',
			});
		}
	});
}