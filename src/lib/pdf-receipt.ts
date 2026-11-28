import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Order, BusinessConfig } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'

/**
 * Plantilla de Comprobante comercial tipo "X" o "E" (Documento no válido como factura).
 * Diseño limpio, sobrio e imprimible estilo factura argentina estándar.
 */
export function generateOrderReceiptPDF(
  order: Order,
  config: BusinessConfig | null,
  customerName?: string,
  receiptType: 'X' | 'E' = 'X'
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  const recNum = order.receipt_number || order.order_number

  // Marco superior limpio (estilo comprobante argentino clásico)
  doc.setDrawColor(203, 213, 225) // #CBD5E1
  doc.setLineWidth(0.4)
  doc.rect(margin, 12, contentWidth, 34)

  // Línea vertical divisoria izquierda / derecha
  const centerX = pageWidth / 2
  doc.line(centerX, 28, centerX, 46)

  // Cuadro central con la letra X o E (estilo AFIP / comercial)
  const boxSize = 14
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(15, 23, 42) // #0F172A
  doc.setLineWidth(0.5)
  doc.rect(centerX - boxSize / 2, 12, boxSize, boxSize, 'FD')

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(receiptType, centerX, 21.5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  doc.setTextColor(100, 116, 139)
  doc.text('DOC. NO VÁLIDO', centerX, 29.5, { align: 'center' })
  doc.text('COMO FACTURA', centerX, 32.5, { align: 'center' })

  // Columna izquierda: Datos del comercio
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(config?.name || '3D Copas', margin + 5, 21)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text(config?.slogan || 'Impresión 3D a pedido', margin + 5, 27)
  const cityLine = [config?.local_city || 'Balcarce', config?.local_province || 'Buenos Aires']
    .filter(Boolean)
    .join(', ')
  doc.text(cityLine, margin + 5, 32.5)
  if (config?.whatsapp) {
    doc.text(`Tel / WhatsApp: +${config.whatsapp}`, margin + 5, 38)
  }
  if (config?.email) {
    doc.text(`Email: ${config.email}`, margin + 5, 43)
  }

  // Columna derecha: Tipo y número de comprobante
  const rightX = centerX + boxSize / 2 + 6
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`COMPROBANTE ${receiptType}`, rightX, 20)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(13, 82, 214) // #0D52D6
  doc.text(`N° 0001-${String(recNum).padStart(8, '0')}`, rightX, 27)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text(`Fecha de emisión: ${formatDate(order.receipt_issued_at || order.ordered_at)}`, rightX, 34)
  doc.text(`Pedido web: #${order.order_number}`, rightX, 39.5)

  // Bloque de datos del cliente y envío
  const clientY = 52
  doc.setFillColor(248, 250, 252) // #F8FAFC
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.rect(margin, clientY, contentWidth, 28, 'FD')

  const clientName = customerName || order.guest_name || order.customer?.full_name || 'Consumidor Final'
  const clientPhone = order.guest_phone || order.customer?.phone || '-'

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('CLIENTE', margin + 4, clientY + 6)
  doc.text('CONDICIONES Y FECHAS', centerX + 4, clientY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(51, 65, 85)
  doc.text(`Nombre: ${clientName}`, margin + 4, clientY + 11.5)
  doc.text(`Teléfono: ${clientPhone}`, margin + 4, clientY + 16.5)
  doc.text(`Localidad: ${order.city}, ${order.province} (CP ${order.postal_code})`, margin + 4, clientY + 21.5)
  const deliveryStr =
    order.delivery_type === 'local'
      ? 'Retiro / Entrega local'
      : `Envío: ${order.transporte || 'A confirmar'}${order.tracking_code ? ` (${order.tracking_code})` : ''}`
  doc.text(deliveryStr, margin + 4, clientY + 26)

  doc.text(
    `Forma de pago: ${order.payment_method === 'efectivo' ? 'Efectivo' : 'Transferencia bancaria'}`,
    centerX + 4,
    clientY + 11.5
  )
  doc.text(`Fecha de pedido: ${formatDate(order.ordered_at)}`, centerX + 4, clientY + 16.5)
  doc.text(
    `Entrega coordinada: ${order.delivery_date ? formatDate(order.delivery_date) : 'A coordinar'}`,
    centerX + 4,
    clientY + 21.5
  )
  doc.text(
    `Fecha de despacho: ${order.dispatch_date ? formatDate(order.dispatch_date) : 'Pendiente'}`,
    centerX + 4,
    clientY + 26
  )

  // Tabla de productos
  const tableRows = (order.items || []).map((item) => [
    String(item.qty),
    `${item.name}${item.variant ? ` · ${item.variant.size}` : ''}${
      item.color ? ` · Color: ${item.color}` : ''
    }${item.personalization ? `\nPersonalizado: ${item.personalization}` : ''}`,
    formatPrice(item.unit_price),
    formatPrice(item.unit_price * item.qty),
  ])

  autoTable(doc, {
    startY: clientY + 34,
    margin: { left: margin, right: margin },
    head: [['Cant.', 'Descripción', 'Precio unit.', 'Importe']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineWidth: { top: 0.3, bottom: 0.5 },
      lineColor: [148, 163, 184],
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3,
      lineWidth: { bottom: 0.2 },
      lineColor: [226, 232, 240],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 30 },
    },
  })

  // Bloque de totales alineado a la derecha
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  const totalsBoxX = pageWidth - margin - 72
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(totalsBoxX, finalY, pageWidth - margin, finalY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text('Subtotal:', totalsBoxX, finalY + 6)
  doc.text(formatPrice(order.subtotal), pageWidth - margin, finalY + 6, { align: 'right' })

  doc.text('Envío:', totalsBoxX, finalY + 12)
  doc.text(
    order.delivery_type === 'local' ? '$0' : formatPrice(order.shipping_cost || 0),
    pageWidth - margin,
    finalY + 12,
    { align: 'right' }
  )

  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.5)
  doc.line(totalsBoxX, finalY + 15.5, pageWidth - margin, finalY + 15.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(15, 23, 42)
  doc.text('TOTAL:', totalsBoxX, finalY + 22)
  doc.text(formatPrice(order.total || order.subtotal), pageWidth - margin, finalY + 22, {
    align: 'right',
  })

  // Pie de página sobrio
  const policyY = finalY + 34
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(margin, policyY, pageWidth - margin, policyY)

  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Observaciones y condiciones:', margin, policyY + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  const policyText = [
    config?.returns_policy || 'Arrepentimiento: 10 días hábiles desde la recepción del pedido.',
    config?.exchange_policy || 'Cambios: cubrimos defectos de impresión o roturas en el envío.',
  ].join(' ')
  const splitPolicy = doc.splitTextToSize(policyText, contentWidth)
  doc.text(splitPolicy, margin, policyY + 10)

  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `Documento no válido como factura · ${config?.name || '3D Copas'}`,
    pageWidth / 2,
    285,
    { align: 'center' }
  )

  doc.save(`Comprobante${receiptType}-3DCopas-${String(recNum).padStart(6, '0')}.pdf`)
}
