export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ProductStatus = 'disponible' | 'a_pedido' | 'agotado'
export type OrderStatus =
  | 'nuevo'
  | 'esperando_cotizacion'
  | 'esperando_transferencia'
  | 'pagado'
  | 'en_impresion'
  | 'listo'
  | 'despachado'
  | 'entregado'
  | 'cancelado'
export type CustomRequestStatus = 'nueva' | 'respondida' | 'cerrada'
export type DeliveryType = 'local' | 'envio'
export type PaymentMethod = 'efectivo' | 'transferencia'
export type ContactType = 'whatsapp' | 'email'

export interface ProductVariant {
  id: string
  size: string
  price: number
  stock?: ProductStatus
}

export interface Transporte {
  id: string
  name: string
  active: boolean
  tracking_url: string
  order: number
  warning?: string
}

export interface OtherLink {
  label: string
  url: string
  icon?: string
}

export interface BusinessConfig {
  id: string
  name: string
  slogan?: string
  logo_url?: string
  whatsapp?: string
  email?: string
  instagram?: string
  tiktok?: string
  facebook?: string
  other_links?: OtherLink[]
  local_province: string
  local_city: string
  local_postal_codes: string[]
  transportes: Transporte[]
  garmendia_weight_threshold: number
  garmendia_bultos_threshold: number
  payment_alias?: string
  payment_cbu?: string
  payment_holder?: string
  returns_policy?: string
  exchange_policy?: string
  delivery_times_text?: string
  footer_text?: string
  welcome_message?: string
  banner_active: boolean
  banner_title?: string
  banner_subtitle?: string
  banner_image_url?: string
  banner_button_text?: string
  banner_button_url?: string
  color_primary: string
  color_secondary: string
  color_accent: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  category_id?: string
  photos: string[]
  main_photo_index: number
  variants: ProductVariant[]
  colors: string[]
  labels: string[]
  status: ProductStatus
  visible: boolean
  featured: boolean
  pinned?: boolean
  pinned_until?: string | null
  sort_order: number
  season?: string
  estimated_delivery: string
  personalizable: boolean
  personalization_hint?: string
  shipping_height_cm?: number
  shipping_width_cm?: number
  shipping_length_cm?: number
  shipping_weight_g?: number
  packaging_cost?: number
  // Solo para admin
  cost?: number
  cost_breakdown?: Json
  view_count: number
  created_at: string
  updated_at: string
  // Join
  category?: Category
}

export interface Customer {
  id: string
  email: string
  full_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id: string
  name: string
  variant?: ProductVariant
  color?: string
  qty: number
  personalization?: string
  unit_price: number
  // Para cálculo de envío
  shipping_height_cm?: number
  shipping_width_cm?: number
  shipping_length_cm?: number
  shipping_weight_g?: number
}

export interface Order {
  id: string
  order_number: number
  customer_id?: string
  guest_email?: string
  guest_name?: string
  guest_phone?: string
  province: string
  city: string
  postal_code: string
  items: OrderItem[]
  subtotal: number
  delivery_type: DeliveryType
  transporte?: string
  tracking_code?: string
  tracking_url?: string
  shipping_cost: number
  total: number
  payment_method?: PaymentMethod
  box_height_cm?: number
  box_width_cm?: number
  box_length_cm?: number
  box_weight_g?: number
  status: OrderStatus
  notes?: string
  ordered_at: string
  delivery_date?: string
  dispatch_date?: string
  receipt_number?: number
  receipt_issued_at?: string
  receipt_type?: 'X' | 'E'
  created_at: string
  updated_at: string
  // Join
  customer?: Customer
}

export interface CustomRequest {
  id: string
  customer_name: string
  contact_type: ContactType
  contact_value: string
  description: string
  approximate_size?: string
  reference_photo_url?: string
  status: CustomRequestStatus
  internal_notes?: string
  created_at: string
  updated_at: string
}

export interface IncomeEntry {
  id: string
  date: string
  amount: number
  description?: string
  order_id?: string
  created_at: string
}

export interface ExpenseEntry {
  id: string
  date: string
  amount: number
  category: string
  note?: string
  created_at: string
}

export interface Withdrawal {
  id: string
  date: string
  amount: number
  note?: string
  created_at: string
}

export interface CalculatorDefaults {
  id: string
  filament_price_per_kg: number
  kwh_price: number
  machine_wear_per_hour: number
  default_margin_pct: number
  ml_commission_pct: number
  updated_at: string
}
