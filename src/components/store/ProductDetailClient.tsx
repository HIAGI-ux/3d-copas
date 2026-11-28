'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, MessageCircle, ArrowLeft, Clock, Truck, ShieldCheck } from 'lucide-react'
import { Product, ProductVariant, Category } from '@/types'
import { formatPrice } from '@/lib/utils'
import { parseColorOption, isLightHex } from '@/lib/colors'
import { useCart } from '@/context/CartContext'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'

interface Props {
  product: Product
  whatsapp?: string
}

export default function ProductDetailClient({ product, whatsapp }: Props) {
  const { addItem } = useCart()
  const photos = product.photos || []
  const variants = product.variants || []
  const colorOptions = (product.colors || []).map(parseColorOption)

  const [selectedPhoto, setSelectedPhoto] = useState(
    product.main_photo_index < photos.length ? product.main_photo_index : 0
  )
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length >= 1 ? variants[0] : null
  )
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]?.name || '')
  const [personalization, setPersonalization] = useState('')
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')

  const currentPhoto = photos[selectedPhoto] || PLACEHOLDER_IMAGE
  const price = selectedVariant?.price ?? (variants[0]?.price || 0)

  const handleAddToCart = () => {
    if (variants.length > 1 && !selectedVariant) {
      setError('Por favor, elegí un tamaño.')
      return
    }
    if (product.personalizable && !personalization.trim()) {
      setError('Por favor, escribí el texto o diseño que querés.')
      return
    }
    setError('')
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_photo: photos[product.main_photo_index] || photos[0],
      variant: selectedVariant || undefined,
      color: selectedColor || undefined,
      qty,
      personalization: personalization.trim() || undefined,
      unit_price: price,
      shipping_height_cm: product.shipping_height_cm,
      shipping_width_cm: product.shipping_width_cm,
      shipping_length_cm: product.shipping_length_cm,
      shipping_weight_g: product.shipping_weight_g,
    })
  }

  const whatsappPersonal = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        `¡Hola! Me interesa "${product.name}". Quiero consultar por un pedido personalizado.`
      )}`
    : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-[#0D52D6] mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Galería */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhoto(idx)}
                  className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedPhoto === idx
                      ? 'border-[#0D52D6] ring-2 ring-[#0D52D6]/20'
                      : 'border-neutral-200 hover:border-neutral-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`${product.name} – foto ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info del producto */}
        <div className="flex flex-col gap-5">
          <div>
            {(product.category as Category | undefined)?.name && (
              <p className="text-xs text-[#0D52D6] font-semibold uppercase tracking-wider mb-1.5">
                {(product.category as Category).name}
              </p>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight leading-tight">
              {product.name}
            </h1>

            {product.labels && product.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {product.labels.map((label) => (
                  <Badge key={label} label={label} />
                ))}
              </div>
            )}
          </div>

          {/* Precio destacado */}
          <div className="border-y border-neutral-200 py-4">
            <div className="text-3xl font-bold text-[#0F172A] tracking-tight">
              {formatPrice(price)}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Transferencia bancaria o efectivo al retirar
            </p>
          </div>

          {product.description && (
            <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Descripción
              </p>
              <p className="text-neutral-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Selector de tamaño */}
          {variants.length > 0 && (
            <div>
              <p className="font-semibold text-[#0F172A] mb-2.5 text-xs uppercase tracking-wider">
                Tamaño
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-[#0D52D6] bg-[#0D52D6] text-white shadow-sm'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:border-[#0D52D6] hover:text-[#0D52D6]'
                    }`}
                  >
                    {v.size} · {formatPrice(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de color */}
          {colorOptions.length > 0 && (
            <div>
              <p className="font-semibold text-[#0F172A] mb-2.5 text-xs uppercase tracking-wider">
                Color:{' '}
                <span className="text-[#0D52D6] font-semibold normal-case">
                  {selectedColor}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => {
                  const active = selectedColor === c.name
                  const light = isLightHex(c.hex)
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all ${
                        active
                          ? 'border-[#0D52D6] bg-blue-50/70 text-[#0F172A] ring-2 ring-[#0D52D6]/20 shadow-sm'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-[#0D52D6] hover:text-[#0F172A]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full shrink-0 ${
                          light ? 'border border-neutral-300' : 'border border-black/10'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Personalización */}
          {product.personalizable && (
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1.5 text-xs uppercase tracking-wider">
                Personalización *
              </label>
              {product.personalization_hint && (
                <p className="text-xs text-neutral-500 mb-2">
                  {product.personalization_hint}
                </p>
              )}
              <textarea
                value={personalization}
                onChange={(e) => setPersonalization(e.target.value)}
                placeholder="Escribí el nombre, texto o detalle que querés..."
                rows={3}
                className="w-full border border-neutral-300 bg-white rounded-xl p-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#0D52D6] resize-none"
              />
            </div>
          )}

          {error && <p className="text-red-600 font-medium text-sm">{error}</p>}

          {product.status === 'agotado' ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-700 font-medium">
              Este producto está temporalmente agotado. Consultanos por WhatsApp cuándo vuelve a ingresar.
            </div>
          ) : (
            <div className="flex gap-3 items-center pt-1">
              <div className="flex items-center border border-neutral-300 bg-white rounded-full overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 hover:bg-neutral-100 transition-colors font-semibold text-[#0F172A]"
                >
                  −
                </button>
                <span className="px-3 py-2.5 font-semibold text-sm text-[#0F172A] min-w-[2.5rem] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3.5 py-2.5 hover:bg-neutral-100 transition-colors font-semibold text-[#0F172A]"
                >
                  +
                </button>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="flex-1 text-sm py-3">
                <ShoppingCart size={18} />
                Agregar al carrito
              </Button>
            </div>
          )}

          {/* Acciones secundarias */}
          <div className="flex gap-2.5 flex-wrap">
            <Link
              href="/?modal=personalizado"
              className="inline-flex items-center gap-2 border border-neutral-300 text-[#0F172A] px-5 py-2.5 rounded-full font-semibold text-xs hover:border-[#0D52D6] hover:text-[#0D52D6] transition-colors"
            >
              <MessageCircle size={15} />
              Pedir algo personalizado
            </Link>
            {whatsappPersonal && (
              <a
                href={whatsappPersonal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-green-600 text-green-700 px-5 py-2.5 rounded-full font-semibold text-xs hover:bg-green-600 hover:text-white transition-colors"
              >
                Consultar por WhatsApp
              </a>
            )}
          </div>

          {/* Beneficios / confianza */}
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-neutral-600">
            <div className="flex items-center gap-2.5">
              <Clock size={15} className="text-[#0D52D6] shrink-0" />
              <span>
                Producción estimada: <strong className="text-[#0F172A]">{product.estimated_delivery}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck size={15} className="text-[#0D52D6] shrink-0" />
              <span>Envíos a todo el país o retiro sin cargo en Balcarce.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={15} className="text-[#0D52D6] shrink-0" />
              <span>Garantía por defectos de impresión o roturas en el envío.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
