'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, ShoppingBag, Plus, Minus, ChevronRight, Loader2 } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useOrderStream } from '@/components/realtime/useOrderStream'
import Image from 'next/image'

interface CartPanelProps {
  onClose: () => void
}

export function CartPanel({ onClose }: CartPanelProps) {
  const cart = useCart()
  const [step, setStep] = useState<'cart' | 'details' | 'success'>('cart')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    deliveryType: 'dine-in',
    tableNumber: '',
    address: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  const handlePlaceOrder = async () => {
    if (!formData.name || !formData.phone) {
        alert('Please fill in your name and phone')
        return
    }
    if (formData.deliveryType === 'dine-in' && !formData.tableNumber) {
        alert('Please enter your table number')
        return
    }
    if (formData.deliveryType === 'outdoor' && !formData.address) {
        alert('Please enter your delivery address')
        return
    }

    setSubmitting(true)
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            body: JSON.stringify({
                ...formData,
                items: cart.items,
                total: cart.totalPrice()
            })
        })
        const data = await response.json()
        setOrderNumber(data.orderNumber)
        setStep('success')
        cart.clearCart()
    } catch (err) {
        alert('Failed to place order. Please try again.')
    } finally {
        setSubmitting(false)
    }
  }

  useOrderStream((event) => {
    if (step === 'success' && event.channel === 'orders:ready') {
        const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload
        if (payload.orderNumber === orderNumber) {
            alert('🎉 YOUR DELICIOUS ORDER IS READY TO DELIVER! 🥘\nEnjoy your meal at The Royal Comfort Hotel and Restaurant.')
        }
    }
  })

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm px-4 py-8 flex justify-end"
    >
      <motion.div 
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        exit={{ x: 500 }}
        className="bg-background w-full max-w-lg h-full rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 flex justify-between items-center bg-white border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-playfair">Your Order</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-border/50 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'cart' && (
            <div className="space-y-6">
              {cart.items.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-text-secondary">Your cart is empty.</p>
                  <button onClick={onClose} className="text-primary font-bold mt-2">Browse Menu</button>
                </div>
              ) : (
                <>
                  {cart.items.map((item) => (
                    <div key={`${item.id}-${item.sizeLabel}`} className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-border/50">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-accent/10 flex-shrink-0">
                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <p className="text-[10px] text-text-secondary">{item.sizeLabel} · ₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-[#FFF8F0] px-3 py-1.5 rounded-lg border border-border">
                        <button onClick={() => cart.updateQuantity(item.id, item.sizeLabel, item.quantity - 1)}>
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs">{item.quantity}</span>
                        <button onClick={() => cart.updateQuantity(item.id, item.sizeLabel, item.quantity + 1)}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white p-6 rounded-2xl border border-border">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-text-secondary">Subtotal</span>
                        <span className="font-bold">₹{cart.totalPrice()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-text-secondary">Gst (5%)</span>
                        <span className="font-bold">₹{(cart.totalPrice() * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-border my-4"></div>
                    <div className="flex justify-between text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-primary">₹{(cart.totalPrice() * 1.05).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
                <div>
                   <label className="text-xs font-bold text-text-secondary uppercase mb-2 block">Delivery Type</label>
                   <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setFormData({...formData, deliveryType: 'dine-in'})}
                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.deliveryType === 'dine-in' ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}
                        >
                            <span className="text-2xl">🍽️</span>
                            <span className="text-sm font-bold">Dine-In</span>
                        </button>
                        <button 
                            onClick={() => setFormData({...formData, deliveryType: 'outdoor'})}
                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.deliveryType === 'outdoor' ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}
                        >
                            <span className="text-2xl">🚚</span>
                            <span className="text-sm font-bold">Outdoor</span>
                        </button>
                   </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Full Name</label>
                        <input 
                            type="text" 
                            placeholder="Your Name"
                            className="w-full bg-white border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Phone Number</label>
                        <input 
                            type="tel" 
                            placeholder="98765 43210"
                            className="w-full bg-white border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    {formData.deliveryType === 'dine-in' ? (
                        <div>
                            <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Table Number</label>
                            <input 
                                type="text" 
                                placeholder="Enter table no."
                                className="w-full bg-white border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.tableNumber}
                                onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Delivery Address</label>
                            <textarea 
                                placeholder="Enter your full address"
                                className="w-full bg-white border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 h-24"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                    )}
                </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-green-600">✅</span>
                </div>
                <h3 className="text-2xl font-bold font-playfair mb-2">Order Placed!</h3>
                <p className="text-text-secondary text-sm mb-6">Your order #{orderNumber} has been sent to the kitchen.</p>
                <div className="bg-[#FFF8F0] p-6 rounded-2xl border border-border mb-8">
                    <p className="text-xs text-text-secondary uppercase font-bold mb-1">Estimated Wait</p>
                    <p className="text-xl font-bold">15 - 20 Minutes</p>
                </div>
                <button 
                    onClick={onClose}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg"
                >
                    Great, thanks!
                </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
            <div className="p-6 bg-white border-t border-border">
                {step === 'cart' ? (
                    <button 
                        onClick={() => setStep('details')}
                        disabled={cart.items.length === 0}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        Checkout (₹{(cart.totalPrice() * 1.05).toFixed(0)})
                        <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setStep('cart')}
                            className="bg-background border border-border px-6 py-4 rounded-2xl font-bold"
                        >
                            Back
                        </button>
                        <button 
                            onClick={handlePlaceOrder}
                            disabled={submitting}
                            className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}
                        </button>
                    </div>
                )}
            </div>
        )}
      </motion.div>
    </motion.div>
  )
}
