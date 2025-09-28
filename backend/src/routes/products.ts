import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { authRequired, managerOrAdmin } from '../middleware/route-helpers'

const createProductSchema = z.object({
	name: z.string().min(1).max(200),
	description: z.string().optional(),
	shortDescription: z.string().optional(),
	sku: z.string().min(1).max(50),
	price: z.number().positive(),
	costPrice: z.number().positive(),
	categoryId: z.number().int().positive(),
	brand: z.string().optional(),
	color: z.string().optional(),
	material: z.string().optional(),
	size: z.string().optional(),
	weight: z.number().optional(),
	dimensions: z.string().optional(),
	metaTitle: z.string().optional(),
	metaDescription: z.string().optional(),
	isActive: z.boolean().default(true),
	isFeatured: z.boolean().default(false),
	images: z.array(z.object({
		public_id: z.string(),
		url: z.string(),
		secure_url: z.string(),
		width: z.number(),
		height: z.number(),
		format: z.string(),
		bytes: z.number()
	})).default([]),
	initialStock: z.number().int().min(0).default(0)
})

const updateProductSchema = createProductSchema.partial().omit({ initialStock: true })

const productRoutes: FastifyPluginCallback = async (fastify) => {
	// Get all products
	fastify.get('/', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const { categoryId, isActive, isFeatured, search } = request.query as {
				categoryId?: string;
				isActive?: string;
				isFeatured?: string;
				search?: string;
			}

			const where: any = {}

			if (categoryId && categoryId !== 'all') {
				where.categoryId = parseInt(categoryId)
			}

			if (isActive !== undefined) {
				where.isActive = isActive === 'true'
			}

			if (isFeatured !== undefined) {
				where.isFeatured = isFeatured === 'true'
			}

			if (search) {
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ sku: { contains: search, mode: 'insensitive' } },
					{ description: { contains: search, mode: 'insensitive' } }
				]
			}

			const products = await fastify.prisma.product.findMany({
				where,
				include: {
					category: true,
					images: {
						orderBy: { sortOrder: 'asc' }
					},
					inventory: true
				},
				orderBy: { createdAt: 'desc' }
			})

			return { products }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch products',
				message: error.message
			})
		}
	})

	// Get product by ID
	fastify.get('/:id', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const { id } = request.params as { id: string }
			const productId = parseInt(id)

			if (isNaN(productId)) {
				return reply.code(400).send({ error: 'Invalid product ID' })
			}

			const product = await fastify.prisma.product.findUnique({
				where: { id: productId },
				include: {
					category: true,
					images: {
						orderBy: { sortOrder: 'asc' }
					},
					inventory: true,
					stockMovements: {
						take: 10,
						orderBy: { createdAt: 'desc' },
						include: {
							createdByUser: {
								select: {
									firstName: true,
									lastName: true
								}
							}
						}
					}
				}
			})

			if (!product) {
				return reply.code(404).send({ error: 'Product not found' })
			}

			return { product }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch product',
				message: error.message
			})
		}
	})

	// Create product
	fastify.post('/', {
		preHandler: managerOrAdmin
	}, async (request, reply) => {
		try {
			const data = createProductSchema.parse(request.body)
			
			// Ensure we have a valid user
			if (!request.user?.userId) {
				return reply.code(401).send({ 
					error: 'Authentication required',
					message: 'User information not found in request' 
				})
			}

			// Generate slug from name
			const slug = data.name.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.trim()

			// Create product with inventory in a transaction
			const result = await fastify.prisma.$transaction(async (tx) => {
				// Create the product
				const product = await tx.product.create({
					data: {
						name: data.name,
						description: data.description,
						shortDescription: data.shortDescription,
						sku: data.sku,
						price: data.price,
						costPrice: data.costPrice,
						categoryId: data.categoryId,
						brand: data.brand,
						color: data.color,
						material: data.material,
						size: data.size,
						weight: data.weight,
						dimensions: data.dimensions,
						metaTitle: data.metaTitle,
						metaDescription: data.metaDescription,
						isActive: data.isActive,
						isFeatured: data.isFeatured,
						slug: slug,
						images: {
							create: data.images?.map((img, index) => ({
								imageUrl: img.secure_url || img.url,
								cloudinaryId: img.public_id,
								altText: data.name,
								isPrimary: index === 0,
								sortOrder: index
							})) || []
						},
						inventory: {
							create: {
								quantityAvailable: data.initialStock,
								quantityReserved: 0,
								reorderLevel: Math.max(10, Math.floor(data.initialStock * 0.1)),
								maxStockLevel: Math.max(1000, data.initialStock * 2),
								lastRestockedAt: data.initialStock > 0 ? new Date() : undefined
							}
						}
					}
				})

				// Create initial stock movement if stock > 0
				if (data.initialStock > 0) {
					await tx.stockMovement.create({
						data: {
							productId: product.id,
							movementType: 'IN',
							quantity: data.initialStock,
							referenceType: 'PURCHASE',
							notes: 'Initial stock entry',
							unitCost: data.costPrice,
							createdBy: parseInt(request.user!.userId)
						}
					})
				}

				return product
			})

			// Fetch the complete product data
			const product = await fastify.prisma.product.findUnique({
				where: { id: result.id },
				include: {
					images: {
						orderBy: { sortOrder: 'asc' }
					},
					inventory: true,
					category: true
				}
			})

			return reply.code(201).send({ product })
		} catch (error: any) {
			console.error('Product creation error:', error)
			if (error.name === 'ZodError') {
				return reply.code(400).send({ 
					error: 'Invalid request data',
					message: 'Validation failed',
					details: error.errors
				})
			}
			return reply.code(400).send({ 
				error: 'Invalid request data', 
				message: error.message 
			})
		}
	})

	// Update product
	fastify.put('/:id', {
		preHandler: managerOrAdmin
	}, async (request, reply) => {
		try {
			const { id } = request.params as { id: string }
			const productId = parseInt(id)
			const data = updateProductSchema.parse(request.body)

			if (isNaN(productId)) {
				return reply.code(400).send({ error: 'Invalid product ID' })
			}

			// Generate new slug if name is being updated
			let updateData: any = {
				...(data.name && { name: data.name }),
				...(data.description !== undefined && { description: data.description }),
				...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
				...(data.price && { price: data.price }),
				...(data.costPrice && { costPrice: data.costPrice }),
				...(data.sku && { sku: data.sku }),
				...(data.categoryId && { categoryId: data.categoryId }),
				...(data.brand !== undefined && { brand: data.brand }),
				...(data.color !== undefined && { color: data.color }),
				...(data.material !== undefined && { material: data.material }),
				...(data.size !== undefined && { size: data.size }),
				...(data.weight !== undefined && { weight: data.weight }),
				...(data.dimensions !== undefined && { dimensions: data.dimensions }),
				...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
				...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
				...(data.isActive !== undefined && { isActive: data.isActive }),
				...(data.isFeatured !== undefined && { isFeatured: data.isFeatured })
			}

			if (data.name) {
				updateData.slug = data.name.toLowerCase()
					.replace(/[^a-z0-9\s-]/g, '')
					.replace(/\s+/g, '-')
					.trim()
			}

			// Update product and handle images if provided
			const result = await fastify.prisma.$transaction(async (tx) => {
				// Update the product
				const product = await tx.product.update({
					where: { id: productId },
					data: updateData
				})

				// Handle image updates if provided
				if (data.images && Array.isArray(data.images)) {
					// Delete existing images
					await tx.productImage.deleteMany({
						where: { productId }
					})

					// Create new images
					if (data.images.length > 0) {
						await tx.productImage.createMany({
							data: data.images.map((img, index) => ({
								productId,
								imageUrl: img.secure_url || img.url,
								cloudinaryId: img.public_id,
								altText: data.name || product.name,
								isPrimary: index === 0,
								sortOrder: index
							}))
						})
					}
				}

				return product
			})

			// Fetch updated product with relations
			const product = await fastify.prisma.product.findUnique({
				where: { id: productId },
				include: {
					images: {
						orderBy: { sortOrder: 'asc' }
					},
					inventory: true,
					category: true
				}
			})

			return { product }
		} catch (error: any) {
			console.error('Product update error:', error)
			return reply.code(400).send({ 
				error: 'Invalid request data or product not found',
				message: error.message 
			})
		}
	})

	// Delete product
	fastify.delete('/:id', {
		preHandler: managerOrAdmin
	}, async (request, reply) => {
		try {
			const { id } = request.params as { id: string }
			const productId = parseInt(id)

			if (isNaN(productId)) {
				return reply.code(400).send({ error: 'Invalid product ID' })
			}

			// Check if product exists
			const existingProduct = await fastify.prisma.product.findUnique({
				where: { id: productId },
				include: { orderItems: true }
			})

			if (!existingProduct) {
				return reply.code(404).send({ error: 'Product not found' })
			}

			// Check if product has been ordered - if so, deactivate instead of delete
			if (existingProduct.orderItems.length > 0) {
				const product = await fastify.prisma.product.update({
					where: { id: productId },
					data: { isActive: false }
				})
				return reply.send({ 
					message: 'Product has order history and has been deactivated instead of deleted',
					product 
				})
			}

			// Safe to delete - will cascade to related records
			await fastify.prisma.product.delete({
				where: { id: productId }
			})

			return reply.code(204).send()
		} catch (error: any) {
			console.error('Product deletion error:', error)
			return reply.code(500).send({ 
				error: 'Failed to delete product',
				message: error.message 
			})
		}
	})
}

export default productRoutes