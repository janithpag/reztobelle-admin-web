import { PrismaClient } from '@prisma/client'
import '@fastify/multipart'

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient
    }

    interface FastifyRequest {
        user?: any
    }
}