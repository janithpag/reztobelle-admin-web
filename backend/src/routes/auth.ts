import { FastifyPluginCallback } from 'fastify'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { authenticateToken } from '../middleware/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2)
})

const authRoutes: FastifyPluginCallback = async (fastify) => {
  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body)
      
      const user = await fastify.prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      )

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid request data' })
    }
  })

  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, name } = registerSchema.parse(request.body)
      
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return reply.code(409).send({ error: 'User already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      
      const user = await fastify.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name
        }
      })

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      )

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    } catch (error) {
      return reply.code(400).send({ error: 'Invalid request data' })
    }
  })

  // Get current user
  fastify.get('/me', {
    preHandler: authenticateToken
  }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    return { user }
  })

  // Logout (client-side token invalidation)
  fastify.post('/logout', {
    preHandler: authenticateToken
  }, async (request, reply) => {
    // In a production app, you might want to maintain a blacklist of tokens
    // For now, we'll just return success and let the client handle token removal
    return { message: 'Logged out successfully' }
  })
}

export default authRoutes