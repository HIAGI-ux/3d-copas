'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus, ORDER_STATUS_LABELS, BusinessConfig } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'
import { generateOrderReceiptPDF } from '@/lib/pdf-receipt'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { Search, FileText, Truck, Copy, ExternalLink } from 'lucide-react'

const ALL_STATUSES: OrderStatus[] = [
  'nuevo',
  'esperando_cotizacion',
  'esperando_transferencia',
  'pagado',
  'en_impresion',
  'listo',
  'despachado',
  'entregado',
  'cancelado',
]

export default function AdminPedidosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [saving, setSaving] = useState(false)

  // Campos editables del pedido
  const [editStatus, setEditStatus] = useState<OrderStatus>('nuevo')
  const [editTrackingCode, setEditTrackingCode] = useState('')
  const [editTransporte, setEditTransporte] = useState('')
  const [editDeliveryDate, setEditDeliveryDate] = useState('')
  const [editDispatchDate, setEditDispatchDate] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Calculadora de envío y caja
  const [volumeAdjustPct, setVolumeAdjustPct] = useState(20) // -20% más compacto por defecto o +
  const [packagingPct, setPackagingPct] = useState(5)
  const [boxLength, setBoxLength] = useState(20)
  const [boxWidth, setBoxWidth] = useState(20)
  const [boxHeight, setBoxHeight] = useState(15)
  const [boxWeight, setBoxWeight] = useState(500)
  const [bultosCount, setBultosCount] = useState(1)

  // Cotizaciones lado a lado
  const [quotes, setQuotes] = useState<Record<string, string>>({})
  const [shippingCost, setShippingCost] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [ordersRes, configRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, customer:customers(id,full_name,email,phone)')
        .order('ordered_at', { ascending: false }),
      supabase.from('business_config').select('*').single(),
    ])
    if (ordersRes.data) setOrders(ordersRes.data as Order[])
    if (configRes.data) setConfig(configRes.data as BusinessConfig)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setEditStatus(order.status)
    setEditTrackingCode(order.tracking_code || '')
    setEditTransporte(order.transporte || '')
    setEditDeliveryDate(order.delivery_date || '')
    setEditDispatchDate(order.dispatch_date || '')
    setEditNotes(order.notes || '')
    setShippingCost(Number(order.shipping_cost || 0))

    // Calcular caja estimada desde los items
    const items = order.items || []
    const rawWeight = items.reduce((s, i) => s + (i.shipping_weight_g || 120) * i.qty, 0)
    const rawVol = items.reduce((s, i) => {
      const h = i.shipping_height_cm || 4
      const w = i.shipping_width_cm || 10
      const l = i.shipping_length_cm || 10
      return s + h * w * l * i.qty
    }, 0)

    const side = Math.max(10, Math.ceil(Math.cbrt(rawVol * (1 - volumeAdjustPct / 100))))
    setBoxLength(Number(order.box_length_cm || side))
    setBoxWidth(Number(order.box_width_cm || side))
    setBoxHeight(Number(order.box_height_cm || side))
    setBoxWeight(Number(order.box_weight_g || rawWeight || 300))
    setBultosCount(1)
    setQuotes({})
  }

  const recalculateBoxFromItems = (pct: number) => {
    if (!selectedOrder) return
    const items = selectedOrder.items || []
    const rawVol = items.reduce((s, i) => {
      const h = i.shipping_height_cm || 4
      const w = i.shipping_width_cm || 10
      const l = i.shipping_length_cm || 10
      return s + h * w * l * i.qty
    }, 0)
    const adjustedVol = Math.max(100, rawVol * (1 - pct / 100))
    const side = Math.max(10, Math.ceil(Math.cbrt(adjustedVol)))
    setBoxLength(side)
    setBoxWidth(side)
    setBoxHeight(side)
  }

  const activeTransportes = (config?.transportes || [])
    .filter((t) => t.active)
    .sort((a, b) => a.order - b.order)

  // Encontrar cotización más barata
  const numericQuotes = Object.entries(quotes)
    .map(([id, val]) => ({ id, amount: Number(val) }))
    .filter((q) => !isNaN(q.amount) && q.amount > 0)
  const cheapestQuote =
    numericQuotes.length > 0
      ? numericQuotes.reduce((min, q) => (q.amount < min.amount ? q : min))
      : null

  const weightThreshold = config?.garmendia_weight_threshold || 5000
  const bultosThreshold = config?.garmendia_bultos_threshold || 3
  const isLargeOrder = boxWeight >= weightThreshold || bultosCount >= bultosThreshold

  const extraPackagingAmount =
    selectedOrder?.delivery_type === 'envio'
      ? Math.round(Number(selectedOrder.subtotal) * (packagingPct / 100))
      : 0
  const finalTotal = selectedOrder
    ? Number(selectedOrder.subtotal) + extraPackagingAmount + Number(shippingCost || 0)
    : 0

  const handleSaveOrder = async () => {
    if (!selectedOrder) return
    setSaving(true)

    const tObj = config?.transportes?.find(
      (t) => t.name.toLowerCase() === editTransporte.toLowerCase()
    )
    const trackingUrl =
      editTrackingCode && tObj?.tracking_url ? `${tObj.tracking_url}` : selectedOrder.tracking_url

    const { error } = await supabase
      .from('orders')
      .update({
        status: editStatus,
        tracking_code: editTrackingCode.trim() || null,
        tracking_url: trackingUrl || null,
        transporte: editTransporte || null,
        delivery_date: editDeliveryDate || null,
        dispatch_date: editDispatchDate || null,
        notes: editNotes.trim() || null,
        shipping_cost: Number(shippingCost || 0),
        total: finalTotal,
        box_length_cm: boxLength,
        box_width_cm: boxWidth,
        box_height_cm: boxHeight,
        box_weight_g: boxWeight,
      })
      .eq('id', selectedOrder.id)

    setSaving(false)
    if (error) {
      toast.error('No se pudo actualizar el pedido.')
      return
    }
    toast.success('Pedido actualizado.')
    setSelectedOrder(null)
    loadData()
  }

  const handleGenerateReceipt = async () => {
    if (!selectedOrder) return
    const nextReceiptNum = selectedOrder.receipt_number || selectedOrder.order_number
    const nowIso = new Date().toISOString()

    await supabase
      .from('orders')
      .update({
        receipt_number: nextReceiptNum,
        receipt_issued_at: selectedOrder.receipt_issued_at || nowIso,
      })
      .eq('id', selectedOrder.id)

    const updatedOrder: Order = {
      ...selectedOrder,
      status: editStatus,
      transporte: editTransporte,
      tracking_code: editTrackingCode,
      delivery_date: editDeliveryDate || undefined,
      dispatch_date: editDispatchDate || undefined,
      shipping_cost: Number(shippingCost || 0),
      total: finalTotal,
      receipt_number: nextReceiptNum,
      receipt_issued_at: selectedOrder.receipt_issued_at || nowIso,
    }
    generateOrderReceiptPDF(updatedOrder, config)
    toast.success('Comprobante descargado.')
    loadData()
  }

  const buildClientMessage = () => {
    if (!selectedOrder) return ''
    const clientName =
      selectedOrder.guest_name || selectedOrder.customer?.full_name || 'Cliente'
    const chosenTransporte = editTransporte || 'Correo Argentino'
    const reason = chosenTransporte.toLowerCase().includes('garmendia')
      ? `Te conviene ${chosenTransporte} porque cobra por bulto y tu pedido es grande/pesado.`
      : `Te conviene ${chosenTransporte} porque tu pedido es chico y liviano, y resulta más económico.`

    let msg = `¡Hola ${clientName}! Ya tengo la cotización de tu pedido #${selectedOrder.order_number} de 3D Copas 📦\n\n`
    msg += `• Subtotal productos: ${formatPrice(selectedOrder.subtotal)}\n`
    if (extraPackagingAmount > 0) {
      msg += `• Packaging protector: ${formatPrice(extraPackagingAmount)}\n`
    }
    msg += `• Envío por ${chosenTransporte}: ${formatPrice(shippingCost)}\n`
    msg += `*TOTAL FINAL: ${formatPrice(finalTotal)}*\n\n`
    msg += `💡 ${reason}\n\n`
    if (config?.payment_alias || config?.payment_cbu) {
      msg += `*Datos para transferir una sola vez:*\n`
      if (config.payment_holder) msg += `Titular: ${config.payment_holder}\n`
      if (config.payment_alias) msg += `Alias: ${config.payment_alias}\n`
      if (config.payment_cbu) msg += `CBU/CVU: ${config.payment_cbu}\n`
    }
    msg += `\n¡Avisame cuando transfieras y me mandás el comprobante!`
    return msg
  }

  const handleCopyMessage = () => {
    const msg = buildClientMessage()
    navigator.clipboard.writeText(msg)
    toast.success('Mensaje copiado al portapapeles.')
  }

  const handleOpenWhatsApp = () => {
    if (!selectedOrder) return
    const phone = selectedOrder.guest_phone || selectedOrder.customer?.phone || ''
    const cleanPhone = phone.replace(/\D/g, '')
    const msg = buildClientMessage()
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const filtered = orders.filter((o) => {
    const matchesStatus = !statusFilter || o.status === statusFilter
    const clientStr = `${o.guest_name || ''} ${o.customer?.full_name || ''} ${o.order_number} ${o.city}`
    const matchesSearch = !search || clientStr.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-black text-copas-marino">Pedidos</h1>
        <p className="text-sm text-copas-plata-oscuro">
          Gestioná estados, cotizá envíos lado a lado y generá comprobantes PDF.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-copas-plata-oscuro"
          />
          <input
            type="search"
            placeholder="Buscar por cliente, ciudad o N° de pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border-2 border-copas-plata rounded-xl bg-white text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-2 border-copas-plata rounded-xl px-3 py-2.5 bg-white text-sm font-heading font-semibold text-copas-marino"
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {ORDER_STATUS_LABELS[st]}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-3">
        {filtered.map((order) => {
          const clientName =
            order.guest_name || order.customer?.full_name || 'Cliente sin nombre'
          return (
            <div
              key={order.id}
              onClick={() => openOrderDetail(order)}
              className="bg-white rounded-card border border-copas-plata p-4 hover:border-copas-azul cursor-pointer transition-all shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-copas-marino">
                    #{order.order_number}
                  </span>
                  <span className="font-heading font-bold text-sm text-copas-marino">
                    {clientName}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-heading font-bold bg-copas-azul/10 text-copas-azul">
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-copas-plata-oscuro">
                <span>
                  {formatDate(order.ordered_at)} ·{' '}
                  {order.delivery_type === 'local'
                    ? '🏠 Local Balcarce'
                    : `🚚 ${order.city}, ${order.province} (${order.transporte || 'A definir'})`}
                </span>
                <span className="font-heading font-black text-base text-copas-azul">
                  {formatPrice(order.total || order.subtotal)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal detalle y calculadora de envío */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Pedido #${selectedOrder.order_number}` : ''}
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Info cliente */}
            <div className="bg-copas-crema rounded-xl p-3.5 text-sm space-y-1">
              <p>
                <strong>Cliente:</strong>{' '}
                {selectedOrder.guest_name || selectedOrder.customer?.full_name} — Tel:{' '}
                {selectedOrder.guest_phone || selectedOrder.customer?.phone}
              </p>
              <p>
                <strong>Destino:</strong> {selectedOrder.city}, {selectedOrder.province} (CP{' '}
                {selectedOrder.postal_code}) ·{' '}
                <strong>
                  {selectedOrder.delivery_type === 'local' ? 'Entrega local' : 'Envío'}
                </strong>
              </p>
              <p>
                <strong>Pago:</strong> {selectedOrder.payment_method || 'A definir'}
              </p>
            </div>

            {/* Items */}
            <div className="border border-copas-plata rounded-xl p-3 space-y-1.5">
              <p className="font-heading font-bold text-xs uppercase text-copas-plata-oscuro">
                Productos
              </p>
              {(selectedOrder.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {it.name} {it.variant ? `(${it.variant.size})` : ''}{' '}
                    {it.color ? `· ${it.color}` : ''} x{it.qty}
                    {it.personalization ? ` [✏️ ${it.personalization}]` : ''}
                  </span>
                  <span className="font-semibold">{formatPrice(it.unit_price * it.qty)}</span>
                </div>
              ))}
              <div className="border-t border-copas-plata pt-2 flex justify-between font-heading font-bold">
                <span>Subtotal productos</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
            </div>

            {/* Calculadora de envío y caja (solo si es envío) */}
            {selectedOrder.delivery_type === 'envio' && (
              <div className="border-2 border-copas-azul/30 rounded-xl p-4 space-y-4 bg-copas-azul/5">
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-copas-azul" />
                  <h3 className="font-heading font-black text-copas-marino">
                    Calculadora de caja y cotizaciones
                  </h3>
                </div>

                {/* Sugerencia */}
                <div
                  className={`rounded-lg p-3 text-xs sm:text-sm font-semibold ${
                    isLargeOrder
                      ? 'bg-copas-dorado/25 text-copas-marino border border-copas-dorado'
                      : 'bg-white text-copas-marino border border-copas-plata'
                  }`}
                >
                  {isLargeOrder
                    ? '📦 Pedido grande o pesado: podría convenir Garmendia (cobra por bulto). Comparar cotizaciones.'
                    : '✉️ Pedido chico/liviano: suele convenir Correo Argentino, Vía Cargo u OCA (Garmendia puede ser más caro).'}
                </div>

                {/* Medidas y ajustes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input
                    label="Compactado (%)"
                    type="number"
                    value={volumeAdjustPct}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setVolumeAdjustPct(val)
                      recalculateBoxFromItems(val)
                    }}
                  />
                  <Input
                    label="Packaging (%)"
                    type="number"
                    value={packagingPct}
                    onChange={(e) => setPackagingPct(Number(e.target.value))}
                  />
                  <Input
                    label="Peso total (g)"
                    type="number"
                    value={boxWeight}
                    onChange={(e) => setBoxWeight(Number(e.target.value))}
                  />
                  <Input
                    label="Cant. bultos"
                    type="number"
                    min={1}
                    value={bultosCount}
                    onChange={(e) => setBultosCount(Math.max(1, Number(e.target.value)))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="Largo (cm)"
                    type="number"
                    value={boxLength}
                    onChange={(e) => setBoxLength(Number(e.target.value))}
                  />
                  <Input
                    label="Ancho (cm)"
                    type="number"
                    value={boxWidth}
                    onChange={(e) => setBoxWidth(Number(e.target.value))}
                  />
                  <Input
                    label="Alto (cm)"
                    type="number"
                    value={boxHeight}
                    onChange={(e) => setBoxHeight(Number(e.target.value))}
                  />
                </div>

                {/* Cotizaciones lado a lado */}
                <div>
                  <p className="text-xs font-heading font-bold text-copas-marino mb-2">
                    Comparar cotizaciones de transportes (cargá el precio de cada uno):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {activeTransportes.map((t) => {
                      const isCheapest = cheapestQuote?.id === t.id
                      return (
                        <div
                          key={t.id}
                          className={`p-2.5 rounded-lg border-2 bg-white ${
                            isCheapest ? 'border-copas-verde' : 'border-copas-plata'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-heading font-bold text-copas-marino">
                              {t.name}
                            </span>
                            {isCheapest && (
                              <span className="text-[10px] bg-copas-verde text-white px-1.5 py-0.5 rounded font-bold">
                                Más barato
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            placeholder="$"
                            value={quotes[t.id] || ''}
                            onChange={(e) =>
                              setQuotes((prev) => ({ ...prev, [t.id]: e.target.value }))
                            }
                            className="w-full border border-copas-plata rounded px-2 py-1 text-sm mb-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditTransporte(t.name)
                              if (quotes[t.id]) setShippingCost(Number(quotes[t.id]))
                            }}
                            className="w-full text-[11px] font-heading font-bold text-copas-azul hover:underline"
                          >
                            Usar este
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-copas-plata">
                  <Input
                    label="Costo de envío elegido ($)"
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                  />
                  <div className="flex flex-col justify-center bg-white rounded-lg px-3 py-2 border border-copas-plata">
                    <span className="text-xs text-copas-plata-oscuro">
                      Total final (productos + {formatPrice(extraPackagingAmount)} pack + envío)
                    </span>
                    <span className="font-heading text-xl font-black text-copas-azul">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={handleCopyMessage}>
                    <Copy size={14} /> Copiar mensaje para el cliente
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={handleOpenWhatsApp}>
                    <ExternalLink size={14} /> Enviar por WhatsApp
                  </Button>
                </div>
              </div>
            )}

            {/* Estado, seguimiento y las 3 fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Estado interno"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                options={ALL_STATUSES.map((s) => ({
                  value: s,
                  label: ORDER_STATUS_LABELS[s],
                }))}
              />
              <Input
                label="Transporte"
                value={editTransporte}
                onChange={(e) => setEditTransporte(e.target.value)}
              />
              <Input
                label="Código de seguimiento"
                value={editTrackingCode}
                onChange={(e) => setEditTrackingCode(e.target.value)}
                placeholder="Ej: CA123456789AR"
              />
              <Input
                label="Fecha de entrega coordinada"
                type="date"
                value={editDeliveryDate}
                onChange={(e) => setEditDeliveryDate(e.target.value)}
              />
              <Input
                label="Fecha de despacho"
                type="date"
                value={editDispatchDate}
                onChange={(e) => setEditDispatchDate(e.target.value)}
              />
              <div className="flex flex-col justify-end text-xs text-copas-plata-oscuro pb-2">
                Fecha de pedido: <strong>{formatDate(selectedOrder.ordered_at)}</strong>
              </div>
            </div>

            <div>
              <label className="text-sm font-heading font-semibold text-copas-marino block mb-1">
                Notas internas (privadas)
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="w-full border-2 border-copas-plata rounded-lg p-2.5 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-copas-plata">
              <Button type="button" variant="outline" onClick={handleGenerateReceipt}>
                <FileText size={16} /> Generar comprobante PDF
              </Button>
              <Button type="button" loading={saving} onClick={handleSaveOrder} className="flex-1">
                Guardar cambios del pedido
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
