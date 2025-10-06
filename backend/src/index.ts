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
import expenseRoutes from './routes/expenses'
import reportRoutes from './routes/reports'
import uploadsRoutes from './routes/uploads'
import koombiyoRoutes from './routes/koombiyo'
import inventoryRoutes from './routes/inventory'
import categoryRoutes from './routes/categories'
import customerRoutes from './routes/customers'

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
		BCRYPT_SALT_ROUNDS: {
			type: 'string',
			default: '12'
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
		},
		requestTimeout: 25000, // 25 second timeout for requests
		keepAliveTimeout: 30000 // 30 second keep-alive timeout
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
			: ['http://localhost:3000', 'http://127.0.0.1:3000'],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
		credentials: true
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

	// Error logging and handling middleware
	app.addHook('onError', async (request, reply, error) => {
		console.error(`${request.method} ${request.url} - Error:`, error.message)
		
		// Handle authentication/authorization errors from middleware
		if (error.statusCode && error.code) {
			return reply.code(error.statusCode).send({
				error: error.message,
				code: error.code
			})
		}
	})

	// Health check
	app.get('/health', async (request, reply) => {
		return { status: 'ok', timestamp: new Date().toISOString() }
	})

	// Register routes
	await app.register(authRoutes, { prefix: '/api/auth' })
	await app.register(categoryRoutes, { prefix: '/api/categories' })
	await app.register(productRoutes, { prefix: '/api/products' })
	await app.register(inventoryRoutes, { prefix: '/api/inventory' })
	await app.register(orderRoutes, { prefix: '/api/orders' })
	await app.register(customerRoutes, { prefix: '/api/customers' })
	await app.register(koombiyoRoutes, { prefix: '/api/koombiyo' })
	await app.register(expenseRoutes, { prefix: '/api/expenses' })
	await app.register(reportRoutes, { prefix: '/api/reports' })
	await app.register(uploadsRoutes, { prefix: '/api/uploads' })

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