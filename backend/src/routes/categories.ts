import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth'

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
		preHandler: [authenticateToken, requireManagerOrAdmin],
		schema: {
			body: {
				type: 'object',
				required: ['name'],
				properties: {
					name: { type: 'string', minLength: 1, maxLength: 100 },
					description: { type: 'string' },
					imageUrl: { type: 'string', format: 'uri' }
				}
			}
		}
	}, async (request, reply) => {
		try {
			// Validate request body with Zod
			const createCategorySchema = z.object({
				name: z.string().min(1).max(100),
				description: z.string().optional(),
				imageUrl: z.string().url().optional()
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
					description: data.description,
					imageUrl: data.imageUrl,
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
}

export default categoryRoutes