import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  sizeLabel: string
  price: number
  quantity: number
  image?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string, sizeLabel: string) => void
  updateQuantity: (id: string, sizeLabel: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const items = get().items
        const existingItem = items.find(
          (i) => i.id === newItem.id && i.sizeLabel === newItem.sizeLabel
        )

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === newItem.id && i.sizeLabel === newItem.sizeLabel
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          })
        } else {
          set({ items: [...items, newItem] })
        }
      },
      removeItem: (id, sizeLabel) => {
        set({
          items: get().items.filter(
            (i) => !(i.id === id && i.sizeLabel === sizeLabel)
          ),
        })
      },
      updateQuantity: (id, sizeLabel, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id, sizeLabel)
          return
        }
        set({
          items: get().items.map((i) =>
            i.id === id && i.sizeLabel === sizeLabel ? { ...i, quantity } : i
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    {
      name: 'royal-comfort-cart',
    }
  )
)
