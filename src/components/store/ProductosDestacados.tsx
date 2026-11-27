import { Product } from '@/types'
import ProductCard from './ProductCard'

export default function ProductosDestacados({ products }: { products: Product[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 pt-10 pb-6">
      <div className="flex items-baseline justify-between border-b border-neutral-200 pb-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
          Productos destacados
        </h2>
        <a
          href="#catalogo"
          className="text-xs font-semibold text-[#0D52D6] hover:underline transition-colors"
        >
          Ver todos
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
