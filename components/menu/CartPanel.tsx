'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, ShoppingBag, Plus, Minus, ChevronRight, Loader2, User, Phone, Hotel, CheckCircle2, RefreshCw } from 'lucide-react'
import { useCart } from '@/lib/store'
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
  const [isReorder, setIsReorder] = useState(false)

  // Pre-fill from saved customer session
  useEffect(() => {
    try {
      const stored = localStorage.getItem('customer_info') || localStorage.getItem('rcCustomerSession')
      if (stored) {
        const parsed = JSON.parse(stored)
        setFormData(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          phone: parsed.phone || prev.phone,
          tableNumber: parsed.tableNumber || prev.tableNumber,
          deliveryType: parsed.deliveryType || prev.deliveryType
        }))
      }
    } catch {}
  }, [])

  const handlePlaceOrder = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please fill in your name and WhatsApp phone number')
      return
    }
    if (formData.deliveryType === 'dine-in' && !formData.tableNumber.trim()) {
      alert('Please enter your Table or Room number')
      return
    }
    if (formData.deliveryType === 'outdoor' && !formData.address.trim()) {
      alert('Please enter your delivery address')
      return
    }

    setSubmitting(true)
    try {
      // Save customer info back to localStorage so it stays persistent
      localStorage.setItem('customer_info', JSON.stringify({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        tableNumber: formData.tableNumber.trim(),
        deliveryType: formData.deliveryType
      }))

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          tableNumber: formData.tableNumber.trim(),
          items: cart.items,
          total: cart.totalPrice()
        })
      })

      const data = await response.json()
      if (data.success) {
        setOrderNumber(data.orderNumber)
        setIsReorder(Boolean(data.isReorder))
        setStep('success')
        cart.clearCart()
      } else {
        alert(data.error || 'Failed to place order. Please try again.')
      }
    } catch (err) {
      alert('Failed to place order. Please check your network and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-8 flex justify-end"
    >
      <motion.div 
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        exit={{ x: 500 }}
        className="bg-background w-full max-w-lg h-full rounded-[2.2rem] shadow-2xl overflow-hidden flex flex-col border border-border"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 flex justify-between items-center bg-white border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-playfair">Your Order</h2>
              {formData.tableNumber && (
                <p className="text-[11px] font-bold text-primary">
                  {formData.tableNumber} • {formData.name || 'Guest'}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-border/50 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {step === 'cart' && (
            <div className="space-y-6">
              {cart.items.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-text-secondary">Your cart is empty.</p>
                  <button onClick={onClose} className="text-primary font-bold mt-2">Browse Menu</button>
                </div>
              ) : (
                <>
                  {/* Active table info strip */}
                  {formData.tableNumber && (
                    <div className="bg-[#FFF8F0] border border-[#D4AF37]/40 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Hotel className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-bold text-gray-800">Delivering to {formData.tableNumber}</p>
                          <p className="text-[10px] text-text-secondary">Customer: {formData.name || 'Guest'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded-md">
                        Dine-in
                      </span>
                    </div>
                  )}

                  {/* Items list */}
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={`${item.id}-${item.sizeLabel}`} className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-border/60 shadow-sm">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-accent/10 flex-shrink-0">
                          {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.name}</h4>
                          <p className="text-[11px] text-text-secondary font-mono">{item.sizeLabel} · ₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2.5 bg-[#FFF8F0] px-3 py-1.5 rounded-xl border border-border">
                          <button 
                            onClick={() => cart.updateQuantity(item.id, item.sizeLabel, item.quantity - 1)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm min-w-[1rem] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => cart.updateQuantity(item.id, item.sizeLabel, item.quantity + 1)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price breakdown */}
                  <div className="bg-white p-4 rounded-2xl border border-border space-y-2 text-sm">
                    <div className="flex justify-between text-text-secondary text-xs">
                      <span>Subtotal</span>
                      <span>₹{cart.totalPrice()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                      <span>Grand Total</span>
                      <span className="text-primary font-black">₹{cart.totalPrice()}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-playfair mb-1">Confirm Destination & Details</h3>
                <p className="text-xs text-text-secondary">
                  Please review your details. Additional dishes for this table will be merged into your current bill.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Enter your name"
                      className="w-full bg-white border border-border pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 flex justify-between">
                    <span>WhatsApp Phone</span>
                    <span className="text-[10px] text-[#25D366] font-semibold">Bill will be sent here</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      maxLength={10}
                      placeholder="10-digit WhatsApp number"
                      className="w-full bg-white border border-border pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                </div>

                {formData.deliveryType === 'dine-in' ? (
                  <div>
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block">
                      Table / Room Number
                    </label>
                    <div className="relative">
                      <Hotel className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. Table 5 or Room 204"
                        className="w-full bg-white border border-border pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        value={formData.tableNumber}
                        onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block">
                      Delivery Address
                    </label>
                    <textarea 
                      placeholder="Enter your full address"
                      className="w-full bg-white border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 h-24 text-sm"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block">
                    Special Cooking Instructions (Optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Less spicy, extra onions"
                    className="w-full bg-white border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-bold font-playfair mb-2">
                {isReorder ? 'Dishes Added to Active Bill!' : 'Order Placed Successfully!'}
              </h3>

              <p className="text-text-secondary text-sm mb-6 max-w-xs mx-auto">
                {isReorder
                  ? `New items have been added to ${formData.tableNumber}'s existing bill #${orderNumber}. Kitchen has been notified.`
                  : `Your order #${orderNumber} has been sent to the Kitchen & Reception.`}
              </p>

              <div className="bg-[#FFF8F0] p-5 rounded-2xl border border-border mb-6 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Destination:</span>
                  <span className="font-bold text-gray-900">{formData.tableNumber || 'Takeaway'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Customer:</span>
                  <span className="font-bold text-gray-900">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">WhatsApp:</span>
                  <span className="font-bold text-[#25D366] font-mono">+91 {formData.phone}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="text-text-secondary">Bill Delivery:</span>
                  <span className="font-bold text-primary">Directly to WhatsApp</span>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-primary-light transition-all"
              >
                Continue Browsing Menu
              </button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {step !== 'success' && (
          <div className="p-5 sm:p-6 bg-white border-t border-border">
            {step === 'cart' ? (
              <button 
                onClick={() => setStep('details')}
                disabled={cart.items.length === 0}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary-light transition-all"
              >
                Proceed to Checkout (₹{cart.totalPrice()})
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={() => setStep('cart')}
                  className="bg-background border border-border px-6 py-4 rounded-2xl font-bold text-sm"
                >
                  Back
                </button>
                <button 
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-primary-light transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{isReorder ? 'Add to Current Bill' : 'Confirm & Place Order'}</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
