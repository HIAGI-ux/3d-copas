import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea un número como precio en pesos argentinos. Ej: 12500 → "$12.500" */
export function formatPrice(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('es-AR')
}

/** Formatea una fecha como dd/mm/aaaa */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Formatea una fecha larga: "27 de noviembre de 2026" */
export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Genera un slug desde un texto */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Detecta si una entrega es local basándose en la configuración de zona */
export function isLocalDelivery(
  province: string,
  city: string,
  postalCode: string,
  localConfig: { province: string; city: string; postalCodes: string[] }
): boolean {
  const normalizeStr = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  const provincesMatch = normalizeStr(province) === normalizeStr(localConfig.province)
  const citiesMatch = normalizeStr(city) === normalizeStr(localConfig.city)
  const postalMatch = localConfig.postalCodes.some(
    pc => pc.trim() === postalCode.trim()
  )

  return provincesMatch && citiesMatch && postalMatch
}
