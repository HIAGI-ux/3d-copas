import { CartProvider } from '@/context/CartContext'
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import { createClient } from '@/lib/supabase/server'
import { BusinessConfig } from '@/types'

export const dynamic = 'force-dynamic'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: config } = await supabase
    .from('business_config')
    .select(
      'id,name,slogan,logo_url,whatsapp,email,instagram,tiktok,facebook,other_links,local_province,local_city,local_postal_codes,transportes,garmendia_weight_threshold,garmendia_bultos_threshold,returns_policy,exchange_policy,delivery_times_text,footer_text,welcome_message,banner_active,banner_title,banner_subtitle,banner_image_url,banner_button_text,banner_button_url,color_primary,color_secondary,color_accent'
    )
    .single()

  const businessConfig = config as BusinessConfig | null

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-white text-neutral-900">
        <StoreHeader config={businessConfig} />
        <main className="flex-1">{children}</main>
        <StoreFooter config={businessConfig} />
      </div>
    </CartProvider>
  )
}
