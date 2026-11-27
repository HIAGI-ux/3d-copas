import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-heading font-semibold text-copas-marino">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full border-2 rounded-lg px-4 py-2.5 text-copas-marino bg-white',
            'focus:outline-none focus:ring-2 focus:ring-copas-azul focus:border-copas-azul',
            'placeholder:text-copas-plata-oscuro transition-colors',
            error ? 'border-copas-rojo' : 'border-copas-plata',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-copas-plata-oscuro">{hint}</p>}
        {error && <p className="text-xs text-copas-rojo font-semibold">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
