import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Order, BusinessConfig } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'

/**
 * Plantilla de Comprobante de Compra tipo "X" (Documento no válido como factura).
 * Diseñada de forma simple y modular para poder reemplazar fácilmente.
 */
export function generateOrderReceiptPDF(
  order: Order,
  config: BusinessConfig | null,
  customerName?: string,
  receiptType: 'X' | 'E' = 'X'
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // Encabezado
  doc.setFillColor(15, 27, 61) // #0F1B3D Azul marino 3D Copas
  doc.rect(0, 0, pageWidth, 34, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(config?.name || '3D Copas', 14, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(config?.slogan || 'Hecho a pedido en impresión 3D · Balcarce, Buenos Aires', 14, 22)
  if (config?.whatsapp) {
    doc.text(`WhatsApp: +${config.whatsapp}`, 14, 28)
  }

  // Recuadro "X" al centro/derecha
  doc.setFillColor(230, 180, 34) // Dorado copas
  doc.roundedRect(pageWidth - 65, 6, 51, 22, 2, 2, 'F')
  doc.setTextColor(15, 27, 61)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`COMPROBANTE ${receiptType}`, pageWidth - 39.5, 14, { align: 'center' })
  doc.setFontSize(10)
  const recNum = order.receipt_number || order.order_number
  doc.text(`N° ${String(recNum).padStart(6, '0')}`, pageWidth - 39.5, 22, { align: 'center' })

  // Leyenda legal obligatoria
  doc.setTextColor(156, 42, 42) // Rojo vino
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const receiptLegend =
    receiptType === 'E'
      ? 'Comprobante de compra tipo E – No válido como factura'
      : 'Comprobante de compra - Documento no válido como factura'
  doc.text(receiptLegend, pageWidth / 2, 43, { align: 'center' })

  // Datos del cliente y fechas
  doc.setTextColor(15, 27, 61)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Datos del cliente y entrega:', 14, 53)

  doc.setFont('helvetica', 'normal')
  const clientName = customerName || order.guest_name || order.customer?.full_name || 'Cliente'
  const clientPhone = order.guest_phone || order.customer?.phone || '-'
  doc.text(`Cliente: ${clientName}`, 14, 59)
  doc.text(`Teléfono: ${clientPhone}`, 14, 65)
  doc.text(`Localidad: ${order.city}, ${order.province} (CP ${order.postal_code})`, 14, 71)
  doc.text(
    `Entrega: ${
      order.delivery_type === 'local'
        ? 'Entrega local en Balcarce'
        : `Envío (${order.transporte || 'A confirmar'})`
    }`,
    14,
    77
  )
  if (order.tracking_code) {
    doc.text(`Código de seguimiento: ${order.tracking_code}`, 14, 83)
  }

  // Las 3 fechas obligatorias
  doc.setFont('helvetica', 'bold')
  doc.text('Fechas:', 125, 53)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha de pedido: ${formatDate(order.ordered_at)}`, 125, 59)
  doc.text(
    `Entrega coordinada: ${order.delivery_date ? formatDate(order.delivery_date) : 'A coordinar'}`,
    125,
    65
  )
  doc.text(
    `Fecha de despacho: ${order.dispatch_date ? formatDate(order.dispatch_date) : 'Pendiente'}`,
    125,
    71
  )
  doc.text(
    `Forma de pago: ${order.payment_method === 'efectivo' ? 'Efectivo' : 'Transferencia'}`,
    125,
    77
  )

  // Tabla de productos
  const tableRows = (order.items || []).map((item) => [
    `${item.name}${item.variant ? ` (${item.variant.size})` : ''}${
      item.color ? ` - ${item.color}` : ''
    }${item.personalization ? `\nPersonalizado: ${item.personalization}` : ''}`,
    String(item.qty),
    formatPrice(item.unit_price),
    formatPrice(item.unit_price * item.qty),
  ])

  autoTable(doc, {
    startY: 92,
    head: [['Producto / Detalle', 'Cant.', 'Precio unit.', 'Subtotal']],
    body: tableRows,
    headStyles: { fillColor: [36, 86, 214], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
    },
  })

  // Totales
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Subtotal productos: ${formatPrice(order.subtotal)}`, pageWidth - 14, finalY, {
    align: 'right',
  })
  doc.text(
    `Envío: ${order.delivery_type === 'local' ? '$0 (Local)' : formatPrice(order.shipping_cost || 0)}`,
    pageWidth - 14,
    finalY + 6,
    { align: 'right' }
  )
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(36, 86, 214)
  doc.text(`TOTAL: ${formatPrice(order.total || order.subtotal)}`, pageWidth - 14, finalY + 14, {
    align: 'right',
  })

  // Políticas al pie
  const policyY = finalY + 26
  doc.setDrawColor(199, 203, 209)
  doc.line(14, policyY, pageWidth - 14, policyY)

  doc.setTextColor(100, 105, 115)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('Políticas y condiciones:', 14, policyY + 6)

  doc.setFont('helvetica', 'normal')
  const policyText = [
    config?.returns_policy ||
      'Arrepentimiento: 10 días hábiles desde la recepción del pedido.',
    config?.exchange_policy ||
      'Cambios: cubrimos defectos de impresión o roturas en el envío.',
  ].join(' ')
  const splitPolicy = doc.splitTextToSize(policyText, pageWidth - 28)
  doc.text(splitPolicy, 14, policyY + 11)

  doc.save(`Comprobante${receiptType}-3DCopas-${String(recNum).padStart(6, '0')}.pdf`)
}
