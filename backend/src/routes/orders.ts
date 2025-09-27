import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'

const createOrderSchema = z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
    address: z.string().min(1),
    cityId: z.number().int(),
    cityName: z.string().min(1),
    districtId: z.number().int(),
    districtName: z.string().min(1),
    paymentMethod: z.enum(['CASH_ON_DELIVERY', 'BANK_TRANSFER']),
    notes: z.string().optional(),
    items: z.array(z.object({
        productId: z.number().int(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        productName: z.string().min(1),
        sku: z.string().min(1)
    }))
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
            const shippingAmount = 0
            const totalAmount = subtotal + shippingAmount

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
                    totalAmount,
                    notes: orderData.notes,
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
            return reply.code(400).send({ error: 'Invalid request data' })
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