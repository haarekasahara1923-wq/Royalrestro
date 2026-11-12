import 'dotenv/config'
import { db } from './index'
import { dishes } from './schema'

async function check() {
  const allDishes = await db.select().from(dishes)
  console.log('--- DATABASE DISHES ---')
  allDishes.forEach(d => {
    console.log(`- ${d.name}: ${JSON.stringify(d.images)}`)
  })
  process.exit(0)
}

check()
