import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'

const createOrderSchema = z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    customerPhone: z.string().optional(),
    shippingAddress: z.string().min(1),
    notes: z.string().optional(),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().positive()
    }))
})

const orderRoutes: FastifyPluginCallback = async (fastify) => {
    // Get all orders
    fastify.get('/', async (request, reply) => {
        const orders = await fastify.prisma.order.findMany({
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                deliveries: true
            },
            orderBy: { createdAt: 'desc' }
        })
        return { orders }
    })

    // Get order by ID
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string }

        const order = await fastify.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                deliveries: true
            }
        })

        if (!order) {
            return reply.code(404).send({ error: 'Order not found' })
        }

        return { order }
    })

    // Create order
    fastify.post('/', async (request, reply) => {
        try {
            const { items, ...orderData } = createOrderSchema.parse(request.body)

            // Calculate total amount
            const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

            // Generate order number
            const orderNumber = `ORD-${Date.now()}`

            const order = await fastify.prisma.order.create({
                data: {
                    ...orderData,
                    orderNumber,
                    totalAmount,
                    items: {
                        create: items
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            return reply.code(201).send({ order })
        } catch (error) {
            return reply.code(400).send({ error: 'Invalid request data' })
        }
    })

    // Update order status
    fastify.patch('/:id/status', async (request, reply) => {
        try {
            const { id } = request.params as { id: string }
            const { status } = request.body as { status: string }

            const order = await fastify.prisma.order.update({
                where: { id },
                data: { status: status as any },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    deliveries: true
                }
            })

            return { order }
        } catch (error) {
            return reply.code(400).send({ error: 'Invalid request data or order not found' })
        }
    })
}

export default orderRoutes