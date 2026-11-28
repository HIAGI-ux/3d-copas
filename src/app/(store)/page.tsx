import { createClient } from '@/lib/supabase/server'
import { BusinessConfig, Product, Category } from '@/types'
import BannerTemporada from '@/components/store/BannerTemporada'
import ProductosDestacados from '@/components/store/ProductosDestacados'
import CatalogoProductos from '@/components/store/CatalogoProductos'
import ModalPersonalizado from '@/components/store/ModalPersonalizado'
import DBErrorBanner from '@/components/ui/DBErrorBanner'
import { Truck, MapPin, CreditCard, SlidersHorizontal } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: { categoria?: string; buscar?: string; modal?: string }
}) {
  const supabase = createClient()

  const [configRes, categoriesRes, productsRes] = await Promise.all([
    supabase
      .from('business_config')
      .select(
        'id,name,slogan,logo_url,whatsapp,welcome_message,banner_active,banner_title,banner_subtitle,banner_image_url,banner_button_text,banner_button_url'
      )
      .single(),
    supabase.from('categories').select('*').order('sort_order'),
    supabase
      .from('products')
      .select(
        'id,name,slug,description,category_id,photos,main_photo_index,variants,colors,labels,status,visible,featured,pinned,pinned_until,sort_order,season,estimated_delivery,personalizable,personalization_hint,shipping_height_cm,shipping_width_cm,shipping_length_cm,shipping_weight_g,view_count,created_at,updated_at,category:categories(id,name,slug,icon)'
      )
      .eq('visible', true)
      .order('pinned', { ascending: false })
      .order('sort_order'),
  ])

  if (configRes.error || productsRes.error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <DBErrorBanner />
      </div>
    )
  }

  const config = configRes.data as BusinessConfig
  const categories = (categoriesRes.data || []) as Category[]
  const rawProducts = (productsRes.data || []) as unknown as Product[]

  const today = new Date().toISOString().slice(0, 10)
  const isActivelyPinned = (p: Product) =>
    Boolean(p.pinned && (!p.pinned_until || p.pinned_until >= today))

  const products = [...rawProducts].sort((a, b) => {
    const aPinned = isActivelyPinned(a) ? 1 : 0
    const bPinned = isActivelyPinned(b) ? 1 : 0
    if (aPinned !== bPinned) return bPinned - aPinned
    return a.sort_order - b.sort_order
  })

  const featured = products
    .filter((p) => p.featured)
    .sort((a, b) => a.sort_order - b.sort_order)
  const showPersonalModal = searchParams.modal === 'personalizado'

  return (
    <>
      {config.banner_active && <BannerTemporada config={config} />}

      {/* Barra de beneficios estilo Tiendanube con colores del logo */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-[#0D52D6] rounded-full p-2.5 shrink-0">
              <Truck size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F172A]">Envíos a todo el país</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Andreani, Correo y Via Cargo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-[#0D52D6] rounded-full p-2.5 shrink-0">
              <MapPin size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F172A]">Retiro en Balcarce</p>
              <p className="text-xs text-neutral-500 mt-0.5">Sin cargo coordinando horario</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-[#0D52D6] rounded-full p-2.5 shrink-0">
              <CreditCard size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F172A]">Transferencia o efectivo</p>
              <p className="text-xs text-neutral-500 mt-0.5">Coordinación por WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-[#0D52D6] rounded-full p-2.5 shrink-0">
              <SlidersHorizontal size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F172A]">Impresión 3D a medida</p>
              <p className="text-xs text-neutral-500 mt-0.5">Diseños y tamaños propios</p>
            </div>
          </div>
        </div>
      </section>

      {config.welcome_message && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-blue-50/70 border border-blue-100 px-4 py-3 rounded-xl text-center">
            <p className="text-sm text-[#0F172A] font-medium">{config.welcome_message}</p>
          </div>
        </div>
      )}

      {featured.length > 0 && <ProductosDestacados products={featured} />}

      <CatalogoProductos
        products={products}
        categories={categories}
        initialCategory={searchParams.categoria}
        initialSearch={searchParams.buscar}
        whatsapp={config.whatsapp}
      />

      {showPersonalModal && <ModalPersonalizado whatsapp={config.whatsapp} />}
    </>
  )
}
