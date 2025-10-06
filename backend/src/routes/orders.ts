import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'

const createOrderSchema = z.object({
    customerName: z.string().min(1, "Customer name is required"),
    customerEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
    customerPhone: z.string().min(1, "Customer phone is required"),
    address: z.string().min(1, "Address is required"),
    cityId: z.number().int("City ID must be a valid integer"),
    cityName: z.string().min(1, "City name is required"),
    districtId: z.number().int("District ID must be a valid integer"),
    districtName: z.string().min(1, "District name is required"),
    paymentMethod: z.enum(['CASH_ON_DELIVERY', 'BANK_TRANSFER']),
    notes: z.string().optional().or(z.literal('')),
    specialNotes: z.string().optional().or(z.literal('')),
    shippingAmount: z.number().nonnegative("Shipping amount cannot be negative").optional().default(0),
    discountAmount: z.number().nonnegative("Discount amount cannot be negative").optional().default(0),
    markAsReadyForDelivery: z.boolean().optional().default(false),
    items: z.array(z.object({
        productId: z.number().int("Product ID must be a valid integer"),
        quantity: z.number().int().positive("Quantity must be a positive integer"),
        unitPrice: z.number().positive("Unit price must be positive"),
        productName: z.string().min(1, "Product name is required"),
        sku: z.string().min(1, "SKU is required")
    })).min(1, "At least one item is required")
})

const updateOrderSchema = z.object({
    customerName: z.string().min(1).optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    customerPhone: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    cityId: z.number().int().optional(),
    cityName: z.string().optional(),
    districtId: z.number().int().optional(),
    districtName: z.string().optional(),
    notes: z.string().optional().or(z.literal('')),
    specialNotes: z.string().optional().or(z.literal('')),
    shippingAmount: z.number().nonnegative().optional(),
    discountAmount: z.number().nonnegative().optional(),
})

const orderRoutes: FastifyPluginCallback = async (fastify) => {
    // Get all orders
    fastify.get('/', async (request, reply) => {
        const orders = await fastify.prisma.order.findMany({
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                sku: true,
                                price: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return { orders }
    })

    // Get order by ID
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string }

        const order = await fastify.prisma.order.findUnique({
            where: { id: parseInt(id) },
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

        return { order }
    })

    // Create new order
    fastify.post('/', async (request, reply) => {
        try {
            const orderData = createOrderSchema.parse(request.body)

            // Fetch product cost prices for all items
            const productIds = orderData.items.map(item => item.productId)
            const products = await fastify.prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, costPrice: true }
            })
            
            // Create a map of productId to costPrice for easy lookup
            const costPriceMap = new Map(products.map(p => [p.id, p.costPrice]))

            // Calculate totals
            const subtotal = orderData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
            const shippingAmount = orderData.shippingAmount || 0
            const discountAmount = orderData.discountAmount || 0
            const totalAmount = subtotal + shippingAmount - discountAmount

            // Generate order number
            const orderNumber = `ORD-${Date.now()}`

            // Determine initial status based on markAsReadyForDelivery flag
            const initialStatus = orderData.markAsReadyForDelivery ? 'READY_FOR_DELIVERY' : 'PENDING'

            const order = await fastify.prisma.order.create({
                data: {
                    orderNumber,
                    customerName: orderData.customerName,
                    customerEmail: orderData.customerEmail,
                    customerPhone: orderData.customerPhone,
                    address: orderData.address,
                    cityId: orderData.cityId,
                    cityName: orderData.cityName,
                    districtId: orderData.districtId,
                    districtName: orderData.districtName,
                    paymentMethod: orderData.paymentMethod,
                    status: initialStatus,
                    subtotal,
                    shippingAmount,
                    discountAmount,
                    totalAmount,
                    notes: orderData.notes,
                    specialNotes: orderData.specialNotes,
                    orderItems: {
                        create: orderData.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice, // Selling price (what customer pays)
                            unitCost: costPriceMap.get(item.productId) || 0, // Cost price (for profit calculation)
                            totalPrice: item.quantity * item.unitPrice,
                            productName: item.productName,
                            sku: item.sku
                        }))
                    }
                }
            })

            // Fetch the created order with includes
            const orderWithItems = await fastify.prisma.order.findUnique({
                where: { id: order.id },
                include: {
                    orderItems: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            return reply.code(201).send({ order: orderWithItems })
        } catch (error) {
            console.error('Create order error:', error)
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ 
                    error: 'Invalid request data',
                    details: error.errors 
                })
            }
            return reply.code(400).send({ 
                error: 'Invalid request data',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    })

    // Update order status with workflow validation
    fastify.patch('/:id/status', async (request, reply) => {
        try {
            const { id } = request.params as { id: string }
            const { status } = request.body as any

            if (!status) {
                return reply.code(400).send({ error: 'Status is required' })
            }

            // Get current order
            const currentOrder = await fastify.prisma.order.findUnique({
                where: { id: parseInt(id) }
            })

            if (!currentOrder) {
                return reply.code(404).send({ error: 'Order not found' })
            }

            // Validate status transitions
            const validTransitions: Record<string, string[]> = {
                'PENDING': ['READY_FOR_DELIVERY', 'CANCELLED'],
                'READY_FOR_DELIVERY': ['SENT_TO_DELIVERY', 'CANCELLED'],
                'SENT_TO_DELIVERY': ['DELIVERED', 'RETURNED', 'REFUNDED', 'CANCELLED'],
                'DELIVERED': ['RETURNED', 'REFUNDED'],
                'RETURNED': ['REFUNDED'],
                'CANCELLED': [], // Cannot transition from cancelled
                'REFUNDED': [] // Cannot transition from refunded
            }

            const allowedTransitions = validTransitions[currentOrder.status] || []
            
            if (!allowedTransitions.includes(status) && currentOrder.status !== status) {
                return reply.code(400).send({ 
                    error: `Cannot transition from ${currentOrder.status} to ${status}` 
                })
            }

            const updateData: any = { status }

            // Handle SENT_TO_DELIVERY transition - send to Koombiyo
            if (status === 'SENT_TO_DELIVERY' && currentOrder.status !== 'SENT_TO_DELIVERY') {
                updateData.sentToDeliveryAt = new Date()
                updateData.deliveryStatus = 'SENT_TO_KOOMBIYO'
                
                // Log the action
                await fastify.prisma.deliveryLog.create({
                    data: {
                        orderId: parseInt(id),
                        action: 'SENT_TO_KOOMBIYO',
                        status: 'SENT_TO_KOOMBIYO',
                        message: 'Order marked as sent to delivery service'
                    }
                })
            }

            // Handle DELIVERED transition
            if (status === 'DELIVERED') {
                updateData.deliveredAt = new Date()
                updateData.deliveryStatus = 'DELIVERED'
            }

            const order = await fastify.prisma.order.update({
                where: { id: parseInt(id) },
                data: updateData,
                include: {
                    orderItems: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            return { order }
        } catch (error) {
            console.error('Update order status error:', error)
            return reply.code(400).send({ 
                error: 'Invalid request data or order not found',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    })

    // Update payment status
    fastify.patch('/:id/payment-status', async (request, reply) => {
        try {
            const { id } = request.params as { id: string }
            const { paymentStatus } = request.body as any

            if (!paymentStatus) {
                return reply.code(400).send({ error: 'Payment status is required' })
            }

            const order = await fastify.prisma.order.update({
                where: { id: parseInt(id) },
                data: { paymentStatus },
                include: {
                    orderItems: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            return { order }
        } catch (error) {
            return reply.code(400).send({ error: 'Invalid request data or order not found' })
        }
    })

    // Attach waybill ID and send to Koombiyo
    fastify.patch('/:id/attach-waybill', async (request, reply) => {
        try {
            const { id } = request.params as { id: string }
            const { waybillId } = request.body as any

            if (!waybillId || typeof waybillId !== 'string') {
                return reply.code(400).send({ error: 'Valid waybill ID is required' })
            }

            // Get current order
            const currentOrder = await fastify.prisma.order.findUnique({
                where: { id: parseInt(id) },
                include: {
                    orderItems: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            if (!currentOrder) {
                return reply.code(404).send({ error: 'Order not found' })
            }

            // Check if order is ready for delivery
            if (currentOrder.status !== 'READY_FOR_DELIVERY') {
                return reply.code(400).send({ 
                    error: 'Order must be in READY_FOR_DELIVERY status to attach waybill' 
                })
            }

            // Check if waybill is already assigned
            if (currentOrder.waybillId) {
                return reply.code(400).send({ 
                    error: 'Order already has a waybill assigned' 
                })
            }

            // Import KoombiyoService
            const KoombiyoService = (await import('../services/koombiyo.service')).default
            const koombiyoService = new KoombiyoService()

            // Prepare order data for Koombiyo
            const packageDescription = currentOrder.orderItems
                .map(item => `${item.productName} (${item.quantity})`)
                .join(', ')

            const orderData = {
                waybillId: waybillId,
                orderNo: currentOrder.orderNumber,
                receiverName: currentOrder.customerName,
                receiverStreet: currentOrder.address,
                receiverDistrict: currentOrder.districtId,
                receiverCity: currentOrder.cityId,
                receiverPhone: currentOrder.customerPhone || '',
                description: packageDescription,
                specialNotes: currentOrder.specialNotes || undefined,
                codAmount: currentOrder.paymentMethod === 'CASH_ON_DELIVERY' ? Number(currentOrder.totalAmount) : 0
            }

            // Send order to Koombiyo
            const result = await koombiyoService.addOrder(orderData)

            if (result.success) {
                // Update order with waybill and delivery status
                const updatedOrder = await fastify.prisma.order.update({
                    where: { id: parseInt(id) },
                    data: {
                        waybillId: waybillId,
                        deliveryStatus: 'SENT_TO_KOOMBIYO',
                        sentToDeliveryAt: new Date(),
                        status: 'SENT_TO_DELIVERY',
                        koombiyoOrderId: result.data?.id || null
                    },
                    include: {
                        orderItems: {
                            include: {
                                product: true
                            }
                        }
                    }
                })

                // Log the action
                await koombiyoService.logDeliveryAction(
                    fastify.prisma,
                    parseInt(id),
                    'SENT_TO_KOOMBIYO',
                    'SENT_TO_KOOMBIYO',
                    `Order ${currentOrder.orderNumber} sent to Koombiyo with waybill ${waybillId}`,
                    result.data,
                    (request as any).user?.id
                )

                return { 
                    order: updatedOrder,
                    message: 'Waybill attached and order sent to Koombiyo successfully',
                    koombiyoOrderId: result.data?.id
                }
            }

            throw new Error(result.message || 'Failed to send order to Koombiyo')
        } catch (error: any) {
            console.error('Attach waybill error:', error)
            return reply.code(400).send({ 
                error: 'Failed to attach waybill and send to Koombiyo',
                message: error.message || 'Unknown error'
            })
        }
    })

    // Update order (only allowed for PENDING orders)
    fastify.put('/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string }
            const updateData = updateOrderSchema.parse(request.body)

            // Get current order
            const currentOrder = await fastify.prisma.order.findUnique({
                where: { id: parseInt(id) },
                include: {
                    orderItems: true
                }
            })

            if (!currentOrder) {
                return reply.code(404).send({ error: 'Order not found' })
            }

            // Only allow editing PENDING orders
            if (currentOrder.status !== 'PENDING') {
                return reply.code(400).send({ 
                    error: 'Only orders with PENDING status can be edited. Use status endpoint to change order status.' 
                })
            }

            // Recalculate totals if amounts changed
            const shippingAmount = updateData.shippingAmount ?? currentOrder.shippingAmount
            const discountAmount = updateData.discountAmount ?? currentOrder.discountAmount
            const subtotal = currentOrder.subtotal
            const totalAmount = Number(subtotal) + Number(shippingAmount) - Number(discountAmount)

            const order = await fastify.prisma.order.update({
                where: { id: parseInt(id) },
                data: {
                    ...(updateData.customerName && { customerName: updateData.customerName }),
                    ...(updateData.customerEmail !== undefined && { customerEmail: updateData.customerEmail }),
                    ...(updateData.customerPhone && { customerPhone: updateData.customerPhone }),
                    ...(updateData.address && { address: updateData.address }),
                    ...(updateData.cityId && { cityId: updateData.cityId }),
                    ...(updateData.cityName && { cityName: updateData.cityName }),
                    ...(updateData.districtId && { districtId: updateData.districtId }),
                    ...(updateData.districtName && { districtName: updateData.districtName }),
                    ...(updateData.notes !== undefined && { notes: updateData.notes }),
                    ...(updateData.specialNotes !== undefined && { specialNotes: updateData.specialNotes }),
                    ...(updateData.shippingAmount !== undefined && { shippingAmount: updateData.shippingAmount }),
                    ...(updateData.discountAmount !== undefined && { discountAmount: updateData.discountAmount }),
                    totalAmount
                },
                include: {
                    orderItems: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            return { order }
        } catch (error) {
            console.error('Update order error:', error)
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ 
                    error: 'Invalid request data',
                    details: error.errors 
                })
            }
            return reply.code(400).send({ 
                error: 'Invalid request data or order not found',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    })

    // Cancel order (allowed from any status)
    fastify.patch('/:id/cancel', async (request, reply) => {
        try {
            const { id } = request.params as { id: string }
            const { reason } = request.body as { reason?: string }

            const currentOrder = await fastify.prisma.order.findUnique({
                where: { id: parseInt(id) }
            })

            if (!currentOrder) {
                return reply.code(404).send({ error: 'Order not found' })
            }

            // Cannot cancel already cancelled or refunded orders
            if (currentOrder.status === 'CANCELLED' || currentOrder.status === 'REFUNDED') {
                return reply.code(400).send({ 
                    error: `Order is already ${currentOrder.status.toLowerCase()}` 
                })
            }

            const order = await fastify.prisma.order.update({
                where: { id: parseInt(id) },
                data: {
                    status: 'CANCELLED',
                    internalNotes: reason ? `Cancelled: ${reason}` : 'Order cancelled'
                },
                include: {
                    orderItems: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            return { order }
        } catch (error) {
            console.error('Cancel order error:', error)
            return reply.code(400).send({ 
                error: 'Failed to cancel order',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    })

    // Delete order
    fastify.delete('/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string }

            await fastify.prisma.order.delete({
                where: { id: parseInt(id) }
            })

            return reply.code(204).send()
        } catch (error) {
            return reply.code(404).send({ error: 'Order not found' })
        }
    })
}

export default orderRoutes