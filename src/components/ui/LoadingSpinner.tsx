import { cn } from '@/lib/utils'

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="w-8 h-8 border-4 border-copas-plata border-t-copas-azul rounded-full animate-spin" />
    </div>
  )
}
