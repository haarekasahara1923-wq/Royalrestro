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

    const body = await req.json()
    const { status, paymentStatus, paymentMethod } = body
    const id = params.id

    const updateFields: any = { updatedAt: new Date() }
    if (status) updateFields.status = status
    if (paymentStatus) updateFields.paymentStatus = paymentStatus
    if (paymentMethod) updateFields.paymentMethod = paymentMethod

    const updatedOrder = await db.update(orders)
      .set(updateFields)
      .where(eq(orders.id, id))
      .returning()

    if (updatedOrder.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch order with items so clients receive complete payload
    const fullOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true }
    })

    const orderData = fullOrder || updatedOrder[0]
    const channel = status === 'ready' ? CHANNELS.ORDER_READY : CHANNELS.ORDER_UPDATED
    
    await publishOrderEvent(channel, orderData as any)
    await cacheRecentEvent(channel, orderData as any)

    return NextResponse.json({ success: true, order: orderData })
  } catch (error) {
    console.error('Update Error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
