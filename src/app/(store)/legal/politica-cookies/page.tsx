import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cookies | 3D Copas',
  description: 'Información sobre el uso de cookies en la tienda 3D Copas.',
  robots: { index: false },
}

export default function PoliticaCookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="text-sm text-blue-600 hover:underline mb-8 inline-block">
        ← Volver a la tienda
      </Link>
      <h1 className="font-heading text-3xl font-bold text-[#0F172A] mb-8">Política de Cookies</h1>

      <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que un sitio web almacena en tu dispositivo
            cuando lo visitás. Sirven para recordar información entre visitas y hacer que el sitio
            funcione correctamente.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">¿Qué cookies usamos?</h2>
          <p>
            En <strong>3D Copas</strong> usamos únicamente <strong>cookies técnicas estrictamente
            necesarias</strong>. Estas cookies no rastrean tu actividad ni se comparten con
            terceros. No usamos cookies publicitarias ni de seguimiento.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-neutral-200">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-neutral-200 px-3 py-2 text-left font-semibold">Cookie</th>
                  <th className="border border-neutral-200 px-3 py-2 text-left font-semibold">Proveedor</th>
                  <th className="border border-neutral-200 px-3 py-2 text-left font-semibold">Finalidad</th>
                  <th className="border border-neutral-200 px-3 py-2 text-left font-semibold">Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-200 px-3 py-2">sb-* (sesión)</td>
                  <td className="border border-neutral-200 px-3 py-2">Supabase</td>
                  <td className="border border-neutral-200 px-3 py-2">Mantener tu sesión iniciada en la tienda</td>
                  <td className="border border-neutral-200 px-3 py-2">Sesión / 1 semana</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="border border-neutral-200 px-3 py-2">cookies-accepted</td>
                  <td className="border border-neutral-200 px-3 py-2">3D Copas</td>
                  <td className="border border-neutral-200 px-3 py-2">Recordar que ya aceptaste este aviso</td>
                  <td className="border border-neutral-200 px-3 py-2">1 año</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">¿Cómo desactivar las cookies?</h2>
          <p>
            Podés configurar tu navegador para que rechace las cookies o te avise antes de aceptarlas.
            Tené en cuenta que si deshabilitás las cookies técnicas, es posible que algunas funciones
            de la tienda (como mantener tu sesión o el carrito de compras) no funcionen correctamente.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <a href="https://support.google.com/chrome/answer/95647" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Instrucciones para Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Instrucciones para Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/es-ar/guide/safari/sfri11471/mac" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Instrucciones para Safari
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">Más información</h2>
          <p>
            Podés consultar nuestra{' '}
            <Link href="/legal/politica-privacidad" className="text-blue-600 hover:underline">
              Política de Privacidad
            </Link>{' '}
            y nuestro{' '}
            <Link href="/legal/aviso-legal" className="text-blue-600 hover:underline">
              Aviso Legal
            </Link>{' '}
            para más información. Ante cualquier consulta, contactanos por{' '}
            <a href="https://wa.me/5492266466387" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>.
          </p>
        </section>

        <p className="text-xs text-neutral-400 mt-8">
          Última actualización: noviembre de 2026.
        </p>
      </div>
    </div>
  )
}
