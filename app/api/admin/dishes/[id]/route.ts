import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dishes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { bustCache } from '@/lib/cache'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    const body = await req.json()
    const { name, description, categoryId, price, images, isVeg, isAvailable } = body

    const updateData: any = {
      updatedAt: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (isVeg !== undefined) updateData.isVeg = isVeg
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable
    if (images !== undefined) {
      updateData.images = Array.isArray(images) ? images.filter((img: string) => img.trim() !== '') : []
    }
    if (price !== undefined) {
      updateData.sizes = [{ label: 'Standard', price: Number(price) }]
    }

    await db.update(dishes).set(updateData).where(eq(dishes.id, id))
    await bustCache('menu:all')
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating dish:', error)
    return NextResponse.json({ error: 'Failed to update dish: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    await db.delete(dishes).where(eq(dishes.id, id))
    await bustCache('menu:all')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting dish:', error)
    return NextResponse.json({ error: 'Failed to delete dish: ' + error.message }, { status: 500 })
  }
}
