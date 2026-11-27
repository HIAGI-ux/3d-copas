'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import CheckoutModal from '@/components/store/CheckoutModal'
import { Trash2, ShoppingBag } from 'lucide-react'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'

export default function CarritoPage() {
  const { items, removeItem, updateQty, subtotal, totalItems } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center flex flex-col items-center gap-6">
        <ShoppingBag size={64} className="text-copas-plata" />
        <h1 className="font-heading text-2xl font-black text-copas-marino">Tu carrito está vacío</h1>
        <p className="text-copas-plata-oscuro">
          Explorá el catálogo y agregá los productos que quieras pedir.
        </p>
        <Link href="/">
          <Button>Ver catálogo</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-black text-copas-marino mb-6">
        🛒 Tu carrito ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
      </h1>

      <div className="bg-copas-azul/10 border border-copas-azul/30 rounded-lg px-4 py-3 mb-6 flex items-center gap-2 text-sm text-copas-marino">
        <span>🚚</span>
        <span>
          <strong>Hacemos envíos a toda la Argentina</strong> — Correo Argentino, Vía Cargo, OCA y
          Garmendia (en Balcarce entregamos sin costo).
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-card border border-copas-plata p-4 flex gap-3 shadow-sm"
            >
              <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-copas-crema">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.product_photo || PLACEHOLDER_IMAGE}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <Link
                  href={`/producto/${item.product_slug}`}
                  className="font-heading font-bold text-copas-marino text-sm leading-tight hover:text-copas-azul"
                >
                  {item.product_name}
                </Link>
                {item.variant && (
                  <p className="text-xs text-copas-plata-oscuro">Tamaño: {item.variant.size}</p>
                )}
                {item.color && (
                  <p className="text-xs text-copas-plata-oscuro">Color: {item.color}</p>
                )}
                {item.personalization && (
                  <p className="text-xs text-copas-marino bg-copas-crema rounded px-2 py-1 mt-0.5">
                    ✏️ {item.personalization}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-copas-plata rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQty(idx, item.qty - 1)}
                      className="px-2.5 py-1 text-copas-marino hover:bg-copas-crema transition-colors font-bold"
                    >
                      −
                    </button>
                    <span className="px-3 py-1 text-sm font-heading font-bold text-copas-marino">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(idx, item.qty + 1)}
                      className="px-2.5 py-1 text-copas-marino hover:bg-copas-crema transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-black text-copas-azul text-sm">
                      {formatPrice(item.unit_price * item.qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-copas-plata-oscuro hover:text-copas-rojo transition-colors p-1"
                      aria-label="Quitar del carrito"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-card border border-copas-plata p-6 sticky top-24 shadow-sm">
            <h2 className="font-heading font-bold text-copas-marino mb-4">Resumen</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-copas-plata-oscuro">
                <span>Subtotal productos</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-copas-plata-oscuro">
                <span>Envío</span>
                <span className="text-copas-azul font-semibold">Según localidad</span>
              </div>
            </div>
            <div className="border-t border-copas-plata pt-3 mb-5 flex justify-between font-heading font-black text-copas-marino">
              <span>Total productos</span>
              <span className="text-copas-azul text-xl">{formatPrice(subtotal)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={() => setShowCheckout(true)}>
              Continuar con el pedido
            </Button>
            <p className="text-xs text-copas-plata-oscuro text-center mt-3">
              No pagás nada online. Coordinamos por WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
    </div>
  )
}
