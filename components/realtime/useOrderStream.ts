'use client'

import { useEffect, useRef } from 'react'

// ─── Module-level dedup set ────────────────────────────────────────────────
// This persists across reconnects within the same browser session.
// Key format: "<channel>:<orderId>:<createdAt>"
// We keep at most 500 keys to avoid unbounded memory growth.
const seenEventKeys = new Set<string>()
const MAX_SEEN = 500

function isDuplicate(channel: string, payload: any): boolean {
  // Build a key that uniquely identifies this logical event
  const key = `${channel}:${payload?.id ?? ''}:${payload?.createdAt ?? payload?.updatedAt ?? ''}`
  if (seenEventKeys.has(key)) return true
  seenEventKeys.add(key)
  // Trim oldest entries if we exceed the cap
  if (seenEventKeys.size > MAX_SEEN) {
    const first = seenEventKeys.values().next().value
    if (first !== undefined) seenEventKeys.delete(first)
  }
  return false
}

export function useOrderStream(onEvent: (data: any) => void) {
  // Keep a stable ref to the latest callback so the EventSource connection
  // is never recreated just because the parent re-rendered with a new
  // inline function reference.
  const callbackRef = useRef(onEvent)
  useEffect(() => {
    callbackRef.current = onEvent
  })

  useEffect(() => {
    let es: EventSource
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      es = new EventSource('/api/orders/stream')

      es.onmessage = (e) => {
        // Ignore heartbeat comments (empty data)
        if (!e.data || e.data.startsWith(':')) return
        try {
          const data = JSON.parse(e.data)
          const payload =
            typeof data.payload === 'string'
              ? JSON.parse(data.payload)
              : data.payload

          // ── Dedup: skip if we've already delivered this event ──
          if (isDuplicate(data.channel, payload)) return

          callbackRef.current(data)
        } catch (err) {
          console.error('SSE Parse Error:', err)
        }
      }

      es.onerror = () => {
        es.close()
        // Reconnect after 5 s, but only if the component is still mounted
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      es?.close()
    }
  }, []) // Empty deps — connect ONCE per mount, never recreate on re-render
}
