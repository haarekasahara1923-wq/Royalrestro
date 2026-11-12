import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { publishOrderEvent, cacheRecentEvent, CHANNELS } from '@/lib/pubsub'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { status } = await req.json()
    const id = params.id

    const updatedOrder = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning()

    if (updatedOrder.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = updatedOrder[0]
    const channel = status === 'ready' ? CHANNELS.ORDER_READY : CHANNELS.ORDER_UPDATED
    
    await publishOrderEvent(channel, order)
    await cacheRecentEvent(channel, order)

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Update Error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
