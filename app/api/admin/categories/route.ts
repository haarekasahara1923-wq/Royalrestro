import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { bustCache } from '@/lib/cache'

export async function GET() {
  const result = await db.query.categories.findMany({
    orderBy: [desc(categories.createdAt)],
  })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await db.insert(categories).values({
      name,
      isActive: true,
      displayOrder: 0
    }).returning()

    await bustCache('menu:all')
    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error('Error adding category:', error)
    return NextResponse.json({ error: error.message || 'Failed to add category' }, { status: 500 })
  }
}
