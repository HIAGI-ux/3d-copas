'use client'

import { useState, useMemo } from 'react'
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
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('¡Hola! Quiero hacer un pedido personalizado.')}`
    : null

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-2xl font-black text-copas-marino">Catálogo</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/?modal=personalizado"
            className="bg-copas-dorado text-copas-marino px-4 py-2 rounded-lg font-heading font-bold text-sm hover:brightness-110 transition-all"
          >
            🎨 Pedir algo personalizado
          </Link>
          {whatsappPersonal && (
            <a
              href={whatsappPersonal}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-copas-verde text-copas-verde px-4 py-2 rounded-lg font-heading font-bold text-sm hover:bg-copas-verde hover:text-white transition-all"
            >
              💬 Escribime por WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Filtros por categoría con estilo carta */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3.5 py-2 rounded-xl text-sm font-heading font-semibold transition-all border ${
            !selectedCategory
              ? 'bg-copas-azul text-white border-copas-azul shadow-sm'
              : 'bg-white border-copas-plata text-copas-marino hover:border-copas-azul'
          }`}
        >
          🏆 Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-3.5 py-2 rounded-xl text-sm font-heading font-semibold transition-all border ${
              selectedCategory === cat.slug
                ? 'bg-copas-azul text-white border-copas-azul shadow-sm'
                : 'bg-white border-copas-plata text-copas-marino hover:border-copas-azul'
            }`}
          >
            {cat.icon ? `${cat.icon} ` : ''}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-copas-plata-oscuro"
        />
        <input
          type="search"
          placeholder="Buscar por nombre (ej: casita, sello, velador...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border-2 border-copas-plata rounded-xl focus:outline-none focus:border-copas-azul bg-white text-copas-marino font-body"
        />
      </div>

      {/* Grid de productos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-card border border-copas-plata/50">
          <p className="text-5xl mb-3">🃏</p>
          <p className="font-heading text-lg font-bold text-copas-marino">
            No encontramos productos con ese filtro.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('')
              setSearch('')
            }}
            className="mt-3 text-sm text-copas-azul font-heading font-bold hover:underline"
          >
            Ver todo el catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
