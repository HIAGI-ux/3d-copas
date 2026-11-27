import { cn } from '@/lib/utils'

type BadgeVariant = 'nuevo' | 'navidad' | 'mas-pedido' | 'a-pedido' | 'agotado' | 'default'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  'nuevo': 'bg-copas-verde text-white',
  'navidad': 'bg-red-700 text-white',
  'mas-pedido': 'bg-copas-dorado text-copas-marino',
  'a-pedido': 'bg-copas-plata text-copas-marino',
  'agotado': 'bg-copas-rojo text-white',
  'default': 'bg-copas-plata text-copas-marino',
}

const LABEL_MAP: Record<string, BadgeVariant> = {
  'Nuevo': 'nuevo',
  'Navidad': 'navidad',
  'Más pedido': 'mas-pedido',
  'A pedido': 'a-pedido',
  'Agotado': 'agotado',
}

interface BadgeProps {
  label: string
  className?: string
}

export default function Badge({ label, className }: BadgeProps) {
  const variant = LABEL_MAP[label] ?? 'default'
  return (
    <span className={cn(
      'inline-block px-2 py-0.5 rounded text-xs font-heading font-bold',
      BADGE_STYLES[variant],
      className
    )}>
      {label}
    </span>
  )
}
