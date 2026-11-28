import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada | 3D Copas',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6 p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-3d-copas.png"
        alt="3D Copas"
        className="h-16 w-auto object-contain opacity-80"
      />
      <div>
        <p className="text-7xl font-heading font-black text-[#0D52D6] leading-none">404</p>
        <h1 className="font-heading text-2xl font-bold text-[#0F172A] mt-3">
          Esta página no existe
        </h1>
        <p className="text-neutral-500 mt-2 text-sm max-w-sm mx-auto">
          Puede que hayas escrito mal la dirección, o que el producto que buscabas ya no esté disponible.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="bg-[#0D52D6] text-white px-6 py-3 rounded-full font-heading font-bold hover:bg-[#0F172A] transition-colors text-sm"
        >
          Ver el catálogo
        </Link>
        <a
          href="https://wa.me/5492266466387?text=Hola%2C+busco+un+producto+en+3D+Copas"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-[#0D52D6] text-[#0D52D6] px-6 py-3 rounded-full font-heading font-bold hover:bg-blue-50 transition-colors text-sm"
        >
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  )
}
