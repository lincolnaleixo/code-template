import type { ReactNode } from 'react'
import { Skeleton } from '../components/skeleton'
import { cn } from '../utils'

const loadingRowKeys = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
] as const

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
  const visibleRows = loadingRowKeys.slice(0, Math.max(1, Math.min(rows, loadingRowKeys.length)))

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
        {visibleRows.map((row, index) => (
          <Skeleton
            className={cn('h-4', index === visibleRows.length - 1 ? 'w-2/3' : 'w-full')}
            key={row}
          />
        ))}
      </div>
    </section>
  )
}
