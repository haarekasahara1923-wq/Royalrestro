'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, ShoppingBag, User } from 'lucide-react'
import { useCart } from '@/lib/store'

export function BottomNav() {
  const pathname = usePathname()
  const cart = useCart()
  
  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
    { name: 'Cart', href: '/menu', icon: ShoppingBag, isCart: true },
    { name: 'Staff', href: '/auth/login', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[60] md:hidden pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          // If we are on the menu page, clicking cart should probably open the cart panel.
          // But since the CartPanel state is managed in the page, we will just let it navigate to /menu
          // if they are not already there.
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
                isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.isCart && cart.items.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {cart.totalItems()}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
