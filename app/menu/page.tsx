'use client' // Version: 1.0.1 - Updated layout and data cleanup

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, MapPin, Phone, ChevronRight } from 'lucide-react'
import { useCart } from '@/lib/store'
import { DishCard } from '@/components/menu/DishCard'
import { CategoryTabs } from '@/components/menu/CategoryTabs'
import { CartPanel } from '@/components/menu/CartPanel'
import { Logo } from '@/components/Logo'
import { Footer } from '@/components/Footer'
import { BottomNav } from '@/components/navigation/BottomNav'
import { HamburgerMenu } from '@/components/navigation/HamburgerMenu'

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)
  const cart = useCart()

  useEffect(() => {
    Promise.all([
      fetch('/api/menu').then(res => res.json()),
      fetch('/api/admin/settings').then(res => res.json()).catch(() => ({}))
    ]).then(([menuData, settingsData]) => {
      setCategories(menuData || [])
      if (menuData && menuData.length > 0) setActiveCategory(menuData[0].id)
      if (settingsData && settingsData.name) setRestaurantInfo(settingsData)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const activeCategoryData = categories.find(c => c.id === activeCategory)
  const restaurantName = restaurantInfo?.name || 'The Royal Comfort'
  const restaurantAddress = restaurantInfo?.address || 'Hotel and Restaurant'
  const restaurantPhone = restaurantInfo?.contactPhone || ''

  return (
    <div className="min-h-screen font-poppins bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white p-4 md:p-8 rounded-b-[2rem] shadow-lg sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto w-full flex justify-between items-center px-2 md:px-8">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <HamburgerMenu />
            <Logo width={45} height={45} className="flex-shrink-0 border-2 border-white/20" />
            <div className="min-w-0 flex-1">
              <h1 className="font-playfair text-xl md:text-3xl font-bold italic truncate">{restaurantName}</h1>
              <div className="flex items-center text-[10px] md:text-sm opacity-80 mt-0.5">
                <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{restaurantAddress}</span>
              </div>
            </div>
          </div>
          {restaurantPhone && (
            <div className="flex-shrink-0 ml-2">
              <a href={`tel:${restaurantPhone.replace(/\s+/g, '')}`} className="bg-white/20 p-2.5 md:p-3 rounded-full backdrop-blur-md transition hover:bg-white/30 block">
                <Phone className="w-5 h-5 md:w-6 md:h-6" />
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 max-w-[1920px] mx-auto w-full md:px-8 pb-24">
        {/* ... (rest of the content) */}
        {/* Categories Sidebar/TopTabs */}
        <aside className="lg:w-72 lg:sticky lg:top-32 lg:h-[calc(100vh-10rem)] py-6 z-40 bg-background lg:pr-8">
          <div className="px-4 lg:px-0">
            <h2 className="hidden lg:block text-xl font-bold font-playfair mb-6 text-primary border-b border-primary/10 pb-4">Menu Categories</h2>
            <div className="lg:flex lg:flex-col lg:gap-3">
                <CategoryTabs 
                    categories={categories} 
                    activeId={activeCategory} 
                    onSelect={setActiveCategory} 
                    loading={loading}
                    isVertical={true}
                />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 lg:px-0 mt-6 md:mt-8">
          {/* Banner */}
          <div className="mb-10 lg:mb-12">
            <div className="bg-gradient-to-r from-[#F4A261] to-[#E76F51] rounded-3xl p-8 md:p-12 text-white overflow-hidden relative shadow-xl min-h-[220px] flex flex-col justify-center">
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold font-playfair mb-4 drop-shadow-md tracking-tight">Authentic Flavors</h2>
                    <p className="text-base md:text-lg opacity-90 max-w-[420px] font-medium leading-relaxed">Experience a taste that feels like home, prepared fresh and served with love.</p>
                </div>
                <div className="absolute right-[-40px] top-[-40px] bg-white/20 w-80 h-80 rounded-full blur-[100px]"></div>
                <div className="absolute left-[-40px] bottom-[-40px] bg-white/10 w-60 h-60 rounded-full blur-[80px]"></div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold font-playfair flex items-center gap-3 capitalize">
                  {activeCategoryData?.name || 'Loading Food...'}
                  {!loading && (
                    <span className="text-sm font-normal text-text-secondary bg-[#E8D5C4] px-4 py-1 rounded-full uppercase tracking-wider">
                        {activeCategoryData?.dishes?.length || 0} Items
                    </span>
                  )}
              </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-8 pb-12">
              {loading ? (
                  Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-white rounded-[2.5rem] h-[400px] animate-pulse shadow-sm"></div>
                  ))
              ) : (
                  activeCategoryData?.dishes?.map((dish: any) => (
                      <DishCard key={dish.id} dish={dish} />
                  ))
              )}
          </div>
        </main>
      </div>

      {/* Floating Cart Button */}
      {cart.items.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[450px] z-50 pointer-events-none"
          >
            <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-primary text-white h-16 rounded-2xl flex items-center justify-between px-6 shadow-[0_10px_40px_rgba(181,69,27,0.4)] pointer-events-auto transition hover:scale-[1.02] active:scale-[0.98]"
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <ShoppingBag className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-primary">
                            {cart.totalItems()}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs opacity-80">Your Order</p>
                        <p className="font-bold">₹{cart.totalPrice()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 font-bold">
                    View Cart
                    <ChevronRight className="w-5 h-5" />
                </div>
            </button>
          </motion.div>
      )}

      {/* Cart Panel Overlay */}
      <AnimatePresence>
        {isCartOpen && <CartPanel onClose={() => setIsCartOpen(false)} />}
      </AnimatePresence>
      
      <Footer />
      <div className="md:hidden h-16"></div> {/* Spacer for BottomNav */}
      <BottomNav />
    </div>
  )
}
