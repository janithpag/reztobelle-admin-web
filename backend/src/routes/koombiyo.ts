import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import KoombiyoService from '../services/koombiyo.service'
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth'

const koombiyoRoutes: FastifyPluginCallback = async (fastify) => {
	const koombiyoService = new KoombiyoService()

	// Get districts (real-time from Koombiyo API)
	fastify.get('/districts', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const result = await koombiyoService.getDistricts()

			if (!result.success) {
				return reply.code(500).send({
					error: 'Failed to fetch districts',
					message: result.message
				})
			}

			return { districts: result.data }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch districts',
				message: error.message
			})
		}
	})

	// Get cities by district (real-time from Koombiyo API)
	fastify.get('/cities/:districtId', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const { districtId } = request.params as { districtId: string }
			const districtIdNum = parseInt(districtId)

			if (isNaN(districtIdNum)) {
				return reply.code(400).send({ error: 'Invalid district ID' })
			}

			const result = await koombiyoService.getCities(districtIdNum)

			if (!result.success) {
				return reply.code(500).send({
					error: 'Failed to fetch cities',
					message: result.message
				})
			}

			return { cities: result.data }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch cities',
				message: error.message
			})
		}
	})

	// Get available waybills (real-time from Koombiyo API)
	fastify.get('/waybills/available', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const { limit } = request.query as { limit?: string }
			const limitNum = limit ? parseInt(limit) : 50

			const result = await koombiyoService.getAvailableWaybills(limitNum)

			if (!result.success) {
				return reply.code(500).send({
					error: 'Failed to fetch waybills',
					message: result.message
				})
			}

			return { waybills: result.data }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch waybills',
				message: error.message
			})
		}
	})

	// Validate district and city combination
	fastify.post('/validate-location', {
		preHandler: authenticateToken,
		schema: {
			body: {
				type: 'object',
				required: ['districtId', 'cityId'],
				properties: {
					districtId: { type: 'integer', minimum: 1 },
					cityId: { type: 'integer', minimum: 1 }
				}
			}
		}
	}, async (request, reply) => {
		try {
			// Validate request body with Zod
			const validateDistrictCitySchema = z.object({
				districtId: z.number().int().positive(),
				cityId: z.number().int().positive()
			})

			const validationResult = validateDistrictCitySchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const { districtId, cityId } = validationResult.data

			const validation = await koombiyoService.validateDistrictCity(districtId, cityId)

			return {
				valid: validation.valid,
				message: validation.message
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Location validation failed',
				message: error.message
			})
		}
	})

	// Send order to Koombiyo
	fastify.post('/orders/:orderId/send', {
		preHandler: [authenticateToken, requireManagerOrAdmin]
	}, async (request, reply) => {
		try {
			const { orderId } = request.params as { orderId: string }
			const orderIdNum = parseInt(orderId)

			if (isNaN(orderIdNum)) {
				return reply.code(400).send({ error: 'Invalid order ID' })
			}

			// Get order details from database
			const order = await fastify.prisma.order.findUnique({
				where: { id: orderIdNum },
				include: {
					orderItems: {
						include: {
							product: true
						}
					}
				}
			})

			if (!order) {
				return reply.code(404).send({ error: 'Order not found' })
			}

			if (!order.waybillId) {
				return reply.code(400).send({ error: 'Order does not have an assigned waybill' })
			}

			if (order.status !== 'READY_FOR_DELIVERY') {
				return reply.code(400).send({ error: 'Order is not ready for delivery' })
			}

			// Prepare order data for Koombiyo
			const packageDescription = order.orderItems
				.map(item => `${item.productName} (${item.quantity})`)
				.join(', ')

			const orderData = {
				waybillId: order.waybillId,
				orderNo: order.orderNumber,
				receiverName: order.customerName,
				receiverStreet: order.address,
				receiverDistrict: order.districtId,
				receiverCity: order.cityId,
				receiverPhone: order.customerPhone || '',
				description: packageDescription,
				specialNotes: order.specialNotes || undefined,
				codAmount: order.paymentMethod === 'CASH_ON_DELIVERY' ? Number(order.totalAmount) : 0
			}

			// Send order to Koombiyo
			const result = await koombiyoService.addOrder(orderData)

			if (result.success) {
				// Update order status
				await fastify.prisma.order.update({
					where: { id: orderIdNum },
					data: {
						deliveryStatus: 'SENT_TO_KOOMBIYO',
						sentToDeliveryAt: new Date(),
						koombiyoOrderId: result.data?.id || null
					}
				})

				// Log the action
				await koombiyoService.logDeliveryAction(
					fastify.prisma,
					orderIdNum,
					'SENT_TO_KOOMBIYO',
					'Order sent to Koombiyo delivery service',
					`Order ${order.orderNumber} sent to Koombiyo with waybill ${order.waybillId}`,
					result.data,
					(request as any).user?.id
				)

				return {
					success: true,
					message: 'Order sent to Koombiyo successfully',
					koombiyoOrderId: result.data?.id
				}
			}

			throw new Error(result.message || 'Failed to send order to Koombiyo')
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to send order to Koombiyo',
				message: error.message
			})
		}
	})

	// Track order status
	fastify.get('/orders/:orderId/track', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const { orderId } = request.params as { orderId: string }
			const orderIdNum = parseInt(orderId)

			if (isNaN(orderIdNum)) {
				return reply.code(400).send({ error: 'Invalid order ID' })
			}

			// Get order from database
			const order = await fastify.prisma.order.findUnique({
				where: { id: orderIdNum },
				select: { waybillId: true, orderNumber: true }
			})

			if (!order || !order.waybillId) {
				return reply.code(404).send({ error: 'Order not found or no waybill assigned' })
			}

			// Get tracking info from Koombiyo
			const result = await koombiyoService.trackOrder(order.waybillId)

			if (result.success && result.data) {
				// Update local order status if different
				const currentStatus = result.data.status

				await fastify.prisma.order.update({
					where: { id: orderIdNum },
					data: {
						koombiyoLastStatus: currentStatus,
						koombiyoStatusUpdatedAt: new Date()
					}
				})

				// Log status update
				await koombiyoService.logDeliveryAction(
					fastify.prisma,
					orderIdNum,
					'STATUS_UPDATE',
					currentStatus,
					`Status updated: ${currentStatus}`,
					result.data
				)

				return {
					tracking: result.data,
					orderNumber: order.orderNumber,
					waybillId: order.waybillId
				}
			}

			return reply.code(404).send({
				error: 'Tracking information not found',
				message: result.message
			})
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to track order',
				message: error.message
			})
		}
	})

	// Get order delivery history
	fastify.get('/orders/:orderId/history', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const { orderId } = request.params as { orderId: string }
			const orderIdNum = parseInt(orderId)

			if (isNaN(orderIdNum)) {
				return reply.code(400).send({ error: 'Invalid order ID' })
			}

			// Get order from database
			const order = await fastify.prisma.order.findUnique({
				where: { id: orderIdNum },
				select: { waybillId: true, orderNumber: true }
			})

			if (!order || !order.waybillId) {
				return reply.code(404).send({ error: 'Order not found or no waybill assigned' })
			}

			// Get history from Koombiyo
			const result = await koombiyoService.getOrderHistory(order.waybillId)

			if (result.success) {
				// Also get local delivery logs
				const localLogs = await fastify.prisma.deliveryLog.findMany({
					where: { orderId: orderIdNum },
					include: {
						createdByUser: {
							select: {
								firstName: true,
								lastName: true
							}
						}
					},
					orderBy: { createdAt: 'desc' }
				})

				return {
					koombiyoHistory: result.data || [],
					localLogs,
					orderNumber: order.orderNumber,
					waybillId: order.waybillId
				}
			}

			return {
				koombiyoHistory: [],
				localLogs: await fastify.prisma.deliveryLog.findMany({
					where: { orderId: orderIdNum },
					include: {
						createdByUser: {
							select: {
								firstName: true,
								lastName: true
							}
						}
					},
					orderBy: { createdAt: 'desc' }
				}),
				orderNumber: order.orderNumber,
				waybillId: order.waybillId,
				message: result.message
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to get order history',
				message: error.message
			})
		}
	})

	// Request pickup
	fastify.post('/pickup/request', {
		preHandler: [authenticateToken, requireManagerOrAdmin],
		schema: {
			body: {
				type: 'object',
				required: ['vehicleType', 'pickupAddress', 'latitude', 'longitude', 'phone', 'quantity'],
				properties: {
					vehicleType: { type: 'string', enum: ['Bike', 'Three wheel', 'Lorry'] },
					pickupAddress: { type: 'string', minLength: 1 },
					latitude: { type: 'string' },
					longitude: { type: 'string' },
					phone: { type: 'string', minLength: 1 },
					quantity: { type: 'integer', minimum: 1 },
					remarks: { type: 'string' }
				}
			}
		}
	}, async (request, reply) => {
		try {
			// Validate request body with Zod
			const pickupRequestSchema = z.object({
				vehicleType: z.enum(['Bike', 'Three wheel', 'Lorry']),
				pickupAddress: z.string().min(1),
				latitude: z.string(),
				longitude: z.string(),
				phone: z.string().min(1),
				quantity: z.number().int().positive(),
				remarks: z.string().optional()
			})

			const validationResult = pickupRequestSchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const pickupData = validationResult.data

			const result = await koombiyoService.requestPickup(pickupData)

			if (result.success) {
				return {
					success: true,
					message: result.message,
					data: result.data
				}
			}

			throw new Error(result.message || 'Failed to request pickup')
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to request pickup',
				message: error.message
			})
		}
	})

	// Get return notes
	fastify.get('/returns', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const result = await koombiyoService.getReturnNotes()

			return {
				returns: result.data || [],
				success: result.success,
				message: result.message
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to get return notes',
				message: error.message
			})
		}
	})

	// Get return items by note ID
	fastify.get('/returns/:noteId/items', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const { noteId } = request.params as { noteId: string }

			const result = await koombiyoService.getReturnItems(noteId)

			return {
				items: result.data || [],
				success: result.success,
				message: result.message
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to get return items',
				message: error.message
			})
		}
	})

	// Mark return as received
	fastify.post('/returns/:waybillId/receive', {
		preHandler: [authenticateToken, requireManagerOrAdmin]
	}, async (request, reply) => {
		try {
			const { waybillId } = request.params as { waybillId: string }

			// Find order by waybill ID
			const order = await fastify.prisma.order.findUnique({
				where: { waybillId },
				select: { id: true, orderNumber: true }
			})

			if (!order) {
				return reply.code(404).send({ error: 'Order not found for this waybill' })
			}

			const result = await koombiyoService.receiveReturn(waybillId)

			if (result.success) {
				// Update order status
				await fastify.prisma.order.update({
					where: { id: order.id },
					data: {
						deliveryStatus: 'RETURNED',
						koombiyoLastStatus: 'RETURNED'
					}
				})

				// Log the action
				await koombiyoService.logDeliveryAction(
					fastify.prisma,
					order.id,
					'RETURN_RECEIVED',
					'RETURNED',
					`Return received for order ${order.orderNumber}`,
					result.data,
					(request as any).user?.id
				)

				return {
					success: true,
					message: result.message,
					orderNumber: order.orderNumber
				}
			}

			throw new Error(result.message || 'Failed to mark return as received')
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to mark return as received',
				message: error.message
			})
		}
	})
}

export default koombiyoRoutes