'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrderStream } from '@/components/realtime/useOrderStream'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, CheckCircle, Receipt, Clock,
  MapPin, User, Phone, ChefHat, Bell, Home, LogOut
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { generateWhatsAppReceipt } from '@/lib/receiptFormatter'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { NewOrderAlert } from '@/components/notifications/NewOrderAlert'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function ReceptionOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)

  // ── Helper: apply a status update by order id ──────────────────
  const applyStatusUpdate = useCallback((id: string, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o))
  }, [])

  // ── Real-time SSE handler ───────────────────────────────────────
  useOrderStream((event) => {
    const payload = typeof event.payload === 'string'
      ? JSON.parse(event.payload)
      : event.payload

    if (event.channel === 'orders:new') {
      setOrders(prev => {
        if (prev.some(o => o.id === payload.id)) return prev
        toast.success(`New Order: #${payload.orderNumber}`, { duration: 6000 })
        return [payload, ...prev]
      })
    } else if (event.channel === 'orders:updated') {
      // Kitchen clicked "Start Preparing" → move pending → preparing
      setOrders(prev => {
        if (prev.some(o => o.id === payload.id)) {
          return prev.map(o => o.id === payload.id ? { ...o, ...payload } : o)
        }
        return [payload, ...prev]
      })
    } else if (event.channel === 'orders:ready') {
      // Kitchen marked order ready → move to Ready column
      setOrders(prev => prev.map(o =>
        o.id === payload.id ? { ...o, status: 'ready', updatedAt: new Date().toISOString() } : o
      ))
      toast.info(`🔔 Order #${payload.orderNumber} is Ready for Delivery!`, {
        description: 'Please deliver to the customer.',
        duration: 15000,
        id: `ready-${payload.id}`
      })
    }
  })

  // ── Initial load ────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/reception/orders').then(res => res.json()),
      fetch('/api/admin/settings').then(res => res.json()).catch(() => ({}))
    ]).then(([ordersData, settingsData]) => {
      setOrders(ordersData)
      setRestaurantInfo(settingsData)
    }).catch(() => {})
  }, [])

  // ── Periodic re-sync every 15s as safety net ─────────────────────
  // This ensures status is always correct even if an SSE event was missed
  useEffect(() => {
    const timer = setInterval(() => {
      fetch('/api/reception/orders')
        .then(res => res.json())
        .then((fresh: any[]) => {
          setOrders(prev =>
            prev.map(o => {
              const updated = fresh.find(f => f.id === o.id)
              // Only adopt DB status if it moved forward (don't regress)
              if (updated && updated.status !== o.status) {
                return { ...o, status: updated.status, updatedAt: updated.updatedAt }
              }
              return o
            })
          )
        })
        .catch(() => {})
    }, 15000)
    return () => clearInterval(timer)
  }, [])

  const columns = [
    { key: 'pending',   title: 'New',       color: 'bg-orange-50  border-orange-200',  dot: 'bg-orange-400' },
    { key: 'preparing', title: 'Preparing', color: 'bg-yellow-50  border-yellow-200',  dot: 'bg-yellow-400' },
    { key: 'ready',     title: 'Ready 🔔',  color: 'bg-green-50   border-green-200',   dot: 'bg-green-500'  },
    { key: 'delivered', title: 'Delivered', color: 'bg-gray-50    border-gray-200',    dot: 'bg-gray-400'   },
  ]

  const updateStatus = async (orderId: string, status: string) => {
    toast.dismiss(`delay-prep-${orderId}`)
    toast.dismiss(`delay-ready-${orderId}`)
    // Optimistic update
    applyStatusUpdate(orderId, status)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
  }

  // ── Delay alerts every 30s ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      orders.forEach(order => {
        if (order.status === 'preparing') {
          const diff = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60)
          if (diff > 15) {
            toast.error(`DELAY: Order #${order.orderNumber} preparing >15 mins!`, {
              description: 'Check with kitchen.',
              duration: 5000,
              id: `delay-prep-${order.id}`
            })
          }
        }
        if (order.status === 'ready') {
          const diff = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60)
          if (diff > 5) {
            toast.warning(`DELIVERY PENDING: Order #${order.orderNumber} waiting >5 mins!`, {
              description: 'Deliver immediately.',
              duration: 5000,
              id: `delay-ready-${order.id}`
            })
          }
        }
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [orders])

  const pendingReady = orders.filter(o => o.status === 'ready').length

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 lg:p-8 font-poppins">
      {/* ── New Order Alert Overlay ── */}
      <NewOrderAlert />
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-playfair text-primary italic">Reception Panel</h1>
          <p className="text-text-secondary mt-1 text-sm">Manage incoming orders and delivery</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          <div className="flex gap-2">
            <Link 
              href="/" 
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-border rounded-2xl text-xs font-bold text-text-secondary hover:text-primary transition-all shadow-sm hover:shadow-md"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <button 
              onClick={() => {
                localStorage.removeItem('cached_session_cookie_name')
                localStorage.removeItem('cached_session_cookie_val')
                sessionStorage.removeItem('restore_attempted')
                signOut({ callbackUrl: '/auth/login' })
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm hover:shadow-md"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <div className="flex gap-3">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-border text-center">
              <p className="text-[10px] uppercase font-bold text-text-secondary opacity-60">Total</p>
              <p className="text-xl font-bold">{orders.length}</p>
            </div>
            {pendingReady > 0 && (
              <div className="bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg text-center animate-pulse">
                <p className="text-[10px] uppercase font-bold opacity-80">Ready to Deliver</p>
                <p className="text-xl font-bold flex items-center gap-1 justify-center">
                  <Bell className="w-4 h-4" />{pendingReady}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-220px)]">
        {columns.map((col) => {
          const colOrders = orders.filter(o => o.status === col.key)
          return (
            <div
              key={col.key}
              className={cn(
                'flex flex-col h-full rounded-[2rem] border p-4',
                col.color
              )}
            >
              <div className="flex items-center justify-between px-2 mb-4">
                <h2 className="font-bold font-playfair text-lg flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full', col.dot)} />
                  {col.title}
                </h2>
                <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-border font-bold">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 px-1 no-scrollbar">
                <AnimatePresence>
                  {colOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        'bg-white p-4 rounded-[1.5rem] shadow-sm border transition-all',
                        order.status === 'ready'
                          ? 'border-green-400 shadow-green-100 shadow-md ring-2 ring-green-400/30'
                          : 'border-border hover:shadow-md'
                      )}
                    >
                      {/* ── Order header ── */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-bold text-primary mb-0.5">#{order.orderNumber}</p>
                          <div className="flex items-center gap-1 font-bold text-sm">
                            {order.deliveryType === 'dine-in' ? (
                              <><ShoppingBag className="w-4 h-4 text-accent" /> Table {order.tableNumber}</>
                            ) : (
                              <><MapPin className="w-4 h-4 text-accent" /> Outdoor</>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">₹{order.total}</span>
                          <div className="flex items-center gap-1 text-[10px] text-text-secondary opacity-60 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {order.createdAt
                              ? `${Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000)}m ago`
                              : '—'}
                          </div>
                        </div>
                      </div>

                      {/* ── Customer info ── */}
                      <div className="space-y-1 mb-3 bg-[#FFF8F0] p-2.5 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <User className="w-3 h-3" /> {order.customerName}
                        </div>
                        {order.deliveryType === 'outdoor' && order.customerPhone && (
                          <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                            <Phone className="w-3 h-3" /> {order.customerPhone}
                          </div>
                        )}
                      </div>

                      {/* ── CTAs ── */}
                      <div className="flex gap-2 mt-3">

                        {/* NEW → Confirm (send to kitchen) */}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(order.id, 'preparing')}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                          >
                            ✓ Confirm Order
                          </button>
                        )}

                        {/* PREPARING → Kitchen is working, no manual action needed */}
                        {order.status === 'preparing' && (
                          <div className="flex-1 flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-300 text-yellow-700 py-2.5 rounded-xl text-xs font-bold">
                            <ChefHat className="w-4 h-4 animate-bounce" />
                            Kitchen Working…
                          </div>
                        )}

                        {/* READY → Mark Delivered */}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateStatus(order.id, 'delivered')}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 animate-pulse"
                          >
                            <CheckCircle className="w-4 h-4" /> Mark Delivered
                          </button>
                        )}

                        {/* WhatsApp notify (always visible) */}
                        <button
                          onClick={() => {
                            const msg = encodeURIComponent(
                              `Namaste ${order.customerName}! Your order #${order.orderNumber} from ${restaurantInfo?.name || 'The Royal Comfort Hotel and Restaurant'} is ready. Enjoy your meal! 🥘`
                            )
                            let phoneStr = order.customerPhone || '';
                            let formattedPhone = phoneStr.replace(/\D/g, '');
                            if (formattedPhone.length === 10) {
                                formattedPhone = '91' + formattedPhone;
                            }
                            window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank')
                          }}
                          className="bg-[#25D366] text-white p-2.5 rounded-xl hover:bg-[#128C7E] transition-all"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                        </button>

                        {/* Receipt */}
                        <button 
                          onClick={() => {
                            const message = encodeURIComponent(generateWhatsAppReceipt(order, restaurantInfo))
                            let phoneStr = order.customerPhone || '';
                            let formattedPhone = phoneStr.replace(/\D/g, '');
                            if (formattedPhone.length === 10) {
                                formattedPhone = '91' + formattedPhone;
                            }
                            window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
                          }}
                          className="bg-white border border-border p-2.5 rounded-xl hover:bg-[#25D366]/10 hover:border-[#25D366] transition-colors"
                          title="Share Bill via WhatsApp"
                        >
                          <Receipt className="w-4 h-4 text-text-secondary hover:text-[#25D366]" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colOrders.length === 0 && (
                  <div className="h-32 flex items-center justify-center opacity-30 text-xs font-medium text-text-secondary">
                    No orders here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
