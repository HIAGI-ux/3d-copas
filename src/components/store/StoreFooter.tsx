import { BusinessConfig } from '@/types'
import Link from 'next/link'

export default function StoreFooter({ config }: { config: BusinessConfig | null }) {
  const instagramUrl = config?.instagram
    ? config.instagram.startsWith('http')
      ? config.instagram
      : `https://instagram.com/${config.instagram.replace('@', '')}`
    : null
  const tiktokUrl = config?.tiktok
    ? config.tiktok.startsWith('http')
      ? config.tiktok
      : `https://tiktok.com/@${config.tiktok.replace('@', '')}`
    : null
  const facebookUrl = config?.facebook
    ? config.facebook.startsWith('http')
      ? config.facebook
      : `https://facebook.com/${config.facebook}`
    : null
  const whatsappUrl = config?.whatsapp ? `https://wa.me/${config.whatsapp}` : null

  const activeTransportes = (config?.transportes || [])
    .filter((t) => t.active)
    .sort((a, b) => a.order - b.order)
    .map((t) => t.name)
    .join(', ')

  return (
    <footer className="bg-[#0F172A] text-neutral-300 mt-16 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config?.logo_url || '/logo-3d-copas.png'}
                alt={config?.name || '3D Copas'}
                className="h-10 w-auto object-contain bg-white rounded-md px-1.5 py-0.5"
              />
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {config?.footer_text || config?.slogan || 'Impresión 3D a pedido desde Balcarce.'}
            </p>
            <p className="text-xs text-neutral-400 mt-3">
              Envíos a toda la Argentina{activeTransportes ? ` (${activeTransportes})` : ''}.
            </p>
          </div>

          {/* Información de compra */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Información de compra
            </h4>
            <div className="space-y-2.5 text-xs text-neutral-400 leading-relaxed">
              {config?.delivery_times_text && (
                <p>
                  <span className="text-neutral-200 font-medium">Tiempos de entrega:</span>{' '}
                  {config.delivery_times_text}
                </p>
              )}
              {config?.exchange_policy && (
                <p>
                  <span className="text-neutral-200 font-medium">Cambios:</span>{' '}
                  {config.exchange_policy}
                </p>
              )}
              {config?.returns_policy && (
                <p>
                  <span className="text-neutral-200 font-medium">Arrepentimiento:</span>{' '}
                  {config.returns_policy}
                </p>
              )}
              <div className="pt-1">
                <Link href="/cuenta" className="text-blue-400 hover:text-white underline">
                  Seguir mi pedido
                </Link>
              </div>
            </div>
          </div>

          {/* Contacto y redes */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Contacto y redes
            </h4>
            <div className="flex flex-col space-y-2 text-xs sm:text-sm text-neutral-400">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  TikTok
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Facebook
                </a>
              )}
              {config?.email && (
                <a
                  href={`mailto:${config.email}`}
                  className="hover:text-white transition-colors pt-1"
                >
                  {config.email}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <span>
            © {new Date().getFullYear()} {config?.name || '3D Copas'}. Todos los derechos reservados.
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/legal/aviso-legal" className="hover:text-neutral-300 transition-colors">
              Aviso legal
            </Link>
            <Link href="/legal/politica-privacidad" className="hover:text-neutral-300 transition-colors">
              Privacidad
            </Link>
            <Link href="/legal/politica-cookies" className="hover:text-neutral-300 transition-colors">
              Cookies
            </Link>
            <span className="text-neutral-700">Balcarce, Buenos Aires, Argentina</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
