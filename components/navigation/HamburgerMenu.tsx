'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, UtensilsCrossed, Info, User, Phone } from 'lucide-react'
import { Logo } from '@/components/Logo'

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Our Menu', href: '/menu', icon: UtensilsCrossed },
    { name: 'About Us', href: '/#about', icon: Info },
    { name: 'Contact Us', href: '/#contact', icon: Phone },
    { name: 'Staff Login', href: '/auth/login', icon: User },
  ]

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 md:hidden"
      >
        <Menu className="w-7 h-7 text-white" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] md:hidden"
            />
            
            {/* Side Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl flex flex-col md:hidden"
            >
              <div className="p-6 bg-primary text-white flex flex-col items-center justify-center relative">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <Logo width={60} height={60} className="mb-4 drop-shadow-md" />
                <h2 className="font-playfair text-xl font-bold italic text-center">The Royal Comfort</h2>
                <p className="text-xs text-white/80 font-poppins text-center">Hotel & Restaurant</p>
              </div>
              
              <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                {links.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-gray-700 hover:text-primary font-medium"
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                ))}
              </div>
              
              <div className="p-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">© {new Date().getFullYear()} The Royal Comfort Hotel and Restaurant</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
