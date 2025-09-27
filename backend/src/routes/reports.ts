import { FastifyPluginCallback } from 'fastify'

const reportRoutes: FastifyPluginCallback = async (fastify) => {
	// Dashboard overview
	fastify.get('/overview', async (request, reply) => {
		try {
			const [
				totalProducts,
				totalOrders,
				totalRevenue,
				pendingOrders,
				lowStockProducts,
				recentOrders
			] = await Promise.all([
				fastify.prisma.product.count(),
				fastify.prisma.order.count(),
				fastify.prisma.order.aggregate({
					_sum: { totalAmount: true },
				}),
				fastify.prisma.order.count({
					where: { status: "PENDING" },
				}),
				fastify.prisma.product.findMany({
					where: {
						inventory: {
							quantityAvailable: { lte: 10 }
						}
					},
					select: {
						id: true,
						name: true,
						sku: true,
						inventory: {
							select: {
								quantityAvailable: true
							}
						}
					},
				}),
				fastify.prisma.order.findMany({
					take: 5,
					orderBy: { createdAt: "desc" },
					include: {
						orderItems: {
							include: {
								product: { select: { name: true } },
							},
						},
					},
				}),
			])

			return {
				overview: {
					totalProducts,
					totalOrders,
					totalRevenue: totalRevenue._sum.totalAmount || 0,
					pendingOrders,
					lowStockProducts,
					recentOrders,
				},
			}
		} catch (error) {
			return reply.code(500).send({ error: 'Internal server error' })
		}
	})

	// Sales report by date range
	fastify.get('/sales', async (request, reply) => {
		try {
			const query = request.query as { startDate?: string; endDate?: string }
			const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
			const endDate = query.endDate ? new Date(query.endDate) : new Date()

			const orders = await fastify.prisma.order.findMany({
				where: {
					createdAt: { gte: startDate, lte: endDate },
					status: { not: "CANCELLED" },
				},
				include: {
					orderItems: {
						include: {
							product: {
								select: {
									name: true,
									categoryId: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: "desc" },
			})

			return { orders, dateRange: { startDate, endDate } }
		} catch (error) {
			return reply.code(500).send({ error: 'Internal server error' })
		}
	})

	// Inventory report
	fastify.get('/inventory', async (request, reply) => {
		try {
			const products = await fastify.prisma.product.findMany({
				select: {
					id: true,
					name: true,
					sku: true,
					price: true,
					inventory: {
						select: {
							quantityAvailable: true,
							quantityReserved: true,
							reorderLevel: true
						}
					}
				},
				orderBy: { name: "asc" },
			})

			return { products }
		} catch (error) {
			return reply.code(500).send({ error: 'Internal server error' })
		}
	})

	// Products by category
	fastify.get('/products-by-category', async (request, reply) => {
		try {
			const productsByCategory = await fastify.prisma.product.groupBy({
				by: ["categoryId"],
				_count: { id: true },
			})

			// Get category names
			const categories = await fastify.prisma.category.findMany({
				select: { id: true, name: true }
			})

			const categoryMap = categories.reduce((acc, cat) => {
				acc[cat.id] = cat.name
				return acc
			}, {} as Record<number, string>)

			const result = productsByCategory.map(item => ({
				categoryId: item.categoryId,
				categoryName: categoryMap[item.categoryId] || 'Unknown',
				count: item._count.id
			}))

			return { productsByCategory: result }
		} catch (error) {
			return reply.code(500).send({ error: 'Internal server error' })
		}
	})

	// Expense report
	fastify.get('/expenses', async (request, reply) => {
		try {
			const query = request.query as { startDate?: string; endDate?: string }
			const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
			const endDate = query.endDate ? new Date(query.endDate) : new Date()

			const expenses = await fastify.prisma.expense.findMany({
				where: {
					expenseDate: { gte: startDate, lte: endDate },
				},
				include: {
					createdByUser: {
						select: {
							firstName: true,
							lastName: true
						}
					}
				},
				orderBy: { expenseDate: "desc" },
			})

			const totalExpenses = await fastify.prisma.expense.aggregate({
				where: {
					expenseDate: { gte: startDate, lte: endDate },
				},
				_sum: { amount: true }
			})

			return {
				expenses,
				totalExpenses: totalExpenses._sum.amount || 0,
				dateRange: { startDate, endDate }
			}
		} catch (error) {
			return reply.code(500).send({ error: 'Internal server error' })
		}
	})
}

export default reportRoutes