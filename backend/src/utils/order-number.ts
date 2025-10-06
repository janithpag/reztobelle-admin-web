import { PrismaClient } from '@prisma/client'

/**
 * Generates the next order number in the format RBO1, RBO2, RBO3, etc.
 * @param prisma - Prisma client instance
 * @returns The next order number (e.g., "RBO1", "RBO2", "RBO3", etc.)
 */
export async function generateOrderNumber(prisma: PrismaClient): Promise<string> {
    const prefix = 'RBO'

    try {
        // Find all orders with the RBO prefix and extract the highest number
        const orders = await prisma.order.findMany({
            where: {
                orderNumber: {
                    startsWith: prefix
                }
            },
            select: {
                orderNumber: true
            }
        })

        let maxNumber = 0

        // Parse all order numbers to find the highest number
        for (const order of orders) {
            const numericPart = order.orderNumber.substring(prefix.length)
            const orderNum = parseInt(numericPart, 10)
            
            if (!isNaN(orderNum) && orderNum > maxNumber) {
                maxNumber = orderNum
            }
        }

        // Increment to get the next number
        const nextNumber = maxNumber + 1
        
        return `${prefix}${nextNumber}`
    } catch (error) {
        console.error('Error generating order number:', error)
        // Fallback to RBO1 if there's an error
        return `${prefix}1`
    }
}
