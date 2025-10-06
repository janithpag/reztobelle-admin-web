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
    items: z.array(z.object({
        productId: z.number().int("Product ID must be a valid integer"),
        quantity: z.number().int().positive("Quantity must be a positive integer"),
        unitPrice: z.number().positive("Unit price must be positive"),
        productName: z.string().min(1, "Product name is required"),
        sku: z.string().min(1, "SKU is required")
    })).min(1, "At least one item is required")
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

            // Calculate totals
            const subtotal = orderData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
            const shippingAmount = orderData.shippingAmount || 0
            const discountAmount = orderData.discountAmount || 0
            const totalAmount = subtotal + shippingAmount - discountAmount

            // Generate order number
            const orderNumber = `ORD-${Date.now()}`

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
                            unitPrice: item.unitPrice,
                            unitCost: item.unitPrice,
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

    // Update order status
    fastify.patch('/:id/status', async (request, reply) => {
        try {
            const { id } = request.params as { id: string }
            const { status, deliveryStatus, paymentStatus } = request.body as any

            const order = await fastify.prisma.order.update({
                where: { id: parseInt(id) },
                data: {
                    ...(status && { status }),
                    ...(deliveryStatus && { deliveryStatus }),
                    ...(paymentStatus && { paymentStatus })
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
            return reply.code(400).send({ error: 'Invalid request data or order not found' })
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

    // Update order
    fastify.put('/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string }
            const updateData = request.body as any

            const order = await fastify.prisma.order.update({
                where: { id: parseInt(id) },
                data: {
                    ...(updateData.status && { status: updateData.status }),
                    ...(updateData.deliveryStatus && { deliveryStatus: updateData.deliveryStatus }),
                    ...(updateData.paymentStatus && { paymentStatus: updateData.paymentStatus }),
                    ...(updateData.notes && { notes: updateData.notes })
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
            return reply.code(400).send({ error: 'Invalid request data or order not found' })
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