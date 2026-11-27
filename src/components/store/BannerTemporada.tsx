import { BusinessConfig } from '@/types'
import Link from 'next/link'

export default function BannerTemporada({ config }: { config: BusinessConfig }) {
  if (!config.banner_active) return null
  const hasImage = Boolean(config.banner_image_url)

  return (
    <section
      className={`relative min-h-[260px] sm:min-h-[360px] flex items-center justify-center overflow-hidden ${
        hasImage ? 'bg-[#0F172A]' : 'bg-neutral-50 border-b border-neutral-200'
      }`}
      style={
        hasImage
          ? {
              backgroundImage: `url(${config.banner_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {hasImage && <div className="absolute inset-0 bg-[#0F172A]/55" />}

      <div className="relative z-10 text-center px-6 py-12 max-w-3xl mx-auto">
        {config.banner_title && (
          <h1
            className={`text-3xl sm:text-5xl font-bold tracking-tight mb-3 ${
              hasImage ? 'text-white' : 'text-[#0F172A]'
            }`}
          >
            {config.banner_title}
          </h1>
        )}
        {config.banner_subtitle && (
          <p
            className={`text-sm sm:text-base max-w-xl mx-auto mb-7 leading-relaxed ${
              hasImage ? 'text-neutral-200' : 'text-neutral-600'
            }`}
          >
            {config.banner_subtitle}
          </p>
        )}
        {config.banner_button_text && config.banner_button_url && (
          <Link
            href={config.banner_button_url}
            className="inline-block bg-[#0D52D6] hover:bg-[#0941AB] text-white px-8 py-3.5 text-sm font-semibold rounded-full transition-colors shadow-sm"
          >
            {config.banner_button_text}
          </Link>
        )}
      </div>
    </section>
  )
}
