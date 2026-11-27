import { createClient } from '@/lib/supabase/server'
import { BusinessConfig, Product, Category } from '@/types'
import BannerTemporada from '@/components/store/BannerTemporada'
import ProductosDestacados from '@/components/store/ProductosDestacados'
import CatalogoProductos from '@/components/store/CatalogoProductos'
import ModalPersonalizado from '@/components/store/ModalPersonalizado'
import DBErrorBanner from '@/components/ui/DBErrorBanner'

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
        'id,name,slug,description,category_id,photos,main_photo_index,variants,colors,labels,status,visible,featured,sort_order,season,estimated_delivery,personalizable,personalization_hint,shipping_height_cm,shipping_width_cm,shipping_length_cm,shipping_weight_g,view_count,created_at,updated_at,category:categories(id,name,slug,icon)'
      )
      .eq('visible', true)
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
  const products = (productsRes.data || []) as Product[]

  const featured = products
    .filter((p) => p.featured)
    .sort((a, b) => a.sort_order - b.sort_order)
  const showPersonalModal = searchParams.modal === 'personalizado'

  return (
    <>
      {config.banner_active && <BannerTemporada config={config} />}
      {config.welcome_message && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-copas-azul/10 border-l-4 border-copas-azul px-4 py-3 rounded-r-lg">
            <p className="text-copas-marino font-heading font-semibold">
              {config.welcome_message}
            </p>
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
