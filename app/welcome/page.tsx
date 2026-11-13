'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Phone, Utensils, Hotel, Package, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { toast } from 'sonner'

function WelcomeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryType, setDeliveryType] = useState<'dine-in' | 'outdoor'>('dine-in')
  const [tableOrRoom, setTableOrRoom] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Initialize from search params or previous visit
  useEffect(() => {
    const tableParam = searchParams.get('table')
    const roomParam = searchParams.get('room')

    if (tableParam) {
      setTableOrRoom(tableParam.toLowerCase().includes('table') ? tableParam : `Table ${tableParam}`)
      setDeliveryType('dine-in')
    } else if (roomParam) {
      setTableOrRoom(roomParam.toLowerCase().includes('room') ? roomParam : `Room ${roomParam}`)
      setDeliveryType('dine-in')
    }

    // Check existing customer info in localStorage
    try {
      const stored = localStorage.getItem('customer_info')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.name && !name) setName(parsed.name)
        if (parsed.phone && !phone) setPhone(parsed.phone)
        if (!tableParam && !roomParam && parsed.tableNumber) {
          setTableOrRoom(parsed.tableNumber)
        }
      }
    } catch {}
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }

    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit WhatsApp number')
      return
    }

    if (deliveryType === 'dine-in' && !tableOrRoom.trim()) {
      toast.error('Please enter your Table or Room number')
      return
    }

    setSubmitting(true)

    const customerData = {
      name: name.trim(),
      phone: cleanPhone.slice(-10),
      tableNumber: deliveryType === 'dine-in' ? tableOrRoom.trim() : 'Takeaway',
      deliveryType,
      updatedAt: new Date().toISOString()
    }

    // Persist customer session in localStorage
    try {
      localStorage.setItem('customer_info', JSON.stringify(customerData))
      localStorage.setItem('rcCustomerSession', JSON.stringify(customerData))
    } catch {}

    toast.success(`Welcome, ${name.trim()}! Loading menu...`)

    setTimeout(() => {
      router.push('/menu')
    }, 400)
  }

  return (
    <div className="min-h-screen bg-[#140801] text-white flex flex-col justify-center items-center p-4 sm:p-6 font-poppins relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#B5451B]/25 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-t from-[#D4AF37]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-[2.8rem] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="mb-4 relative"
          >
            <Logo width={85} height={85} className="shadow-2xl border-2 border-[#D4AF37]/50" />
            <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-black p-1.5 rounded-full shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#D4AF37] mb-1">
            Royal Dining Experience
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair tracking-tight text-white">
            The Royal Comfort
          </h1>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">
            Please enter your details to view our digital menu and order fresh delicacies
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dining Type Selection */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">
              Dining Option
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('dine-in')}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  deliveryType === 'dine-in'
                    ? 'bg-[#B5451B] border-[#B5451B] text-white shadow-lg shadow-[#B5451B]/30'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Utensils className="w-4 h-4" />
                Table / Room
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('outdoor')}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  deliveryType === 'outdoor'
                    ? 'bg-[#B5451B] border-[#B5451B] text-white shadow-lg shadow-[#B5451B]/30'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Package className="w-4 h-4" />
                Takeaway / Parcel
              </button>
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
              Your Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
              <span>
                WhatsApp Number <span className="text-red-400">*</span>
              </span>
              <span className="text-[10px] text-[#25D366] font-normal">
                Bill will be sent here
              </span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <div className="absolute left-11 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 border-r border-white/10 pr-2">
                +91
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit WhatsApp number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-24 pr-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-white placeholder-gray-500 text-sm font-mono tracking-wider focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
            </div>
          </div>

          {/* Table No. / Room No. (For Dine-In) */}
          {deliveryType === 'dine-in' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
                <span>
                  Table No. / Room No. <span className="text-red-400">*</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  Delivery location
                </span>
              </label>
              <div className="relative">
                <Hotel className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 5 or Room 204"
                  value={tableOrRoom}
                  onChange={(e) => setTableOrRoom(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* Submit CTA */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full mt-4 bg-gradient-to-r from-[#B5451B] to-[#D4622D] hover:from-[#c24b1f] hover:to-[#df6a33] text-white py-4 rounded-2xl font-bold text-base shadow-[0_10px_25px_rgba(181,69,27,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>View Menu & Order</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
            Your bill will be automatically sent to your WhatsApp
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#140801] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WelcomeForm />
    </Suspense>
  )
}

