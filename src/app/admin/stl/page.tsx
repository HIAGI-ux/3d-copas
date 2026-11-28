'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StlFile } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import StlPreviewModal from '@/components/admin/StlPreviewModal'
import toast from 'react-hot-toast'
import {
  Box,
  Upload,
  Folder,
  FolderPlus,
  Search,
  Star,
  Download,
  Eye,
  Edit2,
  Trash2,
  Clock,
  Scale,
  Layers,
  Link2,
  FileCode2,
  AlertTriangle,
} from 'lucide-react'

const DEFAULT_FOLDERS = [
  'Cortantes',
  'Sellos',
  'Luces',
  'Llaveros',
  'Decoración',
  'Pedidos personalizados',
  'Sin clasificar',
]

const MATERIALS = ['PLA', 'PETG', 'TPU', 'ABS', 'Resina', 'Otro']

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatMinutes(mins?: number | null): string {
  if (!mins || mins <= 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h}h ${m}m`
}

function cleanFileTitle(filename: string): string {
  return filename
    .replace(/\.(stl|3mf|obj|zip)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()
}

export default function AdminStlPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [needsMigration, setNeedsMigration] = useState(false)
  const [files, setFiles] = useState<StlFile[]>([])
  const [products, setProducts] = useState<{ id: string; name: string; slug: string }[]>([])

  // Filtros
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('ALL')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size' | 'time'>('recent')

  // Subida
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  // Form subida / edición
  const [editingFile, setEditingFile] = useState<StlFile | null>(null)
  const [formName, setFormName] = useState('')
  const [formFolder, setFormFolder] = useState('Cortantes')
  const [customFolder, setCustomFolder] = useState('')
  const [formMaterial, setFormMaterial] = useState('PLA')
  const [formTime, setFormTime] = useState('')
  const [formGrams, setFormGrams] = useState('')
  const [formLayer, setFormLayer] = useState('0.20mm')
  const [formInfill, setFormInfill] = useState('15')
  const [formSupports, setFormSupports] = useState(false)
  const [formProductId, setFormProductId] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Vista 3D
  const [previewFile, setPreviewFile] = useState<StlFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [stlRes, prodRes] = await Promise.all([
      supabase
        .from('stl_files')
        .select('*, product:products(id, name, slug)')
        .order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, slug').order('name'),
    ])

    if (stlRes.error) {
      if (
        stlRes.error.message.includes('does not exist') ||
        stlRes.error.code === '42P01'
      ) {
        setNeedsMigration(true)
      } else {
        toast.error('Error cargando archivos STL: ' + stlRes.error.message)
      }
    } else {
      setNeedsMigration(false)
      setFiles((stlRes.data || []) as StlFile[])
    }

    if (prodRes.data) {
      setProducts(prodRes.data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Carpetas disponibles (default + las que existan en la BD)
  const allFolders = useMemo(() => {
    const set = new Set<string>(DEFAULT_FOLDERS)
    files.forEach((f) => {
      if (f.folder) set.add(f.folder)
    })
    return Array.from(set)
  }, [files])

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    files.forEach((f) => {
      const key = f.folder || 'Sin clasificar'
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [files])

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = files.filter((f) => {
      if (selectedFolder !== 'ALL' && f.folder !== selectedFolder) return false
      if (filterMaterial !== 'ALL' && (f.material || 'PLA') !== filterMaterial) return false
      if (onlyFavorites && !f.favorite) return false
      if (q) {
        const hay = [
          f.name,
          f.file_name,
          f.folder,
          f.notes || '',
          f.product?.name || '',
          ...(f.tags || []),
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'size') return (b.file_size_bytes || 0) - (a.file_size_bytes || 0)
      if (sortBy === 'time') return (a.print_time_minutes || 999999) - (b.print_time_minutes || 999999)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return list
  }, [files, selectedFolder, filterMaterial, onlyFavorites, search, sortBy])

  const totalSizeMB = useMemo(() => {
    const total = files.reduce((acc, f) => acc + (f.file_size_bytes || 0), 0)
    return (total / (1024 * 1024)).toFixed(1)
  }, [files])

  const favoritesCount = useMemo(() => files.filter((f) => f.favorite).length, [files])

  const openUploadModal = (initialFiles?: File[]) => {
    setPendingFiles(initialFiles || [])
    setFormName(initialFiles && initialFiles.length === 1 ? cleanFileTitle(initialFiles[0].name) : '')
    setFormFolder(selectedFolder !== 'ALL' ? selectedFolder : 'Cortantes')
    setCustomFolder('')
    setFormMaterial('PLA')
    setFormTime('')
    setFormGrams('')
    setFormLayer('0.20mm')
    setFormInfill('15')
    setFormSupports(false)
    setFormProductId('')
    setFormTags('')
    setFormNotes('')
    setUploadModalOpen(true)
  }

  const handleFileInput = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const valid = Array.from(fileList).filter((f) =>
      /\.(stl|3mf|obj|zip)$/i.test(f.name)
    )
    if (valid.length === 0) {
      toast.error('Solo podés subir archivos .stl, .3mf, .obj o .zip')
      return
    }
    if (valid.length < fileList.length) {
      toast('Algunos archivos fueron omitidos porque no son .stl / .3mf / .obj / .zip')
    }
    setPendingFiles((prev) => [...prev, ...valid])
    if (!formName && valid.length === 1 && pendingFiles.length === 0) {
      setFormName(cleanFileTitle(valid[0].name))
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pendingFiles.length === 0) {
      toast.error('Elegí al menos un archivo para subir.')
      return
    }

    const targetFolder = (customFolder.trim() || formFolder || 'Sin clasificar').trim()
    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    setUploading(true)
    let okCount = 0

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i]
      setUploadProgress(`Subiendo ${i + 1} de ${pendingFiles.length}: ${file.name}`)

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const folderSlug = targetFolder.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'general'
      const storagePath = `${folderSlug}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('stl-files')
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (uploadError) {
        toast.error(`Error subiendo ${file.name}: ${uploadError.message}`)
        continue
      }

      const displayName =
        pendingFiles.length === 1 && formName.trim()
          ? formName.trim()
          : cleanFileTitle(file.name)

      const { error: dbError } = await supabase.from('stl_files').insert({
        name: displayName,
        folder: targetFolder,
        file_name: file.name,
        file_path: storagePath,
        file_size_bytes: file.size,
        product_id: formProductId || null,
        material: formMaterial,
        print_time_minutes: formTime ? parseInt(formTime, 10) : null,
        filament_grams: formGrams ? parseFloat(formGrams) : null,
        layer_height: formLayer.trim() || '0.20mm',
        infill_pct: formInfill ? parseInt(formInfill, 10) : 15,
        supports: formSupports,
        notes: formNotes.trim() || null,
        tags: tagsArray,
        favorite: false,
      })

      if (dbError) {
        toast.error(`Error guardando ${file.name}: ${dbError.message}`)
        // Limpiar archivo huérfano si falló la BD
        await supabase.storage.from('stl-files').remove([storagePath])
        continue
      }

      okCount++
    }

    setUploading(false)
    setUploadProgress('')

    if (okCount > 0) {
      toast.success(
        okCount === 1 ? 'Archivo guardado correctamente.' : `${okCount} archivos guardados.`
      )
      setUploadModalOpen(false)
      setPendingFiles([])
      loadData()
    }
  }

  const openEditModal = (file: StlFile) => {
    setEditingFile(file)
    setFormName(file.name)
    setFormFolder(file.folder || 'Sin clasificar')
    setCustomFolder('')
    setFormMaterial(file.material || 'PLA')
    setFormTime(file.print_time_minutes ? String(file.print_time_minutes) : '')
    setFormGrams(file.filament_grams ? String(file.filament_grams) : '')
    setFormLayer(file.layer_height || '0.20mm')
    setFormInfill(file.infill_pct !== null && file.infill_pct !== undefined ? String(file.infill_pct) : '15')
    setFormSupports(Boolean(file.supports))
    setFormProductId(file.product_id || '')
    setFormTags((file.tags || []).join(', '))
    setFormNotes(file.notes || '')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFile || !formName.trim()) return

    const targetFolder = (customFolder.trim() || formFolder || 'Sin clasificar').trim()
    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    setSavingEdit(true)
    const { error } = await supabase
      .from('stl_files')
      .update({
        name: formName.trim(),
        folder: targetFolder,
        product_id: formProductId || null,
        material: formMaterial,
        print_time_minutes: formTime ? parseInt(formTime, 10) : null,
        filament_grams: formGrams ? parseFloat(formGrams) : null,
        layer_height: formLayer.trim() || '0.20mm',
        infill_pct: formInfill ? parseInt(formInfill, 10) : 15,
        supports: formSupports,
        notes: formNotes.trim() || null,
        tags: tagsArray,
      })
      .eq('id', editingFile.id)

    setSavingEdit(false)
    if (error) {
      toast.error('No se pudo actualizar: ' + error.message)
      return
    }
    toast.success('Cambios guardados.')
    setEditingFile(null)
    loadData()
  }

  const toggleFavorite = async (file: StlFile) => {
    const next = !file.favorite
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, favorite: next } : f)))
    const { error } = await supabase
      .from('stl_files')
      .update({ favorite: next })
      .eq('id', file.id)
    if (error) {
      toast.error('Error actualizando favorito')
      loadData()
    }
  }

  const handleDownload = async (file: StlFile) => {
    const { data, error } = await supabase.storage
      .from('stl-files')
      .createSignedUrl(file.file_path, 300, { download: file.file_name })
    if (error || !data?.signedUrl) {
      toast.error('No se pudo generar el link de descarga.')
      return
    }
    const a = document.createElement('a')
    a.href = data.signedUrl
    a.download = file.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handlePreview = async (file: StlFile) => {
    const { data, error } = await supabase.storage
      .from('stl-files')
      .createSignedUrl(file.file_path, 600)
    if (error || !data?.signedUrl) {
      toast.error('No se pudo abrir la vista previa.')
      return
    }
    setPreviewFile(file)
    setPreviewUrl(data.signedUrl)
  }

  const handleDelete = async (file: StlFile) => {
    if (!confirm(`¿Seguro que querés eliminar "${file.name}" (${file.file_name})?`)) return
    const { error: storageErr } = await supabase.storage
      .from('stl-files')
      .remove([file.file_path])
    if (storageErr) {
      toast.error('Error borrando archivo: ' + storageErr.message)
    }
    const { error: dbErr } = await supabase.from('stl_files').delete().eq('id', file.id)
    if (dbErr) {
      toast.error('Error borrando registro: ' + dbErr.message)
      return
    }
    toast.success('Archivo eliminado.')
    setFiles((prev) => prev.filter((f) => f.id !== file.id))
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner />
        <p className="text-sm text-copas-plata-oscuro">Cargando biblioteca STL...</p>
      </div>
    )
  }

  if (needsMigration) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border-2 border-amber-300 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={28} />
          <div>
            <h1 className="font-heading text-xl font-bold text-copas-marino">
              Falta activar la tabla de archivos STL en Supabase
            </h1>
            <p className="text-sm text-copas-plata-oscuro mt-1">
              Para empezar a guardar y organizar tus archivos STL de forma privada, tenés que
              ejecutar el script SQL una sola vez.
            </p>
          </div>
        </div>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-copas-marino mb-6">
          <li>Abrí tu proyecto en <strong>Supabase → SQL Editor</strong>.</li>
          <li>
            Copiá el contenido del archivo <code className="bg-slate-100 px-1.5 py-0.5 rounded">supabase/migracion_stl.sql</code>.
          </li>
          <li>Pegalo en el SQL Editor y tocá <strong>Run</strong>.</li>
          <li>Volvé acá y recargá la página.</li>
        </ol>
        <Button onClick={loadData}>Ya lo ejecuté, recargar</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-copas-marino flex items-center gap-2.5">
            <Box className="text-copas-azul" size={28} /> Organizador de Archivos STL
          </h1>
          <p className="text-sm text-copas-plata-oscuro mt-1">
            Guardá tus modelos 3D en carpetas, anotá tiempos, gramos y vinculalos con productos de la tienda.
          </p>
        </div>
        <Button onClick={() => openUploadModal()}>
          <Upload size={18} /> Subir STL / 3MF
        </Button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-copas-plata/60 shadow-sm">
          <p className="text-xs text-copas-plata-oscuro font-semibold">Total de modelos</p>
          <p className="font-heading text-2xl font-black text-copas-marino mt-1">{files.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-copas-plata/60 shadow-sm">
          <p className="text-xs text-copas-plata-oscuro font-semibold">Carpetas activas</p>
          <p className="font-heading text-2xl font-black text-copas-azul mt-1">
            {Object.keys(folderCounts).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-copas-plata/60 shadow-sm">
          <p className="text-xs text-copas-plata-oscuro font-semibold">Favoritos</p>
          <p className="font-heading text-2xl font-black text-amber-500 mt-1">{favoritesCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-copas-plata/60 shadow-sm">
          <p className="text-xs text-copas-plata-oscuro font-semibold">Espacio usado</p>
          <p className="font-heading text-2xl font-black text-copas-marino mt-1">{totalSizeMB} MB</p>
        </div>
      </div>

      {/* Zona rápida de Drop para subir directo */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          const dropped = Array.from(e.dataTransfer.files).filter((f) =>
            /\.(stl|3mf|obj|zip)$/i.test(f.name)
          )
          if (dropped.length > 0) {
            openUploadModal(dropped)
          } else {
            toast.error('Arrastrá archivos .stl, .3mf, .obj o .zip')
          }
        }}
        className={`rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
          dragActive
            ? 'border-copas-azul bg-blue-50'
            : 'border-copas-plata bg-white/70 hover:border-copas-azul/50'
        }`}
      >
        <p className="text-xs sm:text-sm text-copas-plata-oscuro">
          <strong className="text-copas-marino">Tip:</strong> Arrastrá uno o varios archivos{' '}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">.stl</span> /{' '}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">.3mf</span> acá
          para subirlos directo.
        </p>
      </div>

      {/* Carpetas */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedFolder('ALL')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-heading font-bold transition-all ${
            selectedFolder === 'ALL'
              ? 'bg-copas-azul text-white shadow-sm'
              : 'bg-white text-copas-marino border border-copas-plata hover:border-copas-azul'
          }`}
        >
          <Folder size={14} /> Todos ({files.length})
        </button>
        {allFolders.map((folder) => {
          const count = folderCounts[folder] || 0
          const active = selectedFolder === folder
          return (
            <button
              key={folder}
              type="button"
              onClick={() => setSelectedFolder(folder)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-heading font-bold transition-all ${
                active
                  ? 'bg-copas-azul text-white shadow-sm'
                  : 'bg-white text-copas-marino border border-copas-plata hover:border-copas-azul'
              }`}
            >
              <Folder size={14} /> {folder} ({count})
            </button>
          )
        })}
      </div>

      {/* Buscador y filtros */}
      <div className="bg-white rounded-2xl p-4 border border-copas-plata/60 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-copas-plata-oscuro"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, tag, notas o producto..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-copas-plata text-sm text-copas-marino focus:outline-none focus:border-copas-azul"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterMaterial}
            onChange={(e) => setFilterMaterial(e.target.value)}
            className="px-3 py-2 rounded-xl border border-copas-plata text-xs font-semibold text-copas-marino bg-white focus:outline-none focus:border-copas-azul"
          >
            <option value="ALL">Material: Todos</option>
            {MATERIALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-xl border border-copas-plata text-xs font-semibold text-copas-marino bg-white focus:outline-none focus:border-copas-azul"
          >
            <option value="recent">Más recientes</option>
            <option value="name">Nombre (A-Z)</option>
            <option value="time">Menor tiempo</option>
            <option value="size">Más pesados</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyFavorites((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              onlyFavorites
                ? 'bg-amber-400 text-copas-marino border-amber-400'
                : 'bg-white text-copas-marino border-copas-plata hover:border-amber-400'
            }`}
          >
            <Star size={14} className={onlyFavorites ? 'fill-current' : ''} /> Favoritos
          </button>
        </div>
      </div>

      {/* Lista / Grilla de archivos */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-copas-plata/60 p-12 text-center">
          <Box size={40} className="mx-auto text-copas-plata mb-3" />
          <p className="font-heading font-bold text-copas-marino text-lg">
            {files.length === 0
              ? 'Todavía no subiste ningún archivo STL'
              : 'No hay archivos que coincidan con tu búsqueda'}
          </p>
          <p className="text-sm text-copas-plata-oscuro mt-1 mb-4">
            {files.length === 0
              ? 'Subí tu primer modelo .stl o .3mf para tener todo organizado por carpetas.'
              : 'Probá limpiando los filtros o cambiando de carpeta.'}
          </p>
          {files.length === 0 && (
            <Button onClick={() => openUploadModal()}>
              <Upload size={16} /> Subir primer archivo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFiles.map((file) => {
            const ext = file.file_name.split('.').pop()?.toUpperCase() || 'STL'
            return (
              <div
                key={file.id}
                className="bg-white rounded-2xl border border-copas-plata/70 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 bg-copas-azul/10 text-copas-azul font-mono font-bold text-[11px] px-2 py-1 rounded-lg">
                        .{ext}
                      </span>
                      <span className="text-[11px] bg-slate-100 text-copas-plata-oscuro px-2 py-0.5 rounded-full truncate">
                        {file.folder}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(file)}
                      title={file.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                      className="text-amber-400 hover:scale-110 transition-transform shrink-0"
                    >
                      <Star
                        size={18}
                        className={file.favorite ? 'fill-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  </div>

                  {/* Título */}
                  <h3 className="font-heading font-bold text-copas-marino text-base mt-2.5 leading-snug">
                    {file.name}
                  </h3>
                  <p className="text-[11px] text-copas-plata-oscuro font-mono truncate mt-0.5">
                    {file.file_name} · {formatBytes(file.file_size_bytes)}
                  </p>

                  {/* Parámetros de impresión */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3 text-[11px]">
                    <div className="bg-slate-50 rounded-lg px-2 py-1.5 flex items-center gap-1 text-copas-marino">
                      <Clock size={12} className="text-copas-azul shrink-0" />
                      <span className="truncate">{formatMinutes(file.print_time_minutes)}</span>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-2 py-1.5 flex items-center gap-1 text-copas-marino">
                      <Scale size={12} className="text-copas-azul shrink-0" />
                      <span className="truncate">
                        {file.filament_grams ? `${file.filament_grams} g` : '—'}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-2 py-1.5 flex items-center gap-1 text-copas-marino">
                      <Layers size={12} className="text-copas-azul shrink-0" />
                      <span className="truncate">{file.material || 'PLA'}</span>
                    </div>
                  </div>

                  {/* Detalles extra */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5 text-[11px]">
                    {file.layer_height && (
                      <span className="bg-blue-50 text-copas-azul px-2 py-0.5 rounded-md font-semibold">
                        Capa {file.layer_height}
                      </span>
                    )}
                    {file.infill_pct !== null && file.infill_pct !== undefined && (
                      <span className="bg-slate-100 text-copas-marino px-2 py-0.5 rounded-md">
                        Relleno {file.infill_pct}%
                      </span>
                    )}
                    {file.supports && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                        Con soportes
                      </span>
                    )}
                  </div>

                  {/* Producto vinculado */}
                  {file.product && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                      <Link2 size={13} className="shrink-0" />
                      <span className="truncate font-semibold">{file.product.name}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {file.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notas */}
                  {file.notes && (
                    <p className="text-xs text-copas-plata-oscuro mt-2 line-clamp-2 italic">
                      &ldquo;{file.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePreview(file)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-copas-azul text-white text-xs font-bold hover:bg-copas-marino transition-colors"
                      title="Ver modelo en 3D"
                    >
                      <Eye size={14} /> Ver 3D
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-copas-marino text-xs font-bold hover:bg-slate-200 transition-colors"
                      title="Descargar archivo"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(file)}
                      className="p-1.5 rounded-lg text-copas-plata-oscuro hover:bg-slate-100 hover:text-copas-azul transition-colors"
                      title="Editar detalles"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      className="p-1.5 rounded-lg text-copas-plata-oscuro hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Eliminar archivo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de subida */}
      <Modal
        open={uploadModalOpen}
        onClose={() => !uploading && setUploadModalOpen(false)}
        title="Subir archivos STL / 3MF"
        size="lg"
      >
        <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
          {/* Selector de archivos */}
          <label className="border-2 border-dashed border-copas-plata rounded-xl p-6 text-center cursor-pointer hover:border-copas-azul transition-colors bg-slate-50">
            <FileCode2 size={32} className="mx-auto text-copas-azul mb-2" />
            <p className="font-heading font-bold text-sm text-copas-marino">
              Tocá acá para elegir archivos (.stl, .3mf, .obj, .zip)
            </p>
            <p className="text-xs text-copas-plata-oscuro mt-1">
              Podés elegir uno o varios archivos a la vez.
            </p>
            <input
              type="file"
              multiple
              accept=".stl,.3mf,.obj,.zip"
              onChange={(e) => handleFileInput(e.target.files)}
              className="hidden"
            />
          </label>

          {pendingFiles.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 max-h-36 overflow-y-auto space-y-1.5">
              {pendingFiles.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-copas-marino truncate">
                    {f.name} ({formatBytes(f.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-red-500 hover:underline ml-2 shrink-0"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingFiles.length <= 1 && (
            <Input
              label="Nombre del modelo (opcional, usa el del archivo si lo dejás vacío)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Cortante Flor Margarita 8cm"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
                Carpeta
              </label>
              <select
                value={formFolder}
                onChange={(e) => setFormFolder(e.target.value)}
                className="w-full border-2 border-copas-plata rounded-lg px-3 py-2 text-sm text-copas-marino focus:outline-none focus:border-copas-azul"
              >
                {allFolders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-heading font-semibold text-copas-marino flex items-center gap-1 mb-1">
                <FolderPlus size={14} /> O crear carpeta nueva
              </label>
              <input
                type="text"
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                placeholder="Ej: Pascuas 2027"
                className="w-full border-2 border-copas-plata rounded-lg px-3 py-2 text-sm text-copas-marino focus:outline-none focus:border-copas-azul"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-heading font-semibold text-copas-marino block mb-1">
                Material
              </label>
              <select
                value={formMaterial}
                onChange={(e) => setFormMaterial(e.target.value)}
                className="w-full border-2 border-copas-plata rounded-lg px-2.5 py-2 text-sm text-copas-marino"
              >
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Tiempo (min)"
              type="number"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              placeholder="Ej: 45"
            />
            <Input
              label="Gramos (g)"
              type="number"
              step="0.1"
              value={formGrams}
              onChange={(e) => setFormGrams(e.target.value)}
              placeholder="Ej: 18.5"
            />
            <Input
              label="Capa"
              value={formLayer}
              onChange={(e) => setFormLayer(e.target.value)}
              placeholder="0.20mm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-heading font-semibold text-copas-marino block mb-1">
                Vincular a producto de la tienda (opcional)
              </label>
              <select
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                className="w-full border-2 border-copas-plata rounded-lg px-3 py-2 text-sm text-copas-marino"
              >
                <option value="">Ninguno</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 pb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-copas-marino cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSupports}
                  onChange={(e) => setFormSupports(e.target.checked)}
                  className="w-4 h-4 accent-copas-azul"
                />
                Lleva soportes
              </label>
            </div>
          </div>

          <Input
            label="Etiquetas separadas por coma (opcional)"
            value={formTags}
            onChange={(e) => setFormTags(e.target.value)}
            placeholder="Ej: flor, 8cm, ceramica, facil"
          />

          <div>
            <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
              Notas de impresión (opcional)
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              placeholder="Ej: Imprimir con brim de 5mm, boquilla 0.4, sin enfriamiento en primeras 3 capas"
              className="w-full border-2 border-copas-plata rounded-lg p-2.5 text-sm text-copas-marino focus:outline-none focus:border-copas-azul resize-none"
            />
          </div>

          {uploadProgress && (
            <p className="text-xs font-semibold text-copas-azul">{uploadProgress}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={() => setUploadModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={uploading}>
              <Upload size={16} /> Guardar {pendingFiles.length > 1 ? `(${pendingFiles.length})` : ''}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de edición */}
      <Modal
        open={Boolean(editingFile)}
        onClose={() => !savingEdit && setEditingFile(null)}
        title="Editar detalles del modelo"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <Input
            label="Nombre del modelo *"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
                Carpeta
              </label>
              <select
                value={formFolder}
                onChange={(e) => setFormFolder(e.target.value)}
                className="w-full border-2 border-copas-plata rounded-lg px-3 py-2 text-sm text-copas-marino"
              >
                {allFolders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-heading font-semibold text-copas-marino flex items-center gap-1 mb-1">
                <FolderPlus size={14} /> O mover a carpeta nueva
              </label>
              <input
                type="text"
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                placeholder="Ej: Día de la Madre"
                className="w-full border-2 border-copas-plata rounded-lg px-3 py-2 text-sm text-copas-marino"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-heading font-semibold text-copas-marino block mb-1">
                Material
              </label>
              <select
                value={formMaterial}
                onChange={(e) => setFormMaterial(e.target.value)}
                className="w-full border-2 border-copas-plata rounded-lg px-2.5 py-2 text-sm text-copas-marino"
              >
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Tiempo (min)"
              type="number"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
            />
            <Input
              label="Gramos (g)"
              type="number"
              step="0.1"
              value={formGrams}
              onChange={(e) => setFormGrams(e.target.value)}
            />
            <Input
              label="Capa"
              value={formLayer}
              onChange={(e) => setFormLayer(e.target.value)}
            />
            <Input
              label="Relleno %"
              type="number"
              value={formInfill}
              onChange={(e) => setFormInfill(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-heading font-semibold text-copas-marino block mb-1">
                Producto vinculado
              </label>
              <select
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                className="w-full border-2 border-copas-plata rounded-lg px-3 py-2 text-sm text-copas-marino"
              >
                <option value="">Ninguno</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-copas-marino cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={formSupports}
                onChange={(e) => setFormSupports(e.target.checked)}
                className="w-4 h-4 accent-copas-azul"
              />
              Lleva soportes
            </label>
          </div>

          <Input
            label="Etiquetas separadas por coma"
            value={formTags}
            onChange={(e) => setFormTags(e.target.value)}
          />

          <div>
            <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
              Notas de impresión
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
              className="w-full border-2 border-copas-plata rounded-lg p-2.5 text-sm text-copas-marino focus:outline-none focus:border-copas-azul resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={savingEdit}
              onClick={() => setEditingFile(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={savingEdit}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Visor 3D */}
      {previewFile && (
        <StlPreviewModal
          open={Boolean(previewFile)}
          onClose={() => {
            setPreviewFile(null)
            setPreviewUrl(null)
          }}
          fileName={previewFile.file_name}
          modelName={previewFile.name}
          signedUrl={previewUrl}
          onDownload={() => handleDownload(previewFile)}
        />
      )}
    </div>
  )
}
