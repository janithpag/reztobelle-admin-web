import fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import env from '@fastify/env'
import { PrismaClient } from '@prisma/client'

// Route imports
import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import orderRoutes from './routes/orders'
import deliveryRoutes from './routes/deliveries'
import expenseRoutes from './routes/expenses'
import reportRoutes from './routes/reports'

const prisma = new PrismaClient()

const envSchema = {
  type: 'object',
  required: ['DATABASE_URL', 'JWT_SECRET'],
  properties: {
    PORT: {
      type: 'string',
      default: '3001'
    },
    DATABASE_URL: {
      type: 'string'
    },
    JWT_SECRET: {
      type: 'string'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    }
  }
}

async function buildApp() {
  const app = fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  })

  // Register environment variables
  await app.register(env, {
    schema: envSchema,
    dotenv: true
  })

  // Register plugins
  await app.register(helmet)
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.com'] 
      : ['http://localhost:3000', 'http://127.0.0.1:3000']
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  // Register Swagger for API documentation
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'ReztoBelle Admin API',
        description: 'API for ReztoBelle Admin Dashboard',
        version: '1.0.0'
      },
      host: 'localhost:3001',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    }
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  })

  // Add Prisma to app context
  app.decorate('prisma', prisma)

  // Health check
  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(productRoutes, { prefix: '/api/products' })
  await app.register(orderRoutes, { prefix: '/api/orders' })
  await app.register(deliveryRoutes, { prefix: '/api/deliveries' })
  await app.register(expenseRoutes, { prefix: '/api/expenses' })
  await app.register(reportRoutes, { prefix: '/api/reports' })

  return app
}

async function start() {
  try {
    const app = await buildApp()
    
    const port = Number(process.env.PORT) || 3001
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
    
    await app.listen({ port, host })
    console.log(`🚀 Server running at http://${host}:${port}`)
    console.log(`📚 API Documentation available at http://${host}:${port}/docs`)
  } catch (err) {
    console.error('Error starting server:', err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

if (require.main === module) {
  start()
}

export default buildApp