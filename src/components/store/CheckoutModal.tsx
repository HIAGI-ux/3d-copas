'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import { BusinessConfig, ARGENTINA_PROVINCES, DeliveryType } from '@/types'
import { formatPrice, isLocalDelivery } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import toast from 'react-hot-toast'

interface CheckoutModalProps {
  onClose: () => void
}

type Step = 'datos' | 'transporte' | 'pago' | 'confirmado'

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const { items, subtotal, clearCart } = useCart()
  const [step, setStep] = useState<Step>('datos')
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('envio')
  const [selectedTransporte, setSelectedTransporte] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('transferencia')

  useEffect(() => {
    const loadInitial = async () => {
      const supabase = createClient()
      const [configRes, userRes] = await Promise.all([
        supabase
          .from('business_config')
          .select(
            'id,name,whatsapp,local_province,local_city,local_postal_codes,transportes,garmendia_weight_threshold,garmendia_bultos_threshold'
          )
          .single(),
        supabase.auth.getUser(),
      ])

      if (configRes.data) setConfig(configRes.data as BusinessConfig)

      const user = userRes.data.user
      if (user && user.user_metadata?.role !== 'admin') {
        setUserId(user.id)
        if (user.email) setEmail(user.email)
        const { data: cust } = await supabase
          .from('customers')
          .select('full_name, phone')
          .eq('id', user.id)
          .single()
        if (cust?.full_name) setFullName(cust.full_name)
        if (cust?.phone) setPhone(cust.phone)
      }
    }
    loadInitial()
  }, [])

  const estimatedBox = () => {
    const totalWeight = items.reduce((sum, i) => sum + (i.shipping_weight_g || 120) * i.qty, 0)
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0)
    const totalVol = items.reduce((sum, i) => {
      const h = i.shipping_height_cm || 4
      const w = i.shipping_width_cm || 10
      const l = i.shipping_length_cm || 10
      return sum + h * w * l * i.qty
    }, 0)
    const side = Math.max(10, Math.ceil(Math.cbrt(totalVol * 1.15)))
    return { weight: totalWeight, totalQty, side }
  }

  const handleDatosSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim() || !province || !city.trim() || !postalCode.trim()) {
      toast.error('Completá todos los campos obligatorios.')
      return
    }
    if (!config) {
      toast.error('No se pudo cargar la configuración de envíos. Intentá de nuevo.')
      return
    }

    const local = isLocalDelivery(province, city, postalCode, {
      province: config.local_province,
      city: config.local_city,
      postalCodes: config.local_postal_codes || ['7620'],
    })

    setDeliveryType(local ? 'local' : 'envio')
    if (local) {
      setPaymentMethod('efectivo')
      setStep('pago')
    } else {
      setPaymentMethod('transferencia')
      setStep('transporte')
    }
  }

  const handleConfirmar = async () => {
    setLoading(true)
    const supabase = createClient()
    const box = estimatedBox()

    const orderItems = items.map((i) => ({
      product_id: i.product_id,
      name: i.product_name,
      variant: i.variant,
      color: i.color,
      qty: i.qty,
      personalization: i.personalization,
      unit_price: i.unit_price,
      shipping_height_cm: i.shipping_height_cm,
      shipping_width_cm: i.shipping_width_cm,
      shipping_length_cm: i.shipping_length_cm,
      shipping_weight_g: i.shipping_weight_g,
    }))

    const transporteObj = config?.transportes?.find((t) => t.id === selectedTransporte)
    const transporteLabel =
      deliveryType === 'envio'
        ? transporteObj?.name || 'A sugerir el más conveniente'
        : null

    const { error } = await supabase.from('orders').insert({
      customer_id: userId,
      guest_name: fullName.trim(),
      guest_phone: phone.trim(),
      guest_email: email.trim() || null,
      province,
      city: city.trim(),
      postal_code: postalCode.trim(),
      items: orderItems,
      subtotal,
      delivery_type: deliveryType,
      transporte: transporteLabel,
      shipping_cost: 0,
      total: subtotal,
      payment_method: deliveryType === 'envio' ? 'transferencia' : paymentMethod,
      box_height_cm: deliveryType === 'envio' ? box.side : null,
      box_width_cm: deliveryType === 'envio' ? box.side : null,
      box_length_cm: deliveryType === 'envio' ? box.side : null,
      box_weight_g: deliveryType === 'envio' ? box.weight : null,
      status: 'nuevo',
    })

    setLoading(false)

    if (error) {
      console.error('Error guardando pedido:', error)
      toast.error('Hubo un problema al guardar el pedido, pero igual podés enviarlo por WhatsApp.')
    }

    let msg = `¡Hola! Quiero confirmar este pedido en 3D Copas 🛒\n\n`
    msg += `*Cliente:* ${fullName.trim()}\n`
    msg += `*Teléfono:* ${phone.trim()}\n`
    if (email.trim()) msg += `*Email:* ${email.trim()}\n`
    msg += `\n*Productos:*\n`

    items.forEach((item) => {
      msg += `• ${item.product_name}`
      if (item.variant) msg += ` (${item.variant.size})`
      if (item.color) msg += ` — Color: ${item.color}`
      msg += ` x${item.qty} = ${formatPrice(item.unit_price * item.qty)}\n`
      if (item.personalization) msg += `  ✏️ Personalización: ${item.personalization}\n`
    })

    msg += `\n*Subtotal de productos:* ${formatPrice(subtotal)}\n`
    msg += `\n*Entrega:*\n`
    msg += `Provincia: ${province}\n`
    msg += `Ciudad: ${city.trim()}\n`
    msg += `Código postal: ${postalCode.trim()}\n`

    if (deliveryType === 'local') {
      msg += `Tipo: Entrega en Balcarce, sin costo de envío\n`
      msg += `Forma de pago: ${
        paymentMethod === 'efectivo' ? 'Efectivo al recibir' : 'Transferencia bancaria'
      }\n`
    } else {
      msg += `Tipo: Envío a otra ciudad/provincia\n`
      msg += `Transporte elegido: ${transporteLabel}\n`
      msg += `Forma de pago: Transferencia bancaria\n`
      msg += `Medidas estimadas del paquete: ${box.side} x ${box.side} x ${box.side} cm · Peso aprox: ${(
        box.weight / 1000
      ).toFixed(2)} kg\n`
      msg += `\nEnvío: a cotizar por ${transporteLabel}. Te paso el total final para transferir una sola vez.`
    }

    const whatsappNumber = config?.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')

    clearCart()
    setStep('confirmado')
  }

  const activeTransportes = (config?.transportes || [])
    .filter((t) => t.active)
    .sort((a, b) => a.order - b.order)

  const boxStats = estimatedBox()
  const isHeavyOrLarge =
    boxStats.weight >= (config?.garmendia_weight_threshold || 5000) ||
    boxStats.totalQty >= (config?.garmendia_bultos_threshold || 3)

  const stepTitles: Record<Step, string> = {
    datos: 'Paso 1: Datos de entrega',
    transporte: 'Paso 2: Elegí el transporte',
    pago: 'Paso 3: Forma de pago',
    confirmado: '¡Pedido registrado!',
  }

  return (
    <Modal open={true} onClose={onClose} title={stepTitles[step]} size="lg">
      {step === 'datos' && (
        <form onSubmit={handleDatosSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-copas-plata-oscuro">
            Primero completá tus datos y localidad para saber si es entrega local en Balcarce o
            envío.
          </p>
          <Input
            label="Nombre y apellido *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Sofía García"
            required
          />
          <Input
            label="Teléfono de contacto (WhatsApp) *"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: 2266123456"
            required
          />
          <Input
            label="Email (opcional, útil si creás una cuenta después)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />

          <div className="border-t border-copas-plata pt-3 mt-1 space-y-3">
            <p className="text-sm font-heading font-bold text-copas-marino">
              ¿Dónde entregamos o enviamos?
            </p>
            <Select
              label="Provincia *"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              options={ARGENTINA_PROVINCES.map((p) => ({ value: p, label: p }))}
              placeholder="Seleccioná tu provincia"
              required
            />
            <Input
              label="Ciudad o localidad *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej: Balcarce"
              required
            />
            <Input
              label="Código postal *"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Ej: 7620"
              hint="Pedimos provincia, ciudad y CP porque hay localidades con el mismo nombre en distintas provincias."
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full mt-2">
            Continuar →
          </Button>
        </form>
      )}

      {step === 'transporte' && (
        <div className="flex flex-col gap-3">
          <div className="bg-copas-azul/10 border border-copas-azul/30 rounded-lg p-3 text-sm text-copas-marino">
            📍 Envío a <strong>{city}, {province}</strong> (CP {postalCode}).
          </div>

          {isHeavyOrLarge && (
            <div className="bg-copas-dorado/20 border border-copas-dorado rounded-lg p-3 text-xs sm:text-sm text-copas-marino">
              📦 <strong>Pedido grande o pesado:</strong> podría convenir <strong>Garmendia</strong>{' '}
              (cobra por bulto). Igual podés elegir el que prefieras y lo comparamos.
            </div>
          )}

          <p className="text-sm font-heading font-bold text-copas-marino">Elegí un transporte:</p>

          {activeTransportes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTransporte(t.id)}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                selectedTransporte === t.id
                  ? 'border-copas-azul bg-copas-azul/5'
                  : 'border-copas-plata hover:border-copas-azul/50'
              }`}
            >
              <div>
                <p className="font-heading font-bold text-copas-marino">{t.name}</p>
                {t.warning && (
                  <p className="text-xs text-copas-plata-oscuro mt-0.5">⚠️ {t.warning}</p>
                )}
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  selectedTransporte === t.id
                    ? 'border-copas-azul bg-copas-azul'
                    : 'border-copas-plata'
                }`}
              />
            </button>
          ))}

          <button
            type="button"
            onClick={() => setSelectedTransporte('')}
            className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between ${
              selectedTransporte === ''
                ? 'border-copas-azul bg-copas-azul/5'
                : 'border-copas-plata hover:border-copas-azul/50'
            }`}
          >
            <div>
              <p className="font-heading font-bold text-copas-marino">
                Que me sugieran el más conveniente
              </p>
              <p className="text-xs text-copas-plata-oscuro">
                Cotizo y te recomiendo la mejor opción según peso y tamaño.
              </p>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                selectedTransporte === '' ? 'border-copas-azul bg-copas-azul' : 'border-copas-plata'
              }`}
            />
          </button>

          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setStep('datos')}>
              ← Atrás
            </Button>
            <Button className="flex-1" size="lg" onClick={() => setStep('pago')}>
              Continuar →
            </Button>
          </div>
        </div>
      )}

      {step === 'pago' && (
        <div className="flex flex-col gap-4">
          {deliveryType === 'local' ? (
            <>
              <div className="bg-copas-verde/10 border border-copas-verde/30 rounded-lg p-3 text-sm text-copas-marino">
                🏠 <strong>Entrega en Balcarce, sin costo de envío.</strong> Se entrega en bolsita.
              </div>
              <p className="font-heading font-bold text-copas-marino text-sm">
                Elegí cómo querés pagar:
              </p>
              <div className="flex flex-col gap-2">
                {(['efectivo', 'transferencia'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === method
                        ? 'border-copas-azul bg-copas-azul/5'
                        : 'border-copas-plata hover:border-copas-azul/50'
                    }`}
                  >
                    <p className="font-heading font-bold text-copas-marino">
                      {method === 'efectivo'
                        ? '💵 Efectivo al recibir (solo entrega local)'
                        : '🏦 Transferencia bancaria'}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-copas-crema border border-copas-plata rounded-lg p-4 text-sm text-copas-marino space-y-2">
              <p>
                🚚 <strong>Envío a {city}, {province}</strong> (CP {postalCode})
              </p>
              <p>
                Transporte:{' '}
                <strong>
                  {config?.transportes?.find((t) => t.id === selectedTransporte)?.name ||
                    'A sugerir el más conveniente'}
                </strong>
              </p>
              <p className="text-copas-marino/80 leading-relaxed">
                <strong>Forma de pago: solo transferencia bancaria.</strong>
                <br />
                No transferís todavía: primero cotizo el envío en el transporte elegido y te paso
                el total final (productos + envío), así transferís <strong>una sola vez</strong>.
              </p>
            </div>
          )}

          {/* Resumen */}
          <div className="border border-copas-plata rounded-lg p-4 space-y-1.5 bg-white">
            <p className="font-heading font-bold text-copas-marino text-sm mb-2">
              Resumen de tu pedido
            </p>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs sm:text-sm text-copas-plata-oscuro">
                <span>
                  {item.product_name} {item.variant ? `(${item.variant.size})` : ''} x{item.qty}
                </span>
                <span className="font-semibold text-copas-marino">
                  {formatPrice(item.unit_price * item.qty)}
                </span>
              </div>
            ))}
            <div className="border-t border-copas-plata pt-2 mt-2 flex justify-between font-heading font-black text-copas-marino">
              <span>Subtotal productos</span>
              <span className="text-copas-azul">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-copas-plata-oscuro">
              <span>Envío</span>
              <span>{deliveryType === 'local' ? 'Sin costo (Balcarce)' : 'A cotizar'}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep(deliveryType === 'local' ? 'datos' : 'transporte')}
            >
              ← Atrás
            </Button>
            <Button size="lg" className="flex-1" loading={loading} onClick={handleConfirmar}>
              📱 Confirmar por WhatsApp
            </Button>
          </div>
        </div>
      )}

      {step === 'confirmado' && (
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <div className="text-6xl">🎉</div>
          <h3 className="font-heading text-xl font-bold text-copas-verde">¡Pedido enviado!</h3>
          <p className="text-copas-plata-oscuro text-sm max-w-md">
            Tu pedido quedó guardado en nuestro sistema y se abrió WhatsApp con el detalle listo
            para enviar. Apenas lo vea te respondo.
          </p>
          <Button onClick={onClose}>Volver a la tienda</Button>
        </div>
      )}
    </Modal>
  )
}
