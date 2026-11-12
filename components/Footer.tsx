'use client'

import { useEffect, useState } from 'react'
import { Logo } from './Logo'
import { MapPin, Phone, Mail } from 'lucide-react'

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
)

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
)

interface FooterProps {
  initialInfo?: {
    name?: string | null
    address?: string | null
    contactPhone?: string | null
    contactEmail?: string | null
  } | null
}

export function Footer({ initialInfo }: FooterProps) {
  const [info, setInfo] = useState(initialInfo || null)

  useEffect(() => {
    if (!initialInfo) {
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => {
          if (data && data.name) setInfo(data)
        })
        .catch(() => {})
    }
  }, [initialInfo])

  const restaurantName = info?.name || 'The Royal Comfort Hotel and Restaurant'
  const address = info?.address || 'Hotel and Restaurant'
  const phone = info?.contactPhone || ''
  const email = info?.contactEmail || ''

  return (
    <footer className="bg-[#1A0A00] text-white pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand & Logo */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Logo width={60} height={60} />
            <div>
              <h2 className="text-2xl font-bold font-playfair italic">{restaurantName}</h2>
              <p className="text-sm text-gray-400 font-poppins">Hotel & Restaurant</p>
            </div>
          </div>
          <p className="text-gray-400 max-w-md font-poppins leading-relaxed mb-8">
            Welcome to {restaurantName}. We are committed to offering delightful dining experiences, 
            warm hospitality, and authentic flavors prepared with the finest ingredients. 
            Enjoy meals crafted with passion and care.
          </p>
          <div className="flex gap-4">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-primary/20 transition-colors">
              <InstagramIcon className="w-5 h-5 text-primary" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-primary/20 transition-colors">
              <FacebookIcon className="w-5 h-5 text-primary" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-6 font-playfair">Quick Links</h3>
          <ul className="space-y-4 font-poppins text-gray-400">
            <li><a href="/menu" className="hover:text-primary transition-colors">Digital Menu</a></li>
            <li><a href="/#about" className="hover:text-primary transition-colors">About Us</a></li>
            <li><a href="/#contact" className="hover:text-primary transition-colors">Contact</a></li>
            <li><a href="/auth/login" className="hover:text-primary transition-colors">Staff Portal</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold mb-6 font-playfair">Contact Us</h3>
          <ul className="space-y-4 font-poppins text-gray-400">
            {address && (
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>{address}</span>
              </li>
            )}
            {phone && (
              <li className="flex gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-primary transition-colors">{phone}</a>
              </li>
            )}
            {email && (
              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 text-center text-gray-500 text-sm font-poppins">
        <p>© {new Date().getFullYear()} {restaurantName}. All rights reserved.</p>
      </div>
    </footer>
  )
}
