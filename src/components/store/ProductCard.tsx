import Link from 'next/link'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'

export default function ProductCard({ product }: { product: Product }) {
  const variants = product.variants || []
  const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : null
  const maxPrice = variants.length > 0 ? Math.max(...variants.map((v) => v.price)) : null
  const photoUrl =
    product.photos?.[product.main_photo_index] || product.photos?.[0] || PLACEHOLDER_IMAGE
  const isUnavailable = product.status === 'agotado'

  return (
    <Link href={`/producto/${product.slug}`} className="group flex flex-col bg-white">
      {/* Imagen cuadrada limpia estilo Tiendanube */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            isUnavailable ? 'opacity-60' : ''
          }`}
        />

        {product.labels && product.labels.length > 0 && !isUnavailable && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {product.labels.slice(0, 1).map((label) => (
              <span
                key={label}
                className="bg-white/95 text-neutral-900 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
            <span className="bg-neutral-900 text-white text-[11px] font-medium uppercase tracking-widest px-3 py-1.5 rounded-sm">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Info minimalista */}
      <div className="pt-3 pb-1 flex flex-col flex-1">
        <h3 className="text-sm text-neutral-800 font-normal leading-snug line-clamp-2 group-hover:text-black transition-colors">
          {product.name}
        </h3>
        {minPrice !== null && (
          <p className="text-base font-semibold text-neutral-900 mt-1">
            {minPrice === maxPrice ? formatPrice(minPrice) : `Desde ${formatPrice(minPrice)}`}
          </p>
        )}
        <span className="text-xs text-neutral-500 mt-0.5">
          {product.status === 'a_pedido'
            ? `A pedido · ${product.estimated_delivery}`
            : isUnavailable
              ? 'Consultar disponibilidad'
              : 'Transferencia o efectivo'}
        </span>
      </div>
    </Link>
  )
}
