'use client'

import { useState, useMemo, useEffect } from 'react'
import { Product, Category } from '@/types'
import ProductCard from './ProductCard'
import { Search } from 'lucide-react'
import Link from 'next/link'

interface CatalogoProps {
  products: Product[]
  categories: Category[]
  initialCategory?: string
  initialSearch?: string
  whatsapp?: string
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

  useEffect(() => {
    setSearch(initialSearch || '')
  }, [initialSearch])

  useEffect(() => {
    setSelectedCategory(initialCategory || '')
  }, [initialCategory])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const catSlug = (p.category as Category | undefined)?.slug
      const matchesCat = !selectedCategory || catSlug === selectedCategory
      const matchesSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase())
      return matchesCat && matchesSearch
    })
  }, [products, selectedCategory, search])

  const whatsappPersonal = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quiero hacer un pedido personalizado.')}`
    : null

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 py-10">
      {/* Encabezado limpio */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-neutral-200 pb-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">
          Catálogo
        </h2>
        <span className="text-xs text-neutral-500">
          {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {/* Filtros por categoría + buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              !selectedCategory
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-900'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                selectedCategory === cat.slug
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            placeholder="Filtrar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 bg-white text-neutral-900"
          />
        </div>
      </div>

      {/* Grid de productos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-md border border-neutral-200">
          <p className="text-base font-medium text-neutral-900">
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
            className="mt-4 inline-block px-4 py-2 text-xs font-medium uppercase tracking-wider bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors"
          >
            Ver todos los productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Banner inferior limpio para pedidos personalizados */}
      <div className="mt-14 bg-neutral-50 border border-neutral-200 rounded-md p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            ¿Buscás un diseño personalizado en 3D?
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Cotizamos piezas a medida, regalos empresariales o modelos con tu logo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/?modal=personalizado"
            className="bg-neutral-900 text-white px-5 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
          >
            Pedir presupuesto
          </Link>
          {whatsappPersonal && (
            <a
              href={whatsappPersonal}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-neutral-300 bg-white text-neutral-900 px-5 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider hover:border-neutral-900 transition-colors"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
