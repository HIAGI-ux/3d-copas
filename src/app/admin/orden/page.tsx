'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Star, Eye, Pin } from 'lucide-react'

function SortableItem({
  product,
  onToggleFeatured,
  onMoveFirst,
}: {
  product: Product
  onToggleFeatured: (id: string) => void
  onMoveFirst: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: product.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const photo = product.photos?.[product.main_photo_index] || product.photos?.[0] || PLACEHOLDER_IMAGE

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-copas-plata p-3 flex items-center gap-3 shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-2 text-copas-plata-oscuro hover:text-copas-marino cursor-grab active:cursor-grabbing touch-none"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt={product.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-heading font-bold text-sm text-copas-marino truncate">{product.name}</p>
          {product.pinned && (
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              <Pin size={10} /> Anclado
            </span>
          )}
        </div>
        <p className="text-xs text-copas-plata-oscuro">
          {product.season ? `Temporada: ${product.season} · ` : ''}
          {formatPrice(product.variants?.[0]?.price || 0)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onMoveFirst(product.id)}
          className="text-xs font-heading font-bold text-copas-azul hover:underline px-2 py-1"
          title="Mostrar primero"
        >
          ↑ Primero
        </button>
        <button
          type="button"
          onClick={() => onToggleFeatured(product.id)}
          className={`p-2 rounded-lg border transition-all ${
            product.featured
              ? 'bg-copas-dorado/20 border-copas-dorado text-copas-marino'
              : 'border-copas-plata text-copas-plata-oscuro'
          }`}
          title={product.featured ? 'Quitar de destacados' : 'Marcar como destacado'}
        >
          <Star size={16} className={product.featured ? 'fill-copas-dorado text-copas-dorado' : ''} />
        </button>
      </div>
    </div>
  )
}

export default function AdminOrdenPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [seasonFilter, setSeasonFilter] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('sort_order')
    if (data) setProducts(data as Product[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const seasons = Array.from(new Set(products.map((p) => p.season).filter(Boolean) as string[]))
  const visibleList = seasonFilter
    ? products.filter((p) => p.season === seasonFilter)
    : products

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setProducts((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const handleToggleFeatured = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p))
    )
  }

  const handleMoveFirst = (id: string) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === id)
      if (idx <= 0) return prev
      return arrayMove(prev, idx, 0)
    })
  }

  const handleSaveOrder = async () => {
    setSaving(true)
    for (let i = 0; i < products.length; i++) {
      await supabase
        .from('products')
        .update({ sort_order: i + 1, featured: products[i].featured })
        .eq('id', products[i].id)
    }
    setSaving(false)
    toast.success('¡Orden y destacados guardados!')
  }

  if (loading) return <LoadingSpinner />

  const featuredPreview = products.filter((p) => p.featured && p.visible)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-black text-copas-marino">
            Orden y destacados
          </h1>
          <p className="text-sm text-copas-plata-oscuro">
            Arrastrá con el dedo o el mouse para ordenar el catálogo y elegí los destacados (★).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye size={16} /> Vista previa
          </Button>
          <Button size="sm" loading={saving} onClick={handleSaveOrder}>
            Guardar orden
          </Button>
        </div>
      </div>

      {seasons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSeasonFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-heading font-bold border ${
              !seasonFilter
                ? 'bg-copas-azul text-white border-copas-azul'
                : 'bg-white text-copas-marino border-copas-plata'
            }`}
          >
            Todas las temporadas
          </button>
          {seasons.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeasonFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-heading font-bold border ${
                seasonFilter === s
                  ? 'bg-copas-azul text-white border-copas-azul'
                  : 'bg-white text-copas-marino border-copas-plata'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleList.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {visibleList.map((p) => (
              <SortableItem
                key={p.id}
                product={p}
                onToggleFeatured={handleToggleFeatured}
                onMoveFirst={handleMoveFirst}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Vista previa de portada (Destacados)"
        size="lg"
      >
        {featuredPreview.length === 0 ? (
          <p className="text-sm text-copas-plata-oscuro">
            No hay productos visibles marcados como destacados.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {featuredPreview.map((p) => (
              <div key={p.id} className="border border-copas-plata rounded-lg p-2 bg-copas-crema">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photos?.[p.main_photo_index] || p.photos?.[0] || PLACEHOLDER_IMAGE}
                  alt={p.name}
                  className="w-full aspect-square object-cover rounded mb-2"
                />
                <p className="font-heading font-bold text-xs text-copas-marino truncate">
                  {p.name}
                </p>
                <p className="font-heading font-black text-xs text-copas-azul">
                  {formatPrice(p.variants?.[0]?.price || 0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
