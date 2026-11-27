'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, User, Search, Menu, X } from 'lucide-react'
import { BusinessConfig } from '@/types'
import { useCart } from '@/context/CartContext'

interface StoreHeaderProps {
  config: BusinessConfig | null
}

export default function StoreHeader({ config }: StoreHeaderProps) {
  const { totalItems } = useCart()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const whatsappUrl = config?.whatsapp
    ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Hola, vi la tienda 3D Copas y quiero hacer una consulta.')}`
    : null

  const activeTransportes = (config?.transportes || [])
    .filter((t) => t.active)
    .sort((a, b) => a.order - b.order)
    .map((t) => t.name)
    .join(' · ')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchTerm.trim()
    if (q) {
      router.push(`/?buscar=${encodeURIComponent(q)}#catalogo`)
    } else {
      router.push('/#catalogo')
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      {/* Barra de anuncios superior con el azul del logo */}
      <div className="bg-[#0D52D6] text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide">
        <span>Envíos a todo el país</span>
        {activeTransportes ? <span className="hidden sm:inline"> ({activeTransportes})</span> : null}
        <span className="mx-2 opacity-60">|</span>
        <span>Retiro sin cargo en Balcarce</span>
      </div>

      {/* Header principal */}
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Menú mobile */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="md:hidden p-2 -ml-2 text-neutral-700 hover:text-[#0D52D6]"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo oficial */}
        <Link href="/" className="flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config?.logo_url || '/logo-3d-copas.png'}
            alt={config?.name || '3D Copas'}
            className="h-11 sm:h-14 w-auto object-contain"
          />
        </Link>

        {/* Buscador desktop estilo Tiendanube */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <input
              type="search"
              placeholder="¿Qué estás buscando?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-5 pr-11 py-2.5 text-sm bg-neutral-100 border border-transparent rounded-full focus:bg-white focus:border-[#0D52D6] focus:outline-none text-neutral-900 placeholder:text-neutral-500 transition-colors"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#0D52D6]"
            >
              <Search size={18} />
            </button>
          </div>
        </form>

        {/* Acciones derecha */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/?modal=personalizado"
            className="hidden sm:inline-flex items-center text-xs font-semibold text-[#0D52D6] border border-[#0D52D6] hover:bg-[#0D52D6] hover:text-white px-4 py-2 rounded-full transition-colors"
          >
            Pedido a medida
          </Link>

          <Link
            href="/cuenta"
            className="flex items-center gap-1.5 text-neutral-700 hover:text-[#0D52D6] transition-colors"
            aria-label="Mi cuenta"
            title="Mi cuenta"
          >
            <User size={21} strokeWidth={1.75} />
            <span className="hidden lg:inline text-xs font-medium">Mi cuenta</span>
          </Link>

          <Link
            href="/carrito"
            className="relative flex items-center gap-1.5 text-neutral-800 hover:text-[#0D52D6] transition-colors"
            aria-label={`Carrito (${totalItems} productos)`}
            title="Carrito"
          >
            <ShoppingBag size={21} strokeWidth={1.75} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#0D52D6] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Barra de navegación desktop */}
      <nav className="hidden md:block border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-center gap-8 text-xs font-semibold uppercase tracking-wider text-neutral-600">
          <Link href="/" className="hover:text-[#0D52D6] transition-colors">
            Inicio
          </Link>
          <Link href="/#catalogo" className="hover:text-[#0D52D6] transition-colors">
            Productos
          </Link>
          <Link href="/?modal=personalizado" className="hover:text-[#0D52D6] transition-colors">
            Personalizados
          </Link>
          <Link href="/cuenta" className="hover:text-[#0D52D6] transition-colors">
            Seguimiento de pedidos
          </Link>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0D52D6] transition-colors"
            >
              Contacto
            </a>
          )}
        </div>
      </nav>

      {/* Menú desplegable mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              placeholder="¿Qué estás buscando?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 text-sm bg-neutral-100 rounded-full focus:outline-none focus:ring-1 focus:ring-[#0D52D6]"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            >
              <Search size={17} />
            </button>
          </form>
          <div className="flex flex-col space-y-2.5 text-sm font-medium text-neutral-800">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-1">
              Inicio
            </Link>
            <Link href="/#catalogo" onClick={() => setMobileMenuOpen(false)} className="py-1">
              Productos
            </Link>
            <Link
              href="/?modal=personalizado"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1"
            >
              Pedido a medida
            </Link>
            <Link href="/cuenta" onClick={() => setMobileMenuOpen(false)} className="py-1">
              Mi cuenta
            </Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
