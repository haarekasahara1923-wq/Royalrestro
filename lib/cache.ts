import { redis } from './redis'

const TTL = {
  MENU: 300,        // Menu cached 5 minutes
  CATEGORIES: 600,  // Categories cached 10 minutes
  RESTAURANT: 3600, // Restaurant info cached 1 hour
  SALES_TODAY: 60,  // Today's sales cached 1 minute
}

export async function getCached<T>(key: string): Promise<T | null> {
  const val = await redis.get(key)
  return val ? (val as T) : null
}

export async function setCached(key: string, value: unknown, ttl: number) {
  await redis.set(key, JSON.stringify(value), { ex: ttl })
}

export async function bustCache(...keys: string[]) {
  if (keys.length) await redis.del(...keys)
}

export { TTL }
