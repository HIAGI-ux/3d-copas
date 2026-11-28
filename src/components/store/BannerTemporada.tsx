import { BusinessConfig } from '@/types'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function BannerTemporada({ config }: { config: BusinessConfig }) {
  if (!config.banner_active) return null
  const hasImage = Boolean(config.banner_image_url)

  return (
    <section
      className={`relative min-h-[280px] sm:min-h-[380px] flex items-center justify-center overflow-hidden ${
        hasImage
          ? 'bg-[#0F172A]'
          : 'bg-gradient-to-br from-slate-50 via-blue-50/45 to-white border-b border-neutral-200/80'
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
      {hasImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/50 to-[#0F172A]/35" />
      )}

      {!hasImage && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl"
        />
      )}

      <div className="relative z-10 text-center px-6 py-12 sm:py-16 max-w-3xl mx-auto">
        <div
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full mb-4 ${
            hasImage
              ? 'bg-white/15 text-white backdrop-blur-sm border border-white/20'
              : 'bg-blue-50 text-[#0D52D6] border border-blue-100'
          }`}
        >
          <Sparkles size={12} />
          Impresión 3D de precisión · Balcarce
        </div>

        {config.banner_title && (
          <h1
            className={`text-3xl sm:text-5xl font-bold tracking-tight leading-[1.12] mb-4 ${
              hasImage ? 'text-white' : 'text-[#0F172A]'
            }`}
          >
            {config.banner_title}
          </h1>
        )}

        {config.banner_subtitle && (
          <p
            className={`text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed ${
              hasImage ? 'text-neutral-200' : 'text-neutral-600'
            }`}
          >
            {config.banner_subtitle}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {config.banner_button_text && config.banner_button_url ? (
            <Link
              href={config.banner_button_url}
              className="inline-flex items-center gap-2 bg-[#0D52D6] hover:bg-[#0941AB] text-white px-7 py-3.5 text-sm font-semibold rounded-full transition-all shadow-sm hover:shadow"
            >
              {config.banner_button_text}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2 bg-[#0D52D6] hover:bg-[#0941AB] text-white px-7 py-3.5 text-sm font-semibold rounded-full transition-all shadow-sm hover:shadow"
            >
              Explorar catálogo
              <ArrowRight size={16} />
            </a>
          )}

          <Link
            href="/?modal=personalizado"
            className={`inline-flex items-center px-6 py-3.5 text-sm font-semibold rounded-full transition-colors border ${
              hasImage
                ? 'border-white/40 text-white hover:bg-white/10 backdrop-blur-sm'
                : 'border-neutral-300 text-[#0F172A] bg-white hover:border-[#0D52D6] hover:text-[#0D52D6]'
            }`}
          >
            Pedir diseño a medida
          </Link>
        </div>
      </div>
    </section>
  )
}
