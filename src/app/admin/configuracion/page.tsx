'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BusinessConfig, Category, Transporte, ARGENTINA_PROVINCES } from '@/types'
import { compressImageFile } from '@/lib/image-compress'
import { slugify } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { Download, Upload, Plus, Trash2 } from 'lucide-react'

export default function AdminConfiguracionPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [postalCodesText, setPostalCodesText] = useState('7620')

  // Categorías
  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('✨')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [cfgRes, catRes] = await Promise.all([
      supabase.from('business_config').select('*').single(),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    if (cfgRes.data) {
      const c = cfgRes.data as BusinessConfig
      setConfig(c)
      setPostalCodesText((c.local_postal_codes || ['7620']).join(', '))
    }
    if (catRes.data) setCategories(catRes.data as Category[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return
    setSaving(true)

    const postalCodesArray = postalCodesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const { error } = await supabase
      .from('business_config')
      .update({
        ...config,
        local_postal_codes: postalCodesArray,
      })
      .eq('id', config.id)

    setSaving(false)
    if (error) toast.error('Error al guardar configuración.')
    else toast.success('Configuración guardada.')
  }

  const handleUploadImage = async (
    file: File,
    bucket: 'logos' | 'banners',
    field: 'logo_url' | 'banner_image_url'
  ) => {
    if (!config) return
    const compressed = await compressImageFile(file, 1200, 0.85)
    const fileName = `${field}_${Date.now()}.webp`
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, compressed)
    if (error || !data) {
      toast.error('Error subiendo imagen.')
      return
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)
    setConfig({ ...config, [field]: publicUrl })
    toast.success('Imagen subida. Recordá guardar la configuración.')
  }

  const updateTransporte = (id: string, patch: Partial<Transporte>) => {
    if (!config) return
    setConfig({
      ...config,
      transportes: (config.transportes || []).map((t) =>
        t.id === id ? { ...t, ...patch } : t
      ),
    })
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    const { error } = await supabase.from('categories').insert({
      name: newCatName.trim(),
      slug: `${slugify(newCatName)}-${Date.now().toString().slice(-3)}`,
      icon: newCatIcon || '✨',
      sort_order: categories.length + 1,
    })
    if (error) toast.error('No se pudo crear la categoría.')
    else {
      setNewCatName('')
      toast.success('Categoría creada.')
      loadData()
    }
  }

  const handleRenameCategory = async (cat: Category, newName: string) => {
    await supabase.from('categories').update({ name: newName }).eq('id', cat.id)
    loadData()
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Borrar esta categoría?')) return
    await supabase.from('categories').delete().eq('id', id)
    loadData()
  }

  // Copia de seguridad JSON
  const handleDownloadBackup = async () => {
    const [cfg, cats, prods, ords, reqs, incs, exps, wits, calc] = await Promise.all([
      supabase.from('business_config').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('products').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('custom_requests').select('*'),
      supabase.from('income_entries').select('*'),
      supabase.from('expense_entries').select('*'),
      supabase.from('withdrawals').select('*'),
      supabase.from('calculator_defaults').select('*'),
    ])
    const backup = {
      exported_at: new Date().toISOString(),
      business_config: cfg.data || [],
      categories: cats.data || [],
      products: prods.data || [],
      orders: ords.data || [],
      custom_requests: reqs.data || [],
      income_entries: incs.data || [],
      expense_entries: exps.data || [],
      withdrawals: wits.data || [],
      calculator_defaults: calc.data || [],
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `3DCopas-Backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Copia de seguridad descargada.')
  }

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('¿Seguro que querés restaurar esta copia? Se actualizarán los registros existentes.')) {
      return
    }
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.categories?.length) await supabase.from('categories').upsert(data.categories)
      if (data.products?.length) await supabase.from('products').upsert(data.products)
      if (data.orders?.length) await supabase.from('orders').upsert(data.orders)
      if (data.custom_requests?.length)
        await supabase.from('custom_requests').upsert(data.custom_requests)
      if (data.income_entries?.length)
        await supabase.from('income_entries').upsert(data.income_entries)
      if (data.expense_entries?.length)
        await supabase.from('expense_entries').upsert(data.expense_entries)
      if (data.withdrawals?.length) await supabase.from('withdrawals').upsert(data.withdrawals)
      if (data.business_config?.length)
        await supabase.from('business_config').upsert(data.business_config)
      toast.success('Copia de seguridad restaurada correctamente.')
      loadData()
    } catch {
      toast.error('Archivo de copia inválido.')
    }
    e.target.value = ''
  }

  if (loading || !config) return <LoadingSpinner />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-black text-copas-marino">
          Configuración del negocio
        </h1>
        <p className="text-sm text-copas-plata-oscuro">
          Logo, redes, zona local de Balcarce, transportes, políticas y copia de seguridad.
        </p>
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-6">
        {/* Identidad y Logo */}
        <section className="bg-white rounded-card border border-copas-plata p-5 space-y-4">
          <h2 className="font-heading font-bold text-copas-marino">Identidad y redes</h2>
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={config.logo_url || '/logo-3d-copas.png'}
              alt="Logo actual"
              className="h-16 w-auto rounded-lg border border-copas-plata object-contain bg-white p-1"
            />
            <label className="cursor-pointer bg-copas-crema border border-copas-plata px-3 py-2 rounded-lg text-xs font-heading font-bold text-copas-marino hover:border-copas-azul">
              Cambiar logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleUploadImage(e.target.files[0], 'logos', 'logo_url')
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombre del negocio"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
            <Input
              label="Eslogan"
              value={config.slogan || ''}
              onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
            />
            <Input
              label="WhatsApp (ej: 542266123456)"
              value={config.whatsapp || ''}
              onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
            />
            <Input
              label="Email"
              value={config.email || ''}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
            />
            <Input
              label="Instagram (usuario o URL)"
              value={config.instagram || ''}
              onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
            />
            <Input
              label="TikTok (usuario o URL)"
              value={config.tiktok || ''}
              onChange={(e) => setConfig({ ...config, tiktok: e.target.value })}
            />
            <Input
              label="Facebook"
              value={config.facebook || ''}
              onChange={(e) => setConfig({ ...config, facebook: e.target.value })}
            />
          </div>
        </section>

        {/* Zona local */}
        <section className="bg-white rounded-card border border-copas-plata p-5 space-y-4">
          <h2 className="font-heading font-bold text-copas-marino">
            Zona de entrega local (sin costo de envío y con efectivo)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Provincia local"
              value={config.local_province}
              onChange={(e) => setConfig({ ...config, local_province: e.target.value })}
              options={ARGENTINA_PROVINCES.map((p) => ({ value: p, label: p }))}
            />
            <Input
              label="Ciudad local"
              value={config.local_city}
              onChange={(e) => setConfig({ ...config, local_city: e.target.value })}
            />
            <Input
              label="Códigos postales (separados por coma)"
              value={postalCodesText}
              onChange={(e) => setPostalCodesText(e.target.value)}
            />
          </div>
        </section>

        {/* Transportes */}
        <section className="bg-white rounded-card border border-copas-plata p-5 space-y-4">
          <h2 className="font-heading font-bold text-copas-marino">Transportes y umbrales</h2>
          <div className="space-y-3">
            {(config.transportes || []).map((t) => (
              <div
                key={t.id}
                className="border border-copas-plata rounded-xl p-3 space-y-2 bg-copas-crema/40"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-heading font-bold text-copas-marino cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t.active}
                      onChange={(e) => updateTransporte(t.id, { active: e.target.checked })}
                      className="w-4 h-4 accent-copas-azul"
                    />
                    {t.name}
                  </label>
                </div>
                <Input
                  label="Link de seguimiento"
                  value={t.tracking_url || ''}
                  onChange={(e) => updateTransporte(t.id, { tracking_url: e.target.value })}
                />
                {t.id === 'garmendia' && (
                  <Input
                    label="Aviso visible para Garmendia"
                    value={t.warning || ''}
                    onChange={(e) => updateTransporte(t.id, { warning: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Input
              label="Umbral de peso para sugerir Garmendia (gramos)"
              type="number"
              value={config.garmendia_weight_threshold}
              onChange={(e) =>
                setConfig({ ...config, garmendia_weight_threshold: Number(e.target.value) })
              }
            />
            <Input
              label="Umbral de cantidad de bultos para Garmendia"
              type="number"
              value={config.garmendia_bultos_threshold}
              onChange={(e) =>
                setConfig({ ...config, garmendia_bultos_threshold: Number(e.target.value) })
              }
            />
          </div>
        </section>

        {/* Datos para transferencia */}
        <section className="bg-white rounded-card border border-copas-plata p-5 space-y-3">
          <h2 className="font-heading font-bold text-copas-marino">Datos para transferencia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Titular"
              value={config.payment_holder || ''}
              onChange={(e) => setConfig({ ...config, payment_holder: e.target.value })}
            />
            <Input
              label="Alias"
              value={config.payment_alias || ''}
              onChange={(e) => setConfig({ ...config, payment_alias: e.target.value })}
            />
            <Input
              label="CBU / CVU"
              value={config.payment_cbu || ''}
              onChange={(e) => setConfig({ ...config, payment_cbu: e.target.value })}
            />
          </div>
        </section>

        {/* Banner de temporada y textos */}
        <section className="bg-white rounded-card border border-copas-plata p-5 space-y-4">
          <h2 className="font-heading font-bold text-copas-marino">
            Banner de temporada y políticas
          </h2>
          <label className="flex items-center gap-2 font-heading font-bold text-sm text-copas-marino cursor-pointer">
            <input
              type="checkbox"
              checked={config.banner_active}
              onChange={(e) => setConfig({ ...config, banner_active: e.target.checked })}
              className="w-4 h-4 accent-copas-azul"
            />
            Mostrar banner de temporada en la tienda
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Título del banner"
              value={config.banner_title || ''}
              onChange={(e) => setConfig({ ...config, banner_title: e.target.value })}
            />
            <Input
              label="Subtítulo"
              value={config.banner_subtitle || ''}
              onChange={(e) => setConfig({ ...config, banner_subtitle: e.target.value })}
            />
            <Input
              label="Texto del botón"
              value={config.banner_button_text || ''}
              onChange={(e) => setConfig({ ...config, banner_button_text: e.target.value })}
            />
            <Input
              label="Enlace del botón"
              value={config.banner_button_url || ''}
              onChange={(e) => setConfig({ ...config, banner_button_url: e.target.value })}
            />
          </div>
          <div>
            <label className="cursor-pointer inline-block bg-copas-crema border border-copas-plata px-3 py-2 rounded-lg text-xs font-heading font-bold text-copas-marino">
              Subir imagen de fondo del banner
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleUploadImage(e.target.files[0], 'banners', 'banner_image_url')
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2">
            <div>
              <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
                Política de arrepentimiento
              </label>
              <textarea
                rows={2}
                value={config.returns_policy || ''}
                onChange={(e) => setConfig({ ...config, returns_policy: e.target.value })}
                className="w-full border-2 border-copas-plata rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
                Política de cambios
              </label>
              <textarea
                rows={2}
                value={config.exchange_policy || ''}
                onChange={(e) => setConfig({ ...config, exchange_policy: e.target.value })}
                className="w-full border-2 border-copas-plata rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
                Tiempos de entrega
              </label>
              <textarea
                rows={2}
                value={config.delivery_times_text || ''}
                onChange={(e) => setConfig({ ...config, delivery_times_text: e.target.value })}
                className="w-full border-2 border-copas-plata rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Color principal"
              type="color"
              value={config.color_primary}
              onChange={(e) => setConfig({ ...config, color_primary: e.target.value })}
            />
            <Input
              label="Color secundario"
              type="color"
              value={config.color_secondary}
              onChange={(e) => setConfig({ ...config, color_secondary: e.target.value })}
            />
            <Input
              label="Color acento"
              type="color"
              value={config.color_accent}
              onChange={(e) => setConfig({ ...config, color_accent: e.target.value })}
            />
          </div>
        </section>

        <Button type="submit" size="lg" loading={saving} className="w-full sm:w-auto">
          Guardar configuración
        </Button>
      </form>

      {/* Categorías */}
      <section className="bg-white rounded-card border border-copas-plata p-5 space-y-4">
        <h2 className="font-heading font-bold text-copas-marino">Categorías del catálogo</h2>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span className="text-lg">{cat.icon || '✨'}</span>
              <input
                type="text"
                defaultValue={cat.name}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== cat.name) {
                    handleRenameCategory(cat, e.target.value.trim())
                  }
                }}
                className="flex-1 border border-copas-plata rounded-lg px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id)}
                className="p-2 text-copas-rojo hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            className="w-14 border border-copas-plata rounded-lg px-2 py-2 text-center"
          />
          <input
            type="text"
            placeholder="Nueva categoría..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 border border-copas-plata rounded-lg px-3 py-2 text-sm"
          />
          <Button type="button" size="sm" onClick={handleAddCategory}>
            <Plus size={16} /> Agregar
          </Button>
        </div>
      </section>

      {/* Copia de seguridad */}
      <section className="bg-white rounded-card border border-copas-plata p-5 space-y-3">
        <h2 className="font-heading font-bold text-copas-marino">Copia de seguridad</h2>
        <p className="text-xs text-copas-plata-oscuro">
          Descargá un respaldo completo de tus productos, pedidos, consultas, contabilidad y
          configuración en formato JSON, o restauralo cuando lo necesites.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleDownloadBackup}>
            <Download size={16} /> Descargar copia de seguridad
          </Button>
          <label className="cursor-pointer inline-flex items-center gap-2 bg-copas-marino text-white px-4 py-2.5 rounded-lg font-heading font-bold text-sm hover:bg-copas-azul transition-colors">
            <Upload size={16} /> Restaurar copia
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleRestoreBackup}
            />
          </label>
        </div>
      </section>
    </div>
  )
}
