import type { ReactNode } from 'react'
import { WarningIcon } from '../icons'
import { cn } from '../utils'

export interface ErrorStateProps {
  action?: ReactNode
  className?: string
  description: ReactNode
  title?: ReactNode
}

export function ErrorState({
  action,
  className,
  description,
  title = 'Something went wrong',
}: ErrorStateProps) {
  return (
    <section
      aria-live="assertive"
      className={cn(
        'flex flex-col items-center rounded-xl border border-destructive/25 bg-destructive/5',
        'px-6 py-10 text-center',
        className,
      )}
      role="alert"
    >
      <div className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
        <WarningIcon className="size-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</div>
      {action && <div className="mt-5">{action}</div>}
    </section>
  )
}
