import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  sku: z.string().min(1),
  category: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
})

const updateProductSchema = createProductSchema.partial()

const productRoutes: FastifyPluginCallback = async (fastify) => {
  // Get all products
  fastify.get('/', async (request, reply) => {
    const products = await fastify.prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return { products }
  })

  // Get product by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const product = await fastify.prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' })
    }

    return { product }
  })

  // Create product
  fastify.post('/', async (request, reply) => {
    try {
      const data = createProductSchema.parse(request.body)
      
      const product = await fastify.prisma.product.create({
        data
      })

      return reply.code(201).send({ product })
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid request data' })
    }
  })

  // Update product
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = updateProductSchema.parse(request.body)

      const product = await fastify.prisma.product.update({
        where: { id },
        data
      })

      return { product }
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid request data or product not found' })
    }
  })

  // Delete product
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await fastify.prisma.product.delete({
        where: { id }
      })

      return reply.code(204).send()
    } catch (error) {
      return reply.code(404).send({ error: 'Product not found' })
    }
  })
}

export default productRoutes