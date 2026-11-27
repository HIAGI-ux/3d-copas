import { BusinessConfig } from '@/types'
import Link from 'next/link'

export default function BannerTemporada({ config }: { config: BusinessConfig }) {
  if (!config.banner_active) return null
  const hasImage = Boolean(config.banner_image_url)

  return (
    <section
      className={`relative min-h-[260px] sm:min-h-[360px] flex items-center justify-center overflow-hidden ${
        hasImage ? 'bg-neutral-900' : 'bg-neutral-100 border-b border-neutral-200'
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
      {hasImage && <div className="absolute inset-0 bg-black/45" />}

      <div className="relative z-10 text-center px-6 py-12 max-w-3xl mx-auto">
        {config.banner_title && (
          <h1
            className={`text-3xl sm:text-5xl font-semibold tracking-tight mb-3 ${
              hasImage ? 'text-white' : 'text-neutral-900'
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
            className={`inline-block px-7 py-3 text-xs uppercase tracking-widest font-semibold rounded-md transition-colors ${
              hasImage
                ? 'bg-white text-neutral-900 hover:bg-neutral-100'
                : 'bg-neutral-900 text-white hover:bg-neutral-800'
            }`}
          >
            {config.banner_button_text}
          </Link>
        )}
      </div>
    </section>
  )
}
