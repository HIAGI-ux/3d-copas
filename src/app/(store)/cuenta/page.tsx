'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Order,
  BusinessConfig,
  mapOrderStatusToPublic,
  ORDER_STATUS_PUBLIC_LABELS,
} from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'
import { generateOrderReceiptPDF } from '@/lib/pdf-receipt'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import Link from 'next/link'

type AuthMode = 'login' | 'register' | 'reset'

export default function CuentaPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [config, setConfig] = useState<BusinessConfig | null>(null)

  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadAccountData = useCallback(async () => {
    setLoading(true)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      setUser(null)
      setOrders([])
      setLoading(false)
      return
    }

    setUser({ id: currentUser.id, email: currentUser.email })

    // Vincular pedidos previos hechos como invitado con el mismo email
    await supabase.rpc('link_guest_orders')

    const [ordersRes, configRes] = await Promise.all([
      supabase
        .from('orders')
        .select(
          'id,order_number,customer_id,guest_name,guest_phone,province,city,postal_code,items,subtotal,delivery_type,transporte,tracking_code,tracking_url,shipping_cost,total,payment_method,status,ordered_at,delivery_date,dispatch_date,receipt_number,receipt_issued_at'
        )
        .eq('customer_id', currentUser.id)
        .order('ordered_at', { ascending: false }),
      supabase
        .from('business_config')
        .select('id,name,slogan,whatsapp,transportes,returns_policy,exchange_policy')
        .single(),
    ])

    if (ordersRes.data) setOrders(ordersRes.data as Order[])
    if (configRes.data) setConfig(configRes.data as BusinessConfig)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadAccountData()
  }, [loadAccountData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      toast.error('Email o contraseña incorrectos.')
      return
    }
    toast.success('¡Bienvenido/a!')
    loadAccountData()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setSubmitting(false)
      toast.error(error.message || 'No se pudo crear la cuenta.')
      return
    }
    if (data.user) {
      await supabase.from('customers').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone,
      })
    }
    setSubmitting(false)
    toast.success('¡Cuenta creada! Si compraste antes con este email, tus pedidos se vinculan solos.')
    loadAccountData()
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Ingresá tu email.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cuenta`,
    })
    setSubmitting(false)
    if (error) {
      toast.error('No se pudo enviar el correo de recuperación.')
      return
    }
    toast.success('Te enviamos un email para restablecer tu contraseña.')
    setAuthMode('login')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setOrders([])
  }

  const getTrackingLink = (order: Order) => {
    if (order.tracking_url) return order.tracking_url
    if (!order.tracking_code || !config?.transportes) return null
    const t = config.transportes.find(
      (tr) => tr.name.toLowerCase() === (order.transporte || '').toLowerCase()
    )
    if (!t?.tracking_url) return null
    return `${t.tracking_url}`
  }

  if (loading) return <LoadingSpinner />

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white rounded-card border border-copas-plata p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-black text-copas-marino mb-1">Mi cuenta</h1>
          <p className="text-sm text-copas-plata-oscuro mb-6">
            Seguí el estado de tus pedidos y descargá tus comprobantes. (No es obligatorio tener
            cuenta para comprar.)
          </p>

          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg font-heading font-bold text-sm border-2 ${
                authMode === 'login'
                  ? 'border-copas-azul bg-copas-azul text-white'
                  : 'border-copas-plata text-copas-marino'
              }`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-lg font-heading font-bold text-sm border-2 ${
                authMode === 'register'
                  ? 'border-copas-azul bg-copas-azul text-white'
                  : 'border-copas-plata text-copas-marino'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={submitting} className="mt-2">
                Entrar a mi cuenta
              </Button>
              <button
                type="button"
                onClick={() => setAuthMode('reset')}
                className="text-xs text-copas-azul font-semibold hover:underline text-center mt-2"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <Input
                label="Nombre y apellido *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Teléfono"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                hint="Si ya compraste sin cuenta, usá el mismo email para ver tus pedidos anteriores."
                required
              />
              <Input
                label="Contraseña (mínimo 6 caracteres) *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={submitting} className="mt-2">
                Crear cuenta
              </Button>
            </form>
          )}

          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
              <p className="text-sm text-copas-plata-oscuro">
                Ingresá tu email y te mandamos un link para cambiar la contraseña.
              </p>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" loading={submitting}>
                Enviar correo
              </Button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-xs text-copas-plata-oscuro hover:underline text-center"
              >
                Volver
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-black text-copas-marino">Mis pedidos</h1>
          <p className="text-sm text-copas-plata-oscuro">Sesión iniciada como {user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-card border border-copas-plata p-10 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-heading font-bold text-copas-marino mb-2">
            Todavía no tenés pedidos vinculados a esta cuenta.
          </p>
          <Link href="/">
            <Button size="sm">Ir a la tienda</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const publicStatus = mapOrderStatusToPublic(order.status)
            const statusLabel = ORDER_STATUS_PUBLIC_LABELS[publicStatus]
            const trackingLink = getTrackingLink(order)

            return (
              <div
                key={order.id}
                className="bg-white rounded-card border border-copas-plata p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-copas-plata/60 pb-3 mb-3">
                  <div>
                    <span className="font-heading font-black text-copas-marino">
                      Pedido #{order.order_number}
                    </span>
                    <span className="text-xs text-copas-plata-oscuro ml-3">
                      {formatDate(order.ordered_at)}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-heading font-bold ${
                      publicStatus === 'cancelado'
                        ? 'bg-copas-rojo/15 text-copas-rojo'
                        : publicStatus === 'entregado'
                        ? 'bg-copas-verde/15 text-copas-verde'
                        : 'bg-copas-azul/15 text-copas-azul'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Productos */}
                <div className="space-y-1 mb-3">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-copas-marino">
                      <span>
                        {item.name} {item.variant ? `(${item.variant.size})` : ''} x{item.qty}
                        {item.personalization ? ` — "${item.personalization}"` : ''}
                      </span>
                      <span className="font-semibold">
                        {formatPrice(item.unit_price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-copas-plata/60 text-sm">
                  <div>
                    <span className="text-copas-plata-oscuro">Total: </span>
                    <strong className="font-heading text-copas-azul text-base">
                      {formatPrice(order.total || order.subtotal)}
                    </strong>
                    <span className="text-xs text-copas-plata-oscuro ml-2">
                      ({order.delivery_type === 'local' ? 'Entrega local Balcarce' : order.city})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.tracking_code && (
                      <div className="flex items-center gap-2 bg-copas-crema px-3 py-1.5 rounded-lg text-xs">
                        <span>
                          🚚 {order.transporte || 'Envío'}: <strong>{order.tracking_code}</strong>
                        </span>
                        {trackingLink && (
                          <a
                            href={trackingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-copas-azul font-bold underline"
                          >
                            Seguir mi envío
                          </a>
                        )}
                      </div>
                    )}

                    {order.receipt_issued_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateOrderReceiptPDF(order, config)}
                      >
                        📄 Descargar comprobante
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
