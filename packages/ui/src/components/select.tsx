import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../utils'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ children, className, ...props }, ref) => (
  <select
    className={cn(
      'flex h-[var(--control-height)] w-full rounded-md border border-input',
      'bg-background px-3 py-2 text-sm shadow-xs outline-none',
      'transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2',
      'focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  >
    {children}
  </select>
))

Select.displayName = 'Select'
