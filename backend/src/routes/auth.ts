import { FastifyPluginCallback } from 'fastify'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { UserStatus } from '@prisma/client'
import { authRequired } from '../middleware/route-helpers'

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6)
})

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	firstName: z.string().min(2),
	lastName: z.string().min(2)
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

		if (user.status === UserStatus.PENDING) {
			return reply.code(403).send({ error: 'Your account is pending approval. Please contact the administrator.' })
		}

		if (user.status === UserStatus.SUSPENDED) {
			return reply.code(403).send({ error: 'Your account has been suspended. Please contact the administrator.' })
		}

		const isValidPassword = await bcrypt.compare(password, user.passwordHash)
		if (!isValidPassword) {
			return reply.code(401).send({ error: 'Invalid credentials' })
		}			// Update last login
			await fastify.prisma.user.update({
				where: { id: user.id },
				data: { lastLoginAt: new Date() }
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
					firstName: user.firstName,
					lastName: user.lastName,
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
			const { email, password, firstName, lastName } = registerSchema.parse(request.body)

			const existingUser = await fastify.prisma.user.findUnique({
				where: { email }
			})

			if (existingUser) {
				return reply.code(409).send({ error: 'User already exists' })
			}

			const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS!) || 12
			const hashedPassword = await bcrypt.hash(password, saltRounds)

			const user = await fastify.prisma.user.create({
				data: {
					email,
					passwordHash: hashedPassword,
					firstName,
					lastName,
					role: 'STAFF',
					status: UserStatus.PENDING
				}
			})

			return {
				message: 'Registration successful! Your account is pending approval. You will be able to log in once an administrator activates your account.',
				user: {
					id: user.id,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					status: user.status
				}
			}
		} catch (error) {
			return reply.code(400).send({ error: 'Invalid request data' })
		}
	})

	// Get current user
	fastify.get('/me', {
		preHandler: authRequired
	}, async (request, reply) => {
		const user = await fastify.prisma.user.findUnique({
			where: { id: parseInt(request.user!.userId) },
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
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
		preHandler: authRequired
	}, async (request, reply) => {
		// In a production app, you might want to maintain a blacklist of tokens
		// For now, we'll just return success and let the client handle token removal
		return { message: 'Logged out successfully' }
	})

	// Get all users (Super Admin only)
	fastify.get('/users', {
		preHandler: authRequired
	}, async (request, reply) => {
		const currentUser = await fastify.prisma.user.findUnique({
			where: { id: parseInt(request.user!.userId) }
		})

		if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
			return reply.code(403).send({ error: 'Access denied. Super Admin role required.' })
		}

		const users = await fastify.prisma.user.findMany({
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				status: true,
				createdAt: true,
				lastLoginAt: true
			},
			orderBy: { createdAt: 'desc' }
		})

		return { users }
	})

	// Update user status (Super Admin only)
	fastify.patch('/users/:id/status', {
		preHandler: authRequired
	}, async (request, reply) => {
		const currentUser = await fastify.prisma.user.findUnique({
			where: { id: parseInt(request.user!.userId) }
		})

		if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
			return reply.code(403).send({ error: 'Access denied. Super Admin role required.' })
		}

		const { id } = request.params as { id: string }
		const { status } = request.body as { status: string }

		if (!Object.values(UserStatus).includes(status as UserStatus)) {
			return reply.code(400).send({ error: 'Invalid status. Must be PENDING, ACTIVE, or SUSPENDED.' })
		}

		const user = await fastify.prisma.user.update({
			where: { id: parseInt(id) },
			data: { status: status as UserStatus },
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				status: true
			}
		})

		return { user }
	})
}

export default authRoutes