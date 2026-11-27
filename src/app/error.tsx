'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-copas-crema gap-6 p-6">
      <div className="text-6xl">⚠️</div>
      <h1 className="font-heading text-3xl font-bold text-copas-marino">Algo salió mal</h1>
      <p className="text-copas-plata-oscuro text-center">
        Hubo un error inesperado. Si el problema persiste, contactame por WhatsApp.
      </p>
      <button
        onClick={reset}
        className="bg-copas-azul text-white px-6 py-3 rounded-lg font-heading font-bold hover:bg-copas-marino transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
