import type { ReactNode } from 'react'
import { Label } from '../components/label'
import { cn } from '../utils'

export interface FormFieldProps {
  children: ReactNode
  className?: string
  description?: ReactNode
  error?: ReactNode
  htmlFor?: string
  label: ReactNode
}

export function FormField({ children, className, description, error, htmlFor, label }: FormFieldProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs leading-5 text-destructive">{error}</p>
      ) : description ? (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
