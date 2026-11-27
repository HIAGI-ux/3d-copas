import Link from 'next/link'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'

export default function ProductCard({ product }: { product: Product }) {
  const variants = product.variants || []
  const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : null
  const maxPrice = variants.length > 0 ? Math.max(...variants.map((v) => v.price)) : null
  const photoUrl = product.photos?.[product.main_photo_index] || product.photos?.[0] || PLACEHOLDER_IMAGE
  const isUnavailable = product.status === 'agotado'

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group relative bg-white rounded-card shadow-sm hover:shadow-md transition-all border border-copas-plata/60 overflow-hidden card-suit-border flex flex-col"
    >
      {/* Imagen cuadrada */}
      <div className="relative aspect-square w-full overflow-hidden bg-copas-crema">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isUnavailable ? 'opacity-65' : ''
          }`}
        />
        {product.labels && product.labels.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.labels.slice(0, 2).map((label) => (
              <Badge key={label} label={label} />
            ))}
          </div>
        )}
        {product.status === 'agotado' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30">
            <span className="bg-copas-rojo text-white font-heading font-bold px-3 py-1 rounded-full text-xs sm:text-sm -rotate-12 shadow">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-sm text-copas-marino leading-tight mb-1.5 line-clamp-2">
          {product.name}
        </h3>
        {minPrice !== null && (
          <p className="text-copas-azul font-heading font-black text-base mt-auto">
            {minPrice === maxPrice ? formatPrice(minPrice) : `Desde ${formatPrice(minPrice)}`}
          </p>
        )}
        {product.status === 'a_pedido' && (
          <span className="text-xs text-copas-plata-oscuro font-semibold mt-1">
            A pedido · {product.estimated_delivery}
          </span>
        )}
      </div>
    </Link>
  )
}
