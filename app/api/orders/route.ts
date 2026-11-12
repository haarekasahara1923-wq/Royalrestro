import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/db/schema'
import { publishOrderEvent, cacheRecentEvent, CHANNELS } from '@/lib/pubsub'
import { eq, and, ne } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { 
        items, total, deliveryType, tableNumber, 
        address, name, phone, notes 
    } = data

    let orderId: string | undefined
    let orderNumber: string | null | undefined
    let isReorder = false

    // 1. Check for existing active order for this table (Dine-in only)
    if (deliveryType === 'dine-in' && tableNumber) {
        const existingOrder = await db.query.orders.findFirst({
            where: and(
                eq(orders.tableNumber, tableNumber),
                ne(orders.status, 'delivered'),
                ne(orders.status, 'cancelled')
            )
        })

        if (existingOrder) {
            orderId = existingOrder.id
            orderNumber = existingOrder.orderNumber
            isReorder = true
            
            // Update total for existing order
            const newTotal = Number(existingOrder.total) + Number(total)
            await db.update(orders)
                .set({ 
                    total: newTotal.toString(),
                    updatedAt: new Date(),
                    status: 'pending' // Revert to pending to notify kitchen of new items
                })
                .where(eq(orders.id, orderId))
        }
    }

    // 2. If no existing order, create new one
    if (!orderId) {
        orderNumber = `OR-${Math.floor(1000 + Math.random() * 9000)}`
        const newOrder = await db.insert(orders).values({
            orderNumber,
            deliveryType,
            tableNumber: tableNumber || null,
            deliveryAddress: address || null,
            customerName: name,
            customerPhone: phone,
            total: total.toString(),
            notes: notes || null,
            status: 'pending',
        }).returning()
        orderId = newOrder[0].id
    }

    // 3. Save Order Items
    const itemsToInsert = items.map((item: any) => ({
        orderId,
        dishId: item.id,
        dishName: item.name,
        sizeLabel: item.sizeLabel,
        unitPrice: item.price.toString(),
        quantity: item.quantity,
        totalPrice: (item.price * item.quantity).toString(),
    }))

    await db.insert(orderItems).values(itemsToInsert)

    // 4. Publish Real-time Event (include items for alert display)
    const payloadItems = items.map((item: any) => ({
        dishName: item.name,
        quantity: item.quantity,
        sizeLabel: item.sizeLabel ?? '',
    }))

    const payload = {
        id: orderId,
        orderNumber,
        deliveryType,
        tableNumber,
        customerName: name,
        total: total,
        items: payloadItems,
        status: 'pending',
        isUpdate: isReorder,
        createdAt: new Date().toISOString()
    }
    
    const channel = isReorder ? CHANNELS.ORDER_UPDATED : CHANNELS.NEW_ORDER
    await publishOrderEvent(channel, payload)
    await cacheRecentEvent(channel, payload)

    return NextResponse.json({ success: true, orderNumber })
  } catch (error) {
    console.error('Order Error:', error)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}
