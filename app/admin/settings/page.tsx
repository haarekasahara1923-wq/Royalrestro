'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, ChevronRight, Store, Phone, Mail, MapPin, Globe, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    name: 'The Royal Comfort Hotel and Restaurant',
    address: '',
    contactPhone: '',
    contactEmail: '',
    themeColor: '#B5451B',
    accentColor: '#F4A261'
  })

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(info => {
        if (info && typeof info === 'object') {
          setData(prev => ({
            ...prev,
            name: info.name ?? prev.name,
            address: info.address ?? prev.address,
            contactPhone: info.contactPhone ?? prev.contactPhone,
            contactEmail: info.contactEmail ?? prev.contactEmail,
            themeColor: info.themeColor ?? prev.themeColor,
            accentColor: info.accentColor ?? prev.accentColor,
          }))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success('Settings updated successfully!')
      } else {
        toast.error('Failed to update settings')
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-10 text-center opacity-50">Loading settings...</div>

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 lg:p-10 font-poppins">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span>Settings</span>
        </div>
        <h1 className="text-4xl font-bold font-playfair text-primary">Restaurant Settings</h1>
        <p className="text-text-secondary mt-1">Configure your official restaurant profile and contact details</p>
      </header>

      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Info */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6"
        >
          <h3 className="text-xl font-bold font-playfair flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-primary" />
            General Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Restaurant Name</label>
              <input 
                type="text" 
                className="w-full bg-[#FFF8F0] border border-border p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={data.name}
                onChange={e => setData({...data, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Official Address</label>
              <textarea 
                className="w-full bg-[#FFF8F0] border border-border p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 h-32"
                value={data.address}
                onChange={e => setData({...data, address: e.target.value})}
              />
            </div>
          </div>
        </motion.div>

        {/* Contact Details */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6"
        >
          <h3 className="text-xl font-bold font-playfair flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-primary" />
            Contact & Notifications
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">WhatsApp Number (For Notifications)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary opacity-40" />
                <input 
                  type="text" 
                  placeholder="e.g. 919876543210"
                  className="w-full bg-[#FFF8F0] border border-border p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={data.contactPhone}
                  onChange={e => setData({...data, contactPhone: e.target.value})}
                />
              </div>
              <p className="text-[10px] text-text-secondary mt-1 ml-1">* Include country code without + (e.g. 91 for India)</p>
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary opacity-40" />
                <input 
                  type="email" 
                  className="w-full bg-[#FFF8F0] border border-border p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={data.contactEmail}
                  onChange={e => setData({...data, contactEmail: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-primary-light transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save All Settings
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
