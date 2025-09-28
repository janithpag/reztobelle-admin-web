import { preHandlerHookHandler } from 'fastify'
import { authenticateToken, requireRole } from './auth'

/**
 * Common preHandler combinations for routes
 * This provides a centralized way to apply authentication and authorization
 */

// Authentication only
export const authRequired: preHandlerHookHandler[] = [authenticateToken]

// Admin access (ADMIN role only)
export const adminOnly: preHandlerHookHandler[] = [
	authenticateToken,
	requireRole(['ADMIN'])
]

// Manager or Admin access (MANAGER, ADMIN, SUPER_ADMIN roles)
export const managerOrAdmin: preHandlerHookHandler[] = [
	authenticateToken,
	requireRole(['ADMIN', 'MANAGER', 'SUPER_ADMIN'])
]

// Super Admin only (SUPER_ADMIN role only)
export const superAdminOnly: preHandlerHookHandler[] = [
	authenticateToken,
	requireRole(['SUPER_ADMIN'])
]

/**
 * Usage examples:
 * 
 * // For routes requiring authentication only
 * fastify.get('/protected', { preHandler: authRequired }, handler)
 * 
 * // For routes requiring manager or admin privileges
 * fastify.post('/admin-action', { preHandler: managerOrAdmin }, handler)
 * 
 * // For routes requiring admin only
 * fastify.delete('/critical', { preHandler: adminOnly }, handler)
 * 
 * // For routes requiring super admin only
 * fastify.put('/system', { preHandler: superAdminOnly }, handler)
 */