'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, MessageCircle, ArrowLeft } from 'lucide-react'
import { Product, ProductVariant, Category } from '@/types'
import { formatPrice } from '@/lib/utils'
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
  const colors = product.colors || []

  const [selectedPhoto, setSelectedPhoto] = useState(
    product.main_photo_index < photos.length ? product.main_photo_index : 0
  )
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length >= 1 ? variants[0] : null
  )
  const [selectedColor, setSelectedColor] = useState(colors[0] || '')
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
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-heading font-bold text-copas-azul hover:text-copas-marino mb-5"
      >
        <ArrowLeft size={16} /> Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galería */}
        <div>
          <div className="relative aspect-square rounded-card overflow-hidden bg-white border border-copas-plata mb-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhoto(idx)}
                  className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPhoto === idx ? 'border-copas-azul' : 'border-copas-plata'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          {(product.category as Category | undefined)?.name && (
            <p className="text-xs text-copas-plata-oscuro font-bold uppercase tracking-wider">
              {(product.category as Category).name}
            </p>
          )}

          <h1 className="font-heading text-2xl sm:text-3xl font-black text-copas-marino">
            {product.name}
          </h1>

          {product.labels && product.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.labels.map((label) => (
                <Badge key={label} label={label} />
              ))}
            </div>
          )}

          {product.description && (
            <p className="text-copas-marino/80 leading-relaxed text-sm sm:text-base">
              {product.description}
            </p>
          )}

          {/* Tiempo de entrega */}
          <div className="flex items-center gap-2 text-sm text-copas-marino bg-white border border-copas-plata/70 rounded-lg px-3.5 py-2.5">
            <span>⏱️</span>
            <span>
              Tiempo de entrega estimado:{' '}
              <strong className="text-copas-azul">{product.estimated_delivery}</strong>
            </span>
          </div>

          {/* Selector de tamaño */}
          {variants.length > 0 && (
            <div>
              <p className="font-heading font-bold text-copas-marino mb-2 text-sm">
                Tamaño y precio:
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-lg border-2 font-heading font-semibold text-sm transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-copas-azul bg-copas-azul text-white'
                        : 'border-copas-plata bg-white text-copas-marino hover:border-copas-azul'
                    }`}
                  >
                    {v.size} — {formatPrice(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de color */}
          {colors.length > 0 && (
            <div>
              <p className="font-heading font-bold text-copas-marino mb-2 text-sm">Color:</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 rounded-lg border-2 font-heading text-sm transition-all ${
                      selectedColor === color
                        ? 'border-copas-azul bg-copas-azul text-white'
                        : 'border-copas-plata bg-white text-copas-marino hover:border-copas-azul'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Personalización */}
          {product.personalizable && (
            <div>
              <label className="font-heading font-bold text-copas-marino block mb-1.5 text-sm">
                🎨 ¿Qué querés que diga o cómo querés personalizarlo? *
              </label>
              {product.personalization_hint && (
                <p className="text-xs text-copas-plata-oscuro mb-2">
                  {product.personalization_hint}
                </p>
              )}
              <textarea
                value={personalization}
                onChange={(e) => setPersonalization(e.target.value)}
                placeholder="Escribí el nombre, texto o diseño que querés..."
                rows={3}
                className="w-full border-2 border-copas-plata bg-white rounded-lg p-3 text-copas-marino focus:outline-none focus:border-copas-azul resize-none"
              />
            </div>
          )}

          {/* Precio */}
          <div className="text-3xl font-heading font-black text-copas-azul">
            {formatPrice(price)}
          </div>

          {error && <p className="text-copas-rojo font-semibold text-sm">{error}</p>}

          {product.status === 'agotado' ? (
            <div className="bg-copas-rojo/10 border border-copas-rojo rounded-lg p-3 text-sm text-copas-rojo font-semibold">
              Este producto está temporalmente agotado. Podés consultarme por WhatsApp cuándo vuelve.
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <div className="flex items-center border-2 border-copas-plata bg-white rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 hover:bg-copas-crema transition-colors font-bold text-copas-marino"
                >
                  −
                </button>
                <span className="px-4 py-2.5 font-heading font-bold text-copas-marino min-w-[3rem] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3.5 py-2.5 hover:bg-copas-crema transition-colors font-bold text-copas-marino"
                >
                  +
                </button>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="flex-1">
                <ShoppingCart size={18} />
                Agregar al carrito
              </Button>
            </div>
          )}

          <div className="flex gap-2.5 flex-wrap pt-1">
            <Link
              href="/?modal=personalizado"
              className="flex items-center gap-2 border-2 border-copas-marino text-copas-marino px-4 py-2 rounded-lg font-heading font-bold text-sm hover:bg-copas-marino hover:text-white transition-all"
            >
              <MessageCircle size={16} />
              Pedir algo personalizado
            </Link>
            {whatsappPersonal && (
              <a
                href={whatsappPersonal}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-2 border-copas-verde text-copas-verde px-4 py-2 rounded-lg font-heading font-bold text-sm hover:bg-copas-verde hover:text-white transition-all"
              >
                💬 Escribime por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
