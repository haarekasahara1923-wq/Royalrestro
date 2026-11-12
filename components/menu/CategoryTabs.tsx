'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CategoryTabsProps {
  categories: any[]
  activeId: string
  onSelect: (id: string) => void
  loading: boolean
  isVertical?: boolean
}

export function CategoryTabs({ categories, activeId, onSelect, loading, isVertical }: CategoryTabsProps) {
  if (loading) {
    return (
      <div className={cn(
        "flex gap-4 px-4 pb-4 overflow-x-auto scrollbar-hide",
        isVertical && "lg:flex-col lg:overflow-visible lg:px-0 lg:gap-3"
      )}>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="min-w-[120px] h-10 bg-white/50 rounded-full animate-pulse border border-border/50"></div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn(
        "flex gap-4 px-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar",
        isVertical && "lg:flex-col lg:overflow-visible lg:px-0 lg:gap-3"
    )}>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "relative px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all text-left group",
            activeId === cat.id 
                ? "text-white bg-primary shadow-lg shadow-primary/20" 
                : "text-text-secondary bg-white shadow-sm hover:shadow-md hover:bg-primary/5",
            isVertical && "lg:rounded-2xl lg:py-4 lg:px-8 lg:text-base lg:w-full lg:flex lg:items-center lg:justify-between"
          )}
        >
          {activeId === cat.id && !isVertical && (
            <motion.div
              layoutId="activeTabMobile"
              className="absolute inset-0 bg-primary rounded-full -z-10"
              transition={{ type: 'spring', duration: 0.5 }}
            />
          )}
          <span className="relative z-10">{cat.name}</span>
          {isVertical && activeId === cat.id && (
            <ChevronRight className="hidden lg:block w-4 h-4 opacity-70" />
          )}
        </button>
      ))}
    </div>
  )
}

import { ChevronRight } from 'lucide-react'
