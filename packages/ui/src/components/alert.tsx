import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '../utils'

const alertVariants = cva('relative grid gap-1 rounded-lg border p-4 text-sm', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
      success: 'border-success/25 bg-success/10 text-success',
      warning: 'border-warning/30 bg-warning/15 text-warning-foreground',
      info: 'border-info/25 bg-info/10 text-info',
    },
  },
  defaultVariants: { variant: 'default' },
})

export type AlertProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div className={cn(alertVariants({ className, variant }))} role="alert" {...props} />
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn('font-medium leading-none', className)} {...props} />
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm leading-6 opacity-90', className)} {...props} />
}
