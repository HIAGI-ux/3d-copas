import { CartProvider } from '@/context/CartContext'
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import CookieBanner from '@/components/store/CookieBanner'
import { LocalBusinessSchema } from '@/components/store/JsonLdSchema'
import { createClient } from '@/lib/supabase/server'
import { BusinessConfig } from '@/types'
import { MessageCircle } from 'lucide-react'

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
  const whatsappUrl = businessConfig?.whatsapp
    ? `https://wa.me/${businessConfig.whatsapp}?text=${encodeURIComponent(
        'Hola, vi la tienda 3D Copas y quiero hacer una consulta.'
      )}`
    : null

  return (
    <CartProvider>
      <LocalBusinessSchema />
      <div className="min-h-screen flex flex-col bg-white text-neutral-900">
        <StoreHeader config={businessConfig} />
        <main className="flex-1">{children}</main>
        <StoreFooter config={businessConfig} />
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Consultar por WhatsApp"
            title="Consultar por WhatsApp"
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all text-xs font-semibold"
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        )}
        <CookieBanner />
      </div>
    </CartProvider>
  )
}
