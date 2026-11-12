'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, ChevronRight, Clock, MapPin, User, Search, Receipt, X, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { Logo } from '@/components/Logo'
import { generateWhatsAppReceipt } from '@/lib/receiptFormatter'
import { NewOrderAlert } from '@/components/notifications/NewOrderAlert'

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)

  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  useEffect(() => {
    Promise.all([
        fetch('/api/reception/orders').then(res => res.json()),
        fetch('/api/admin/settings').then(res => res.json())
    ]).then(([ordersData, settingsData]) => {
        setOrders(ordersData)
        setRestaurantInfo(settingsData)
        setLoading(false)
    })
  }, [])

  // Timing Logic: Check for delays every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
        orders.forEach(order => {
            if (order.status === 'preparing') {
                const diff = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60)
                if (diff > 15) {
                    toast.error(`DELAY: Order #${order.orderNumber} (Prep >15m)`, { id: `admin-delay-prep-${order.id}` })
                }
            }
            if (order.status === 'ready') {
                const diff = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60)
                if (diff > 5) {
                    toast.warning(`DELAY: Order #${order.orderNumber} (Ready >5m)`, { id: `admin-delay-ready-${order.id}` })
                }
            }
        })
    }, 30000)

    return () => clearInterval(interval)
  }, [orders])

  const filteredOrders = orders.filter(o => 
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 lg:p-10 font-poppins">
      {/* ── New Order Alert Overlay ── */}
      <NewOrderAlert />
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
            <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Orders</span>
          </div>
          <h1 className="text-4xl font-bold font-playfair text-primary">All Orders</h1>
          <p className="text-text-secondary mt-1">Monitor and manage all restaurant transactions</p>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary opacity-40" />
          <input 
            type="text" 
            placeholder="Search by Order # or Customer Name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-white/50 animate-pulse rounded-[2rem] border border-border"></div>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[2.2rem] border border-border hover:border-primary transition-all shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10">#{order.orderNumber}</span>
                  <h3 className="font-bold text-lg mt-2 flex items-center gap-2">
                    {order.deliveryType === 'dine-in' ? 'Dine In' : 'Outdoor'}
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-md ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">₹{order.total}</p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-text-secondary opacity-60">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 p-4 bg-[#FFF8F0] rounded-2xl border border-border/40">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-primary opacity-60" />
                  <span className="font-medium">{order.customerName}</span>
                </div>
                {order.deliveryType === 'dine-in' ? (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <ShoppingBag className="w-4 h-4 opacity-60" />
                    Table {order.tableNumber}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <MapPin className="w-4 h-4 opacity-60" />
                    Outdoor Service
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Link 
                  href={`/reception/orders`} 
                  className="flex-1 bg-white border border-border py-3 rounded-xl text-xs font-bold text-center hover:bg-border/10 transition-all"
                >
                  Manage Order
                </Link>
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="px-4 bg-primary text-white py-3 rounded-xl text-xs font-bold hover:bg-primary-light transition-all"
                >
                  Receipt
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white/40 rounded-[3rem] border border-dashed border-border">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-20" />
          <h3 className="text-xl font-bold font-playfair opacity-40">No orders found</h3>
          <p className="text-text-secondary opacity-40">Try adjusting your filters or search</p>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center print:p-0 print:bg-white print:fixed print:inset-0">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="receipt-print-area bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none">
                  <div className="absolute top-0 left-0 w-full h-2 bg-primary no-print"></div>
                  
                  {/* Header with Logo & Resto Info */}
                  <div className="flex flex-col items-center text-center mb-8">
                      <div className="flex justify-between w-full mb-4 no-print">
                        <div className="invisible"><X /></div> {/* Spacer */}
                        <Logo width={60} height={60} />
                        <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><X /></button>
                      </div>
                      <div className="hidden print:block mb-3">
                        <Logo width={60} height={60} />
                      </div>
                      <h2 className="text-2xl font-bold font-playfair">{restaurantInfo?.name || 'The Royal Comfort Hotel and Restaurant'}</h2>
                      <p className="text-[10px] text-text-secondary uppercase tracking-widest">{restaurantInfo?.address || 'Hotel and Restaurant'}</p>
                      {restaurantInfo?.contactPhone && (
                        <p className="text-[10px] text-primary font-bold mt-1">Ph: {restaurantInfo.contactPhone}</p>
                      )}
                  </div>

                  <div className="bg-[#FFF8F0] p-4 rounded-2xl border border-border/50 mb-6 space-y-2">
                      <div className="flex justify-between text-xs">
                          <span className="text-text-secondary">Customer:</span>
                          <span className="font-bold">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                          <span className="text-text-secondary">WhatsApp:</span>
                          <span className="font-bold text-primary">{selectedOrder.customerPhone}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-2 border-t border-border/30">
                          <span className="text-text-secondary">Order ID:</span>
                          <span className="font-bold">#{selectedOrder.orderNumber}</span>
                      </div>
                  </div>
                  
                  <div className="border-y border-dashed border-border py-6 space-y-4 mb-6">
                      {selectedOrder.items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.dishName}</span>
                              <span className="font-bold">₹{item.totalPrice}</span>
                          </div>
                      ))}
                  </div>

                  <div className="space-y-2 mb-8">
                      <div className="flex justify-between text-sm text-text-secondary">
                          <span>Subtotal</span>
                          <span>₹{selectedOrder.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary">₹{selectedOrder.total}</span>
                      </div>
                  </div>

                  {/* WhatsApp Share Button */}
                  <button 
                    onClick={() => {
                        const message = encodeURIComponent(generateWhatsAppReceipt(selectedOrder, restaurantInfo))
                        let phoneStr = selectedOrder.customerPhone || '';
                        let formattedPhone = phoneStr.replace(/\D/g, '');
                        if (formattedPhone.length === 10) {
                            formattedPhone = '91' + formattedPhone;
                        }
                        window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank')
                    }}
                    className="no-print w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[#128C7E] transition-all flex items-center justify-center gap-3"
                  >
                      <WhatsAppIcon className="w-6 h-6 fill-white" />
                      Share Receipt via WhatsApp
                  </button>

                  <button 
                    onClick={() => window.print()}
                    className="no-print w-full mt-3 bg-white border border-border text-text-secondary py-3 rounded-xl text-xs font-bold hover:bg-border/10 transition-all flex items-center justify-center gap-2"
                  >
                      <Receipt className="w-4 h-4" />
                      Print Copy
                  </button>
              </motion.div>
          </div>
      )}
    </div>
  )
}
