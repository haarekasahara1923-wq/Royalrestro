'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrderStream } from '@/components/realtime/useOrderStream'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, CheckCircle, Receipt, Clock,
  MapPin, User, Phone, ChefHat, Bell, Home, LogOut,
  CreditCard, Banknote, Smartphone, Check, X, Send, ChevronRight
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
  const [paymentModalOrder, setPaymentModalOrder] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Real-time SSE handler
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
      setOrders(prev => {
        if (prev.some(o => o.id === payload.id)) {
          return prev.map(o => o.id === payload.id ? { ...o, ...payload } : o)
        }
        return [payload, ...prev]
      })
      if (payload.isUpdate) {
        toast.info(`Dishes Added to Order #${payload.orderNumber}!`, { duration: 8000 })
      }
    } else if (event.channel === 'orders:ready') {
      setOrders(prev => prev.map(o =>
        o.id === payload.id ? { ...o, status: 'ready', updatedAt: new Date().toISOString() } : o
      ))
      toast.info(`🔔 Order #${payload.orderNumber} is Ready!`, {
        description: `Deliver to ${payload.tableNumber || 'Customer'}`,
        duration: 15000,
        id: `ready-${payload.id}`
      })
    }
  })

  // Initial load
  useEffect(() => {
    Promise.all([
      fetch('/api/reception/orders').then(res => res.json()),
      fetch('/api/admin/settings').then(res => res.json()).catch(() => ({}))
    ]).then(([ordersData, settingsData]) => {
      setOrders(ordersData || [])
      setRestaurantInfo(settingsData)
    }).catch(() => {})
  }, [])

  // Periodic re-sync every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      fetch('/api/reception/orders')
        .then(res => res.json())
        .then((fresh: any[]) => {
          if (!fresh) return
          setOrders(prev =>
            prev.map(o => {
              const updated = fresh.find(f => f.id === o.id)
              if (updated && (updated.status !== o.status || updated.paymentStatus !== o.paymentStatus || updated.total !== o.total)) {
                return { ...o, ...updated }
              }
              return o
            })
          )
        })
        .catch(() => {})
    }, 15000)
    return () => clearInterval(timer)
  }, [])

  // Update order status
  const updateStatus = async (orderId: string, status: string) => {
    setActionLoading(orderId)
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
    } catch {
      toast.error('Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  // Generate & Deliver Bill via WhatsApp
  const handleGenerateAndSendBill = async (order: any) => {
    setActionLoading(order.id)
    try {
      // 1. Update status to delivered if not already
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered', paymentStatus: order.paymentStatus || 'unpaid' })
      })

      // 2. Optimistically update local state
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'delivered', paymentStatus: o.paymentStatus || 'unpaid' } : o))

      // 3. Format complete WhatsApp receipt
      const receiptText = generateWhatsAppReceipt(order, restaurantInfo)
      let phoneStr = order.customerPhone || ''
      let formattedPhone = phoneStr.replace(/\D/g, '')
      if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone
      }

      if (!formattedPhone) {
        toast.warning('Customer phone number not available. Bill generated in view receipt.')
        return
      }

      // 4. Open WhatsApp with pre-filled receipt
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(receiptText)}`
      window.open(whatsappUrl, '_blank')

      toast.success(`Bill sent to ${order.customerName}'s WhatsApp!`)
    } catch {
      toast.error('Failed to generate bill')
    } finally {
      setActionLoading(null)
    }
  }

  // Record Payment Done
  const handlePaymentDone = async (orderId: string, method: string) => {
    setActionLoading(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'delivered',
          paymentStatus: 'paid', 
          paymentMethod: method 
        })
      })

      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { 
          ...o, 
          status: 'delivered', 
          paymentStatus: 'paid', 
          paymentMethod: method,
          updatedAt: new Date().toISOString()
        } : o))
        toast.success(`Payment marked as PAID via ${method.toUpperCase()}!`)
        setPaymentModalOrder(null)
      } else {
        toast.error('Failed to record payment')
      }
    } catch {
      toast.error('Error recording payment')
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    { key: 'pending',   title: 'New Orders',     color: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
    { key: 'preparing', title: 'In Kitchen',     color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
    { key: 'ready',     title: 'Food Ready',     color: 'bg-blue-50   border-blue-200',   dot: 'bg-blue-500' },
    { key: 'unpaid',    title: 'Bill Sent / Due',color: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
    { key: 'paid',      title: 'Paid & Closed',  color: 'bg-green-50  border-green-200',  dot: 'bg-green-500' },
  ]

  // Filter orders into columns
  const getOrdersForColumn = (key: string) => {
    switch (key) {
      case 'pending':
        return orders.filter(o => o.status === 'pending')
      case 'preparing':
        return orders.filter(o => o.status === 'preparing')
      case 'ready':
        return orders.filter(o => o.status === 'ready')
      case 'unpaid':
        return orders.filter(o => o.status === 'delivered' && o.paymentStatus !== 'paid')
      case 'paid':
        return orders.filter(o => o.paymentStatus === 'paid')
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 md:p-8 font-poppins">
      {/* Real-time sound & modal alert */}
      <NewOrderAlert />

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-playfair text-primary">
            Reception Desk
          </h1>
          <p className="text-text-secondary text-sm">
            Live Order Pipeline, Kitchen Coordination & WhatsApp Billing
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-2xl text-xs font-bold text-text-secondary hover:text-primary transition-all shadow-sm"
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
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 items-start">
        {columns.map((col) => {
          const colOrders = getOrdersForColumn(col.key)
          return (
            <div
              key={col.key}
              className="bg-white rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden min-h-[500px]"
            >
              {/* Column Header */}
              <div className={`p-4 border-b border-border flex justify-between items-center ${col.color}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-bold text-sm text-gray-800">{col.title}</h3>
                </div>
                <span className="text-xs font-bold bg-white/80 px-2 py-0.5 rounded-full text-text-secondary border border-border/50">
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards List */}
              <div className="p-3 flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-14rem)]">
                <AnimatePresence>
                  {colOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-border/80 hover:border-primary/50 p-4 rounded-2xl shadow-sm transition-all space-y-3"
                    >
                      {/* Top Order Row */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md font-mono">
                            #{order.orderNumber}
                          </span>
                          <h4 className="font-bold text-sm mt-1 text-gray-900">
                            {order.deliveryType === 'dine-in'
                              ? order.tableNumber?.toLowerCase().includes('room') || order.tableNumber?.toLowerCase().includes('table')
                                ? order.tableNumber
                                : `Table ${order.tableNumber || 'Dine-in'}`
                              : 'Takeaway / Parcel'}
                          </h4>
                        </div>
                        <span className="text-base font-black text-primary">
                          ₹{order.total}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-[#FFF8F0] p-2.5 rounded-xl border border-border/50 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-800 font-semibold truncate">
                          <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="truncate">{order.customerName || 'Guest'}</span>
                        </div>
                        {order.customerPhone && (
                          <div className="flex items-center gap-1.5 text-text-secondary text-[11px] font-mono">
                            <Phone className="w-3 h-3 text-[#25D366] flex-shrink-0" />
                            <span>+91 {order.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* Items Summary */}
                      <div className="space-y-1 text-xs">
                        {order.items?.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-gray-700">
                            <span className="truncate">
                              {item.quantity}× {item.dishName}
                            </span>
                            <span className="text-text-secondary ml-2 font-mono">
                              ₹{item.totalPrice}
                            </span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <p className="text-[10px] text-text-secondary italic">
                            +{order.items.length - 3} more dishes...
                          </p>
                        )}
                      </div>

                      {/* Action Buttons based on status */}
                      <div className="pt-2 border-t border-border flex flex-col gap-2">
                        {/* PENDING -> Confirm to Kitchen */}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(order.id, 'preparing')}
                            disabled={actionLoading === order.id}
                            className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Confirm to Kitchen
                          </button>
                        )}

                        {/* PREPARING -> Kitchen status indicator */}
                        {order.status === 'preparing' && (
                          <div className="flex items-center justify-center gap-2 bg-yellow-100 text-yellow-800 py-2.5 rounded-xl text-xs font-bold border border-yellow-200">
                            <ChefHat className="w-4 h-4 animate-bounce" />
                            Cooking in Kitchen...
                          </div>
                        )}

                        {/* READY -> Generate & Deliver Bill via WhatsApp */}
                        {order.status === 'ready' && (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => handleGenerateAndSendBill(order)}
                              disabled={actionLoading === order.id}
                              className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f776a] text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Deliver & Send Bill (WhatsApp)
                            </button>

                            <button
                              onClick={() => updateStatus(order.id, 'delivered')}
                              disabled={actionLoading === order.id}
                              className="w-full bg-white border border-border text-text-secondary hover:text-gray-900 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                            >
                              Mark Delivered (No Bill)
                            </button>
                          </div>
                        )}

                        {/* DELIVERED / UNPAID -> Payment Done Button */}
                        {order.status === 'delivered' && order.paymentStatus !== 'paid' && (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => setPaymentModalOrder(order)}
                              className="w-full bg-primary hover:bg-primary-light text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              💰 Payment Done
                            </button>

                            <button
                              onClick={() => handleGenerateAndSendBill(order)}
                              className="w-full bg-white border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                              Resend Bill via WhatsApp
                            </button>
                          </div>
                        )}

                        {/* PAID -> Green Closed Badge */}
                        {order.paymentStatus === 'paid' && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                              PAID ({order.paymentMethod?.toUpperCase() || 'CASH'})
                            </span>

                            <button
                              onClick={() => {
                                const msg = generateWhatsAppReceipt(order, restaurantInfo)
                                let phoneStr = order.customerPhone || ''
                                let formattedPhone = phoneStr.replace(/\D/g, '')
                                if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone
                                window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank')
                              }}
                              className="p-1.5 rounded-lg border border-border hover:bg-gray-50 text-text-secondary"
                              title="Resend Paid Receipt"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 fill-gray-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colOrders.length === 0 && (
                  <div className="h-40 flex items-center justify-center opacity-30 text-xs font-medium text-text-secondary">
                    No orders
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment Selection Modal */}
      <AnimatePresence>
        {paymentModalOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-border relative"
            >
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                  Record Settlement
                </span>
                <h3 className="text-2xl font-bold font-playfair text-gray-900 mt-2">
                  Payment for #{paymentModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Customer: <strong>{paymentModalOrder.customerName}</strong> • {paymentModalOrder.tableNumber}
                </p>

                <div className="bg-[#FFF8F0] border border-border rounded-2xl p-4 mt-4">
                  <span className="text-xs text-text-secondary uppercase font-bold">Total Bill Amount</span>
                  <p className="text-3xl font-black text-primary mt-0.5">
                    ₹{paymentModalOrder.total}
                  </p>
                </div>
              </div>

              {/* Payment Method Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handlePaymentDone(paymentModalOrder.id, 'cash')}
                  className="w-full bg-green-50 border border-green-200 hover:bg-green-100 p-4 rounded-2xl flex items-center justify-between text-green-900 font-bold transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Banknote className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm">Cash Settlement</p>
                      <p className="text-[11px] font-normal text-green-700">Received physical cash at counter</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-green-600" />
                </button>

                <button
                  onClick={() => handlePaymentDone(paymentModalOrder.id, 'upi')}
                  className="w-full bg-blue-50 border border-blue-200 hover:bg-blue-100 p-4 rounded-2xl flex items-center justify-between text-blue-900 font-bold transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm">UPI / QR Code</p>
                      <p className="text-[11px] font-normal text-blue-700">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                </button>

                <button
                  onClick={() => handlePaymentDone(paymentModalOrder.id, 'razorpay')}
                  className="w-full bg-purple-50 border border-purple-200 hover:bg-purple-100 p-4 rounded-2xl flex items-center justify-between text-purple-900 font-bold transition-all"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                    <div className="text-left">
                      <p className="text-sm">Online / Card</p>
                      <p className="text-[11px] font-normal text-purple-700">Razorpay, Credit/Debit card machine</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-600" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
