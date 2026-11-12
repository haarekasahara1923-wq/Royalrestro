import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()
// Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
