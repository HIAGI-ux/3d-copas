'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import Link from 'next/link'

const ADMIN_EMAIL = 'admin@3dcopas.com'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    })
    if (error) {
      setLoading(false)
      toast.error('Clave incorrecta.')
      return
    }

    const isAdmin =
      data.user?.user_metadata?.role === 'admin' ||
      data.user?.app_metadata?.role === 'admin'

    if (!isAdmin) {
      await supabase.auth.signOut()
      setLoading(false)
      toast.error('Esta cuenta no tiene permisos de administrador.')
      return
    }

    toast.success('Sesión iniciada en el panel')
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-copas-crema flex items-center justify-center p-4">
      <div className="bg-white rounded-card border border-copas-plata shadow-lg p-6 sm:p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-3d-copas.png"
            alt="3D Copas"
            className="h-20 w-auto object-contain mb-3"
          />
          <h1 className="font-heading text-2xl font-black text-copas-marino">
            Panel de Administrador
          </h1>
          <p className="text-sm text-copas-plata-oscuro">Uso exclusivo de 3D Copas</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label="Clave de acceso"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresá la clave de administrador"
            required
            autoComplete="current-password"
          />
          <Button type="submit" size="lg" loading={loading} className="mt-2">
            Ingresar al panel
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-copas-azul font-semibold hover:underline">
            ← Volver a la tienda pública
          </Link>
        </div>
      </div>
    </div>
  )
}
