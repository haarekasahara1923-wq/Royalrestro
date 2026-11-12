import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dishes, categories } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { bustCache } from '@/lib/cache'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await db.select({
    id: dishes.id,
    name: dishes.name,
    isAvailable: dishes.isAvailable,
    images: dishes.images,
    sizes: dishes.sizes,
    categoryName: categories.name,
    categoryId: dishes.categoryId
  })
  .from(dishes)
  .leftJoin(categories, eq(dishes.categoryId, categories.id))
  .orderBy(desc(dishes.createdAt))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, categoryId, price, images, isVeg } = body

    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await db.insert(dishes).values({
      name,
      description: description || '',
      categoryId,
      isVeg: isVeg ?? true,
      sizes: [{ label: 'Standard', price: Number(price) }],
      images: Array.isArray(images) ? images.filter((img: string) => img.trim() !== '') : [],
    }).returning({ id: dishes.id })

    await bustCache('menu:all')
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error adding dish:', error)
    return NextResponse.json({ error: 'Failed to add dish' }, { status: 500 })
  }
}
