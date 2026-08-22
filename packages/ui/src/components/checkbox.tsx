import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../utils'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      className={cn(
        'relative size-4 shrink-0 appearance-none rounded-[0.3rem] border border-input bg-background shadow-xs transition-colors',
        'checked:border-primary checked:bg-primary',
        'checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.08rem]',
        'checked:after:h-[0.58rem] checked:after:w-[0.32rem] checked:after:rotate-45',
        'checked:after:border-[0_2px_2px_0] checked:after:border-primary-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      type="checkbox"
      {...props}
    />
  ),
)

Checkbox.displayName = 'Checkbox'
