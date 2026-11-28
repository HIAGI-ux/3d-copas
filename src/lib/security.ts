/**
 * Utilidades de validación y sanitización de inputs para proteger contra
 * inyección SQL/PostgREST, XSS y datos malformados.
 * Nota: Las consultas a Supabase usan el cliente PostgREST parametrizado.
 */

const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const HTML_TAGS_RE = /<[^>]*>/g
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@<>()[\]\\,;:\s@"]+@[^\s@<>()[\]\\,;:\s@"]+\.[^\s@<>()[\]\\,;:\s@"]{2,}$/

export function sanitizeText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(CONTROL_CHARS_RE, '')
    .replace(HTML_TAGS_RE, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeEmail(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(CONTROL_CHARS_RE, '').trim().toLowerCase().slice(0, 254)
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email)
}

export function sanitizePhone(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[^\d+\-\s()]/g, '').trim().slice(0, 30)
}

export function sanitizeSearchQuery(value: unknown, maxLength = 100): string {
  if (typeof value !== 'string') return ''
  // Elimina caracteres que podrían alterar filtros PostgREST o inyectar operadores
  return value
    .replace(CONTROL_CHARS_RE, '')
    .replace(/[;'"\\`<>(){}[\]*%]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeSlug(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120)
}

export function sanitizeUrl(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('/')) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return ''
  } catch {
    return ''
  }
}

export function isValidUUID(value: unknown): boolean {
  return typeof value === 'string' && UUID_RE.test(value)
}
