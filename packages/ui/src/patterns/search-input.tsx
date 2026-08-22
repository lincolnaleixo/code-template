import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../utils'

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, placeholder = 'Search', ...props }, ref) => (
    <label className="relative block">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
      <input
        className={cn(
          'h-[var(--control-height)] w-full rounded-md border border-input bg-background',
          'pl-9 pr-3 text-sm shadow-xs outline-none transition-colors',
          'placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/45',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        placeholder={placeholder}
        ref={ref}
        type="search"
        {...props}
      />
    </label>
  ),
)

SearchInput.displayName = 'SearchInput'
