// src/lib/colors.ts
// Helpers y paleta de colores para productos de impresión 3D.
// Soporta nombres simples ("Beige", "Blanco") y colores personalizados ("Beige mate|#E6D7B9").

export interface ColorOption {
  name: string
  hex: string
}

export const PRESET_COLORS: ColorOption[] = [
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Beige', hex: '#E8DCC4' },
  { name: 'Crema', hex: '#F5EFE0' },
  { name: 'Negro', hex: '#18181B' },
  { name: 'Gris', hex: '#9CA3AF' },
  { name: 'Gris oscuro', hex: '#4B5563' },
  { name: 'Plata', hex: '#CBD5E1' },
  { name: 'Azul', hex: '#0D52D6' },
  { name: 'Celeste', hex: '#38BDF8' },
  { name: 'Azul marino', hex: '#0F172A' },
  { name: 'Rojo', hex: '#DC2626' },
  { name: 'Bordó', hex: '#7F1D1D' },
  { name: 'Rosa', hex: '#F472B6' },
  { name: 'Fucsia', hex: '#DB2777' },
  { name: 'Verde', hex: '#16A34A' },
  { name: 'Verde agua', hex: '#2DD4BF' },
  { name: 'Verde militar', hex: '#4D7C0F' },
  { name: 'Amarillo', hex: '#FACC15' },
  { name: 'Dorado', hex: '#D97706' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Violeta', hex: '#7C3AED' },
  { name: 'Lila', hex: '#C084FC' },
  { name: 'Marrón', hex: '#78350F' },
  { name: 'Cobre', hex: '#B45309' },
]

const COLOR_MAP = new Map<string, string>(
  PRESET_COLORS.map((c) => [c.name.toLowerCase(), c.hex])
)

/**
 * Convierte un string guardado en DB ("Beige" o "Beige mate|#E6D7B9") en { name, hex }.
 */
export function parseColorOption(raw: string): ColorOption {
  const trimmed = (raw || '').trim()
  if (!trimmed) return { name: 'Estándar', hex: '#CBD5E1' }

  if (trimmed.includes('|')) {
    const [namePart, hexPart] = trimmed.split('|')
    const name = namePart.trim() || 'Personalizado'
    const hex = /^#[0-9A-Fa-f]{3,8}$/.test((hexPart || '').trim())
      ? hexPart.trim()
      : COLOR_MAP.get(name.toLowerCase()) || '#CBD5E1'
    return { name, hex }
  }

  const lower = trimmed.toLowerCase()
  const known = COLOR_MAP.get(lower)
  if (known) return { name: trimmed, hex: known }

  // Coincidencia parcial (ej: "Azul Francia" -> azul)
  for (const [key, hex] of COLOR_MAP.entries()) {
    if (lower.includes(key)) return { name: trimmed, hex }
  }

  return { name: trimmed, hex: '#CBD5E1' }
}

/**
 * Serializa un ColorOption para guardar en el array `colors: string[]` de Supabase.
 * Si coincide exactamente con un preset, guarda solo el nombre limpio; si es personalizado, guarda "Nombre|#HEX".
 */
export function serializeColorOption(option: ColorOption): string {
  const name = option.name.trim()
  const presetHex = COLOR_MAP.get(name.toLowerCase())
  if (presetHex && presetHex.toLowerCase() === option.hex.toLowerCase()) {
    return name
  }
  return `${name}|${option.hex}`
}

/**
 * Indica si un color hex es muy claro (para ponerle borde visible al circulito).
 */
export function isLightHex(hex: string): boolean {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return false
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.78
}
