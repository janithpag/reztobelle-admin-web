import { FastifyPluginCallback } from 'fastify'
import { Prisma } from '@prisma/client'
import { authRequired } from '../middleware/route-helpers'

const customerRoutes: FastifyPluginCallback = async (fastify) => {
	// Get unique customers from orders
	fastify.get('/', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const { search, sortBy = 'lastOrderDate', sortOrder = 'desc', page = 1, limit = 50 } = request.query as {
				search?: string
				sortBy?: string
				sortOrder?: 'asc' | 'desc'
				page?: number
				limit?: number
			}

			const pageNum = Number(page)
			const limitNum = Number(limit)
			const skip = (pageNum - 1) * limitNum

			// Build where clause for search
			const whereClause: any = {}
			if (search) {
				whereClause.OR = [
					{ customerName: { contains: search, mode: 'insensitive' } },
					{ customerEmail: { contains: search, mode: 'insensitive' } },
					{ customerPhone: { contains: search, mode: 'insensitive' } }
				]
			}

			// Build the ORDER BY clause
			const orderByColumn = sortBy === 'name' ? 'customerName' : 
			                       sortBy === 'totalSpent' ? 'totalSpent' :
			                       sortBy === 'orderCount' ? 'orderCount' :
			                       'lastOrderDate'
			
			const orderByDirection = sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`

			// Get unique customers with aggregated data
			const customers = search 
				? await fastify.prisma.$queryRaw`
					SELECT 
						"customerName",
						"customerEmail",
						"customerPhone",
						"address",
						"cityName",
						"districtName",
						COUNT(DISTINCT id)::int as "orderCount",
						SUM("totalAmount")::decimal as "totalSpent",
						MAX("createdAt") as "lastOrderDate",
						MIN("createdAt") as "firstOrderDate"
					FROM orders
					WHERE 
						"customerName" ILIKE ${'%' + search + '%'} OR
						"customerEmail" ILIKE ${'%' + search + '%'} OR
						"customerPhone" ILIKE ${'%' + search + '%'}
					GROUP BY 
						"customerName",
						"customerEmail",
						"customerPhone",
						"address",
						"cityName",
						"districtName"
					ORDER BY ${Prisma.raw(`"${orderByColumn}"`)} ${orderByDirection}
					LIMIT ${limitNum}
					OFFSET ${skip}
				` as any[]
				: await fastify.prisma.$queryRaw`
					SELECT 
						"customerName",
						"customerEmail",
						"customerPhone",
						"address",
						"cityName",
						"districtName",
						COUNT(DISTINCT id)::int as "orderCount",
						SUM("totalAmount")::decimal as "totalSpent",
						MAX("createdAt") as "lastOrderDate",
						MIN("createdAt") as "firstOrderDate"
					FROM orders
					GROUP BY 
						"customerName",
						"customerEmail",
						"customerPhone",
						"address",
						"cityName",
						"districtName"
					ORDER BY ${Prisma.raw(`"${orderByColumn}"`)} ${orderByDirection}
					LIMIT ${limitNum}
					OFFSET ${skip}
				` as any[]

			// Get total count
			const totalResult = search
				? await fastify.prisma.$queryRaw`
					SELECT COUNT(DISTINCT ("customerName", "customerEmail", "customerPhone"))::int as count
					FROM orders
					WHERE 
						"customerName" ILIKE ${'%' + search + '%'} OR
						"customerEmail" ILIKE ${'%' + search + '%'} OR
						"customerPhone" ILIKE ${'%' + search + '%'}
				` as any[]
				: await fastify.prisma.$queryRaw`
					SELECT COUNT(DISTINCT ("customerName", "customerEmail", "customerPhone"))::int as count
					FROM orders
				` as any[]

			const total = totalResult[0]?.count || 0

			// Format the response
			const formattedCustomers = customers.map((customer: any) => ({
				customerName: customer.customerName,
				customerEmail: customer.customerEmail,
				customerPhone: customer.customerPhone,
				address: customer.address,
				cityName: customer.cityName,
				districtName: customer.districtName,
				orderCount: Number(customer.orderCount),
				totalSpent: Number(customer.totalSpent),
				lastOrderDate: customer.lastOrderDate,
				firstOrderDate: customer.firstOrderDate
			}))

			return {
				customers: formattedCustomers,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total,
					totalPages: Math.ceil(total / limitNum)
				}
			}
		} catch (error: any) {
			fastify.log.error(error)
			return reply.code(500).send({
				error: 'Failed to fetch customers',
				message: error.message
			})
		}
	})

	// Get customer details by phone or email
	fastify.get('/details', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const { phone, email } = request.query as {
				phone?: string
				email?: string
			}

			if (!phone && !email) {
				return reply.code(400).send({
					error: 'Either phone or email is required'
				})
			}

			const whereClause: any = {}
			if (phone) {
				whereClause.customerPhone = phone
			} else if (email) {
				whereClause.customerEmail = email
			}

			// Get all orders for this customer
			const orders = await fastify.prisma.order.findMany({
				where: whereClause,
				include: {
					orderItems: {
						include: {
							product: true
						}
					}
				},
				orderBy: {
					createdAt: 'desc'
				}
			})

			if (orders.length === 0) {
				return reply.code(404).send({
					error: 'Customer not found'
				})
			}

			// Aggregate customer data
			const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
			const totalOrders = orders.length

			// Get most recent customer info
			const latestOrder = orders[0]

			return {
				customer: {
					customerName: latestOrder.customerName,
					customerEmail: latestOrder.customerEmail,
					customerPhone: latestOrder.customerPhone,
					address: latestOrder.address,
					cityName: latestOrder.cityName,
					districtName: latestOrder.districtName,
					cityId: latestOrder.cityId,
					districtId: latestOrder.districtId,
					orderCount: totalOrders,
					totalSpent,
					lastOrderDate: latestOrder.createdAt,
					firstOrderDate: orders[orders.length - 1].createdAt
				},
				orders: orders.map(order => ({
					id: order.id,
					orderNumber: order.orderNumber,
					status: order.status,
					totalAmount: order.totalAmount,
					paymentMethod: order.paymentMethod,
					paymentStatus: order.paymentStatus,
					createdAt: order.createdAt,
					itemCount: order.orderItems.length
				}))
			}
		} catch (error: any) {
			fastify.log.error(error)
			return reply.code(500).send({
				error: 'Failed to fetch customer details',
				message: error.message
			})
		}
	})

	// Get customer statistics
	fastify.get('/stats', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const stats = await fastify.prisma.$queryRaw`
				SELECT 
					COUNT(DISTINCT ("customerName", "customerEmail", "customerPhone"))::int as "totalCustomers",
					COUNT(*)::int as "totalOrders",
					AVG(order_count)::decimal as "avgOrdersPerCustomer",
					AVG(total_spent)::decimal as "avgSpentPerCustomer"
				FROM (
					SELECT 
						"customerName",
						"customerEmail",
						"customerPhone",
						COUNT(*)::int as order_count,
						SUM("totalAmount")::decimal as total_spent
					FROM orders
					GROUP BY "customerName", "customerEmail", "customerPhone"
				) as customer_stats
			` as any[]

			const result = stats[0]

			return {
				totalCustomers: Number(result.totalCustomers) || 0,
				totalOrders: Number(result.totalOrders) || 0,
				avgOrdersPerCustomer: Number(result.avgOrdersPerCustomer) || 0,
				avgSpentPerCustomer: Number(result.avgSpentPerCustomer) || 0
			}
		} catch (error: any) {
			fastify.log.error(error)
			return reply.code(500).send({
				error: 'Failed to fetch customer statistics',
				message: error.message
			})
		}
	})
}

export default customerRoutes
