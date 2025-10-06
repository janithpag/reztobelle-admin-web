import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { authRequired, managerOrAdmin } from '../middleware/route-helpers'
import InventoryService from '../services/inventory.service'

const inventoryRoutes: FastifyPluginCallback = async (fastify) => {
	const inventoryService = new InventoryService(fastify.prisma)

	// Get all inventory levels
	fastify.get('/', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const { includeInactive } = request.query as { includeInactive?: string }
			const includeInactiveProducts = includeInactive === 'true'

			const inventory = await inventoryService.getInventoryLevels(includeInactiveProducts)

			return { inventory }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch inventory',
				message: error.message
			})
		}
	})

	// Get low stock items
	fastify.get('/low-stock', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const lowStockItems = await inventoryService.getLowStockItems()

			return { lowStockItems }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch low stock items',
				message: error.message
			})
		}
	})

	// Get inventory summary for dashboard
	fastify.get('/summary', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const summary = await inventoryService.getInventorySummary()

			return { summary }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch inventory summary',
				message: error.message
			})
		}
	})

	// Adjust stock levels
	fastify.put('/:id/adjust', {
		preHandler: managerOrAdmin,
		schema: {
			body: {
				type: 'object',
				required: ['quantity', 'movementType', 'referenceType'],
				properties: {
					quantity: { type: 'integer' },
					movementType: { type: 'string', enum: ['IN', 'OUT', 'ADJUSTMENT'] },
					referenceType: { type: 'string', enum: ['PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT'] },
					referenceId: { type: 'integer' },
					notes: { type: 'string' },
					unitCost: { type: 'number', minimum: 0 }
				}
			}
		}
	}, async (request, reply) => {
		try {
			const { id } = request.params as { id: string }
			const productId = parseInt(id)

			if (isNaN(productId)) {
				return reply.code(400).send({ error: 'Invalid product ID' })
			}

			// Validate request body with Zod
			const adjustStockSchema = z.object({
				quantity: z.number().int(),
				movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
				referenceType: z.enum(['PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT']),
				referenceId: z.number().int().optional(),
				notes: z.string().optional(),
				unitCost: z.number().positive().optional()
			})

			const validationResult = adjustStockSchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const adjustmentData = validationResult.data

			const result = await inventoryService.adjustStock({
				productId,
				quantity: adjustmentData.quantity,
				movementType: adjustmentData.movementType as any,
				referenceType: adjustmentData.referenceType as any,
				referenceId: adjustmentData.referenceId,
				notes: adjustmentData.notes,
				unitCost: adjustmentData.unitCost,
				userId: (request as any).user?.id
			})

			return {
				success: true,
				message: result.newCostPrice 
					? `Stock adjusted successfully. New weighted average cost: LKR ${result.newCostPrice.toFixed(2)}`
					: 'Stock adjusted successfully',
				previousQuantity: result.previousQuantity,
				newQuantity: result.newQuantity,
				newCostPrice: result.newCostPrice
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to adjust stock',
				message: error.message
			})
		}
	})

	// Get stock movement history
	fastify.get('/movements', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const {
				productId,
				movementType,
				limit = '50',
				offset = '0'
			} = request.query as {
				productId?: string
				movementType?: string
				limit?: string
				offset?: string
			}

			const movements = await inventoryService.getStockMovements(
				productId ? parseInt(productId) : undefined,
				movementType as any,
				parseInt(limit),
				parseInt(offset)
			)

			return { movements }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch stock movements',
				message: error.message
			})
		}
	})

	// Reserve stock for an order
	fastify.post('/reserve', {
		preHandler: managerOrAdmin,
		schema: {
			body: {
				type: 'object',
				required: ['productId', 'quantity'],
				properties: {
					productId: { type: 'integer', minimum: 1 },
					quantity: { type: 'integer', minimum: 1 }
				}
			}
		}
	}, async (request, reply) => {
		try {
			// Validate request body with Zod
			const reserveStockSchema = z.object({
				productId: z.number().int().positive(),
				quantity: z.number().int().positive()
			})

			const validationResult = reserveStockSchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const { productId, quantity } = validationResult.data

			const result = await inventoryService.reserveStock(productId, quantity)

			return {
				success: true,
				message: 'Stock reserved successfully',
				inventory: result
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to reserve stock',
				message: error.message
			})
		}
	})

	// Release reserved stock
	fastify.post('/release', {
		preHandler: managerOrAdmin,
		schema: {
			body: {
				type: 'object',
				required: ['productId', 'quantity'],
				properties: {
					productId: { type: 'integer', minimum: 1 },
					quantity: { type: 'integer', minimum: 1 }
				}
			}
		}
	}, async (request, reply) => {
		try {
			// Validate request body with Zod
			const releaseStockSchema = z.object({
				productId: z.number().int().positive(),
				quantity: z.number().int().positive()
			})

			const validationResult = releaseStockSchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const { productId, quantity } = validationResult.data

			const result = await inventoryService.releaseStock(productId, quantity)

			return {
				success: true,
				message: 'Stock released successfully',
				inventory: result
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to release stock',
				message: error.message
			})
		}
	})

	// Confirm reserved stock (convert reserved to sold)
	fastify.post('/confirm', {
		preHandler: managerOrAdmin,
		schema: {
			body: {
				type: 'object',
				required: ['productId', 'quantity'],
				properties: {
					productId: { type: 'integer', minimum: 1 },
					quantity: { type: 'integer', minimum: 1 }
				}
			}
		}
	}, async (request, reply) => {
		try {
			// Validate request body with Zod
			const confirmStockSchema = z.object({
				productId: z.number().int().positive(),
				quantity: z.number().int().positive()
			})

			const validationResult = confirmStockSchema.safeParse(request.body)
			if (!validationResult.success) {
				return reply.code(400).send({
					error: 'Validation failed',
					details: validationResult.error.issues
				})
			}

			const { productId, quantity } = validationResult.data

			const result = await inventoryService.confirmStock(productId, quantity)

			return {
				success: true,
				message: 'Stock confirmed successfully',
				inventory: result
			}
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to confirm stock',
				message: error.message
			})
		}
	})

	// Get cost history for a product (Weighted Average Cost tracking)
	fastify.get('/:id/cost-history', {
		preHandler: authRequired
	}, async (request, reply) => {
		try {
			const { id } = request.params as { id: string }
			const productId = parseInt(id)

			if (isNaN(productId)) {
				return reply.code(400).send({ error: 'Invalid product ID' })
			}

			const { limit = '20' } = request.query as { limit?: string }

			const costHistory = await inventoryService.getCostHistory(
				productId,
				parseInt(limit)
			)

			return { costHistory }
		} catch (error: any) {
			return reply.code(500).send({
				error: 'Failed to fetch cost history',
				message: error.message
			})
		}
	})
}

export default inventoryRoutes