import { BusinessConfig } from '@/types'

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
    <footer className="bg-copas-marino text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config?.logo_url || '/logo-3d-copas.svg'}
                alt={config?.name || '3D Copas'}
                className="w-10 h-10 rounded-full object-contain bg-white p-0.5"
              />
              <div>
                <h3 className="font-heading font-black text-lg text-copas-dorado">
                  {config?.name || '3D Copas'}
                </h3>
                <p className="text-xs text-copas-plata">
                  {config?.slogan || 'Hecho a pedido en impresión 3D'}
                </p>
              </div>
            </div>
            <p className="text-sm text-copas-plata">
              {config?.footer_text || 'Hecho a pedido en impresión 3D'}
            </p>
            <p className="text-xs text-copas-dorado font-semibold mt-3">
              🚚 Hacemos envíos a toda la Argentina
              {activeTransportes ? ` (${activeTransportes})` : ''}
            </p>
          </div>

          {/* Políticas */}
          <div>
            <h4 className="font-heading font-bold mb-3 text-white">Políticas de compra</h4>
            <div className="space-y-2 text-xs sm:text-sm text-copas-plata">
              {config?.returns_policy && (
                <p>
                  <span className="text-white font-semibold">Arrepentimiento:</span>{' '}
                  {config.returns_policy}
                </p>
              )}
              {config?.exchange_policy && (
                <p>
                  <span className="text-white font-semibold">Cambios:</span>{' '}
                  {config.exchange_policy}
                </p>
              )}
              {config?.delivery_times_text && (
                <p>
                  <span className="text-white font-semibold">Tiempos de entrega:</span>{' '}
                  {config.delivery_times_text}
                </p>
              )}
            </div>
          </div>

          {/* Contacto y redes */}
          <div>
            <h4 className="font-heading font-bold mb-3 text-white">Seguinos y consultanos</h4>
            <div className="flex flex-wrap gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-copas-plata hover:text-copas-dorado transition-colors"
                >
                  📷 Instagram
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-copas-plata hover:text-copas-dorado transition-colors"
                >
                  🎵 TikTok
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-copas-plata hover:text-copas-dorado transition-colors"
                >
                  📘 Facebook
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-copas-plata hover:text-copas-dorado transition-colors"
                >
                  💬 WhatsApp
                </a>
              )}
            </div>
            {config?.email && (
              <p className="text-xs text-copas-plata mt-3">✉️ {config.email}</p>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 text-center text-xs text-copas-plata">
          © {new Date().getFullYear()} {config?.name || '3D Copas'} — Balcarce, Buenos Aires, Argentina.
        </div>
      </div>
    </footer>
  )
}
