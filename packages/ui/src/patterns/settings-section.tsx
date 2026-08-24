import type { ReactNode } from 'react'
import { cn } from '../utils'

export interface SettingsSectionProps {
  actions?: ReactNode
  children: ReactNode
  className?: string
  description?: ReactNode
  title: ReactNode
}

export function SettingsSection({ actions, children, className, description, title }: SettingsSectionProps) {
  return (
    <section className={cn('grid gap-5 border-b py-7 last:border-b-0 lg:grid-cols-[16rem_1fr]', className)}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <div className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</div>}
      </div>
      <div className="min-w-0">
        <div className="space-y-5">{children}</div>
        {actions && <div className="mt-5 flex flex-wrap justify-end gap-2">{actions}</div>}
      </div>
    </section>
  )
}
