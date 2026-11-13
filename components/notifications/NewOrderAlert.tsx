'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle2, ShoppingBag, User, MapPin, Utensils, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import { useOrderStream } from '@/components/realtime/useOrderStream'

// ─── Types ─────────────────────────────────────────────────────────────
interface OrderAlert {
  id: string
  orderNumber: string
  customerName: string
  customerPhone?: string
  deliveryType: string
  tableNumber?: string | null
  total: number | string
  items?: Array<{ dishName: string; quantity: number; sizeLabel?: string }>
  createdAt: string
  isUpdate?: boolean
}

// ─── Sound Engine (Web Audio API — zero external files needed) ─────────
function createAlarmLoop(): () => void {
  if (typeof window === 'undefined') return () => {}

  let stopped = false
  let ctx: AudioContext | null = null

  async function playBeep() {
    if (stopped) return
    try {
      if (!ctx || ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        ctx = new AudioCtx()
      }
      if (ctx.state === 'suspended') await ctx.resume()

      // High-attention dual frequency chime pattern
      const beepTimes = [0, 0.16, 0.32]
      for (const t of beepTimes) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(950, ctx.currentTime + t)
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + t + 0.12)

        gain.gain.setValueAtTime(0.001, ctx.currentTime + t)
        gain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + t + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.13)

        osc.start(ctx.currentTime + t)
        osc.stop(ctx.currentTime + t + 0.14)
      }
    } catch {
      // Browser autoplay policy might block before interaction
    }
  }

  async function loop() {
    if (stopped) return
    await playBeep()
    await new Promise(res => setTimeout(res, 2200))
    loop()
  }

  loop()

  return () => {
    stopped = true
    try { ctx?.close() } catch {}
  }
}

// Dedup tracking: avoids displaying identical alerts
const shownAlertKeys = new Set<string>()

export function NewOrderAlert() {
  const [alerts, setAlerts] = useState<OrderAlert[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const stopSoundRef = useRef<(() => void) | null>(null)
  const soundStartedRef = useRef(false)

  // Auto-unlock AudioContext on first page interaction
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioCtx()
        ctx.resume().then(() => ctx.close())
      } catch {}
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }
    window.addEventListener('click', unlockAudio)
    window.addEventListener('touchstart', unlockAudio)
    return () => {
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

  // Start alarm when first alert appears, stop when dismissed or muted
  useEffect(() => {
    if (alerts.length > 0 && !soundStartedRef.current && !isMuted) {
      soundStartedRef.current = true
      stopSoundRef.current = createAlarmLoop()
    } else if ((alerts.length === 0 || isMuted) && soundStartedRef.current) {
      soundStartedRef.current = false
      stopSoundRef.current?.()
      stopSoundRef.current = null
    }
  }, [alerts.length, isMuted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSoundRef.current?.()
    }
  }, [])

  // Dismiss current (top) alert — accepts/acknowledges order and stops sound
  const dismiss = useCallback(() => {
    setAlerts(prev => prev.slice(1))
  }, [])

  // Listen to SSE order events (BOTH new orders and updates)
  useOrderStream((event) => {
    if (event.channel !== 'orders:new' && event.channel !== 'orders:updated') return

    const payload: any =
      typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload

    const isUpdate = event.channel === 'orders:updated' || payload.isUpdate === true

    // Skip if update doesn't have items or is just an internal state change
    if (isUpdate && (!payload.items || payload.items.length === 0) && !payload.isUpdate) {
      return
    }

    // Dedup key: includes timestamp for updates so multiple reorders trigger alerts
    const timestampKey = payload.updatedAt || payload.createdAt || ''
    const alertKey = isUpdate 
      ? `update:${payload.id}:${timestampKey}`
      : `new:${payload.id}`

    if (shownAlertKeys.has(alertKey)) return
    shownAlertKeys.add(alertKey)

    const alert: OrderAlert = {
      id: payload.id,
      orderNumber: payload.orderNumber ?? '???',
      customerName: payload.customerName ?? 'Guest',
      customerPhone: payload.customerPhone,
      deliveryType: payload.deliveryType ?? 'dine-in',
      tableNumber: payload.tableNumber,
      total: payload.total ?? 0,
      items: payload.items ?? [],
      createdAt: payload.createdAt ?? new Date().toISOString(),
      isUpdate
    }

    setAlerts(prev => [...prev, alert])
  })

  const current = alerts[0]

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id + (current.isUpdate ? '-update' : '-new')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-2 ${
              current.isUpdate ? 'border-amber-400' : 'border-red-500'
            }`}
          >
            {/* Top accent bar */}
            <div
              className={`h-2.5 w-full ${
                current.isUpdate
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 animate-pulse'
                  : 'bg-gradient-to-r from-red-500 via-orange-500 to-red-600 animate-pulse'
              }`}
            />

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [-15, 15, -15, 15, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      current.isUpdate ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {current.isUpdate ? (
                      <RefreshCw className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
                    ) : (
                      <Bell className="w-8 h-8 fill-current" />
                    )}
                  </motion.div>
                  <div>
                    <span
                      className={`inline-block text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                        current.isUpdate
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {current.isUpdate ? '🔄 Order Updated / Items Added' : '🔔 New Order Alert'}
                    </span>
                    <h2 className="text-2xl font-black text-gray-900 mt-1">
                      #{current.orderNumber}
                    </h2>
                  </div>
                </div>

                {/* Quick Mute Toggle */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                  title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-gray-700 animate-pulse" />}
                </button>
              </div>

              {/* Order Info Badge */}
              <div
                className={`rounded-2xl p-4 mb-5 space-y-2.5 border ${
                  current.isUpdate
                    ? 'bg-amber-50/70 border-amber-200 text-gray-800'
                    : 'bg-red-50/70 border-red-200 text-gray-800'
                }`}
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <User className="w-4 h-4 text-primary" />
                    <span>{current.customerName}</span>
                  </div>
                  {current.customerPhone && (
                    <span className="text-xs text-gray-600 font-mono">
                      Ph: {current.customerPhone}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  {current.deliveryType === 'dine-in' ? (
                    <>
                      <Utensils className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>
                        Destination:{' '}
                        <span className="font-black text-gray-900 text-base">
                          {current.tableNumber?.toLowerCase().includes('room') || current.tableNumber?.toLowerCase().includes('table')
                            ? current.tableNumber
                            : `Table ${current.tableNumber || 'Dine-in'}`}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-bold text-gray-900">Outdoor / Takeaway</span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200/60">
                  <span className="text-gray-600 font-medium">Grand Total:</span>
                  <span className="font-black text-primary text-xl">
                    ₹{current.total}
                  </span>
                </div>
              </div>

              {/* Items list */}
              {current.items && current.items.length > 0 && (
                <div className="mb-6 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      {current.isUpdate ? 'Newly Added Dishes' : 'Ordered Dishes'}
                    </p>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                      {current.items.length} {current.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {current.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm">
                        <span className="font-semibold text-gray-900">
                          {item.quantity}× {item.dishName}
                        </span>
                        {item.sizeLabel && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md uppercase font-medium">
                            {item.sizeLabel}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OK / Accept Button */}
              <motion.button
                onClick={dismiss}
                whileTap={{ scale: 0.97 }}
                className={`w-full text-white font-black text-lg py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                  current.isUpdate
                    ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-amber-800'
                    : 'bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                }`}
              >
                <CheckCircle2 className="w-6 h-6" />
                ✓ Accept & Acknowledge Order
              </motion.button>

              <p className="text-center text-[11px] text-gray-400 mt-3 font-medium">
                Clicking Accept will stop the alarm sound on your screen
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
