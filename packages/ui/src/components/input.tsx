import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    className={cn(
      'flex h-[var(--control-height)] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
      className,
    )}
    ref={ref}
    type={type}
    {...props}
  />
))

Input.displayName = 'Input'
