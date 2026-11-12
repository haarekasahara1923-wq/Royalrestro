import 'dotenv/config'
import { db } from './lib/db'
import { users } from './lib/db/schema'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'

async function resetPasswords() {
  console.log('🔄 Resetting passwords...')
  
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const staffPassword = await bcrypt.hash('Staff@123', 10)

  await db.update(users)
    .set({ passwordHash: adminPassword })
    .where(eq(users.email, 'admin@royalcomfort.com'))

  await db.update(users)
    .set({ passwordHash: staffPassword })
    .where(eq(users.email, 'reception@royalcomfort.com'))

  await db.update(users)
    .set({ passwordHash: staffPassword })
    .where(eq(users.email, 'kitchen@royalcomfort.com'))

  console.log('✅ Passwords reset successfully!')
  process.exit(0)
}

resetPasswords()
