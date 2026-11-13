import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/db/schema'
import { publishOrderEvent, cacheRecentEvent, CHANNELS } from '@/lib/pubsub'
import { eq, and, ne, desc } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { 
        items, total, deliveryType = 'dine-in', tableNumber, 
        address, name, phone, notes 
    } = data

    let orderId: string | undefined
    let orderNumber: string | null | undefined
    let isReorder = false
    let activeTotal = Number(total || 0)
    let customerFullName = name
    let customerPhoneNum = phone

    // 1. Check for existing active unpaid order for this table/room
    if (tableNumber) {
        const existingOrder = await db.query.orders.findFirst({
            where: and(
                eq(orders.tableNumber, tableNumber),
                ne(orders.paymentStatus, 'paid'),
                ne(orders.status, 'cancelled')
            ),
            orderBy: [desc(orders.createdAt)]
        })

        if (existingOrder) {
            orderId = existingOrder.id
            orderNumber = existingOrder.orderNumber
            isReorder = true
            customerFullName = name || existingOrder.customerName || 'Guest'
            customerPhoneNum = phone || existingOrder.customerPhone || ''
            
            // Accumulate total for existing order bill
            activeTotal = Number(existingOrder.total || 0) + Number(total || 0)
            const newSubtotal = Number(existingOrder.subtotal || 0) + Number(total || 0)

            await db.update(orders)
                .set({ 
                    total: activeTotal.toString(),
                    subtotal: newSubtotal.toString(),
                    updatedAt: new Date(),
                    status: 'pending', // Revert to pending to notify kitchen of newly added items
                    customerName: customerFullName,
                    customerPhone: customerPhoneNum
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
            customerName: customerFullName,
            customerPhone: customerPhoneNum,
            total: activeTotal.toString(),
            subtotal: activeTotal.toString(),
            notes: notes || null,
            status: 'pending',
            paymentStatus: 'unpaid'
        }).returning()
        orderId = newOrder[0].id
    }

    // 3. Save Order Items (newly added items)
    const itemsToInsert = items.map((item: any) => ({
        orderId,
        dishId: item.id,
        dishName: item.name,
        sizeLabel: item.sizeLabel || null,
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
        customerName: customerFullName,
        customerPhone: customerPhoneNum,
        total: activeTotal,
        items: payloadItems,
        status: 'pending',
        isUpdate: isReorder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
    
    const channel = isReorder ? CHANNELS.ORDER_UPDATED : CHANNELS.NEW_ORDER
    await publishOrderEvent(channel, payload)
    await cacheRecentEvent(channel, payload)

    return NextResponse.json({ 
        success: true, 
        orderId, 
        orderNumber, 
        isReorder, 
        total: activeTotal 
    })
  } catch (error) {
    console.error('Order Error:', error)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}
