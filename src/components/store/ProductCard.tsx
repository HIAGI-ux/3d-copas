import Link from 'next/link'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { parseColorOption, isLightHex } from '@/lib/colors'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'

export default function ProductCard({ product }: { product: Product }) {
  const variants = product.variants || []
  const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : null
  const maxPrice = variants.length > 0 ? Math.max(...variants.map((v) => v.price)) : null
  const mainIdx = product.main_photo_index < (product.photos?.length || 0) ? product.main_photo_index : 0
  const photoUrl = product.photos?.[mainIdx] || product.photos?.[0] || PLACEHOLDER_IMAGE
  const secondaryPhoto =
    product.photos && product.photos.length > 1
      ? product.photos.find((_, idx) => idx !== mainIdx) || null
      : null
  const isUnavailable = product.status === 'agotado'
  const colorOptions = (product.colors || []).map(parseColorOption)

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col bg-white rounded-2xl transition-all duration-300"
    >
      {/* Imagen cuadrada con swap de segunda foto al pasar el mouse */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 rounded-2xl border border-neutral-200/70 group-hover:border-neutral-300 group-hover:shadow-md transition-all duration-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-500 ${
            secondaryPhoto ? 'group-hover:opacity-0' : 'group-hover:scale-105'
          } ${isUnavailable ? 'opacity-55 grayscale-[30%]' : ''}`}
        />

        {secondaryPhoto && !isUnavailable && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={secondaryPhoto}
            alt={`${product.name} vista alternativa`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        )}

        {product.labels && product.labels.length > 0 && !isUnavailable && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
            {product.labels.slice(0, 1).map((label) => (
              <span
                key={label}
                className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                  label === 'Más pedido'
                    ? 'bg-amber-400 text-[#0F172A]'
                    : label === 'Navidad'
                      ? 'bg-red-600 text-white'
                      : 'bg-white/95 backdrop-blur-sm text-[#0F172A]'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {!isUnavailable && (
          <div className="hidden sm:flex absolute bottom-3 inset-x-3 justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-10">
            <span className="bg-white/95 backdrop-blur-sm text-[#0F172A] text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm border border-neutral-200/80">
              Ver detalle
            </span>
          </div>
        )}

        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
            <span className="bg-[#0F172A] text-white text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Info limpia estilo boutique */}
      <div className="pt-3.5 pb-1 px-0.5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          {product.category?.name ? (
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider truncate">
              {product.category.name}
            </span>
          ) : (
            <span />
          )}
          {colorOptions.length > 0 && (
            <div className="flex items-center gap-1 shrink-0" title={colorOptions.map((c) => c.name).join(', ')}>
              {colorOptions.slice(0, 5).map((c) => (
                <span
                  key={c.name}
                  className={`w-3 h-3 rounded-full ${
                    isLightHex(c.hex) ? 'border border-neutral-300' : 'border border-black/10'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {colorOptions.length > 5 && (
                <span className="text-[10px] text-neutral-400 font-medium">
                  +{colorOptions.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        <h3 className="text-sm text-[#0F172A] font-medium leading-snug line-clamp-2 group-hover:text-[#0D52D6] transition-colors">
          {product.name}
        </h3>

        {minPrice !== null && (
          <p className="text-lg font-bold text-[#0F172A] mt-1.5 tracking-tight">
            {minPrice === maxPrice ? formatPrice(minPrice) : `Desde ${formatPrice(minPrice)}`}
          </p>
        )}

        <span className="text-xs text-neutral-500 mt-0.5">
          {product.status === 'a_pedido'
            ? `Hecho a pedido · ${product.estimated_delivery}`
            : isUnavailable
              ? 'Consultar disponibilidad'
              : 'Transferencia o efectivo'}
        </span>
      </div>
    </Link>
  )
}
