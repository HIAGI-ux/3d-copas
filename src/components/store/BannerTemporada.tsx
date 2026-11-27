import { BusinessConfig } from '@/types'
import Link from 'next/link'

export default function BannerTemporada({ config }: { config: BusinessConfig }) {
  if (!config.banner_active) return null
  return (
    <div
      className="relative min-h-[200px] sm:min-h-[240px] flex items-center justify-center overflow-hidden"
      style={
        config.banner_image_url
          ? {
              backgroundImage: `url(${config.banner_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { background: 'linear-gradient(135deg, #0F1B3D 0%, #2456D6 100%)' }
      }
    >
      <div className="absolute inset-0 bg-copas-marino/65" />
      <div className="relative z-10 text-center px-6 py-10 max-w-3xl mx-auto">
        {config.banner_title && (
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-white mb-2">
            {config.banner_title}
          </h1>
        )}
        {config.banner_subtitle && (
          <p className="text-copas-crema text-base sm:text-lg mb-6">{config.banner_subtitle}</p>
        )}
        {config.banner_button_text && config.banner_button_url && (
          <Link
            href={config.banner_button_url}
            className="inline-block bg-copas-dorado text-copas-marino px-6 py-3 rounded-lg font-heading font-bold hover:brightness-110 transition-all shadow-md"
          >
            {config.banner_button_text}
          </Link>
        )}
      </div>
    </div>
  )
}
