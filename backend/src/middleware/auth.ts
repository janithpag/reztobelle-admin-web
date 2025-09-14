import jwt from 'jsonwebtoken'
import { FastifyRequest, FastifyReply } from 'fastify'

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

export const authenticateToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null

    if (!token) {
      return reply.code(401).send({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthenticatedUser
    request.user = decoded
  } catch (error) {
    return reply.code(401).send({ 
      error: 'Invalid token.',
      code: 'INVALID_TOKEN'
    })
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ 
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED'
      })
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({ 
        error: 'Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }
  }
}

export const requireAdmin = () => requireRole(['ADMIN'])
export const requireManagerOrAdmin = () => requireRole(['ADMIN', 'MANAGER'])