import { FastifyPluginCallback } from 'fastify'

const reportRoutes: FastifyPluginCallback = async (fastify) => {
  // Dashboard overview
  fastify.get('/dashboard', async (request, reply) => {
    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      lowStockProducts,
      recentOrders
    ] = await Promise.all([
      fastify.prisma.product.count(),
      fastify.prisma.order.count(),
      fastify.prisma.order.aggregate({
        _sum: { totalAmount: true }
      }),
      fastify.prisma.order.count({
        where: { status: 'PENDING' }
      }),
      fastify.prisma.product.findMany({
        where: { stock: { lte: 10 } },
        select: { id: true, name: true, stock: true, sku: true }
      }),
      fastify.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { name: true } }
            }
          }
        }
      })
    ])

    return {
      overview: {
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingOrders,
        lowStockCount: lowStockProducts.length
      },
      lowStockProducts,
      recentOrders
    }
  })

  // Sales report
  fastify.get('/sales', async (request, reply) => {
    const { startDate, endDate } = request.query as { startDate?: string, endDate?: string }
    
    const whereClause: any = {}
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [orders, totalRevenue, ordersByStatus] = await Promise.all([
      fastify.prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              product: { select: { name: true, category: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      fastify.prisma.order.aggregate({
        where: whereClause,
        _sum: { totalAmount: true },
        _count: true
      }),
      fastify.prisma.order.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true
      })
    ])

    return {
      orders,
      summary: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalOrders: totalRevenue._count,
        ordersByStatus
      }
    }
  })

  // Inventory report
  fastify.get('/inventory', async (request, reply) => {
    const products = await fastify.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        stock: true,
        price: true,
        isActive: true
      },
      orderBy: { stock: 'asc' }
    })

    const categoryStats = await fastify.prisma.product.groupBy({
      by: ['category'],
      _count: true,
      _sum: { stock: true }
    })

    return {
      products,
      categoryStats
    }
  })

  // Expense report
  fastify.get('/expenses', async (request, reply) => {
    const { startDate, endDate } = request.query as { startDate?: string, endDate?: string }
    
    const whereClause: any = {}
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const [expenses, totalExpenses, expensesByCategory] = await Promise.all([
      fastify.prisma.expense.findMany({
        where: whereClause,
        orderBy: { date: 'desc' }
      }),
      fastify.prisma.expense.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: true
      }),
      fastify.prisma.expense.groupBy({
        by: ['category'],
        where: whereClause,
        _sum: { amount: true },
        _count: true
      })
    ])

    return {
      expenses,
      summary: {
        totalAmount: totalExpenses._sum.amount || 0,
        totalExpenses: totalExpenses._count,
        expensesByCategory
      }
    }
  })
}

export default reportRoutes