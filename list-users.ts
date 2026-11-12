import 'dotenv/config'
import { db } from './lib/db'
import { users } from './lib/db/schema'

async function listUsers() {
  const allUsers = await db.select().from(users)
  console.log('--- USERS IN DATABASE ---')
  allUsers.forEach(u => {
    console.log(`- Email: ${u.email}, Role: ${u.role}, Name: ${u.name}`)
  })
  process.exit(0)
}

listUsers()
