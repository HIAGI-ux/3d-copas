import { Product } from '@/types'
import ProductCard from './ProductCard'

export default function ProductosDestacados({ products }: { products: Product[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-copas-dorado text-xl">★</span>
        <h2 className="font-heading text-2xl font-black text-copas-marino">Destacados</h2>
      </div>
      <p className="text-copas-plata-oscuro text-sm mb-5">Los más elegidos de nuestra tienda</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
