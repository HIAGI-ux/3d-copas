'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category, ProductVariant, ProductStatus } from '@/types'
import { formatPrice, slugify } from '@/lib/utils'
import { compressImageFile } from '@/lib/image-compress'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import PriceCalculator from '@/components/admin/PriceCalculator'
import toast from 'react-hot-toast'
import { Plus, Edit2, Copy, Trash2, Calculator, Star, Eye, EyeOff, X } from 'lucide-react'

const AVAILABLE_LABELS = ['Nuevo', 'Navidad', 'Más pedido', 'A pedido', 'Agotado']

export default function AdminProductosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)
  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: 'v1', size: 'Estándar', price: 3500 },
  ])
  const [colorsText, setColorsText] = useState('Blanco, Negro, Azul')
  const [labels, setLabels] = useState<string[]>([])
  const [status, setStatus] = useState<ProductStatus>('disponible')
  const [visible, setVisible] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [season, setSeason] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('5 a 7 días hábiles')
  const [personalizable, setPersonalizable] = useState(false)
  const [personalizationHint, setPersonalizationHint] = useState('')

  // Envío y costos
  const [shippingHeight, setShippingHeight] = useState('4')
  const [shippingWidth, setShippingWidth] = useState('10')
  const [shippingLength, setShippingLength] = useState('10')
  const [shippingWeight, setShippingWeight] = useState('80')
  const [packagingCost, setPackagingCost] = useState('250')
  const [privateCost, setPrivateCost] = useState('')
  const [costBreakdown, setCostBreakdown] = useState<Record<string, number> | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [prodRes, catRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(id,name,slug)')
        .order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    if (prodRes.data) setProducts(prodRes.data as Product[])
    if (catRes.data) setCategories(catRes.data as Category[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setCategoryId(categories[0]?.id || '')
    setPhotos([])
    setMainPhotoIndex(0)
    setVariants([{ id: `v${Date.now()}`, size: 'Estándar', price: 3500 }])
    setColorsText('Blanco, Negro, Azul')
    setLabels([])
    setStatus('disponible')
    setVisible(true)
    setFeatured(false)
    setSeason('')
    setEstimatedDelivery('5 a 7 días hábiles')
    setPersonalizable(false)
    setPersonalizationHint('')
    setShippingHeight('4')
    setShippingWidth('10')
    setShippingLength('10')
    setShippingWeight('80')
    setPackagingCost('250')
    setPrivateCost('')
    setCostBreakdown(null)
  }

  const openCreate = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setName(p.name)
    setDescription(p.description || '')
    setCategoryId(p.category_id || '')
    setPhotos(p.photos || [])
    setMainPhotoIndex(p.main_photo_index || 0)
    setVariants(
      p.variants && p.variants.length > 0
        ? p.variants
        : [{ id: 'v1', size: 'Estándar', price: 0 }]
    )
    setColorsText((p.colors || []).join(', '))
    setLabels(p.labels || [])
    setStatus(p.status)
    setVisible(p.visible)
    setFeatured(p.featured)
    setSeason(p.season || '')
    setEstimatedDelivery(p.estimated_delivery || '5 a 7 días hábiles')
    setPersonalizable(p.personalizable)
    setPersonalizationHint(p.personalization_hint || '')
    setShippingHeight(p.shipping_height_cm ? String(p.shipping_height_cm) : '')
    setShippingWidth(p.shipping_width_cm ? String(p.shipping_width_cm) : '')
    setShippingLength(p.shipping_length_cm ? String(p.shipping_length_cm) : '')
    setShippingWeight(p.shipping_weight_g ? String(p.shipping_weight_g) : '')
    setPackagingCost(String(p.packaging_cost || 0))
    setPrivateCost(p.cost ? String(p.cost) : '')
    setCostBreakdown((p.cost_breakdown as Record<string, number>) || null)
    setModalOpen(true)
  }

  const handleDuplicate = async (p: Product) => {
    const newName = `${p.name} (Copia)`
    const newSlug = `${slugify(newName)}-${Date.now().toString().slice(-4)}`
    const { error } = await supabase.from('products').insert({
      name: newName,
      slug: newSlug,
      description: p.description,
      category_id: p.category_id,
      photos: p.photos,
      main_photo_index: p.main_photo_index,
      variants: p.variants,
      colors: p.colors,
      labels: p.labels,
      status: p.status,
      visible: false,
      featured: false,
      sort_order: products.length + 1,
      season: p.season,
      estimated_delivery: p.estimated_delivery,
      personalizable: p.personalizable,
      personalization_hint: p.personalization_hint,
      shipping_height_cm: p.shipping_height_cm,
      shipping_width_cm: p.shipping_width_cm,
      shipping_length_cm: p.shipping_length_cm,
      shipping_weight_g: p.shipping_weight_g,
      packaging_cost: p.packaging_cost,
      cost: p.cost,
      cost_breakdown: p.cost_breakdown,
    })
    if (error) {
      toast.error('No se pudo duplicar el producto.')
    } else {
      toast.success('Producto duplicado (oculto por defecto).')
      loadData()
    }
  }

  const handleDelete = async (p: Product) => {
    if (!confirm(`¿Seguro que querés borrar "${p.name}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) {
      toast.error('No se pudo borrar el producto.')
    } else {
      toast.success('Producto borrado.')
      loadData()
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingPhoto(true)
    const uploadedUrls: string[] = []

    for (const file of Array.from(files)) {
      const compressed = await compressImageFile(file, 1200, 0.82)
      const fileName = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.webp`
      const { data, error } = await supabase.storage.from('products').upload(fileName, compressed)
      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('products').getPublicUrl(data.path)
        uploadedUrls.push(publicUrl)
      } else {
        toast.error(`Error subiendo ${file.name}`)
      }
    }

    setPhotos((prev) => [...prev, ...uploadedUrls])
    setUploadingPhoto(false)
    e.target.value = ''
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre es obligatorio.')
      return
    }
    setSaving(true)

    const colorsArray = colorsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    const payload = {
      name: name.trim(),
      slug: editingId ? undefined : `${slugify(name)}-${Date.now().toString().slice(-4)}`,
      description: description.trim() || null,
      category_id: categoryId || null,
      photos,
      main_photo_index: mainPhotoIndex < photos.length ? mainPhotoIndex : 0,
      variants: variants.filter((v) => v.size.trim()),
      colors: colorsArray,
      labels,
      status,
      visible,
      featured,
      season: season.trim() || null,
      estimated_delivery: estimatedDelivery.trim() || '5 a 7 días hábiles',
      personalizable,
      personalization_hint: personalizationHint.trim() || null,
      shipping_height_cm: shippingHeight ? Number(shippingHeight) : null,
      shipping_width_cm: shippingWidth ? Number(shippingWidth) : null,
      shipping_length_cm: shippingLength ? Number(shippingLength) : null,
      shipping_weight_g: shippingWeight ? Math.round(Number(shippingWeight)) : null,
      packaging_cost: packagingCost ? Number(packagingCost) : 0,
      cost: privateCost ? Number(privateCost) : null,
      cost_breakdown: costBreakdown,
    }

    let error
    if (editingId) {
      const { slug: _ignored, ...updatePayload } = payload
      const res = await supabase.from('products').update(updatePayload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('products').insert({
        ...payload,
        sort_order: products.length + 1,
      })
      error = res.error
    }

    setSaving(false)
    if (error) {
      toast.error('Error al guardar el producto: ' + error.message)
      return
    }

    toast.success(editingId ? 'Producto actualizado.' : 'Producto creado.')
    setModalOpen(false)
    loadData()
  }

  const toggleLabel = (lbl: string) => {
    setLabels((prev) => (prev.includes(lbl) ? prev.filter((l) => l !== lbl) : [...prev, lbl]))
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-black text-copas-marino">Productos</h1>
          <p className="text-sm text-copas-plata-oscuro">{products.length} productos cargados</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} /> Nuevo producto
        </Button>
      </div>

      <input
        type="search"
        placeholder="Buscar producto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:max-w-sm border-2 border-copas-plata rounded-xl px-4 py-2.5 bg-white text-copas-marino focus:outline-none focus:border-copas-azul"
      />

      {/* Lista responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredProducts.map((p) => {
          const photo = p.photos?.[p.main_photo_index] || p.photos?.[0] || PLACEHOLDER_IMAGE
          const price = p.variants?.[0]?.price || 0
          return (
            <div
              key={p.id}
              className="bg-white rounded-card border border-copas-plata p-3.5 flex gap-3 items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={p.name}
                className="w-16 h-16 rounded-lg object-cover bg-copas-crema shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-heading font-bold text-copas-marino text-sm truncate">
                    {p.name}
                  </p>
                  {p.featured && <Star size={14} className="text-copas-dorado fill-copas-dorado shrink-0" />}
                </div>
                <p className="text-xs text-copas-plata-oscuro">
                  {(p.category as Category | undefined)?.name || 'Sin categoría'} ·{' '}
                  <strong className="text-copas-azul">{formatPrice(price)}</strong>
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span
                    className={`flex items-center gap-1 font-semibold ${
                      p.visible ? 'text-copas-verde' : 'text-copas-plata-oscuro'
                    }`}
                  >
                    {p.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    {p.visible ? 'Visible' : 'Oculto'}
                  </span>
                  {p.cost ? (
                    <span className="text-copas-plata-oscuro">· Costo: {formatPrice(p.cost)}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-lg hover:bg-copas-crema text-copas-azul"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicate(p)}
                  className="p-2 rounded-lg hover:bg-copas-crema text-copas-marino"
                  title="Duplicar"
                >
                  <Copy size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  className="p-2 rounded-lg hover:bg-red-50 text-copas-rojo"
                  title="Borrar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Crear/Editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar producto' : 'Nuevo producto'}
        size="xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Nombre del producto *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Categoría"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Sin categoría"
            />
            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              options={[
                { value: 'disponible', label: 'Disponible' },
                { value: 'a_pedido', label: 'A pedido' },
                { value: 'agotado', label: 'Agotado' },
              ]}
            />
          </div>

          <div>
            <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border-2 border-copas-plata rounded-lg p-3 text-sm text-copas-marino focus:outline-none focus:border-copas-azul"
            />
          </div>

          {/* Fotos */}
          <div className="border border-copas-plata rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-heading font-bold text-copas-marino">Fotos</span>
              <label className="cursor-pointer bg-copas-azul text-white px-3 py-1.5 rounded-lg text-xs font-heading font-bold hover:bg-copas-marino">
                {uploadingPhoto ? 'Subiendo...' : '+ Subir fotos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      mainPhotoIndex === idx ? 'border-copas-dorado' : 'border-copas-plata'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMainPhotoIndex(idx)}
                      className="absolute bottom-0 inset-x-0 bg-copas-marino/80 text-white text-[10px] py-0.5 text-center"
                    >
                      {mainPhotoIndex === idx ? '★ Principal' : 'Hacer principal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 bg-copas-rojo text-white rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tamaños y precios */}
          <div className="border border-copas-plata rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-heading font-bold text-copas-marino">
                Tamaños y precios
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCalcOpen(true)}
                >
                  <Calculator size={14} /> Abrir calculadora
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setVariants((prev) => [
                      ...prev,
                      { id: `v${Date.now()}`, size: '', price: 0 },
                    ])
                  }
                >
                  + Tamaño
                </Button>
              </div>
            </div>
            {variants.map((v, i) => (
              <div key={v.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Ej: 10 cm"
                  value={v.size}
                  onChange={(e) => {
                    const copy = [...variants]
                    copy[i].size = e.target.value
                    setVariants(copy)
                  }}
                  className="flex-1 border border-copas-plata rounded-lg px-3 py-1.5 text-sm"
                />
                <input
                  type="number"
                  placeholder="Precio $"
                  value={v.price}
                  onChange={(e) => {
                    const copy = [...variants]
                    copy[i].price = Number(e.target.value)
                    setVariants(copy)
                  }}
                  className="w-28 border border-copas-plata rounded-lg px-3 py-1.5 text-sm"
                />
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-copas-rojo p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Colores (separados por coma)"
              value={colorsText}
              onChange={(e) => setColorsText(e.target.value)}
            />
            <Input
              label="Tiempo de entrega estimado"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
            />
          </div>

          {/* Etiquetas */}
          <div>
            <span className="text-sm font-heading font-semibold text-copas-marino block mb-1.5">
              Etiquetas
            </span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LABELS.map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => toggleLabel(lbl)}
                  className={`px-3 py-1 rounded-full text-xs font-heading font-bold border ${
                    labels.includes(lbl)
                      ? 'bg-copas-azul text-white border-copas-azul'
                      : 'bg-white text-copas-marino border-copas-plata'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4 py-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-copas-marino cursor-pointer">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                className="w-4 h-4 accent-copas-azul"
              />
              Visible en la tienda
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-copas-marino cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 accent-copas-dorado"
              />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-copas-marino cursor-pointer">
              <input
                type="checkbox"
                checked={personalizable}
                onChange={(e) => setPersonalizable(e.target.checked)}
                className="w-4 h-4 accent-copas-azul"
              />
              Personalizable
            </label>
          </div>

          {personalizable && (
            <Input
              label="Indicación para personalizar (opcional)"
              value={personalizationHint}
              onChange={(e) => setPersonalizationHint(e.target.value)}
              placeholder="Ej: Escribí el nombre o frase que querés grabar."
            />
          )}

          <Input
            label="Temporada (opcional, ej: Navidad)"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />

          {/* Envío y Costo Privado */}
          <div className="border-t border-copas-plata pt-3 space-y-3">
            <p className="text-sm font-heading font-bold text-copas-marino">
              Datos de envío y costo privado (solo admin)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Input
                label="Alto (cm)"
                type="number"
                step="0.1"
                value={shippingHeight}
                onChange={(e) => setShippingHeight(e.target.value)}
              />
              <Input
                label="Ancho (cm)"
                type="number"
                step="0.1"
                value={shippingWidth}
                onChange={(e) => setShippingWidth(e.target.value)}
              />
              <Input
                label="Largo (cm)"
                type="number"
                step="0.1"
                value={shippingLength}
                onChange={(e) => setShippingLength(e.target.value)}
              />
              <Input
                label="Peso (gramos)"
                type="number"
                value={shippingWeight}
                onChange={(e) => setShippingWeight(e.target.value)}
              />
              <Input
                label="Costo packaging ($)"
                type="number"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
              />
              <Input
                label="Costo privado ($)"
                type="number"
                value={privateCost}
                onChange={(e) => setPrivateCost(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {editingId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Calculadora */}
      <Modal
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        title="Calculadora de precios"
        size="xl"
      >
        <PriceCalculator
          onApplyPrice={(suggested, cost, breakdown) => {
            setPrivateCost(String(cost))
            setCostBreakdown(breakdown)
            if (variants.length > 0) {
              const copy = [...variants]
              copy[0].price = suggested
              setVariants(copy)
            }
            setCalcOpen(false)
            toast.success(`Precio (${formatPrice(suggested)}) y costo aplicados al producto.`)
          }}
        />
      </Modal>
    </div>
  )
}
