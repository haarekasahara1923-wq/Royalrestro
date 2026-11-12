import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseImages(images: any): string[] {
  if (!images) return []
  if (Array.isArray(images)) return images.filter(Boolean)
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
  } catch (e) {}
  return typeof images === 'string' && images ? [images] : []
}
