'use client'

import { useState, useEffect } from 'react'
import { Download, Share2, Copy, Check, ExternalLink, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

// Helper function to composite restaurant logo into the center of the QR code
function attachLogoToQr(qrDataUrl: string, logoSrc: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(qrDataUrl)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const qrImg = new window.Image()
    qrImg.crossOrigin = 'anonymous'
    qrImg.onload = () => {
      const size = qrImg.width || 500
      canvas.width = size
      canvas.height = size
      if (!ctx) return resolve(qrDataUrl)

      // Draw QR Code
      ctx.drawImage(qrImg, 0, 0, size, size)

      // Load Logo
      const logoImg = new window.Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.onload = () => {
        const logoSize = Math.round(size * 0.22)
        const center = size / 2
        const bgRadius = Math.round(logoSize / 2 + 6)

        // Draw white background circle for logo with shadow
        ctx.save()
        ctx.beginPath()
        ctx.arc(center, center, bgRadius, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFFFF'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.restore()

        // Draw gold/primary circular border around logo
        ctx.beginPath()
        ctx.arc(center, center, bgRadius - 1, 0, Math.PI * 2)
        ctx.strokeStyle = '#D4AF37'
        ctx.lineWidth = 3
        ctx.stroke()

        // Clip circular logo inside the badge
        ctx.save()
        ctx.beginPath()
        ctx.arc(center, center, logoSize / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(logoImg, center - logoSize / 2, center - logoSize / 2, logoSize, logoSize)
        ctx.restore()

        resolve(canvas.toDataURL('image/png'))
      }
      logoImg.onerror = () => resolve(qrDataUrl)
      logoImg.src = logoSrc
    }
    qrImg.onerror = () => resolve(qrDataUrl)
    qrImg.src = qrDataUrl
  })
}

export default function QRGenerator() {
  const [qrUrl, setQrUrl] = useState('')
  const [qrBlob, setQrBlob] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)

  useEffect(() => {
    const baseUrl = window.location.origin
    setQrUrl(`${baseUrl}/menu`)
    
    // Fetch QR code from API or generate locally, and fetch restaurant info
    Promise.all([
      fetch(`/api/admin/qr?url=${encodeURIComponent(`${baseUrl}/menu`)}`).then(res => res.json()),
      fetch('/api/admin/settings').then(res => res.json()).catch(() => ({}))
    ]).then(async ([qrData, settingsData]) => {
      if (qrData?.qrDataUrl) {
        const brandedQr = await attachLogoToQr(qrData.qrDataUrl, '/logo.png')
        setQrBlob(brandedQr)
      }
      if (settingsData && settingsData.name) setRestaurantInfo(settingsData)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(qrUrl)
    setCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!qrBlob) return
    const a = document.createElement('a')
    a.href = qrBlob
    a.download = 'RoyalComfort-Menu-QR.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleShare = async () => {
    if (navigator.share && qrBlob) {
      try {
        const response = await fetch(qrBlob)
        const blob = await response.blob()
        const file = new File([blob], 'menu-qr.png', { type: 'image/png' })
        await navigator.share({
          title: `${restaurantInfo?.name || 'The Royal Comfort Hotel and Restaurant'} Digital Menu`,
          text: 'Scan this QR to view our digital menu and place an order!',
          files: [file],
        })
      } catch (err) {
        toast.error('Sharing failed or was cancelled.')
      }
    } else {
      toast.error('Sharing not supported on this browser/device.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 lg:p-10 font-poppins">
      <header className="mb-10 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span>QR Generator</span>
        </div>
        <h1 className="text-4xl font-bold font-playfair text-primary">QR Generator</h1>
        <p className="text-text-secondary mt-1">Branded menu QR codes for tables and marketing</p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* QR Preview Card */}
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-[3rem] shadow-2xl border border-border flex flex-col items-center text-center relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
            <h2 className="text-2xl font-bold font-playfair text-primary mt-4 mb-1 italic">{restaurantInfo?.name || 'The Royal Comfort'}</h2>
            <p className="text-[10px] uppercase font-bold text-text-secondary opacity-60 mb-6 underline decoration-accent underline-offset-4 tracking-widest">Digital Menu</p>
            
            <div className="bg-background p-4 rounded-[2rem] border-2 border-primary mb-8 relative group shadow-sm">
                {loading ? (
                    <div className="w-64 h-64 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="relative w-64 h-64">
                      <img src={qrBlob} alt="Menu QR" className="w-full h-full rounded-xl" />
                    </div>
                )}
            </div>

            <p className="text-xs font-bold text-[#6B4226] flex items-center gap-2 mb-2 bg-[#FFF8F0] px-4 py-2 rounded-full">
                <span className="text-lg">📱</span> Scan to View Menu & Order
            </p>
            <p className="text-[10px] text-text-secondary opacity-60 italic">{restaurantInfo?.address || 'Hotel and Restaurant'}</p>
        </motion.div>

        {/* Controls */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm">
                <label className="text-xs font-bold text-text-secondary uppercase mb-2 block">Menu URL</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        readOnly 
                        value={qrUrl}
                        className="flex-1 bg-background border border-border p-3 rounded-xl text-sm font-mono focus:outline-none"
                    />
                    <button 
                        onClick={copyLink}
                        className="p-3 bg-primary text-white rounded-xl hover:bg-primary-light transition-all shadow-md"
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <a 
                        href={qrUrl} 
                        target="_blank" 
                        className="p-3 bg-white border border-border text-text-secondary rounded-xl hover:bg-border/20 transition-all shadow-sm"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <button 
                    onClick={handleDownload}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 text-lg"
                >
                    <Download className="w-6 h-6" />
                    Download Branded QR
                </button>
                <button 
                    onClick={handleShare}
                    className="w-full bg-white border-2 border-primary text-primary py-4 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                >
                    <Share2 className="w-6 h-6" />
                    Share via Native App
                </button>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-6 rounded-[2rem]">
                <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                    💡 Pro Tip
                </h4>
                <p className="text-xs text-orange-700 leading-relaxed">
                    Printed QR codes look best on table tents or acrylic stands. 
                    The "Branded QR" includes our restaurant logo and address automatically.
                </p>
            </div>
        </div>
      </div>
    </div>
  )
}
