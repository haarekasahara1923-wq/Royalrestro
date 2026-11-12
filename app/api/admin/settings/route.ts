import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { restaurantInfo } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function GET() {
  const info = await db.select().from(restaurantInfo).limit(1)
  return NextResponse.json(info[0] || {})
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  // Remove fields that should not be updated manually
  const { id, createdAt, ...data } = body

  const info = await db.select().from(restaurantInfo).limit(1)

  if (info.length === 0) {
    const newInfo = await db.insert(restaurantInfo).values(data).returning()
    return NextResponse.json(newInfo[0])
  } else {
    const updated = await db.update(restaurantInfo)
      .set(data)
      .where(eq(restaurantInfo.id, info[0].id))
      .returning()
    return NextResponse.json(updated[0])
  }
}
