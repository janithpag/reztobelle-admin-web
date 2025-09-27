import { FastifyPluginCallback } from 'fastify'

const deliveryRoutes: FastifyPluginCallback = async (fastify) => {
	// Get all deliveries (orders with delivery information)
	fastify.get('/', async (request, reply) => {
		const deliveries = await fastify.prisma.order.findMany({
			where: {
				deliveryStatus: { not: null }
			},
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				orderNumber: true,
				customerName: true,
				customerPhone: true,
				customerEmail: true,
				address: true,
				cityName: true,
				districtName: true,
				totalAmount: true,
				status: true,
				deliveryStatus: true,
				waybillId: true,
				koombiyoOrderId: true,
				koombiyoLastStatus: true,
				sentToDeliveryAt: true,
				shippedAt: true,
				deliveredAt: true,
				createdAt: true,
				deliveryLogs: {
					orderBy: { createdAt: 'desc' },
					take: 5
				}
			}
		})
		return { deliveries }
	})

	// Update delivery status for an order
	fastify.patch('/:orderId/status', async (request, reply) => {
		try {
			const { orderId } = request.params as { orderId: string }
			const { deliveryStatus, koombiyoLastStatus } = request.body as any

			const updateData: any = { deliveryStatus }
			
			if (koombiyoLastStatus) {
				updateData.koombiyoLastStatus = koombiyoLastStatus
				updateData.koombiyoStatusUpdatedAt = new Date()
			}

			if (deliveryStatus === 'DELIVERED') {
				updateData.deliveredAt = new Date()
				updateData.status = 'DELIVERED'
			} else if (deliveryStatus === 'SHIPPED' || deliveryStatus === 'IN_TRANSIT') {
				updateData.shippedAt = new Date()
				updateData.status = 'SHIPPED'
			}

			const order = await fastify.prisma.order.update({
				where: { id: parseInt(orderId) },
				data: updateData
			})

			// Log the delivery status change
			await fastify.prisma.deliveryLog.create({
				data: {
					orderId: parseInt(orderId),
					action: 'STATUS_UPDATE',
					status: deliveryStatus,
					message: `Delivery status updated to ${deliveryStatus}`
				}
			})

			return { order }
		} catch (error) {
			return reply.code(400).send({ error: 'Invalid request data or order not found' })
		}
	})

	// Get delivery logs for an order
	fastify.get('/:orderId/logs', async (request, reply) => {
		try {
			const { orderId } = request.params as { orderId: string }

			const logs = await fastify.prisma.deliveryLog.findMany({
				where: { orderId: parseInt(orderId) },
				orderBy: { createdAt: 'desc' },
				include: {
					createdByUser: {
						select: {
							firstName: true,
							lastName: true
						}
					}
				}
			})

			return { logs }
		} catch (error) {
			return reply.code(400).send({ error: 'Invalid order ID' })
		}
	})
}

export default deliveryRoutes