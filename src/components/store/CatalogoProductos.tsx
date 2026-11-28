'use client'

import { useState, useMemo, useEffect } from 'react'
import { Product, Category } from '@/types'
import ProductCard from './ProductCard'
import { Search, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'

interface CatalogoProps {
  products: Product[]
  categories: Category[]
  initialCategory?: string
  initialSearch?: string
  whatsapp?: string
}

type SortOption = 'orden' | 'precio_asc' | 'precio_desc'

function getMinPrice(p: Product): number {
  const variants = p.variants || []
  if (variants.length === 0) return 0
  return Math.min(...variants.map((v) => v.price))
}

export default function CatalogoProductos({
  products,
  categories,
  initialCategory,
  initialSearch,
  whatsapp,
}: CatalogoProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '')
  const [search, setSearch] = useState(initialSearch || '')
  const [sortBy, setSortBy] = useState<SortOption>('orden')

  useEffect(() => {
    setSearch(initialSearch || '')
  }, [initialSearch])

  useEffect(() => {
    setSelectedCategory(initialCategory || '')
  }, [initialCategory])

  const filtered = useMemo(() => {
    const base = products.filter((p) => {
      const catSlug = (p.category as Category | undefined)?.slug
      const matchesCat = !selectedCategory || catSlug === selectedCategory
      const matchesSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase())
      return matchesCat && matchesSearch
    })

    if (sortBy === 'precio_asc') {
      return [...base].sort((a, b) => getMinPrice(a) - getMinPrice(b))
    }
    if (sortBy === 'precio_desc') {
      return [...base].sort((a, b) => getMinPrice(b) - getMinPrice(a))
    }
    return base
  }, [products, selectedCategory, search, sortBy])

  const whatsappPersonal = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quiero hacer un pedido personalizado.')}`
    : null

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 py-12">
      {/* Encabezado limpio */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-neutral-200 pb-3.5 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
            Catálogo
          </h2>
        </div>
        <span className="text-xs text-neutral-500">
          {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {/* Filtros por categoría + buscador + orden */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
              !selectedCategory
                ? 'bg-[#0D52D6] text-white border-[#0D52D6] shadow-sm'
                : 'bg-white border-neutral-300 text-neutral-700 hover:border-[#0D52D6] hover:text-[#0D52D6]'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                selectedCategory === cat.slug
                  ? 'bg-[#0D52D6] text-white border-[#0D52D6] shadow-sm'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:border-[#0D52D6] hover:text-[#0D52D6]'
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="search"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-full focus:outline-none focus:border-[#0D52D6] bg-white text-neutral-900"
            />
          </div>

          <div className="relative">
            <ArrowUpDown
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Ordenar productos"
              className="w-full sm:w-auto pl-9 pr-8 py-2 text-xs font-semibold border border-neutral-300 rounded-full bg-white text-neutral-700 focus:outline-none focus:border-[#0D52D6] cursor-pointer"
            >
              <option value="orden">Destacados</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-200">
          <p className="text-base font-semibold text-[#0F172A]">
            No encontramos productos con ese filtro.
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Probá borrando el buscador o cambiando de categoría.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('')
              setSearch('')
            }}
            className="mt-4 inline-block px-6 py-2.5 text-xs font-semibold bg-[#0D52D6] text-white rounded-full hover:bg-[#0941AB] transition-colors"
          >
            Ver todos los productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-11">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Banner inferior para pedidos personalizados */}
      <div className="mt-16 bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border border-neutral-200/80 rounded-2xl p-6 sm:p-9 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0D52D6]">
            Diseño a medida
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] mt-1">
            ¿Buscás un diseño personalizado en 3D?
          </h3>
          <p className="text-sm text-neutral-600 mt-1 max-w-xl">
            Cotizamos piezas a medida, cortantes con tu forma, regalos empresariales o modelos con tu logo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/?modal=personalizado"
            className="bg-[#0D52D6] hover:bg-[#0941AB] text-white px-6 py-3 rounded-full text-xs font-semibold transition-colors shadow-sm"
          >
            Pedir presupuesto
          </Link>
          {whatsappPersonal && (
            <a
              href={whatsappPersonal}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#0D52D6] text-[#0D52D6] hover:bg-[#0D52D6] hover:text-white bg-white px-6 py-3 rounded-full text-xs font-semibold transition-colors"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
