import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { managerOrAdmin } from '../middleware/route-helpers'

const categoryRoutes: FastifyPluginCallback = async (fastify) => {
	// Get all categories (public endpoint)
	fastify.get('/', async (request, reply) => {
		try {
			const categories = await fastify.prisma.category.findMany({
				where: { isActive: true },
				orderBy: [
					{ name: 'asc' }
				],
				include: {
					_count: {
						select: { products: true }
					}
				}
			})

			return { categories }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch categories',
				message: error.message
			})
		}
	})

	// Get category by ID
	fastify.get('/:id', async (request, reply) => {
		try {
			const { id } = request.params as { id: string }
			const categoryId = parseInt(id)

			if (isNaN(categoryId)) {
				return reply.code(400).send({ error: 'Invalid category ID' })
			}

			const category = await fastify.prisma.category.findUnique({
				where: { id: categoryId },
				include: {
					products: {
						where: { isActive: true },
						include: {
							images: {
								where: { isPrimary: true },
								take: 1
							}
						}
					},
					_count: {
						select: { products: true }
					}
				}
			})

			if (!category) {
				return reply.code(404).send({ error: 'Category not found' })
			}

			return { category }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch category',
				message: error.message
			})
		}
	})

	// Create category (Admin only)
	fastify.post('/', {
		preHandler: managerOrAdmin,
		schema: {
			body: {
				type: 'object',
				required: ['name'],
				properties: {
					name: { type: 'string', minLength: 1, maxLength: 100 },
					description: { type: 'string' },
					imageUrl: { type: 'string' }
				}
			}
		}
	}, async (request, reply) => {
		try {
			// Validate request body with Zod
			const createCategorySchema = z.object({
				name: z.string().min(1).max(100),
				description: z.string().optional(),
				imageUrl: z.string().optional().refine(val => !val || val.trim() === '' || z.string().url().safeParse(val).success, {
					message: 'Invalid URL format'
				})
			})

			const validationResult = createCategorySchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const data = validationResult.data

			// Check if name already exists
			const existing = await fastify.prisma.category.findFirst({
				where: { name: data.name }
			})

			if (existing) {
				return reply.code(409).send({ error: 'Category name already exists' })
			}

			const category = await fastify.prisma.category.create({
				data: {
					name: data.name,
					description: data.description || null,
					imageUrl: data.imageUrl || null,
					slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
				}
			})

			return reply.code(201).send({ category })
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to create category',
				message: error.message
			})
		}
	})

	// Update category (Admin only)
	fastify.put('/:id', {
		preHandler: managerOrAdmin,
		schema: {
			params: {
				type: 'object',
				required: ['id'],
				properties: {
					id: { type: 'string', pattern: '^[0-9]+$' }
				}
			},
			body: {
				type: 'object',
				properties: {
					name: { type: 'string', minLength: 1, maxLength: 100 },
					description: { type: 'string' },
					imageUrl: { type: 'string' },
					isActive: { type: 'boolean' }
				}
			}
		}
	}, async (request, reply) => {
		try {
			const { id } = request.params as { id: string }
			const categoryId = parseInt(id)

			if (isNaN(categoryId)) {
				return reply.code(400).send({ error: 'Invalid category ID' })
			}

			// Validate request body with Zod
			const updateCategorySchema = z.object({
				name: z.string().min(1).max(100).optional(),
				description: z.string().optional(),
				imageUrl: z.string().optional().refine(val => !val || val.trim() === '' || z.string().url().safeParse(val).success, {
					message: 'Invalid URL format'
				}),
				isActive: z.boolean().optional()
			})

			const validationResult = updateCategorySchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const data = validationResult.data

			// Check if category exists
			const existing = await fastify.prisma.category.findUnique({
				where: { id: categoryId }
			})

			if (!existing) {
				return reply.code(404).send({ error: 'Category not found' })
			}

			// Check if name already exists (if name is being updated)
			if (data.name && data.name !== existing.name) {
				const nameExists = await fastify.prisma.category.findFirst({
					where: { 
						name: data.name,
						id: { not: categoryId }
					}
				})

				if (nameExists) {
					return reply.code(409).send({ error: 'Category name already exists' })
				}
			}

			// Update category
			const updateData: any = {}
			if (data.name) {
				updateData.name = data.name
				updateData.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
			}
			if (data.description !== undefined) updateData.description = data.description
			if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
			if (data.isActive !== undefined) updateData.isActive = data.isActive

			const category = await fastify.prisma.category.update({
				where: { id: categoryId },
				data: updateData
			})

			return { category }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to update category',
				message: error.message
			})
		}
	})

	// Delete category (Admin only)
	fastify.delete('/:id', {
		preHandler: managerOrAdmin,
		schema: {
			params: {
				type: 'object',
				required: ['id'],
				properties: {
					id: { type: 'string', pattern: '^[0-9]+$' }
				}
			}
		}
	}, async (request, reply) => {
		try {
			const { id } = request.params as { id: string }
			const categoryId = parseInt(id)

			if (isNaN(categoryId)) {
				return reply.code(400).send({ error: 'Invalid category ID' })
			}

			// Check if category exists
			const existing = await fastify.prisma.category.findUnique({
				where: { id: categoryId },
				include: {
					_count: {
						select: { products: true }
					}
				}
			})

			if (!existing) {
				return reply.code(404).send({ error: 'Category not found' })
			}

			// Check if category has products
			if (existing._count.products > 0) {
				return reply.code(400).send({ 
					error: 'Cannot delete category with associated products',
					message: `This category has ${existing._count.products} products. Please move or delete all products first.`
				})
			}

			// Delete category
			await fastify.prisma.category.delete({
				where: { id: categoryId }
			})

			return reply.code(204).send()
		} catch (error: any) {
			console.error('Failed to delete category:', error)
			return reply.code(500).send({
				error: 'Failed to delete category',
				message: error.message
			})
		}
	})
}

export default categoryRoutes