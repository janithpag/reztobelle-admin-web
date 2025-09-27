import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth'

const paymentRoutes: FastifyPluginCallback = async (fastify) => {
	// Get all payment transactions
	fastify.get('/', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const {
				status,
				paymentMethod,
				limit = '50',
				offset = '0'
			} = request.query as {
				status?: string
				paymentMethod?: string
				limit?: string
				offset?: string
			}

			const where: any = {}
			if (status) where.status = status
			if (paymentMethod) where.paymentMethod = paymentMethod

			const transactions = await fastify.prisma.paymentTransaction.findMany({
				where,
				include: {
					order: {
						select: {
							id: true,
							orderNumber: true,
							customerName: true,
							totalAmount: true
						}
					},
					verifiedByUser: {
						select: {
							id: true,
							firstName: true,
							lastName: true
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				take: parseInt(limit),
				skip: parseInt(offset)
			})

			return { transactions }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch payment transactions',
				message: error.message
			})
		}
	})

	// Get pending payment transactions
	fastify.get('/pending', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const pendingTransactions = await fastify.prisma.paymentTransaction.findMany({
				where: {
					status: 'PENDING'
				},
				include: {
					order: {
						select: {
							id: true,
							orderNumber: true,
							customerName: true,
							customerPhone: true,
							totalAmount: true
						}
					}
				},
				orderBy: { createdAt: 'asc' }
			})

			return { pendingTransactions }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch pending payments',
				message: error.message
			})
		}
	})

	// Upload deposit slip for order
	fastify.post('/orders/:orderId/deposit-slip', {
		preHandler: authenticateToken,
		schema: {
			body: {
				type: 'object',
				required: ['transactionId', 'depositSlipUrl'],
				properties: {
					transactionId: { type: 'string', minLength: 1 },
					bankDetails: { type: 'string' },
					depositSlipUrl: { type: 'string', format: 'uri' },
					notes: { type: 'string' }
				}
			}
		}
	}, async (request, reply) => {
		try {
			const { orderId } = request.params as { orderId: string }
			const orderIdNum = parseInt(orderId)

			if (isNaN(orderIdNum)) {
				return reply.code(400).send({ error: 'Invalid order ID' })
			}

			// Validate request body with Zod
			const depositSlipSchema = z.object({
				transactionId: z.string().min(1),
				bankDetails: z.string().optional(),
				depositSlipUrl: z.string().url(),
				notes: z.string().optional()
			})

			const validationResult = depositSlipSchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const data = validationResult.data

			// Check if order exists
			const order = await fastify.prisma.order.findUnique({
				where: { id: orderIdNum },
				select: {
					id: true,
					totalAmount: true,
					paymentMethod: true,
					paymentStatus: true
				}
			})

			if (!order) {
				return reply.code(404).send({ error: 'Order not found' })
			}

			if (order.paymentMethod !== 'BANK_TRANSFER') {
				return reply.code(400).send({ error: 'This order is not using bank transfer payment method' })
			}

			if (order.paymentStatus === 'PAID') {
				return reply.code(400).send({ error: 'This order has already been paid' })
			}

			// Check if transaction ID already exists
			const existingTransaction = await fastify.prisma.paymentTransaction.findUnique({
				where: { transactionId: data.transactionId }
			})

			if (existingTransaction) {
				return reply.code(409).send({ error: 'Transaction ID already exists' })
			}

			// Create payment transaction
			const transaction = await fastify.prisma.paymentTransaction.create({
				data: {
					orderId: orderIdNum,
					transactionId: data.transactionId,
					paymentMethod: 'BANK_TRANSFER',
					amount: order.totalAmount,
					status: 'PENDING',
					bankDetails: data.bankDetails,
					depositSlipUrl: data.depositSlipUrl,
					notes: data.notes
				},
				include: {
					order: {
						select: {
							orderNumber: true,
							customerName: true
						}
					}
				}
			})

			return reply.code(201).send({
				transaction,
				message: 'Deposit slip uploaded successfully. Payment is pending verification.'
			})
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to upload deposit slip',
				message: error.message
			})
		}
	})

	// Verify payment transaction (Admin only)
	fastify.put('/transactions/:transactionId/verify', {
		preHandler: [authenticateToken, requireManagerOrAdmin],
		schema: {
			body: {
				type: 'object',
				required: ['status'],
				properties: {
					status: { type: 'string', enum: ['COMPLETED', 'FAILED'] },
					notes: { type: 'string' }
				}
			}
		}
	}, async (request, reply) => {
		try {
			const { transactionId } = request.params as { transactionId: string }

			// Validate request body with Zod
			const verifyPaymentSchema = z.object({
				status: z.enum(['COMPLETED', 'FAILED']),
				notes: z.string().optional()
			})

			const validationResult = verifyPaymentSchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const { status, notes } = validationResult.data

			// Find the transaction
			const transaction = await fastify.prisma.paymentTransaction.findUnique({
				where: { transactionId },
				include: {
					order: true
				}
			})

			if (!transaction) {
				return reply.code(404).send({ error: 'Payment transaction not found' })
			}

			if (transaction.status !== 'PENDING') {
				return reply.code(400).send({ error: 'Only pending transactions can be verified' })
			}

			// Update transaction and order in a transaction
			const result = await fastify.prisma.$transaction(async (tx) => {
				// Update payment transaction
				const updatedTransaction = await tx.paymentTransaction.update({
					where: { transactionId },
					data: {
						status,
						verifiedBy: (request as any).user?.id,
						verifiedAt: new Date(),
						processedAt: status === 'COMPLETED' ? new Date() : null,
						notes: notes ? `${transaction.notes || ''}\n\nVerification: ${notes}`.trim() : transaction.notes
					}
				})

				// Update order payment status if completed
				if (status === 'COMPLETED') {
					await tx.order.update({
						where: { id: transaction.orderId },
						data: {
							paymentStatus: 'PAID',
							status: transaction.order.status === 'PENDING' ? 'CONFIRMED' : transaction.order.status
						}
					})
				}

				return updatedTransaction
			})

			return {
				transaction: result,
				message: status === 'COMPLETED'
					? 'Payment verified and order confirmed'
					: 'Payment marked as failed'
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to verify payment',
				message: error.message
			})
		}
	})

	// Get payment transaction by ID
	fastify.get('/transactions/:transactionId', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const { transactionId } = request.params as { transactionId: string }

			const transaction = await fastify.prisma.paymentTransaction.findUnique({
				where: { transactionId },
				include: {
					order: {
						select: {
							id: true,
							orderNumber: true,
							customerName: true,
							customerEmail: true,
							customerPhone: true,
							totalAmount: true,
							paymentStatus: true,
							status: true,
							createdAt: true
						}
					},
					verifiedByUser: {
						select: {
							id: true,
							firstName: true,
							lastName: true
						}
					}
				}
			})

			if (!transaction) {
				return reply.code(404).send({ error: 'Payment transaction not found' })
			}

			return { transaction }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch payment transaction',
				message: error.message
			})
		}
	})

	// Get payment statistics
	fastify.get('/statistics', {
		preHandler: authenticateToken
	}, async (request, reply) => {
		try {
			const { startDate, endDate } = request.query as {
				startDate?: string
				endDate?: string
			}

			const dateFilter: any = {}
			if (startDate) dateFilter.gte = new Date(startDate)
			if (endDate) dateFilter.lte = new Date(endDate)

			const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}

			// Get payment statistics
			const [totalTransactions, completedTransactions, pendingTransactions, failedTransactions] =
				await Promise.all([
					fastify.prisma.paymentTransaction.count({ where }),
					fastify.prisma.paymentTransaction.count({
						where: { ...where, status: 'COMPLETED' }
					}),
					fastify.prisma.paymentTransaction.count({
						where: { ...where, status: 'PENDING' }
					}),
					fastify.prisma.paymentTransaction.count({
						where: { ...where, status: 'FAILED' }
					})
				])

			// Get payment amounts
			const paymentSummary = await fastify.prisma.paymentTransaction.groupBy({
				by: ['status', 'paymentMethod'],
				where,
				_sum: {
					amount: true
				},
				_count: true
			})

			return {
				statistics: {
					totalTransactions,
					completedTransactions,
					pendingTransactions,
					failedTransactions,
					paymentSummary
				}
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch payment statistics',
				message: error.message
			})
		}
	})
}

export default paymentRoutes