'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, IncomeEntry, ExpenseEntry, Withdrawal, EXPENSE_CATEGORIES } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { Download, Plus, Trash2, ShieldAlert, PieChart } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

const PAID_ORDER_STATUSES = ['pagado', 'en_impresion', 'listo', 'despachado', 'entregado']
const EMERGENCY_CATEGORY = 'Fondo de emergencia'

export default function AdminContabilidadPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )

  const [orders, setOrders] = useState<Order[]>([])
  const [manualIncomes, setManualIncomes] = useState<IncomeEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])

  // Rubros editables en sesión + default
  const [expenseCategories, setExpenseCategories] = useState<string[]>(EXPENSE_CATEGORIES)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Form ingreso manual
  const [incDate, setIncDate] = useState(now.toISOString().slice(0, 10))
  const [incAmount, setIncAmount] = useState('')
  const [incDesc, setIncDesc] = useState('')

  // Form gasto
  const [expDate, setExpDate] = useState(now.toISOString().slice(0, 10))
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0])
  const [expNote, setExpNote] = useState('')

  // Form retiro
  const [witDate, setWitDate] = useState(now.toISOString().slice(0, 10))
  const [witAmount, setWitAmount] = useState('')
  const [witNote, setWitNote] = useState('')

  // Form fondo de emergencia
  const [emgDate, setEmgDate] = useState(now.toISOString().slice(0, 10))
  const [emgAmount, setEmgAmount] = useState('')
  const [emgNote, setEmgNote] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [ordRes, incRes, expRes, witRes] = await Promise.all([
      supabase.from('orders').select('*').in('status', PAID_ORDER_STATUSES),
      supabase.from('income_entries').select('*').order('date', { ascending: false }),
      supabase.from('expense_entries').select('*').order('date', { ascending: false }),
      supabase.from('withdrawals').select('*').order('date', { ascending: false }),
    ])
    if (ordRes.data) setOrders(ordRes.data as Order[])
    if (incRes.data) setManualIncomes(incRes.data as IncomeEntry[])
    if (expRes.data) {
      const exps = expRes.data as ExpenseEntry[]
      setExpenses(exps)
      const customCats = Array.from(new Set(exps.map((e) => e.category)))
      setExpenseCategories(Array.from(new Set([...EXPENSE_CATEGORIES, ...customCats])))
    }
    if (witRes.data) setWithdrawals(witRes.data as Withdrawal[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrado por mes seleccionado
  const monthOrders = orders.filter((o) => o.ordered_at.startsWith(selectedMonth))
  const monthManualIncomes = manualIncomes.filter((i) => i.date.startsWith(selectedMonth))
  const monthAllExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth))
  const monthExpenses = monthAllExpenses.filter((e) => e.category !== EMERGENCY_CATEGORY)
  const monthEmergency = monthAllExpenses.filter((e) => e.category === EMERGENCY_CATEGORY)
  const monthWithdrawals = withdrawals.filter((w) => w.date.startsWith(selectedMonth))

  const totalOrdersIncome = monthOrders.reduce((s, o) => s + Number(o.total || o.subtotal), 0)
  const totalManualIncome = monthManualIncomes.reduce((s, i) => s + Number(i.amount), 0)
  const totalIncome = totalOrdersIncome + totalManualIncome
  const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const netProfit = totalIncome - totalExpenses
  const totalEmergencyMonth = monthEmergency.reduce((s, e) => s + Number(e.amount), 0)
  const totalEmergencyAccumulated = expenses
    .filter((e) => e.category === EMERGENCY_CATEGORY)
    .reduce((s, e) => s + Number(e.amount), 0)
  const totalWithdrawals = monthWithdrawals.reduce((s, w) => s + Number(w.amount), 0)
  const remainingInBusiness = netProfit - totalWithdrawals - totalEmergencyMonth

  // Gastos operativos agrupados por rubro (excluye fondo de emergencia)
  const expensesByCategory = expenseCategories
    .filter((cat) => cat !== EMERGENCY_CATEGORY)
    .map((cat) => ({
      category: cat,
      total: monthExpenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + Number(e.amount), 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  // Distribución: "¿A dónde fue la plata?"
  const distributionItems = [
    ...expensesByCategory.map((c) => ({
      label: c.category,
      amount: c.total,
      color: 'bg-red-500',
      badge: 'Gasto',
    })),
    ...(totalEmergencyMonth > 0
      ? [
          {
            label: 'Fondo de emergencia',
            amount: totalEmergencyMonth,
            color: 'bg-amber-500',
            badge: 'Reserva',
          },
        ]
      : []),
    ...(totalWithdrawals > 0
      ? [
          {
            label: 'Retiros personales (mi ganancia)',
            amount: totalWithdrawals,
            color: 'bg-[#0D52D6]',
            badge: 'Retiro',
          },
        ]
      : []),
    ...(remainingInBusiness > 0
      ? [
          {
            label: 'Disponible en caja del negocio',
            amount: remainingInBusiness,
            color: 'bg-emerald-500',
            badge: 'Caja',
          },
        ]
      : []),
  ]

  // Gráfico últimos 6 meses
  const chartData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-AR', { month: 'short' })
    const inc =
      orders
        .filter((o) => o.ordered_at.startsWith(key))
        .reduce((s, o) => s + Number(o.total || o.subtotal), 0) +
      manualIncomes
        .filter((m) => m.date.startsWith(key))
        .reduce((s, m) => s + Number(m.amount), 0)
    const exp = expenses
      .filter((e) => e.date.startsWith(key) && e.category !== EMERGENCY_CATEGORY)
      .reduce((s, e) => s + Number(e.amount), 0)
    const wit = withdrawals
      .filter((w) => w.date.startsWith(key))
      .reduce((s, w) => s + Number(w.amount), 0)
    chartData.push({ mes: label, Ingresos: inc, Gastos: exp, Retiros: wit })
  }

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incAmount || Number(incAmount) <= 0) return
    const { error } = await supabase.from('income_entries').insert({
      date: incDate,
      amount: Number(incAmount),
      description: incDesc.trim() || 'Ingreso manual',
    })
    if (error) toast.error('Error al guardar ingreso')
    else {
      toast.success('Ingreso registrado')
      setIncAmount('')
      setIncDesc('')
      loadData()
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expAmount || Number(expAmount) <= 0) return
    const { error } = await supabase.from('expense_entries').insert({
      date: expDate,
      amount: Number(expAmount),
      category: expCategory,
      note: expNote.trim() || null,
    })
    if (error) toast.error('Error al guardar gasto')
    else {
      toast.success('Gasto registrado')
      setExpAmount('')
      setExpNote('')
      loadData()
    }
  }

  const handleAddEmergency = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emgAmount || Number(emgAmount) <= 0) return
    const { error } = await supabase.from('expense_entries').insert({
      date: emgDate,
      amount: Number(emgAmount),
      category: EMERGENCY_CATEGORY,
      note: emgNote.trim() || 'Reserva fondo de emergencia',
    })
    if (error) toast.error('Error al guardar en fondo de emergencia')
    else {
      toast.success('Guardado en el Fondo de emergencia')
      setEmgAmount('')
      setEmgNote('')
      loadData()
    }
  }

  const handleAddWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!witAmount || Number(witAmount) <= 0) return
    const { error } = await supabase.from('withdrawals').insert({
      date: witDate,
      amount: Number(witAmount),
      note: witNote.trim() || null,
    })
    if (error) toast.error('Error al guardar retiro')
    else {
      toast.success('Retiro registrado')
      setWitAmount('')
      setWitNote('')
      loadData()
    }
  }

  const handleDeleteEntry = async (
    table: 'income_entries' | 'expense_entries' | 'withdrawals',
    id: string
  ) => {
    await supabase.from(table).delete().eq('id', id)
    loadData()
  }

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()

    const resumenRows = [
      { Concepto: 'Mes', Monto: selectedMonth },
      { Concepto: 'Ingresos por pedidos pagados', Monto: totalOrdersIncome },
      { Concepto: 'Ingresos manuales', Monto: totalManualIncome },
      { Concepto: 'Total ingresos', Monto: totalIncome },
      { Concepto: 'Gastos operativos', Monto: totalExpenses },
      { Concepto: 'Ganancia neta', Monto: netProfit },
      { Concepto: 'Fondo de emergencia (mes)', Monto: totalEmergencyMonth },
      { Concepto: 'Retiros personales', Monto: totalWithdrawals },
      { Concepto: 'Disponible en caja del negocio', Monto: remainingInBusiness },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenRows), 'Resumen')

    const ingresosRows = [
      ...monthOrders.map((o) => ({
        Fecha: formatDate(o.ordered_at),
        Tipo: `Pedido #${o.order_number}`,
        Detalle: o.guest_name || 'Cliente',
        Monto: Number(o.total || o.subtotal),
      })),
      ...monthManualIncomes.map((i) => ({
        Fecha: formatDate(i.date),
        Tipo: 'Manual',
        Detalle: i.description || '',
        Monto: Number(i.amount),
      })),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ingresosRows), 'Ingresos')

    const gastosRows = monthAllExpenses.map((e) => ({
      Fecha: formatDate(e.date),
      Rubro: e.category,
      Nota: e.note || '',
      Monto: Number(e.amount),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gastosRows), 'Gastos_por_rubro')

    const retirosRows = monthWithdrawals.map((w) => ({
      Fecha: formatDate(w.date),
      Nota: w.note || '',
      Monto: Number(w.amount),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(retirosRows), 'Retiros')

    XLSX.writeFile(wb, `Contabilidad-3DCopas-${selectedMonth}.xlsx`)
    toast.success('Excel descargado.')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-black text-copas-marino">
            Contabilidad y control de plata
          </h1>
          <p className="text-sm text-copas-plata-oscuro">
            Ingresos totales, ganancia real, gastos por rubro y fondo de emergencia.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-2 border-copas-plata rounded-lg px-3 py-2 bg-white text-sm font-heading font-bold text-copas-marino"
          />
          <Button size="sm" onClick={handleExportExcel}>
            <Download size={16} /> Exportar mes (.xlsx)
          </Button>
        </div>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-card border border-copas-plata p-4">
          <p className="text-xs text-copas-plata-oscuro">Ingresos totales</p>
          <p className="font-heading text-xl font-black text-copas-azul mt-1">
            {formatPrice(totalIncome)}
          </p>
        </div>
        <div className="bg-white rounded-card border border-copas-plata p-4">
          <p className="text-xs text-copas-plata-oscuro">Gastos operativos</p>
          <p className="font-heading text-xl font-black text-copas-rojo mt-1">
            {formatPrice(totalExpenses)}
          </p>
        </div>
        <div className="bg-white rounded-card border border-copas-plata p-4">
          <p className="text-xs text-copas-plata-oscuro">Ganancia neta</p>
          <p className="font-heading text-xl font-black text-copas-verde mt-1">
            {formatPrice(netProfit)}
          </p>
        </div>
        <div className="bg-amber-50/70 rounded-card border border-amber-200 p-4">
          <p className="text-xs text-amber-800 font-semibold">Fondo emergencia</p>
          <p className="font-heading text-xl font-black text-amber-700 mt-1">
            {formatPrice(totalEmergencyMonth)}
          </p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">
            Acumulado: {formatPrice(totalEmergencyAccumulated)}
          </p>
        </div>
        <div className="bg-white rounded-card border border-copas-plata p-4">
          <p className="text-xs text-copas-plata-oscuro">Me llevé (retiros)</p>
          <p className="font-heading text-xl font-black text-copas-marino mt-1">
            {formatPrice(totalWithdrawals)}
          </p>
        </div>
        <div className="bg-white rounded-card border border-copas-plata p-4">
          <p className="text-xs text-copas-plata-oscuro">Queda en caja</p>
          <p className="font-heading text-xl font-black text-emerald-600 mt-1">
            {formatPrice(remainingInBusiness)}
          </p>
        </div>
      </div>

      {/* ¿A dónde fue la plata? */}
      <div className="bg-white rounded-card border border-copas-plata p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-copas-azul" />
            <h2 className="font-heading font-bold text-copas-marino">
              ¿A dónde fue la plata en {selectedMonth}?
            </h2>
          </div>
          <span className="text-xs text-copas-plata-oscuro">
            Sobre un ingreso total de <strong className="text-copas-marino">{formatPrice(totalIncome)}</strong>
          </span>
        </div>

        {distributionItems.length === 0 ? (
          <p className="text-sm text-copas-plata-oscuro">
            Todavía no cargaste ingresos ni gastos este mes. Cargá abajo tus ingresos, filamento, repuestos o fondo de emergencia para ver el reparto.
          </p>
        ) : (
          <div className="space-y-3">
            {distributionItems.map((item) => {
              const pct = totalIncome > 0 ? Math.min(100, Math.round((item.amount / totalIncome) * 100)) : 0
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-copas-marino">{item.label}</span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-semibold">
                        {item.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-copas-marino">{formatPrice(item.amount)}</span>
                      {totalIncome > 0 && (
                        <span className="text-xs text-copas-plata-oscuro w-10 text-right">
                          {pct}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${totalIncome > 0 ? pct : 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Gráfico + Gastos por rubro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-card border border-copas-plata p-5">
          <h2 className="font-heading font-bold text-copas-marino mb-4">Evolución mensual</h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Legend />
                <Bar dataKey="Ingresos" fill="#2456D6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#9C2A2A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Retiros" fill="#E6B422" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-card border border-copas-plata p-5 space-y-3">
          <h2 className="font-heading font-bold text-copas-marino">Gastos por rubro ({selectedMonth})</h2>
          {expensesByCategory.length === 0 ? (
            <p className="text-sm text-copas-plata-oscuro">No hay gastos cargados este mes.</p>
          ) : (
            <div className="space-y-2">
              {expensesByCategory.map((c) => (
                <div
                  key={c.category}
                  className="flex justify-between text-sm border-b border-copas-plata/40 pb-1.5"
                >
                  <span className="font-semibold text-copas-marino">{c.category}</span>
                  <span className="font-heading font-bold text-copas-rojo">
                    {formatPrice(c.total)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Agregar rubro personalizado */}
          <div className="pt-3 border-t border-copas-plata flex gap-2">
            <input
              type="text"
              placeholder="Nuevo rubro (ej: Resina, Alquiler)..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 border border-copas-plata rounded-lg px-3 py-1.5 text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (newCategoryName.trim() && !expenseCategories.includes(newCategoryName.trim())) {
                  setExpenseCategories((prev) => [...prev, newCategoryName.trim()])
                  setExpCategory(newCategoryName.trim())
                  setNewCategoryName('')
                }
              }}
            >
              + Rubro
            </Button>
          </div>
        </div>
      </div>

      {/* Formularios de carga rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingreso manual */}
        <form
          onSubmit={handleAddIncome}
          className="bg-white rounded-card border border-copas-plata p-4 space-y-3"
        >
          <h3 className="font-heading font-bold text-copas-marino">1. Registrar ingreso</h3>
          <Input label="Fecha" type="date" value={incDate} onChange={(e) => setIncDate(e.target.value)} required />
          <Input label="Monto ($)" type="number" value={incAmount} onChange={(e) => setIncAmount(e.target.value)} placeholder="100000" required />
          <Input label="Descripción" value={incDesc} onChange={(e) => setIncDesc(e.target.value)} placeholder="Ej: Ventas del mes / feria" />
          <Button type="submit" size="sm" className="w-full">
            <Plus size={15} /> Agregar ingreso
          </Button>
        </form>

        {/* Nuevo gasto */}
        <form
          onSubmit={handleAddExpense}
          className="bg-white rounded-card border border-copas-plata p-4 space-y-3"
        >
          <h3 className="font-heading font-bold text-copas-marino">2. Registrar gasto</h3>
          <Input label="Fecha" type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required />
          <Input label="Monto ($)" type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="25000" required />
          <div>
            <label className="text-sm font-medium text-copas-marino block mb-1">En qué se gastó</label>
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="w-full border-2 border-copas-plata rounded-lg px-3 py-2 text-sm bg-white"
            >
              {expenseCategories
                .filter((c) => c !== EMERGENCY_CATEGORY)
                .map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
            </select>
          </div>
          <Input label="Detalle" value={expNote} onChange={(e) => setExpNote(e.target.value)} placeholder="Ej: 2kg filamento / pico 0.4" />
          <Button type="submit" size="sm" className="w-full">
            <Plus size={15} /> Agregar gasto
          </Button>
        </form>

        {/* Fondo de emergencia */}
        <form
          onSubmit={handleAddEmergency}
          className="bg-amber-50/50 rounded-card border border-amber-200 p-4 space-y-3"
        >
          <h3 className="font-heading font-bold text-amber-900 flex items-center gap-1.5">
            <ShieldAlert size={16} /> 3. Fondo de emergencia
          </h3>
          <Input label="Fecha" type="date" value={emgDate} onChange={(e) => setEmgDate(e.target.value)} required />
          <Input label="Monto a guardar ($)" type="number" value={emgAmount} onChange={(e) => setEmgAmount(e.target.value)} placeholder="15000" required />
          <Input label="Nota" value={emgNote} onChange={(e) => setEmgNote(e.target.value)} placeholder="Ej: Reserva por roturas" />
          <Button type="submit" size="sm" variant="outline" className="w-full border-amber-500 text-amber-800 hover:bg-amber-500 hover:text-white">
            <Plus size={15} /> Guardar en fondo
          </Button>
        </form>

        {/* Retiro personal */}
        <form
          onSubmit={handleAddWithdrawal}
          className="bg-white rounded-card border border-copas-plata p-4 space-y-3"
        >
          <h3 className="font-heading font-bold text-copas-marino">4. Retiro (mi ganancia)</h3>
          <Input label="Fecha" type="date" value={witDate} onChange={(e) => setWitDate(e.target.value)} required />
          <Input label="Monto ($)" type="number" value={witAmount} onChange={(e) => setWitAmount(e.target.value)} placeholder="50000" required />
          <Input label="Nota" value={witNote} onChange={(e) => setWitNote(e.target.value)} placeholder="Ej: Sueldo / retiro mes" />
          <Button type="submit" size="sm" variant="secondary" className="w-full">
            <Plus size={15} /> Registrar retiro
          </Button>
        </form>
      </div>

      {/* Movimientos del mes */}
      <div className="bg-white rounded-card border border-copas-plata p-5 space-y-4">
        <h3 className="font-heading font-bold text-copas-marino">Movimientos de {selectedMonth}</h3>
        <div className="space-y-2 text-sm">
          {monthExpenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between border-b border-copas-plata/40 pb-1.5">
              <span>
                🔴 <strong>{formatDate(e.date)}</strong> · {e.category} {e.note ? `(${e.note})` : ''}
              </span>
              <span className="flex items-center gap-2 font-bold text-copas-rojo">
                -{formatPrice(e.amount)}
                <button type="button" onClick={() => handleDeleteEntry('expense_entries', e.id)}>
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))}
          {monthEmergency.map((e) => (
            <div key={e.id} className="flex items-center justify-between border-b border-copas-plata/40 pb-1.5">
              <span>
                🛡️ <strong>{formatDate(e.date)}</strong> · Fondo de emergencia {e.note ? `(${e.note})` : ''}
              </span>
              <span className="flex items-center gap-2 font-bold text-amber-700">
                {formatPrice(e.amount)}
                <button type="button" onClick={() => handleDeleteEntry('expense_entries', e.id)}>
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))}
          {monthManualIncomes.map((i) => (
            <div key={i.id} className="flex items-center justify-between border-b border-copas-plata/40 pb-1.5">
              <span>
                🟢 <strong>{formatDate(i.date)}</strong> · {i.description}
              </span>
              <span className="flex items-center gap-2 font-bold text-copas-verde">
                +{formatPrice(i.amount)}
                <button type="button" onClick={() => handleDeleteEntry('income_entries', i.id)}>
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))}
          {monthWithdrawals.map((w) => (
            <div key={w.id} className="flex items-center justify-between border-b border-copas-plata/40 pb-1.5">
              <span>
                🟡 <strong>{formatDate(w.date)}</strong> · Retiro {w.note ? `(${w.note})` : ''}
              </span>
              <span className="flex items-center gap-2 font-bold text-copas-marino">
                {formatPrice(w.amount)}
                <button type="button" onClick={() => handleDeleteEntry('withdrawals', w.id)}>
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
