import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, inventoryItems } from '@/lib/db/schema'
import { count, sum, sql, lt } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Total Orders Today
    const totalOrdersResult = await db.select({ count: count() }).from(orders)
    
    // 2. Revenue Today
    const revenueResult = await db.select({ sum: sum(orders.total) }).from(orders)

    // 3. Low Stock Items
    const lowStockResult = await db.select({ count: count() })
        .from(inventoryItems)
        .where(sql`${inventoryItems.currentStock} <= ${inventoryItems.minThreshold}`)

    return NextResponse.json({
      totalOrders: totalOrdersResult[0].count,
      revenue: Number(revenueResult[0].sum || 0).toFixed(2),
      customers: 0, // Mock for now
      lowStock: lowStockResult[0].count
    })
  } catch (error) {
    console.error('Stats Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
