import { cloneElement, type ReactElement, type ReactNode, useId } from 'react'
import { cn } from '../utils'

export interface TooltipProps {
  children: ReactElement<{ 'aria-describedby'?: string }>
  className?: string
  content: ReactNode
  side?: 'bottom' | 'left' | 'right' | 'top'
}

const sideClasses = {
  bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
} as const

export function Tooltip({ children, className, content, side = 'top' }: TooltipProps) {
  const id = useId()
  const existingDescription = children.props['aria-describedby']
  const trigger = cloneElement(children, {
    'aria-describedby': [existingDescription, id].filter(Boolean).join(' '),
  })

  return (
    <span className="group/tooltip relative inline-flex">
      {trigger}
      <span
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-64 rounded-md bg-foreground px-2.5 py-1.5',
          'text-xs leading-5 text-background opacity-0 shadow-lg transition-opacity',
          'duration-[var(--duration-fast)] group-focus-within/tooltip:opacity-100',
          'group-hover/tooltip:opacity-100',
          sideClasses[side],
          className,
        )}
        id={id}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  )
}
