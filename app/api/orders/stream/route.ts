import { NextRequest } from 'next/server'
import { redis } from '@/lib/redis'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!role) return new Response('Unauthorized', { status: 401 })

  const encoder = new TextEncoder()

  // Channels this role should receive
  const channels =
    role === 'kitchen'
      ? ['orders:new', 'orders:updated']
      : ['orders:new', 'orders:updated', 'orders:ready']

  // ── Cursor approach ──────────────────────────────────────────────────────
  // Record CURRENT list length at connection time.
  // Only events pushed AFTER this point will be forwarded.
  const cursors: Record<string, number> = {}
  for (const ch of channels) {
    const len = await redis.llen(`recent:${ch}`)
    cursors[ch] = len
  }

  // ── Per-connection dedup: track event IDs already sent this session ──────
  const sentIds = new Set<string>()

  const stream = new ReadableStream({
    async start(controller) {
      // Immediate heartbeat so the browser knows the connection is live
      controller.enqueue(encoder.encode(': ping\n\n'))

      const pollInterval = setInterval(async () => {
        try {
          for (const channel of channels) {
            const currentLen = await redis.llen(`recent:${channel}`)
            const prev = cursors[channel]

            if (currentLen > prev) {
              // Newest-first list (lpush). New items are at indices 0..(diff-1).
              const newCount = currentLen - prev
              const newMessages = await redis.lrange(`recent:${channel}`, 0, newCount - 1)

              // Reverse → oldest new event sent first
              for (const msg of newMessages.reverse()) {
                // Parse to extract a stable event ID for dedup
                let parsedId: string
                try {
                  const parsed = JSON.parse(msg as string)
                  // Key = channel + orderId + createdAt
                  parsedId = `${channel}:${parsed?.id ?? ''}:${parsed?.createdAt ?? ''}`
                } catch {
                  parsedId = `${channel}:${msg}`
                }

                if (sentIds.has(parsedId)) continue  // already sent, skip
                sentIds.add(parsedId)

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ channel, payload: msg })}\n\n`)
                )
              }

              cursors[channel] = currentLen
            }
          }
        } catch {
          clearInterval(pollInterval)
          try { controller.close() } catch {}
        }
      }, 4000) // 4 s poll — fast enough, avoids hammering Redis

      req.signal.addEventListener('abort', () => {
        clearInterval(pollInterval)
        try { controller.close() } catch {}
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
