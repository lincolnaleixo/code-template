import type { ReactNode } from 'react'
import { Card, CardContent } from '../components/card'

export interface StatCardProps {
  className?: string
  description?: ReactNode
  icon?: ReactNode
  label: ReactNode
  value: ReactNode
}

export function StatCard({ className, description, icon, label, value }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
        </div>
        {icon && (
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
