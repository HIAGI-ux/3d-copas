import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Product } from '@/types'
import ProductDetailClient from '@/components/store/ProductDetailClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('name, description, photos')
    .eq('slug', params.slug)
    .eq('visible', true)
    .single()
  if (!data) return { title: 'Producto no encontrado | 3D Copas' }
  return {
    title: `${data.name} | 3D Copas`,
    description: data.description || `${data.name} impreso en 3D a pedido en Balcarce.`,
    openGraph: {
      title: `${data.name} | 3D Copas`,
      description: data.description || `${data.name} impreso en 3D a pedido en Balcarce.`,
      images: data.photos?.[0] ? [{ url: data.photos[0] }] : [],
    },
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const [productRes, configRes] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id,name,slug,description,category_id,photos,main_photo_index,variants,colors,labels,status,visible,featured,sort_order,season,estimated_delivery,personalizable,personalization_hint,shipping_height_cm,shipping_width_cm,shipping_length_cm,shipping_weight_g,view_count,created_at,updated_at,category:categories(id,name,slug)'
      )
      .eq('slug', params.slug)
      .eq('visible', true)
      .single(),
    supabase.from('business_config').select('whatsapp').single(),
  ])

  if (productRes.error || !productRes.data) notFound()

  // Incrementar contador de vistas
  await supabase
    .from('products')
    .update({ view_count: (productRes.data.view_count || 0) + 1 })
    .eq('id', productRes.data.id)

  return (
    <ProductDetailClient
      product={productRes.data as unknown as Product}
      whatsapp={configRes.data?.whatsapp}
    />
  )
}
