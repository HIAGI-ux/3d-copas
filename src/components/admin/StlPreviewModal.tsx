'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Download, RotateCcw, ZoomIn, ZoomOut, Grid3X3 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  fileName: string
  modelName: string
  signedUrl: string | null
  onDownload: () => void
}

interface Triangle {
  v1: [number, number, number]
  v2: [number, number, number]
  v3: [number, number, number]
  normal: [number, number, number]
}

interface ParsedStl {
  triangles: Triangle[]
  sizeX: number
  sizeY: number
  sizeZ: number
  center: [number, number, number]
  maxDim: number
}

function computeNormal(
  v1: [number, number, number],
  v2: [number, number, number],
  v3: [number, number, number]
): [number, number, number] {
  const ux = v2[0] - v1[0]
  const uy = v2[1] - v1[1]
  const uz = v2[2] - v1[2]
  const vx = v3[0] - v1[0]
  const vy = v3[1] - v1[1]
  const vz = v3[2] - v1[2]
  const nx = uy * vz - uz * vy
  const ny = uz * vx - ux * vz
  const nz = ux * vy - uy * vx
  const len = Math.hypot(nx, ny, nz) || 1
  return [nx / len, ny / len, nz / len]
}

function parseStlBuffer(buffer: ArrayBuffer): ParsedStl {
  const view = new DataView(buffer)
  const isBinary =
    buffer.byteLength >= 84 &&
    84 + view.getUint32(80, true) * 50 === buffer.byteLength

  const triangles: Triangle[] = []
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  const updateBounds = (v: [number, number, number]) => {
    if (v[0] < minX) minX = v[0]
    if (v[1] < minY) minY = v[1]
    if (v[2] < minZ) minZ = v[2]
    if (v[0] > maxX) maxX = v[0]
    if (v[1] > maxY) maxY = v[1]
    if (v[2] > maxZ) maxZ = v[2]
  }

  if (isBinary) {
    const count = view.getUint32(80, true)
    let offset = 84
    for (let i = 0; i < count; i++) {
      const v1: [number, number, number] = [
        view.getFloat32(offset + 12, true),
        view.getFloat32(offset + 16, true),
        view.getFloat32(offset + 20, true),
      ]
      const v2: [number, number, number] = [
        view.getFloat32(offset + 24, true),
        view.getFloat32(offset + 28, true),
        view.getFloat32(offset + 32, true),
      ]
      const v3: [number, number, number] = [
        view.getFloat32(offset + 36, true),
        view.getFloat32(offset + 40, true),
        view.getFloat32(offset + 44, true),
      ]
      updateBounds(v1)
      updateBounds(v2)
      updateBounds(v3)
      triangles.push({ v1, v2, v3, normal: computeNormal(v1, v2, v3) })
      offset += 50
    }
  } else {
    const text = new TextDecoder().decode(buffer)
    const vertexRegex = /vertex\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g
    const verts: [number, number, number][] = []
    let match: RegExpExecArray | null
    while ((match = vertexRegex.exec(text)) !== null) {
      const v: [number, number, number] = [
        parseFloat(match[1]),
        parseFloat(match[2]),
        parseFloat(match[3]),
      ]
      updateBounds(v)
      verts.push(v)
      if (verts.length === 3) {
        const [v1, v2, v3] = verts
        triangles.push({ v1, v2, v3, normal: computeNormal(v1, v2, v3) })
        verts.length = 0
      }
    }
  }

  if (triangles.length === 0) {
    return {
      triangles: [],
      sizeX: 0,
      sizeY: 0,
      sizeZ: 0,
      center: [0, 0, 0],
      maxDim: 1,
    }
  }

  const sizeX = maxX - minX
  const sizeY = maxY - minY
  const sizeZ = maxZ - minZ
  const center: [number, number, number] = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  ]
  const maxDim = Math.max(sizeX, sizeY, sizeZ) || 1

  return { triangles, sizeX, sizeY, sizeZ, center, maxDim }
}

export default function StlPreviewModal({
  open,
  onClose,
  fileName,
  modelName,
  signedUrl,
  onDownload,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mesh, setMesh] = useState<ParsedStl | null>(null)
  const [wireframe, setWireframe] = useState(false)
  const [rotX, setRotX] = useState(-0.55)
  const [rotY, setRotY] = useState(0.65)
  const [zoom, setZoom] = useState(1)

  const draggingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  const isStl = fileName.toLowerCase().endsWith('.stl')

  useEffect(() => {
    if (!open || !signedUrl || !isStl) {
      setMesh(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(signedUrl)
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo descargar el archivo para previsualizar.')
        return res.arrayBuffer()
      })
      .then((buf) => {
        if (cancelled) return
        const parsed = parseStlBuffer(buf)
        if (parsed.triangles.length === 0) {
          setError('El archivo STL no contiene geometría válida.')
        } else {
          setMesh(parsed)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error leyendo STL')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, signedUrl, isStl])

  const renderMesh = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !mesh || mesh.triangles.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // Fondo degradado suave
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#F1F5F9')
    grad.addColorStop(1, '#E2E8F0')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    const cosX = Math.cos(rotX)
    const sinX = Math.sin(rotX)
    const cosY = Math.cos(rotY)
    const sinY = Math.sin(rotY)

    const scale = (Math.min(w, h) * 0.65 * zoom) / mesh.maxDim
    const [cx, cy, cz] = mesh.center

    // Subsample si tiene muchísimos triángulos para mantener fluidez
    const step = mesh.triangles.length > 55000 ? Math.ceil(mesh.triangles.length / 55000) : 1

    const project = (v: [number, number, number]): [number, number, number] => {
      // Centrar y convertir Z-up (STL estándar) a Y-up para pantalla
      const x0 = v[0] - cx
      const y0 = v[2] - cz
      const z0 = -(v[1] - cy)

      // Rotar en Y
      const x1 = x0 * cosY - z0 * sinY
      const z1 = x0 * sinY + z0 * cosY

      // Rotar en X
      const y2 = y0 * cosX - z1 * sinX
      const z2 = y0 * sinX + z1 * cosX

      return [w / 2 + x1 * scale, h / 2 - y2 * scale, z2]
    }

    const projected: {
      p1: [number, number, number]
      p2: [number, number, number]
      p3: [number, number, number]
      depth: number
      shade: number
    }[] = []

    // Luz desde arriba-izquierda-frente
    const lx = 0.4
    const ly = 0.7
    const lz = 0.6
    const llen = Math.hypot(lx, ly, lz)

    for (let i = 0; i < mesh.triangles.length; i += step) {
      const t = mesh.triangles[i]
      const p1 = project(t.v1)
      const p2 = project(t.v2)
      const p3 = project(t.v3)

      // Backface culling simple en pantalla
      const cross = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])
      if (cross >= 0 && !wireframe) continue

      // Rotar normal para iluminación
      const nx0 = t.normal[0]
      const ny0 = t.normal[2]
      const nz0 = -t.normal[1]

      const nx1 = nx0 * cosY - nz0 * sinY
      const nz1 = nx0 * sinY + nz0 * cosY
      const ny2 = ny0 * cosX - nz1 * sinX
      const nz2 = ny0 * sinX + nz1 * cosX

      const dot = Math.abs(nx1 * lx + ny2 * ly + nz2 * lz) / llen
      const shade = 0.3 + 0.7 * dot
      const depth = (p1[2] + p2[2] + p3[2]) / 3

      projected.push({ p1, p2, p3, depth, shade })
    }

    projected.sort((a, b) => a.depth - b.depth)

    for (let i = 0; i < projected.length; i++) {
      const tri = projected[i]
      ctx.beginPath()
      ctx.moveTo(tri.p1[0], tri.p1[1])
      ctx.lineTo(tri.p2[0], tri.p2[1])
      ctx.lineTo(tri.p3[0], tri.p3[1])
      ctx.closePath()

      if (wireframe) {
        ctx.strokeStyle = 'rgba(13, 82, 214, 0.45)'
        ctx.lineWidth = 0.7
        ctx.stroke()
      } else {
        // Color azul 3D Copas con sombreado
        const r = Math.round(20 + 40 * tri.shade)
        const g = Math.round(90 + 85 * tri.shade)
        const b = Math.round(180 + 70 * tri.shade)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fill()
        ctx.strokeStyle = `rgb(${r},${g},${b})`
        ctx.lineWidth = 0.4
        ctx.stroke()
      }
    }
  }, [mesh, rotX, rotY, zoom, wireframe])

  useEffect(() => {
    renderMesh()
  }, [renderMesh])

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    const dx = e.clientX - lastPosRef.current.x
    const dy = e.clientY - lastPosRef.current.y
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    setRotY((prev) => prev + dx * 0.01)
    setRotX((prev) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + dy * 0.01)))
  }

  const handlePointerUp = () => {
    draggingRef.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.max(0.3, Math.min(4, z - e.deltaY * 0.001)))
  }

  const resetView = () => {
    setRotX(-0.55)
    setRotY(0.65)
    setZoom(1)
  }

  return (
    <Modal open={open} onClose={onClose} title={`Vista 3D · ${modelName}`} size="lg">
      <div className="flex flex-col gap-4">
        {!isStl ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <p className="font-heading font-bold text-copas-marino mb-1">
              Vista previa 3D disponible solo para archivos .STL
            </p>
            <p className="text-sm text-copas-plata-oscuro mb-4">
              El archivo <strong>{fileName}</strong> está guardado de forma segura y podés descargarlo
              para abrirlo en tu laminador (Bambu Studio, OrcaSlicer, PrusaSlicer, Cura).
            </p>
            <Button onClick={onDownload}>
              <Download size={16} /> Descargar {fileName}
            </Button>
          </div>
        ) : loading ? (
          <div className="h-80 flex flex-col items-center justify-center bg-slate-50 rounded-xl">
            <LoadingSpinner text="Cargando modelo 3D..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center text-sm">
            {error}
          </div>
        ) : (
          <>
            <div className="relative rounded-xl overflow-hidden border border-slate-200 select-none">
              <canvas
                ref={canvasRef}
                width={720}
                height={420}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                className="w-full h-72 sm:h-96 cursor-grab active:cursor-grabbing touch-none block"
              />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] text-copas-marino font-semibold shadow-sm pointer-events-none">
                Arrastrá para rotar · Rueda para zoom
              </div>
              <div className="absolute top-3 right-3 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setWireframe((w) => !w)}
                  title="Modo malla (wireframe)"
                  className={`p-2 rounded-lg shadow-sm border text-xs font-bold transition-colors ${
                    wireframe
                      ? 'bg-copas-azul text-white border-copas-azul'
                      : 'bg-white/90 text-copas-marino border-slate-200 hover:bg-white'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                  title="Acercar"
                  className="p-2 rounded-lg bg-white/90 text-copas-marino border border-slate-200 shadow-sm hover:bg-white"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.3, z - 0.25))}
                  title="Alejar"
                  className="p-2 rounded-lg bg-white/90 text-copas-marino border border-slate-200 shadow-sm hover:bg-white"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  title="Restablecer vista"
                  className="p-2 rounded-lg bg-white/90 text-copas-marino border border-slate-200 shadow-sm hover:bg-white"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {mesh && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <p className="text-[11px] text-copas-plata-oscuro">Ancho (X)</p>
                  <p className="font-heading font-bold text-copas-marino text-sm">
                    {mesh.sizeX.toFixed(1)} mm
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <p className="text-[11px] text-copas-plata-oscuro">Profundidad (Y)</p>
                  <p className="font-heading font-bold text-copas-marino text-sm">
                    {mesh.sizeY.toFixed(1)} mm
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <p className="text-[11px] text-copas-plata-oscuro">Altura (Z)</p>
                  <p className="font-heading font-bold text-copas-marino text-sm">
                    {mesh.sizeZ.toFixed(1)} mm
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <p className="text-[11px] text-copas-plata-oscuro">Triángulos</p>
                  <p className="font-heading font-bold text-copas-marino text-sm">
                    {mesh.triangles.length.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={onDownload}>
                <Download size={16} /> Descargar {fileName}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
