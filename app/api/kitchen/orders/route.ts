import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/db/schema'
import { eq, or, desc, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session || !['admin', 'kitchen'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeOrders = await db.query.orders.findMany({
    where: or(
        eq(orders.status, 'pending'),
        eq(orders.status, 'preparing')
    ),
    orderBy: [desc(orders.createdAt)],
    with: {
        // This requires relational mapping in schema. I'll add it or manually join.
        // For now I'll do a separate query or join manually.
    }
  })

  // Manual join for items since I didn't set up Drizzle relations fully yet
  const orderIds = activeOrders.map(o => o.id)
  if (orderIds.length === 0) return NextResponse.json([])

  const items = await db.query.orderItems.findMany({
    where: inArray(orderItems.orderId, orderIds)
  })

  const ordersWithItems = activeOrders.map(order => ({
    ...order,
    items: items.filter(i => i.orderId === order.id)
  }))

  return NextResponse.json(ordersWithItems)
}
