'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookies-accepted')
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookies-accepted', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 inset-x-0 z-50 bg-[#0F172A] text-neutral-200 px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 shadow-2xl border-t border-neutral-700"
    >
      <p className="text-xs flex-1 leading-relaxed">
        Usamos cookies técnicas necesarias para que la tienda funcione correctamente. No usamos
        cookies publicitarias.{' '}
        <Link href="/legal/politica-cookies" className="underline hover:text-white">
          Más información
        </Link>.
      </p>
      <button
        onClick={accept}
        className="shrink-0 bg-[#0D52D6] hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
      >
        Aceptar
      </button>
    </div>
  )
}
