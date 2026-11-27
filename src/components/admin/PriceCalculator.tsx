'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalculatorDefaults } from '@/types'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

interface PriceCalculatorProps {
  onApplyPrice?: (suggestedPrice: number, cost: number, breakdown: Record<string, number>) => void
}

export default function PriceCalculator({ onApplyPrice }: PriceCalculatorProps) {
  const supabase = createClient()
  const [defaultsId, setDefaultsId] = useState<string | null>(null)
  const [savingDefaults, setSavingDefaults] = useState(false)

  // Parámetros de la pieza / pack
  const [isPack, setIsPack] = useState(false)
  const [packQty, setPackQty] = useState(1)

  const [grams, setGrams] = useState(35)
  const [filamentPriceKg, setFilamentPriceKg] = useState(25000)
  const [printHours, setPrintHours] = useState(2.5)
  const [printerWatts, setPrinterWatts] = useState(150)
  const [kwhPrice, setKwhPrice] = useState(120)
  const [wearPerHour, setWearPerHour] = useState(500)
  const [failurePct, setFailurePct] = useState(10)
  const [packagingAndSupplies, setPackagingAndSupplies] = useState(300)
  const [laborMinutes, setLaborMinutes] = useState(10)
  const [laborHourlyRate, setLaborHourlyRate] = useState(4000)
  const [marginPct, setMarginPct] = useState(60)
  const [platformCommissionPct, setPlatformCommissionPct] = useState(0)

  useEffect(() => {
    const loadDefaults = async () => {
      const { data } = await supabase.from('calculator_defaults').select('*').single()
      if (data) {
        const d = data as CalculatorDefaults
        setDefaultsId(d.id)
        setFilamentPriceKg(Number(d.filament_price_per_kg))
        setKwhPrice(Number(d.kwh_price))
        setWearPerHour(Number(d.machine_wear_per_hour))
        setMarginPct(Number(d.default_margin_pct))
      }
    }
    loadDefaults()
  }, [supabase])

  // Cálculos
  const filamentCost = (grams / 1000) * filamentPriceKg
  const electricityCost = (printerWatts / 1000) * printHours * kwhPrice
  const wearCost = printHours * wearPerHour
  const baseProdCost = filamentCost + electricityCost + wearCost
  const failureCost = baseProdCost * (failurePct / 100)
  const laborCost = (laborMinutes / 60) * laborHourlyRate

  const unitCost = baseProdCost + failureCost + packagingAndSupplies + laborCost
  const effectiveQty = isPack ? Math.max(1, packQty) : 1
  const totalCost = unitCost * effectiveQty

  // Precio antes de comisión: costo * (1 + margen/100)
  const priceBeforeCommission = totalCost * (1 + marginPct / 100)
  // Si hay comisión de plataforma (ej: ML 17%), ajustamos para mantener el margen neto
  const suggestedPrice =
    platformCommissionPct > 0 && platformCommissionPct < 100
      ? priceBeforeCommission / (1 - platformCommissionPct / 100)
      : priceBeforeCommission

  const netRevenue = suggestedPrice * (1 - platformCommissionPct / 100)
  const profit = netRevenue - totalCost

  const handleSaveDefaults = async () => {
    setSavingDefaults(true)
    const payload = {
      filament_price_per_kg: filamentPriceKg,
      kwh_price: kwhPrice,
      machine_wear_per_hour: wearPerHour,
      default_margin_pct: marginPct,
      ml_commission_pct: platformCommissionPct,
    }
    const { error } = defaultsId
      ? await supabase.from('calculator_defaults').update(payload).eq('id', defaultsId)
      : await supabase.from('calculator_defaults').insert(payload)

    setSavingDefaults(false)
    if (error) {
      toast.error('No se pudieron guardar los valores por defecto.')
    } else {
      toast.success('Valores por defecto guardados.')
    }
  }

  return (
    <div className="bg-white rounded-card border border-copas-plata p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-black text-copas-marino">
            Calculadora de costos y precios
          </h2>
          <p className="text-xs text-copas-plata-oscuro">
            Calculá el costo real por pieza o por pack y el precio sugerido de venta.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm font-heading font-bold text-copas-marino cursor-pointer bg-copas-crema px-3 py-1.5 rounded-lg border border-copas-plata">
          <input
            type="checkbox"
            checked={isPack}
            onChange={(e) => {
              setIsPack(e.target.checked)
              if (!e.target.checked) setPackQty(1)
              else if (packQty < 2) setPackQty(4)
            }}
            className="w-4 h-4 accent-copas-azul"
          />
          Calcular como Pack
        </label>
      </div>

      {isPack && (
        <div className="bg-copas-azul/5 border border-copas-azul/30 rounded-lg p-3">
          <Input
            label="Cantidad de piezas en el pack"
            type="number"
            min={2}
            value={packQty}
            onChange={(e) => setPackQty(Math.max(2, Number(e.target.value)))}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Input
          label="Filamento por pieza (gramos)"
          type="number"
          min={0}
          step="0.1"
          value={grams}
          onChange={(e) => setGrams(Number(e.target.value))}
        />
        <Input
          label="Precio del kilo de filamento ($)"
          type="number"
          min={0}
          value={filamentPriceKg}
          onChange={(e) => setFilamentPriceKg(Number(e.target.value))}
        />
        <Input
          label="Horas de impresión"
          type="number"
          min={0}
          step="0.1"
          value={printHours}
          onChange={(e) => setPrintHours(Number(e.target.value))}
        />
        <Input
          label="Consumo impresora (Watts)"
          type="number"
          min={0}
          value={printerWatts}
          onChange={(e) => setPrinterWatts(Number(e.target.value))}
        />
        <Input
          label="Precio del kWh ($)"
          type="number"
          min={0}
          value={kwhPrice}
          onChange={(e) => setKwhPrice(Number(e.target.value))}
        />
        <Input
          label="Desgaste máquina ($/hora)"
          type="number"
          min={0}
          value={wearPerHour}
          onChange={(e) => setWearPerHour(Number(e.target.value))}
        />
        <Input
          label="Margen de fallas (%)"
          type="number"
          min={0}
          max={100}
          value={failurePct}
          onChange={(e) => setFailurePct(Number(e.target.value))}
        />
        <Input
          label="Packaging / imanes / insumos ($)"
          type="number"
          min={0}
          value={packagingAndSupplies}
          onChange={(e) => setPackagingAndSupplies(Number(e.target.value))}
        />
        <Input
          label="Mano de obra (minutos)"
          type="number"
          min={0}
          value={laborMinutes}
          onChange={(e) => setLaborMinutes(Number(e.target.value))}
        />
        <Input
          label="Valor hora mano de obra ($)"
          type="number"
          min={0}
          value={laborHourlyRate}
          onChange={(e) => setLaborHourlyRate(Number(e.target.value))}
        />
        <Input
          label="Ganancia deseada (%)"
          type="number"
          min={0}
          value={marginPct}
          onChange={(e) => setMarginPct(Number(e.target.value))}
        />
        <Input
          label="Comisión plataforma ej. ML (%)"
          type="number"
          min={0}
          max={90}
          value={platformCommissionPct}
          onChange={(e) => setPlatformCommissionPct(Number(e.target.value))}
        />
      </div>

      {/* Desglose y resultados */}
      <div className="bg-copas-crema rounded-xl p-4 border border-copas-plata space-y-2">
        <p className="font-heading font-bold text-sm text-copas-marino">
          Desglose de costo {isPack ? `(x${effectiveQty} piezas)` : 'por unidad'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-copas-plata-oscuro">
          <span>Filamento: {formatPrice(filamentCost * effectiveQty)}</span>
          <span>Electricidad: {formatPrice(electricityCost * effectiveQty)}</span>
          <span>Desgaste: {formatPrice(wearCost * effectiveQty)}</span>
          <span>Fallas ({failurePct}%): {formatPrice(failureCost * effectiveQty)}</span>
          <span>Insumos/Pack: {formatPrice(packagingAndSupplies * effectiveQty)}</span>
          <span>Mano de obra: {formatPrice(laborCost * effectiveQty)}</span>
        </div>

        <div className="border-t border-copas-plata pt-3 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-copas-plata-oscuro">Costo total</p>
            <p className="font-heading text-xl font-black text-copas-marino">
              {formatPrice(totalCost)}
            </p>
          </div>
          <div>
            <p className="text-xs text-copas-plata-oscuro">Precio sugerido de venta</p>
            <p className="font-heading text-2xl font-black text-copas-azul">
              {formatPrice(suggestedPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-copas-plata-oscuro">Tu ganancia neta</p>
            <p className="font-heading text-xl font-black text-copas-verde">
              {formatPrice(profit)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" loading={savingDefaults} onClick={handleSaveDefaults}>
          Guardar valores generales por defecto
        </Button>
        {onApplyPrice && (
          <Button
            size="sm"
            onClick={() =>
              onApplyPrice(Math.round(suggestedPrice), Math.round(totalCost), {
                filamentCost: Math.round(filamentCost * effectiveQty),
                electricityCost: Math.round(electricityCost * effectiveQty),
                wearCost: Math.round(wearCost * effectiveQty),
                failureCost: Math.round(failureCost * effectiveQty),
                packagingAndSupplies: Math.round(packagingAndSupplies * effectiveQty),
                laborCost: Math.round(laborCost * effectiveQty),
              })
            }
          >
            ✅ Usar este precio en el producto
          </Button>
        )}
      </div>
    </div>
  )
}
