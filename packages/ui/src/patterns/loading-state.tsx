import { type ReactNode } from 'react'
import { cn } from '../utils'
import { Skeleton } from '../components/skeleton'

export interface LoadingStateProps {
  className?: string
  description?: ReactNode
  rows?: number
  title?: ReactNode
}

export function LoadingState({
  className,
  description = 'Loading the latest information.',
  rows = 3,
  title = 'Loading',
}: LoadingStateProps) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className={cn('rounded-xl border bg-card p-6', className)}
    >
      <div className="max-w-md">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton
            className={cn('h-4', index === rows - 1 ? 'w-2/3' : 'w-full')}
            key={`loading-row-${String(index)}`}
          />
        ))}
      </div>
    </section>
  )
}
