import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { neon } from '@neondatabase/serverless'

async function runMigration() {
  console.log('🚀 Running database migration on Neon...')
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables')
  }

  const sql = neon(databaseUrl)

  const migrationFilePath = path.join(process.cwd(), 'lib', 'db', 'migrations', '0000_fresh_tigra.sql')
  const content = fs.readFileSync(migrationFilePath, 'utf-8')

  const statements = content
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  console.log(`Found ${statements.length} statements to execute.`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    try {
      console.log(`Executing statement [${i + 1}/${statements.length}]...`)
      await sql.query(stmt)
    } catch (err: any) {
      // If error is about already existing type or table, log and continue
      if (err.message && (err.message.includes('already exists') || err.message.includes('already a constraint'))) {
        console.log(`  ℹ️  Notice: ${err.message}`)
      } else {
        console.error(`  ❌ Failed on statement ${i + 1}:`, stmt)
        throw err
      }
    }
  }

  console.log('✅ All database tables and types created successfully!')
  process.exit(0)
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})

