import 'dotenv/config'
import { db } from './index'
import { dishes } from './schema'
import { eq, ne, and } from 'drizzle-orm'

async function cleanup() {
  console.log('🧹 Cleaning up duplicate dishes...')
  const allDishes = await db.select().from(dishes)
  
  const seen = new Set()
  for (const dish of allDishes) {
    if (seen.has(dish.name.toLowerCase())) {
      console.log(`🗑️ Deleting duplicate: ${dish.name} (ID: ${dish.id})`)
      // Note: This might fail if referenced by order_items, but we'll try
      try {
        await db.delete(dishes).where(eq(dishes.id, dish.id))
      } catch (e) {
        console.log(`⚠️ Could not delete ${dish.name}, probably has orders.`)
      }
    } else {
      seen.add(dish.name.toLowerCase())
    }
  }
  
  console.log('✅ Cleanup finished.')
  process.exit(0)
}

cleanup()
