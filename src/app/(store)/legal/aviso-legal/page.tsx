import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aviso Legal | 3D Copas',
  description: 'Información legal de 3D Copas, emprendimiento de impresión 3D ubicado en Balcarce, Buenos Aires, Argentina.',
  robots: { index: false },
}

export default function AvisoLegalPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="text-sm text-blue-600 hover:underline mb-8 inline-block">
        ← Volver a la tienda
      </Link>
      <h1 className="font-heading text-3xl font-bold text-[#0F172A] mb-8">Aviso Legal</h1>

      <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">1. Datos del titular</h2>
          <p>
            Este sitio web es operado por <strong>3D Copas</strong>, emprendimiento unipersonal de
            impresión 3D con domicilio en la ciudad de <strong>Balcarce, Provincia de Buenos Aires,
            República Argentina</strong>.
          </p>
          <p className="mt-2">
            Podés contactarnos a través de WhatsApp al{' '}
            <a href="https://wa.me/5492266466387" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              +54 9 2266 466387
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">2. Objeto y actividad</h2>
          <p>
            3D Copas se dedica a la fabricación y venta de productos de impresión 3D hechos a pedido,
            incluyendo cortantes para cerámica y galletitas, sellos, luces personalizadas y otros
            artículos. Todos los productos son fabricados artesanalmente en Balcarce y enviados a
            todo el territorio argentino.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">3. Propiedad intelectual</h2>
          <p>
            Los contenidos de este sitio web (textos, imágenes, diseños, logotipos y código fuente)
            son propiedad de 3D Copas o de sus respectivos autores, y están protegidos por la
            legislación argentina sobre propiedad intelectual (Ley 11.723 y modificatorias).
          </p>
          <p className="mt-2">
            Queda prohibida su reproducción, distribución o comunicación pública sin autorización
            expresa del titular.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">4. Responsabilidad</h2>
          <p>
            3D Copas no se hace responsable de los daños derivados del uso inadecuado del sitio
            web ni de la información contenida en él. Los precios, disponibilidad y características
            de los productos pueden modificarse sin previo aviso.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">5. Legislación aplicable</h2>
          <p>
            Las presentes condiciones se rigen por la legislación argentina vigente. Para cualquier
            controversia, las partes se someten a la jurisdicción de los Juzgados y Tribunales de la
            ciudad de Balcarce, Provincia de Buenos Aires.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#0F172A] mb-2">6. Derechos del consumidor</h2>
          <p>
            Conforme a la Ley 24.240 de Defensa del Consumidor y sus modificatorias, los
            consumidores gozan de todos los derechos reconocidos por dicha normativa, incluyendo el
            derecho de arrepentimiento dentro de los 10 días hábiles posteriores a la recepción del
            producto.
          </p>
        </section>

        <p className="text-xs text-neutral-400 mt-8">
          Última actualización: noviembre de 2026.
        </p>
      </div>
    </div>
  )
}
