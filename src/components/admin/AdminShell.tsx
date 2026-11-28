'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Package,
  ArrowUpDown,
  Calculator,
  ShoppingBag,
  MessageSquare,
  Wallet,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Tag,
} from 'lucide-react'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [newRequestsCount, setNewRequestsCount] = useState(0)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) return
    const fetchCount = async () => {
      const { count } = await supabase
        .from('custom_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'nueva')
      setNewRequestsCount(count || 0)
    }
    fetchCount()
  }, [pathname, isLoginPage, supabase])

  if (isLoginPage) return <>{children}</>

  const navItems = [
    { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
    { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
    {
      href: '/admin/consultas',
      label: 'Consultas',
      icon: MessageSquare,
      badge: newRequestsCount > 0 ? newRequestsCount : undefined,
    },
    { href: '/admin/productos', label: 'Productos', icon: Package },
    { href: '/admin/categorias', label: 'Categorías', icon: Tag },
    { href: '/admin/orden', label: 'Orden y destacados', icon: ArrowUpDown },
    { href: '/admin/calculadora', label: 'Calculadora', icon: Calculator },
    { href: '/admin/contabilidad', label: 'Contabilidad', icon: Wallet },
    { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-copas-crema flex flex-col lg:flex-row">
      {/* Header móvil */}
      <header className="lg:hidden bg-copas-marino text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-white/10"
            aria-label="Abrir menú"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="font-heading font-black text-base">3D Copas · Admin</span>
        </div>
        <div className="flex items-center gap-2">
          {newRequestsCount > 0 && (
            <Link
              href="/admin/consultas"
              className="bg-copas-dorado text-copas-marino text-xs font-bold px-2 py-1 rounded-full"
            >
              {newRequestsCount} nueva{newRequestsCount > 1 ? 's' : ''}
            </Link>
          )}
          <Link
            href="/"
            target="_blank"
            className="text-xs text-copas-plata hover:text-white flex items-center gap-1"
          >
            Tienda <ExternalLink size={14} />
          </Link>
        </div>
      </header>

      {/* Sidebar desktop + drawer móvil */}
      <aside
        className={`${
          menuOpen ? 'fixed inset-0 z-30 pt-14 bg-copas-marino' : 'hidden'
        } lg:block lg:w-64 lg:shrink-0 bg-copas-marino text-white flex flex-col justify-between`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="hidden lg:flex items-center gap-2.5 px-2 py-3 mb-4 border-b border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-3d-copas.png"
              alt="3D Copas"
              className="h-10 w-auto rounded bg-white px-1.5 py-0.5 object-contain"
            />
            <div>
              <p className="font-heading font-black text-sm">3D Copas</p>
              <p className="text-[11px] text-copas-plata">Panel de control</p>
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-heading font-semibold text-sm transition-all ${
                    active
                      ? 'bg-copas-azul text-white'
                      : 'text-copas-plata hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span className="bg-copas-dorado text-copas-marino text-xs font-black px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 mt-4 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-copas-plata hover:bg-white/10 hover:text-white"
            >
              <ExternalLink size={16} /> Ver tienda pública
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-300 hover:bg-white/10 w-full text-left"
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
