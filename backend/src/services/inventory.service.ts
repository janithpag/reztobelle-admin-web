import { PrismaClient, StockMovementType, StockReferenceType } from '@prisma/client'

interface StockAdjustment {
	productId: number
	quantity: number
	movementType: StockMovementType
	referenceType: StockReferenceType
	referenceId?: number
	notes?: string
	unitCost?: number
	userId: number
}

class InventoryService {
	private prisma: PrismaClient

	constructor(prisma: PrismaClient) {
		this.prisma = prisma
	}

	// Reserve stock for an order
	async reserveStock(productId: number, quantity: number): Promise<any> {
		return await this.prisma.$transaction(async (tx) => {
			const inventory = await tx.inventory.findUnique({
				where: { productId }
			})

			if (!inventory) {
				throw new Error('Product inventory not found')
			}

			if (inventory.quantityAvailable < quantity) {
				throw new Error(`Insufficient stock. Available: ${inventory.quantityAvailable}, Required: ${quantity}`)
			}

			return await tx.inventory.update({
				where: { productId },
				data: {
					quantityAvailable: inventory.quantityAvailable - quantity,
					quantityReserved: inventory.quantityReserved + quantity
				}
			})
		})
	}

	// Release reserved stock (e.g., when order is cancelled)
	async releaseStock(productId: number, quantity: number): Promise<any> {
		return await this.prisma.$transaction(async (tx) => {
			const inventory = await tx.inventory.findUnique({
				where: { productId }
			})

			if (!inventory) {
				throw new Error('Product inventory not found')
			}

			if (inventory.quantityReserved < quantity) {
				throw new Error(`Cannot release more stock than reserved. Reserved: ${inventory.quantityReserved}, Requested: ${quantity}`)
			}

			return await tx.inventory.update({
				where: { productId },
				data: {
					quantityAvailable: inventory.quantityAvailable + quantity,
					quantityReserved: inventory.quantityReserved - quantity
				}
			})
		})
	}

	// Confirm stock reservation (convert reserved to sold)
	async confirmStock(productId: number, quantity: number): Promise<any> {
		return await this.prisma.$transaction(async (tx) => {
			const inventory = await tx.inventory.findUnique({
				where: { productId }
			})

			if (!inventory) {
				throw new Error('Product inventory not found')
			}

			if (inventory.quantityReserved < quantity) {
				throw new Error(`Cannot confirm more stock than reserved. Reserved: ${inventory.quantityReserved}, Requested: ${quantity}`)
			}

			return await tx.inventory.update({
				where: { productId },
				data: {
					quantityReserved: inventory.quantityReserved - quantity
				}
			})
		})
	}

	// Adjust stock levels with movement tracking
	async adjustStock(adjustment: StockAdjustment): Promise<{ previousQuantity: number, newQuantity: number }> {
		return await this.prisma.$transaction(async (tx) => {
			const inventory = await tx.inventory.findUnique({
				where: { productId: adjustment.productId }
			})

			if (!inventory) {
				throw new Error('Product inventory not found')
			}

			const previousQuantity = inventory.quantityAvailable
			let newQuantity = previousQuantity

			// Calculate new quantity based on movement type
			switch (adjustment.movementType) {
				case StockMovementType.IN:
					newQuantity = previousQuantity + adjustment.quantity
					break
				case StockMovementType.OUT:
					if (previousQuantity < adjustment.quantity) {
						throw new Error(`Insufficient stock. Available: ${previousQuantity}, Required: ${adjustment.quantity}`)
					}
					newQuantity = previousQuantity - adjustment.quantity
					break
				case StockMovementType.ADJUSTMENT:
					// For adjustments, the quantity can be positive or negative
					newQuantity = previousQuantity + adjustment.quantity
					if (newQuantity < 0) {
						throw new Error('Stock adjustment would result in negative inventory')
					}
					break
			}

			// Update inventory
			await tx.inventory.update({
				where: { productId: adjustment.productId },
				data: {
					quantityAvailable: newQuantity,
					lastRestockedAt: adjustment.movementType === StockMovementType.IN ? new Date() : inventory.lastRestockedAt
				}
			})

			// Log stock movement
			await tx.stockMovement.create({
				data: {
					productId: adjustment.productId,
					movementType: adjustment.movementType,
					quantity: adjustment.quantity,
					referenceType: adjustment.referenceType,
					referenceId: adjustment.referenceId,
					notes: adjustment.notes,
					unitCost: adjustment.unitCost,
					createdBy: adjustment.userId
				}
			})

			return { previousQuantity, newQuantity }
		})
	}

	// Get inventory levels with low stock alerts
	async getInventoryLevels(includeInactive = false): Promise<any[]> {
		const whereClause = includeInactive ? {} : { product: { isActive: true } }

		return await this.prisma.inventory.findMany({
			where: whereClause,
			include: {
				product: {
					select: {
						id: true,
						name: true,
						sku: true,
						isActive: true,
						price: true,
						category: {
							select: {
								name: true
							}
						}
					}
				}
			},
			orderBy: {
				quantityAvailable: 'asc'
			}
		})
	}

	// Get low stock items
	async getLowStockItems(): Promise<any[]> {
		return await this.prisma.inventory.findMany({
			where: {
				quantityAvailable: {
					lte: this.prisma.inventory.fields.reorderLevel
				},
				product: {
					isActive: true
				}
			},
			include: {
				product: {
					select: {
						id: true,
						name: true,
						sku: true,
						price: true,
						category: {
							select: {
								name: true
							}
						}
					}
				}
			},
			orderBy: {
				quantityAvailable: 'asc'
			}
		})
	}

	// Get stock movement history
	async getStockMovements(
		productId?: number,
		movementType?: StockMovementType,
		limit = 50,
		offset = 0
	): Promise<any[]> {
		const where: any = {}

		if (productId) {
			where.productId = productId
		}

		if (movementType) {
			where.movementType = movementType
		}

		return await this.prisma.stockMovement.findMany({
			where,
			include: {
				product: {
					select: {
						id: true,
						name: true,
						sku: true
					}
				},
				createdByUser: {
					select: {
						id: true,
						firstName: true,
						lastName: true
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
			take: limit,
			skip: offset
		})
	}

	// Create or update inventory for a product
	async upsertInventory(
		productId: number,
		initialQuantity = 0,
		reorderLevel = 10,
		maxStockLevel = 1000
	): Promise<any> {
		return await this.prisma.inventory.upsert({
			where: { productId },
			create: {
				productId,
				quantityAvailable: initialQuantity,
				reorderLevel,
				maxStockLevel,
				lastRestockedAt: initialQuantity > 0 ? new Date() : null
			},
			update: {
				reorderLevel,
				maxStockLevel
			}
		})
	}

	// Get inventory summary for dashboard
	async getInventorySummary(): Promise<{
		totalProducts: number
		totalValue: number
		lowStockCount: number
		outOfStockCount: number
		totalQuantity: number
	}> {
		const inventoryData = await this.prisma.inventory.findMany({
			include: {
				product: {
					select: {
						price: true,
						costPrice: true,
						isActive: true
					}
				}
			},
			where: {
				product: {
					isActive: true
				}
			}
		})

		const summary = inventoryData.reduce(
			(acc, item) => {
				acc.totalProducts += 1
				acc.totalQuantity += item.quantityAvailable + item.quantityReserved
				acc.totalValue += (item.quantityAvailable * Number(item.product.costPrice))

				if (item.quantityAvailable === 0) {
					acc.outOfStockCount += 1
				} else if (item.quantityAvailable <= item.reorderLevel) {
					acc.lowStockCount += 1
				}

				return acc
			},
			{
				totalProducts: 0,
				totalValue: 0,
				lowStockCount: 0,
				outOfStockCount: 0,
				totalQuantity: 0
			}
		)

		return summary
	}
}

export default InventoryService