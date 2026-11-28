'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'
import { slugify } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { Plus, Trash2, GripVertical } from 'lucide-react'

const EMOJI_SUGERIDOS = ['🛍️', '🎄', '🎁', '🍽️', '🏠', '🎨', '👶', '🐾', '⚽', '💍', '🌿', '🔑', '🎓', '🧁', '📦']

export default function AdminCategoriasPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})

  // Formulario nuevo
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🛍️')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [catRes, prodRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('id,category_id'),
    ])
    if (catRes.data) setCategories(catRes.data as Category[])
    if (prodRes.data) {
      const counts: Record<string, number> = {}
      for (const p of prodRes.data) {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1
        }
      }
      setProductCounts(counts)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) {
      toast.error('El nombre es obligatorio.')
      return
    }
    setSaving(true)
    const slug = slugify(newName)
    const { error } = await supabase.from('categories').insert({
      name: newName.trim(),
      slug,
      icon: newIcon,
      sort_order: categories.length + 1,
    })
    setSaving(false)
    if (error) {
      toast.error('No se pudo crear la categoría: ' + error.message)
    } else {
      toast.success(`Categoría "${newName.trim()}" creada.`)
      setNewName('')
      loadData()
    }
  }

  const handleDelete = async (cat: Category) => {
    const count = productCounts[cat.id] || 0
    if (count > 0) {
      toast.error(
        `No podés eliminar "${cat.name}" porque tiene ${count} producto${count > 1 ? 's' : ''} asignado${count > 1 ? 's' : ''}. Reasignálos primero.`
      )
      return
    }
    if (!confirm(`¿Seguro que querés eliminar la categoría "${cat.name}"?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) {
      toast.error('No se pudo eliminar la categoría.')
    } else {
      toast.success('Categoría eliminada.')
      loadData()
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-black text-copas-marino">Categorías</h1>
        <p className="text-sm text-copas-plata-oscuro mt-1">
          Organizá tus productos por categoría. Los clientes pueden filtrar por categoría en la tienda.
        </p>
      </div>

      {/* Formulario nueva categoría */}
      <div className="bg-white rounded-card border border-copas-plata p-5">
        <h2 className="font-heading font-bold text-copas-marino mb-4">Nueva categoría</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nombre *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej: Navidad, Cocina, Jardín..."
            required
          />
          <div>
            <label className="text-sm font-medium text-copas-marino block mb-2">Ícono</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {EMOJI_SUGERIDOS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewIcon(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all border-2 ${
                    newIcon === emoji
                      ? 'border-copas-azul bg-copas-azul/10'
                      : 'border-copas-plata hover:border-copas-azul'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value.slice(0, 4))}
              maxLength={4}
              className="w-20 border-2 border-copas-plata rounded-lg px-3 py-2 text-center text-xl focus:outline-none focus:border-copas-azul"
              placeholder="🛍️"
            />
          </div>
          <Button type="submit" loading={saving}>
            <Plus size={16} /> Crear categoría
          </Button>
        </form>
      </div>

      {/* Lista de categorías */}
      <div className="bg-white rounded-card border border-copas-plata divide-y divide-copas-plata/40">
        {categories.length === 0 ? (
          <p className="text-sm text-copas-plata-oscuro p-5">
            Todavía no hay categorías. ¡Creá la primera arriba!
          </p>
        ) : (
          categories.map((cat) => {
            const count = productCounts[cat.id] || 0
            return (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                <GripVertical size={16} className="text-copas-plata shrink-0" />
                <span className="text-2xl shrink-0">{cat.icon || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-copas-marino text-sm">{cat.name}</p>
                  <p className="text-xs text-copas-plata-oscuro">
                    {count} producto{count !== 1 ? 's' : ''} · slug: <code className="bg-copas-crema px-1 rounded">{cat.slug}</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="p-2 rounded-lg hover:bg-red-50 text-copas-rojo shrink-0"
                  title={count > 0 ? `No se puede eliminar: tiene ${count} productos` : 'Eliminar'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-copas-plata-oscuro">
        💡 Para reordenar las categorías, arrastrá los íconos <strong>≡</strong> (próximamente). Por ahora se muestran en orden de creación.
      </p>
    </div>
  )
}
