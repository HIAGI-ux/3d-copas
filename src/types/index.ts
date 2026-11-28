export * from './database'

export interface CartItem {
  product_id: string
  product_name: string
  product_slug: string
  product_photo?: string
  variant?: {
    id: string
    size: string
    price: number
  }
  color?: string
  qty: number
  personalization?: string
  unit_price: number
  // Para estimación de caja
  shipping_height_cm?: number
  shipping_width_cm?: number
  shipping_length_cm?: number
  shipping_weight_g?: number
}

export type OrderStatusPublic =
  | 'pedido_recibido'
  | 'en_elaboracion'
  | 'en_proceso_envio'
  | 'despachado'
  | 'entregado'
  | 'cancelado'

export function mapOrderStatusToPublic(
  status: import('./database').OrderStatus
): OrderStatusPublic {
  switch (status) {
    case 'nuevo':
    case 'esperando_cotizacion':
    case 'esperando_transferencia':
    case 'pagado':
      return 'pedido_recibido'
    case 'en_impresion':
      return 'en_elaboracion'
    case 'listo':
      return 'en_proceso_envio'
    case 'despachado':
      return 'despachado'
    case 'entregado':
      return 'entregado'
    case 'cancelado':
      return 'cancelado'
  }
}

export const ORDER_STATUS_LABELS: Record<import('./database').OrderStatus, string> = {
  nuevo: 'Nuevo',
  esperando_cotizacion: 'Esperando cotización de envío',
  esperando_transferencia: 'Esperando transferencia',
  pagado: 'Pagado',
  en_impresion: 'En impresión',
  listo: 'Listo',
  despachado: 'Despachado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const ORDER_STATUS_PUBLIC_LABELS: Record<OrderStatusPublic, string> = {
  pedido_recibido: 'Pedido recibido',
  en_elaboracion: 'En proceso de elaboración',
  en_proceso_envio: 'En proceso de envío',
  despachado: 'Despachado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const ARGENTINA_PROVINCES = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
]

export const EXPENSE_CATEGORIES = [
  'Filamento',
  'Repuestos de impresora',
  'Electricidad',
  'Packaging e insumos',
  'Envíos',
  'Comisiones',
  'Fondo de emergencia',
  'Otros',
]
