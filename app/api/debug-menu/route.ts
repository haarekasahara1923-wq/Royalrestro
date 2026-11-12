import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dishes } from '@/lib/db/schema'

export async function GET() {
  const allDishes = await db.select().from(dishes)
  return NextResponse.json({
    count: allDishes.length,
    dishes: allDishes.map(d => ({
        id: d.id,
        name: d.name,
        images: d.images,
        isAvailable: d.isAvailable
    }))
  })
}
