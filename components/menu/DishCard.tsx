'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, Info } from 'lucide-react'
import { useCart } from '@/lib/store'
import { cn, parseImages } from '@/lib/utils'

interface DishCardProps {
  dish: any
}

export function DishCard({ dish }: DishCardProps) {
  const [selectedSize, setSelectedSize] = useState(dish.sizes?.[0] || { label: 'Default', price: 0 })
  const cart = useCart()
  
  const cartItem = cart.items.find(
    (i) => i.id === dish.id && i.sizeLabel === selectedSize.label
  )

  const handleAdd = () => {
    cart.addItem({
      id: dish.id,
      name: dish.name,
      sizeLabel: selectedSize.label,
      price: Number(selectedSize.price),
      quantity: 1,
      image: parseImages(dish.images)[0]
    })
  }

  const validImages = parseImages(dish.images)

  return (
    <div className="bg-white rounded-[1.8rem] p-2.5 md:p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col group">
      {/* Veg/Non-Veg Tag */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-[8px] md:text-[10px] font-bold pointer-events-none">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          dish.isVeg ? "bg-green-500" : "bg-red-500"
        )} />
        {dish.isVeg ? 'VEG' : 'NON-VEG'}
      </div>

      {/* Dish Images - Snap Carousel */}
      <div className="relative w-full aspect-[4/3] rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden mb-3 group/carousel">
        {validImages.length > 0 ? (
          <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar smooth-scroll">
            {validImages.map((img, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                  <Image 
                    src={img} 
                    alt={`${dish.name} - ${idx + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 300px"
                    className="object-cover transition-transform duration-500"
                  />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-accent/10 flex items-center justify-center text-accent">
            <span className="opacity-50 text-[10px] font-medium">No Image</span>
          </div>
        )}
        
        {/* Carousel Indicators */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
            {validImages.map((_, idx) => (
              <div key={idx} className="w-1 h-1 rounded-full bg-white/60 shadow-sm border border-black/10"></div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-sm md:text-lg font-bold font-playfair line-clamp-1">{dish.name}</h4>
          <button className="text-text-secondary opacity-50 hover:opacity-100 hidden md:block">
            <Info className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-[10px] md:text-xs text-text-secondary line-clamp-1 md:line-clamp-2 mb-3">
          {dish.description}
        </p>

        {/* Sizes */}
        {dish.sizes?.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
            {dish.sizes.map((size: any) => (
              <button
                key={size.label}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold border transition-all whitespace-nowrap",
                  selectedSize.label === size.label 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border text-text-secondary"
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex justify-between items-center bg-[#FFF8F0] p-2 md:p-3 rounded-[1rem] md:rounded-[1.2rem]">
          <div className="font-bold flex flex-col leading-tight">
            <span className="text-[8px] md:text-[10px] opacity-60 uppercase font-poppins hidden md:block">Price</span>
            <span className="text-xs md:text-base">₹{selectedSize.price}</span>
          </div>

          {cartItem ? (
            <div className="flex items-center gap-2 md:gap-4 bg-white px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-sm border border-border">
              <button 
                onClick={() => cart.updateQuantity(dish.id, selectedSize.label, cartItem.quantity - 1)}
                className="text-primary hover:bg-primary/10 rounded-md p-0.5"
              >
                <Minus className="w-3 h-3 md:w-4 md:h-4" />
              </button>
              <span className="font-bold text-[10px] md:text-sm w-3 md:w-4 text-center">{cartItem.quantity}</span>
              <button 
                onClick={() => cart.updateQuantity(dish.id, selectedSize.label, cartItem.quantity + 1)}
                className="text-primary hover:bg-primary/10 rounded-md p-0.5"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleAdd}
              className="bg-primary hover:bg-primary-light text-white px-3 py-1.5 md:px-6 md:py-2 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
