'use client'

import PriceCalculator from '@/components/admin/PriceCalculator'

export default function AdminCalculadoraPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-black text-copas-marino">
          Calculadora de precios
        </h1>
        <p className="text-sm text-copas-plata-oscuro">
          Calculá costos de filamento, luz, desgaste, fallas, mano de obra y comisiones.
        </p>
      </div>
      <PriceCalculator />
    </div>
  )
}
