import jwt from 'jsonwebtoken'
import { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify'

export interface AuthenticatedUser {
	userId: string
	email: string
	role: string
}

declare module 'fastify' {
	interface FastifyRequest {
		user?: AuthenticatedUser
	}
}

// Fixed authentication middleware using proper Fastify preHandler pattern
export const authenticateToken: preHandlerHookHandler = async (request, reply) => {
	const authHeader = request.headers.authorization
	const token = authHeader && authHeader.startsWith('Bearer ')
		? authHeader.split(' ')[1]
		: null

	if (!token) {
		throw { statusCode: 401, message: 'Access denied. No token provided.', code: 'NO_TOKEN' }
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthenticatedUser
		request.user = decoded
	} catch (error) {
		console.error('Token verification failed:', error)
		throw { statusCode: 401, message: 'Invalid token.', code: 'INVALID_TOKEN' }
	}
}

export const requireRole = (allowedRoles: string[]): preHandlerHookHandler => {
	return async (request, reply) => {
		if (!request.user) {
			throw { statusCode: 401, message: 'Authentication required.', code: 'UNAUTHENTICATED' }
		}

		if (!allowedRoles.includes(request.user.role)) {
			console.warn(`Access denied for user ${request.user.email}: role ${request.user.role} not in [${allowedRoles.join(', ')}]`)
			throw { statusCode: 403, message: 'Insufficient permissions.', code: 'INSUFFICIENT_PERMISSIONS' }
		}
	}
}

export const requireAdmin = () => requireRole(['ADMIN'])
export const requireManagerOrAdmin = () => requireRole(['ADMIN', 'MANAGER', 'SUPER_ADMIN'])