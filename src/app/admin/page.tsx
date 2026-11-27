'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, Product } from '@/types'
import { formatPrice } from '@/lib/utils'
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

  useEffect(() => {
    const load = async () => {
      const [ordersRes, prodRes, reqRes] = await Promise.all([
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
      ])
      if (ordersRes.data) setOrders(ordersRes.data as Order[])
      if (prodRes.data) setTopProducts(prodRes.data as Product[])
      setPendingRequests(reqRes.count || 0)
      setLoading(false)
    }
    load()
  }, [supabase])

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
    </div>
  )
}
