'use client'
import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-copas-marino/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-white rounded-t-2xl sm:rounded-2xl w-full shadow-2xl',
        'max-h-[90vh] overflow-y-auto',
        sizes[size]
      )}>
        {title && (
          <div className="sticky top-0 bg-white border-b border-copas-plata flex items-center justify-between px-6 py-4 rounded-t-2xl">
            <h2 className="font-heading text-lg font-bold text-copas-marino">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-copas-crema transition-colors" aria-label="Cerrar">
              <X size={20} className="text-copas-plata-oscuro" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
