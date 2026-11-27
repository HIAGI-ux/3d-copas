'use client'

import Link from 'next/link'
import { ShoppingCart, User, MessageCircle } from 'lucide-react'
import { BusinessConfig } from '@/types'
import { useCart } from '@/context/CartContext'

interface StoreHeaderProps {
  config: BusinessConfig | null
}

export default function StoreHeader({ config }: StoreHeaderProps) {
  const { totalItems } = useCart()

  const whatsappUrl = config?.whatsapp
    ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent('¡Hola! Vi la tienda 3D Copas y te quiero consultar.')}`
    : null

  const instagramUrl = config?.instagram
    ? config.instagram.startsWith('http')
      ? config.instagram
      : `https://instagram.com/${config.instagram.replace('@', '')}`
    : null

  const tiktokUrl = config?.tiktok
    ? config.tiktok.startsWith('http')
      ? config.tiktok
      : `https://tiktok.com/@${config.tiktok.replace('@', '')}`
    : null

  const activeTransportes = (config?.transportes || [])
    .filter((t) => t.active)
    .sort((a, b) => a.order - b.order)
    .map((t) => t.name)
    .join(' · ')

  return (
    <header className="bg-copas-marino text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo + Nombre */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config?.logo_url || '/logo-3d-copas.svg'}
            alt={config?.name || '3D Copas'}
            className="w-10 h-10 rounded-full object-contain bg-white p-0.5"
          />
          <div className="leading-tight">
            <span className="font-heading font-black text-lg block">
              {config?.name || '3D Copas'}
            </span>
            <span className="text-[11px] text-copas-plata hidden sm:block">
              Balcarce · Impresión 3D
            </span>
          </div>
        </Link>

        {/* Acciones */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/?modal=personalizado"
            className="flex items-center gap-1.5 bg-copas-dorado text-copas-marino px-2.5 sm:px-3 py-2 rounded-lg font-heading font-bold text-xs sm:text-sm hover:brightness-110 transition-all"
          >
            <MessageCircle size={15} />
            <span className="hidden xs:inline sm:inline">Pedir algo personalizado</span>
            <span className="xs:hidden sm:hidden">A medida</span>
          </Link>

          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex p-2 rounded-lg hover:bg-white/10 transition-colors text-xs font-semibold"
              aria-label="Instagram"
              title="Instagram"
            >
              IG
            </a>
          )}

          {tiktokUrl && (
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex p-2 rounded-lg hover:bg-white/10 transition-colors text-xs font-semibold"
              aria-label="TikTok"
              title="TikTok"
            >
              TikTok
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-copas-verde"
              aria-label="WhatsApp"
              title="Escribime por WhatsApp"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          )}

          <Link
            href="/cuenta"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1"
            aria-label="Mi cuenta"
            title="Mi cuenta"
          >
            <User size={20} />
            <span className="hidden lg:inline text-xs font-heading font-bold">Mi cuenta</span>
          </Link>

          <Link
            href="/carrito"
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={`Carrito (${totalItems} productos)`}
            title="Carrito"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-copas-dorado text-copas-marino text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Aviso de envíos */}
      <div className="bg-copas-azul py-1.5 px-4 text-center text-xs sm:text-sm font-heading font-semibold text-white">
        🚚 Hacemos envíos a toda la Argentina
        {activeTransportes ? ` — ${activeTransportes}` : ''}
      </div>
    </header>
  )
}
