import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories, dishes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCached, setCached, TTL } from '@/lib/cache'

export async function GET() {
  try {
    const cacheKey = 'menu:all'
    const cachedMenu = await getCached(cacheKey)
    if (cachedMenu) return NextResponse.json(cachedMenu)

    // Parallel fetch categories and dishes
    const allCategories = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: [categories.displayOrder],
    })

    const allDishes = await db.query.dishes.findMany({
      where: eq(dishes.isAvailable, true),
    })

    // Group dishes by category
    const menu = allCategories.map(cat => ({
      ...cat,
      dishes: allDishes.filter(dish => dish.categoryId === cat.id)
    }))

    await setCached(cacheKey, menu, TTL.MENU)
    return NextResponse.json(menu)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
