interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon = '🃏', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <span className="text-5xl">{icon}</span>
      <h3 className="font-heading text-xl font-bold text-copas-marino">{title}</h3>
      {description && <p className="text-copas-plata-oscuro max-w-sm">{description}</p>}
      {action}
    </div>
  )
}
