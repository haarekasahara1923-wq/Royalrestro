import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { desc, notInArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session || !['admin', 'reception'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await db.query.orders.findMany({
    where: notInArray(orders.status, ['cancelled']),
    with: {
        items: true
    },
    orderBy: [desc(orders.createdAt)],
  })

  return NextResponse.json(result)
}
