import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad | 3D Copas',
  description: 'Conocé cómo 3D Copas trata tus datos personales.',
  robots: { index: false },
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="text-sm text-blue-600 hover:underline mb-8 inline-block">
        ← Volver a la tienda
      </Link>
      <h1 className="font-heading text-3xl font-bold text-[#0F172A] mb-8">Política de Privacidad</h1>

      <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">1. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de los datos personales recogidos en este sitio es{' '}
            <strong>3D Copas</strong>, con domicilio en Balcarce, Provincia de Buenos Aires, Argentina.
            Podés contactarnos por WhatsApp:{' '}
            <a href="https://wa.me/5492266466387" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              +54 9 2266 466387
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">2. Datos que recopilamos</h2>
          <p>Recopilamos únicamente los datos que vos nos proporcionás voluntariamente:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Nombre y apellido</strong> — para preparar tu pedido.</li>
            <li><strong>Número de WhatsApp</strong> — para coordinar entrega y pago.</li>
            <li><strong>Dirección de envío</strong> — si solicitás envío por correo o transporte.</li>
            <li><strong>Correo electrónico</strong> — solo si creás una cuenta en la tienda (opcional).</li>
            <li><strong>Detalles del pedido</strong> — productos, cantidades y personalizaciones.</li>
          </ul>
          <p className="mt-2">
            <strong>No recopilamos</strong> datos de tarjetas de crédito, cuentas bancarias ni
            información de pago: las transacciones se coordinan directamente por WhatsApp o
            transferencia bancaria fuera de este sitio.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">3. Finalidad del tratamiento</h2>
          <p>Usamos tus datos exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Gestionar y preparar tu pedido.</li>
            <li>Coordinar la entrega y el pago.</li>
            <li>Enviarte el comprobante de tu compra.</li>
            <li>Contactarte si hay algún inconveniente con tu pedido.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">4. Almacenamiento de datos</h2>
          <p>
            Los datos se almacenan en <strong>Supabase</strong> (Supabase Inc., servidores en Amazon
            Web Services), una plataforma segura con cifrado en tránsito (HTTPS/TLS) y en reposo.
            Podés consultar la política de privacidad de Supabase en{' '}
            <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              supabase.com/privacy
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">5. Compartición de datos</h2>
          <p>
            <strong>No vendemos, alquilamos ni compartimos</strong> tus datos personales con terceros
            con fines comerciales. Solo los compartimos cuando es estrictamente necesario para
            cumplir con tu pedido (por ejemplo, con la empresa de transporte que realiza el envío).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">6. Tus derechos</h2>
          <p>
            Conforme a la Ley 25.326 de Protección de Datos Personales (Argentina), tenés derecho a:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Acceder</strong> a tus datos personales.</li>
            <li><strong>Rectificar</strong> datos incorrectos o incompletos.</li>
            <li><strong>Suprimir</strong> tus datos cuando ya no sean necesarios.</li>
            <li><strong>Oponerte</strong> al tratamiento de tus datos.</li>
          </ul>
          <p className="mt-2">
            Para ejercer estos derechos, contactanos por WhatsApp. Responderemos dentro de los 5
            días hábiles.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">7. Cookies</h2>
          <p>
            Usamos únicamente cookies técnicas necesarias para el funcionamiento de la tienda
            (sesión de usuario). No usamos cookies de rastreo publicitario ni las compartimos con
            redes publicitarias.{' '}
            <Link href="/legal/politica-cookies" className="text-blue-600 hover:underline">
              Más información sobre cookies
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">8. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos
            publicando la nueva versión en esta página con la fecha de actualización.
          </p>
        </section>

        <p className="text-xs text-neutral-400 mt-8">
          Última actualización: noviembre de 2026.
        </p>
      </div>
    </div>
  )
}
