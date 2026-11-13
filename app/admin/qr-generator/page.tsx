'use client'

import { useState, useEffect } from 'react'
import { Download, Share2, Copy, Check, ExternalLink, ChevronRight, Hotel, Utensils, QrCode } from 'lucide-react'
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

        // Draw gold circular border around logo
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
  const [qrType, setQrType] = useState<'welcome' | 'table' | 'room'>('table')
  const [targetNumber, setTargetNumber] = useState('1')
  const [qrUrl, setQrUrl] = useState('')
  const [qrBlob, setQrBlob] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)

  // Compute URL based on type and target number
  useEffect(() => {
    if (typeof window === 'undefined') return
    const baseUrl = window.location.origin
    let generated = `${baseUrl}/welcome`

    if (qrType === 'table') {
      generated = `${baseUrl}/welcome?table=${encodeURIComponent(targetNumber)}`
    } else if (qrType === 'room') {
      generated = `${baseUrl}/welcome?room=${encodeURIComponent(targetNumber)}`
    }

    setQrUrl(generated)
  }, [qrType, targetNumber])

  // Fetch / Generate QR code image whenever qrUrl changes
  useEffect(() => {
    if (!qrUrl) return
    setLoading(true)

    Promise.all([
      fetch(`/api/admin/qr?url=${encodeURIComponent(qrUrl)}`).then(res => res.json()),
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
  }, [qrUrl])

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
    const nameLabel = qrType === 'table' ? `Table-${targetNumber}` : qrType === 'room' ? `Room-${targetNumber}` : 'General'
    a.download = `RoyalComfort-QR-${nameLabel}.png`
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
          title: `${restaurantInfo?.name || 'The Royal Comfort Hotel and Restaurant'} QR`,
          text: `Scan to order at ${qrType === 'table' ? `Table ${targetNumber}` : qrType === 'room' ? `Room ${targetNumber}` : 'The Royal Comfort'}`,
          files: [file],
        })
      } catch (err) {
        toast.error('Sharing failed or was cancelled.')
      }
    } else {
      toast.error('Sharing not supported on this browser/device.')
    }
  }

  const destinationLabel = qrType === 'table' ? `Table ${targetNumber}` : qrType === 'room' ? `Room ${targetNumber}` : 'General Welcome'

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 lg:p-10 font-poppins">
      <header className="mb-10 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span>QR Generator</span>
        </div>
        <h1 className="text-4xl font-bold font-playfair text-primary">QR Code Generator</h1>
        <p className="text-text-secondary mt-1">
          Generate branded QR codes for tables and rooms. Customers scan to enter their name & phone before ordering.
        </p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* QR Preview Card */}
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-[3rem] shadow-2xl border border-border flex flex-col items-center text-center relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
            <h2 className="text-2xl font-bold font-playfair text-primary mt-4 mb-1 italic">
              {restaurantInfo?.name || 'The Royal Comfort'}
            </h2>
            <div className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37] px-4 py-1 rounded-full text-xs font-bold text-gray-800 mb-6">
              {destinationLabel}
            </div>
            
            <div className="bg-background p-4 rounded-[2rem] border-2 border-primary mb-6 relative group shadow-sm">
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
                <span className="text-lg">📱</span> Scan to Register & Order
            </p>
            <p className="text-[10px] text-text-secondary opacity-60 italic">
              {restaurantInfo?.address || 'Hotel and Restaurant'}
            </p>
        </motion.div>

        {/* Controls */}
        <div className="space-y-6">
            {/* QR Destination Selector */}
            <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-4">
                <label className="text-xs font-bold text-text-secondary uppercase block">
                  Select QR Destination Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setQrType('table'); setTargetNumber('1') }}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      qrType === 'table'
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-background text-gray-700 border-border hover:bg-border/30'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    Table QR
                  </button>

                  <button
                    type="button"
                    onClick={() => { setQrType('room'); setTargetNumber('101') }}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      qrType === 'room'
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-background text-gray-700 border-border hover:bg-border/30'
                    }`}
                  >
                    <Hotel className="w-4 h-4" />
                    Room QR
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrType('welcome')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      qrType === 'welcome'
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-background text-gray-700 border-border hover:bg-border/30'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    General QR
                  </button>
                </div>

                {qrType !== 'welcome' && (
                  <div className="pt-2 border-t border-border/60">
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block">
                      {qrType === 'table' ? 'Table Number' : 'Room Number'}
                    </label>
                    <input 
                      type="text" 
                      value={targetNumber}
                      onChange={(e) => setTargetNumber(e.target.value)}
                      placeholder={qrType === 'table' ? 'e.g. 1, 2, 3, VIP-1' : 'e.g. 101, 102, 204'}
                      className="w-full bg-background border border-border p-3.5 rounded-xl font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
            </div>

            {/* URL Display */}
            <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm">
                <label className="text-xs font-bold text-text-secondary uppercase mb-2 block">Destination URL</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        readOnly 
                        value={qrUrl}
                        className="flex-1 bg-background border border-border p-3 rounded-xl text-xs font-mono focus:outline-none"
                    />
                    <button 
                        onClick={copyLink}
                        className="p-3 bg-primary text-white rounded-xl hover:bg-primary-light transition-all shadow-md"
                        title="Copy Link"
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <a 
                        href={qrUrl} 
                        target="_blank" 
                        className="p-3 bg-white border border-border text-text-secondary rounded-xl hover:bg-border/20 transition-all shadow-sm"
                        title="Open in new tab"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </a>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-4">
                <button 
                    onClick={handleDownload}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 text-lg"
                >
                    <Download className="w-6 h-6" />
                    Download {destinationLabel} QR
                </button>
                <button 
                    onClick={handleShare}
                    className="w-full bg-white border-2 border-primary text-primary py-4 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                >
                    <Share2 className="w-6 h-6" />
                    Share QR
                </button>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-6 rounded-[2rem]">
                <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                    💡 QR Scan Flow
                </h4>
                <p className="text-xs text-orange-700 leading-relaxed">
                  When a customer scans this QR, they will see a Welcome screen with your Royal Comfort logo to enter their Name, WhatsApp Phone, and pre-filled table/room number. All new orders and reorders will ring sound alerts at Admin, Kitchen, and Reception!
                </p>
            </div>
        </div>
      </div>
    </div>
  )
}
