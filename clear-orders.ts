import 'dotenv/config'
import { db } from './lib/db/index'
import { orderItems, orders } from './lib/db/schema'

async function clearAllOrders() {
  console.log('🗑️  Saare orders clear kar rahe hain...')

  // Pehle order_items delete karo (foreign key constraint ke karan)
  const deletedItems = await db.delete(orderItems)
  console.log('✅ Order items delete ho gaye.')

  // Phir orders delete karo
  const deletedOrders = await db.delete(orders)
  console.log('✅ Orders delete ho gaye.')

  console.log('🎉 Database bilkul clean hai! Ab naye orders place ho sakte hain.')
  process.exit(0)
}

clearAllOrders().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
