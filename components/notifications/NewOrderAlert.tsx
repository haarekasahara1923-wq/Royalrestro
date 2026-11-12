'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle2, ShoppingBag, User, MapPin, Utensils } from 'lucide-react'
import { useOrderStream } from '@/components/realtime/useOrderStream'

// ─── Types ─────────────────────────────────────────────────────────────────
interface OrderAlert {
  id: string
  orderNumber: string
  customerName: string
  deliveryType: string
  tableNumber?: string | null
  total: number | string
  items?: Array<{ dishName: string; quantity: number; sizeLabel?: string }>
  createdAt: string
}

// ─── Sound Engine (Web Audio API — no external file needed) ─────────────────
function createAlarmLoop(): () => void {
  if (typeof window === 'undefined') return () => {}

  let stopped = false
  let ctx: AudioContext | null = null

  async function playBeep() {
    if (stopped) return
    try {
      if (!ctx || ctx.state === 'closed') {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      if (ctx.state === 'suspended') await ctx.resume()

      // Triple beep pattern
      const beepTimes = [0, 0.18, 0.36]
      for (const t of beepTimes) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime + t)
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + t + 0.12)

        gain.gain.setValueAtTime(0.001, ctx.currentTime + t)
        gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + t + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.13)

        osc.start(ctx.currentTime + t)
        osc.stop(ctx.currentTime + t + 0.14)
      }
    } catch {
      // Audio blocked by browser — silently ignore
    }
  }

  async function loop() {
    if (stopped) return
    await playBeep()
    await new Promise(res => setTimeout(res, 2000))
    loop()
  }

  loop()

  return () => {
    stopped = true
    try { ctx?.close() } catch {}
  }
}

// ─── Dedup: avoid showing same order alert twice (e.g. duplicate SSE events) ─
const shownAlertIds = new Set<string>()

// ─── Main Component ─────────────────────────────────────────────────────────
export function NewOrderAlert() {
  const [alerts, setAlerts] = useState<OrderAlert[]>([])
  const stopSoundRef = useRef<(() => void) | null>(null)
  const soundStartedRef = useRef(false)

  // Start alarm when first alert appears, stop when all dismissed
  useEffect(() => {
    if (alerts.length > 0 && !soundStartedRef.current) {
      soundStartedRef.current = true
      stopSoundRef.current = createAlarmLoop()
    } else if (alerts.length === 0 && soundStartedRef.current) {
      soundStartedRef.current = false
      stopSoundRef.current?.()
      stopSoundRef.current = null
    }
  }, [alerts.length])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSoundRef.current?.()
    }
  }, [])

  // Dismiss current (top) alert
  const dismiss = useCallback(() => {
    setAlerts(prev => prev.slice(1))
  }, [])

  // Listen to SSE new order events
  useOrderStream((event) => {
    if (event.channel !== 'orders:new') return

    const payload: any =
      typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload

    // Dedup guard
    if (shownAlertIds.has(payload.id)) return
    shownAlertIds.add(payload.id)

    const alert: OrderAlert = {
      id: payload.id,
      orderNumber: payload.orderNumber ?? '—',
      customerName: payload.customerName ?? 'Customer',
      deliveryType: payload.deliveryType ?? 'dine-in',
      tableNumber: payload.tableNumber ?? null,
      total: payload.total ?? 0,
      items: payload.items ?? [],
      createdAt: payload.createdAt ?? new Date().toISOString(),
    }

    setAlerts(prev => [...prev, alert])
  })

  const current = alerts[0]

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(185,28,28,0.97) 0%, rgba(127,0,0,0.99) 100%)',
          }}
        >
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          >
            <div className="w-72 h-72 md:w-96 md:h-96 rounded-full border-4 border-white/20" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
          >
            <div className="w-52 h-52 md:w-72 md:h-72 rounded-full border-4 border-white/10" />
          </motion.div>

          {/* Queue badge */}
          {alerts.length > 1 && (
            <div className="absolute top-4 right-4 bg-white text-red-700 text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
              +{alerts.length - 1} more order{alerts.length - 1 > 1 ? 's' : ''}
            </div>
          )}

          {/* Alert card */}
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-2 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600" />

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  animate={{ rotate: [-15, 15, -15, 15, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                  className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0"
                >
                  <Bell className="w-8 h-8 text-red-600 fill-red-200" />
                </motion.div>
                <div>
                  <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest">
                    New Order Alert
                  </p>
                  <h2 className="text-2xl font-black text-gray-900">
                    #{current.orderNumber}
                  </h2>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <User className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{current.customerName}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {current.deliveryType === 'dine-in' ? (
                    <>
                      <Utensils className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span>
                        Dine In —{' '}
                        <span className="font-bold text-gray-900">
                          Table {current.tableNumber}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="font-bold text-gray-900">Outdoor / Parcel</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ShoppingBag className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>
                    Total:{' '}
                    <span className="font-black text-red-600 text-base">
                      ₹{current.total}
                    </span>
                  </span>
                </div>
              </div>

              {/* Items list */}
              {current.items && current.items.length > 0 && (
                <div className="mb-5 border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Order Items
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {current.items.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm">
                        <span className="font-medium text-gray-800">
                          {item.quantity}× {item.dishName}
                        </span>
                        {item.sizeLabel && (
                          <span className="text-[10px] text-gray-400 uppercase">
                            {item.sizeLabel}
                          </span>
                        )}
                      </div>
                    ))}
                    {current.items.length > 5 && (
                      <div className="px-4 py-2 text-xs text-gray-400 text-center">
                        +{current.items.length - 5} more items
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OK Button */}
              <motion.button
                onClick={dismiss}
                whileTap={{ scale: 0.96 }}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-lg py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 className="w-6 h-6" />
                ✓ OK — Order Seen
              </motion.button>

              <p className="text-center text-[10px] text-gray-400 mt-3">
                Sound will stop after acknowledgment
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
