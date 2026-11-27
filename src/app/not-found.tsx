import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-copas-crema gap-6 p-6">
      <div className="text-6xl">♣</div>
      <h1 className="font-heading text-3xl font-bold text-copas-marino">Página no encontrada</h1>
      <p className="text-copas-plata-oscuro text-center">
        Esta página no existe o fue movida.
      </p>
      <Link
        href="/"
        className="bg-copas-azul text-white px-6 py-3 rounded-lg font-heading font-bold hover:bg-copas-marino transition-colors"
      >
        Volver a la tienda
      </Link>
    </div>
  )
}
