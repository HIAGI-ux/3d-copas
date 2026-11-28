'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, Product } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export default function AdminDashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [topProducts, setTopProducts] = useState<Product[]>([])
  const [pendingRequests, setPendingRequests] = useState(0)
  const [reorderReminders, setReorderReminders] = useState<
    { name: string; email: string; phone: string; last_order: string; order_number: number }[]
  >([])

  useEffect(() => {
    const load = async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const [ordersRes, prodRes, reqRes, reminderRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id,total,subtotal,status,ordered_at')
          .neq('status', 'cancelado'),
        supabase
          .from('products')
          .select('id,name,view_count')
          .order('view_count', { ascending: false })
          .limit(5),
        supabase
          .from('custom_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'nueva'),
        supabase
          .from('orders')
          .select('ordered_at,order_number,guest_name,guest_phone,guest_email,customer:customers(full_name,email,phone)')
          .eq('status', 'entregado')
          .gte('ordered_at', sixtyDaysAgo.toISOString())
          .lte('ordered_at', thirtyDaysAgo.toISOString())
          .order('ordered_at', { ascending: false }),
      ])

      if (ordersRes.data) setOrders(ordersRes.data as Order[])
      if (prodRes.data) setTopProducts(prodRes.data as Product[])
      setPendingRequests(reqRes.count || 0)

      if (reminderRes.data) {
        // Deduplicar por cliente (email o nombre)
        const seen = new Set<string>()
        const reminders: typeof reorderReminders = []
        for (const o of reminderRes.data as unknown as Array<{
          ordered_at: string
          order_number: number
          guest_name?: string
          guest_phone?: string
          guest_email?: string
          customer?: { full_name?: string; email?: string; phone?: string } | null
        }>) {
          const name = o.guest_name || o.customer?.full_name || 'Cliente'
          const email = o.guest_email || o.customer?.email || ''
          const phone = o.guest_phone || o.customer?.phone || ''
          const key = email || name
          if (!seen.has(key)) {
            seen.add(key)
            reminders.push({ name, email, phone, last_order: o.ordered_at, order_number: o.order_number })
          }
        }
        setReorderReminders(reminders)
      }

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <LoadingSpinner />

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const ordersThisMonth = orders.filter((o) => o.ordered_at.startsWith(currentMonthKey))
  const totalSoldMonth = ordersThisMonth.reduce((sum, o) => sum + Number(o.total || o.subtotal), 0)
  const newOrdersCount = orders.filter((o) => o.status === 'nuevo').length

  // Agrupar últimos 6 meses para gráfico
  const monthlyMap = new Map<string, { mes: string; ventas: number; pedidos: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-AR', { month: 'short' })
    monthlyMap.set(key, { mes: label, ventas: 0, pedidos: 0 })
  }
  orders.forEach((o) => {
    const key = o.ordered_at.slice(0, 7)
    const entry = monthlyMap.get(key)
    if (entry) {
      entry.ventas += Number(o.total || o.subtotal)
      entry.pedidos += 1
    }
  })
  const chartData = Array.from(monthlyMap.values())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black text-copas-marino">
          Resumen de 3D Copas
        </h1>
        <p className="text-sm text-copas-plata-oscuro">
          Estadísticas generales y accesos rápidos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/admin/pedidos"
          className="bg-white rounded-card border border-copas-plata p-4 hover:border-copas-azul transition-all"
        >
          <p className="text-xs text-copas-plata-oscuro font-semibold">Pedidos nuevos</p>
          <p className="font-heading text-2xl font-black text-copas-azul mt-1">{newOrdersCount}</p>
        </Link>
        <Link
          href="/admin/consultas"
          className="bg-white rounded-card border border-copas-plata p-4 hover:border-copas-azul transition-all"
        >
          <p className="text-xs text-copas-plata-oscuro font-semibold">Consultas sin leer</p>
          <p className="font-heading text-2xl font-black text-copas-dorado mt-1">
            {pendingRequests}
          </p>
        </Link>
        <div className="bg-white rounded-card border border-copas-plata p-4">
          <p className="text-xs text-copas-plata-oscuro font-semibold">Pedidos este mes</p>
          <p className="font-heading text-2xl font-black text-copas-marino mt-1">
            {ordersThisMonth.length}
          </p>
        </div>
        <div className="bg-white rounded-card border border-copas-plata p-4">
          <p className="text-xs text-copas-plata-oscuro font-semibold">Vendido este mes</p>
          <p className="font-heading text-2xl font-black text-copas-verde mt-1">
            {formatPrice(totalSoldMonth)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ventas por mes */}
        <div className="bg-white rounded-card border border-copas-plata p-5">
          <h2 className="font-heading font-bold text-copas-marino mb-4">
            Ventas por mes (últimos 6 meses)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val: number) => formatPrice(val)} />
                <Bar dataKey="ventas" fill="#2456D6" radius={[6, 6, 0, 0]} name="Ventas ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productos más vistos */}
        <div className="bg-white rounded-card border border-copas-plata p-5">
          <h2 className="font-heading font-bold text-copas-marino mb-4">
            Productos más vistos
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-copas-plata-oscuro">Todavía no hay datos de visitas.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-copas-plata/40 pb-2 last:border-none"
                >
                  <span className="text-sm font-semibold text-copas-marino">
                    {idx + 1}. {p.name}
                  </span>
                  <span className="text-xs font-heading font-bold bg-copas-crema text-copas-azul px-2.5 py-1 rounded-full">
                    {p.view_count} vistas
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recordatorio de recompra */}
      {reorderReminders.length > 0 && (
        <div className="bg-white rounded-card border border-amber-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔔</span>
            <h2 className="font-heading font-bold text-copas-marino">
              Recordatorio de recompra
            </h2>
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {reorderReminders.length} cliente{reorderReminders.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-copas-plata-oscuro mb-4">
            Estos clientes compraron hace entre 30 y 60 días y pueden estar listos para volver a pedir.
          </p>
          <div className="space-y-3">
            {reorderReminders.map((r, i) => {
              const waMsg = encodeURIComponent(
                `¡Hola ${r.name}! Pasó un mes desde tu último pedido en 3D Copas 🎉 ¿Querés repetirlo o ver las novedades? Entrá a nuestra tienda o avisame por acá.`
              )
              const cleanPhone = r.phone.replace(/\D/g, '')
              return (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-copas-plata/30 pb-3 last:border-none last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-copas-marino">{r.name}</p>
                    <p className="text-xs text-copas-plata-oscuro">
                      Último pedido #{r.order_number} · {formatDate(r.last_order)}
                      {r.email && ` · ${r.email}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${waMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      >
                        WhatsApp
                      </a>
                    )}
                    {r.email && (
                      <a
                        href={`mailto:${r.email}?subject=¿Querés repetir tu pedido de 3D Copas?&body=Hola ${r.name},%0A%0APasó un mes desde tu último pedido.%0A¿Querés ver las novedades o hacer otro pedido?%0A%0ASaludos,%0A3D Copas`}
                        className="inline-flex items-center gap-1.5 bg-copas-azul hover:bg-copas-marino text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      >
                        Email
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

