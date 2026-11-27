'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { CartItem } from '@/types'
import toast from 'react-hot-toast'

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (index: number) => void
  updateQty: (index: number, qty: number) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('3dcopas_cart')
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch {
      // ignorar si sessionStorage no está disponible
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem('3dcopas_cart', JSON.stringify(items))
    } catch {
      // ignorar
    }
  }, [items, hydrated])

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.product_id === newItem.product_id &&
          i.variant?.id === newItem.variant?.id &&
          i.color === newItem.color &&
          (i.personalization || '') === (newItem.personalization || '')
      )
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + newItem.qty }
        return updated
      }
      return [...prev, newItem]
    })
    toast.success(`"${newItem.product_name}" agregado al carrito`)
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateQty = useCallback((index: number, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((_, i) => i !== index))
      return
    }
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], qty }
      return updated
    })
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    try {
      sessionStorage.removeItem('3dcopas_cart')
    } catch {
      // ignorar
    }
  }, [])

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.qty, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
