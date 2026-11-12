import { redis } from './redis'

export const CHANNELS = {
  NEW_ORDER: 'orders:new',
  ORDER_UPDATED: 'orders:updated',
  ORDER_READY: 'orders:ready',
}

export async function publishOrderEvent(
  channel: string,
  payload: Record<string, unknown>
) {
  await redis.publish(channel, JSON.stringify(payload))
}

// Store latest events in Redis list for new connections catching up
export async function cacheRecentEvent(channel: string, payload: Record<string, unknown>) {
  const key = `recent:${channel}`
  await redis.lpush(key, JSON.stringify(payload))
  await redis.ltrim(key, 0, 49)  // Keep last 50 events
  await redis.expire(key, 86400)  // 24hr TTL
}
