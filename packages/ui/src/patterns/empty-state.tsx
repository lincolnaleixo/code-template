import type { ReactNode } from 'react'
import { cn } from '../utils'

export interface EmptyStateProps {
  action?: ReactNode
  className?: string
  description?: ReactNode
  icon?: ReactNode
  title: ReactNode
}

export function EmptyState({ action, className, description, icon, title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'grid min-h-64 place-items-center rounded-xl border border-dashed',
        'bg-card/50 p-8 text-center',
        className,
      )}
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        {icon && (
          <div className="mb-4 grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <div className="mt-2 text-sm leading-6 text-muted-foreground">{description}</div>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  )
}
