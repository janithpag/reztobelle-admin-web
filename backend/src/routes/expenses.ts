import { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'

const createExpenseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string().transform(str => new Date(str)),
  receipt: z.string().optional()
})

const expenseRoutes: FastifyPluginCallback = async (fastify) => {
  // Get all expenses
  fastify.get('/', async (request, reply) => {
    const expenses = await fastify.prisma.expense.findMany({
      orderBy: { date: 'desc' }
    })
    return { expenses }
  })

  // Get expense by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const expense = await fastify.prisma.expense.findUnique({
      where: { id }
    })

    if (!expense) {
      return reply.code(404).send({ error: 'Expense not found' })
    }

    return { expense }
  })

  // Create expense
  fastify.post('/', async (request, reply) => {
    try {
      const data = createExpenseSchema.parse(request.body)
      
      const expense = await fastify.prisma.expense.create({
        data
      })

      return reply.code(201).send({ expense })
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid request data' })
    }
  })

  // Update expense
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = createExpenseSchema.partial().parse(request.body)

      const expense = await fastify.prisma.expense.update({
        where: { id },
        data
      })

      return { expense }
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid request data or expense not found' })
    }
  })

  // Delete expense
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await fastify.prisma.expense.delete({
        where: { id }
      })

      return reply.code(204).send()
    } catch (error) {
      return reply.code(404).send({ error: 'Expense not found' })
    }
  })
}

export default expenseRoutes