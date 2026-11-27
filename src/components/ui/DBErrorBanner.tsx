export default function DBErrorBanner() {
  return (
    <div className="bg-copas-rojo/10 border border-copas-rojo rounded-lg p-4 flex items-start gap-3">
      <span className="text-copas-rojo text-2xl">⚠️</span>
      <div>
        <p className="font-heading font-bold text-copas-rojo">Error de conexión</p>
        <p className="text-sm text-copas-marino">
          No se pudo conectar con la base de datos. Si el problema persiste,
          contactame por WhatsApp.
        </p>
      </div>
    </div>
  )
}
