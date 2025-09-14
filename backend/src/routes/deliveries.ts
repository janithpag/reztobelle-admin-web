import { FastifyPluginCallback } from 'fastify'

const deliveryRoutes: FastifyPluginCallback = async (fastify) => {
  // Get all deliveries
  fastify.get('/', async (request, reply) => {
    const deliveries = await fastify.prisma.delivery.findMany({
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return { deliveries }
  })

  // Create delivery for order
  fastify.post('/', async (request, reply) => {
    try {
      const { orderId, provider, trackingNumber, deliveryFee } = request.body as any

      const delivery = await fastify.prisma.delivery.create({
        data: {
          orderId,
          provider,
          trackingNumber,
          deliveryFee
        },
        include: {
          order: true
        }
      })

      return reply.code(201).send({ delivery })
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid request data' })
    }
  })

  // Update delivery status
  fastify.patch('/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { status, actualDelivery } = request.body as any

      const updateData: any = { status }
      if (actualDelivery) {
        updateData.actualDelivery = new Date(actualDelivery)
      }

      const delivery = await fastify.prisma.delivery.update({
        where: { id },
        data: updateData,
        include: {
          order: true
        }
      })

      return { delivery }
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid request data or delivery not found' })
    }
  })
}

export default deliveryRoutes