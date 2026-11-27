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
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 rounded-xl border border-neutral-200/70">
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
                className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                  label === 'Más pedido'
                    ? 'bg-amber-400 text-[#0F172A]'
                    : 'bg-[#0D52D6] text-white'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
            <span className="bg-[#0F172A] text-white text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Info estilo Tiendanube */}
      <div className="pt-3 pb-1 flex flex-col flex-1">
        <h3 className="text-sm text-neutral-800 font-medium leading-snug line-clamp-2 group-hover:text-[#0D52D6] transition-colors">
          {product.name}
        </h3>
        {minPrice !== null && (
          <p className="text-lg font-bold text-[#0F172A] mt-1">
            {minPrice === maxPrice ? formatPrice(minPrice) : `Desde ${formatPrice(minPrice)}`}
          </p>
        )}
        <span className="text-xs text-neutral-500 mt-0.5 mb-3">
          {product.status === 'a_pedido'
            ? `A pedido · ${product.estimated_delivery}`
            : isUnavailable
              ? 'Consultar disponibilidad'
              : 'Transferencia o efectivo'}
        </span>

        <span className="mt-auto w-full text-center rounded-full border border-[#0D52D6] text-[#0D52D6] group-hover:bg-[#0D52D6] group-hover:text-white py-2 text-xs font-semibold transition-colors">
          Ver producto
        </span>
      </div>
    </Link>
  )
}
