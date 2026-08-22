import { type ReactNode, useEffect, useRef } from 'react'
import { CloseIcon } from '../icons'
import { cn } from '../utils'
import { Button } from './button'

export interface DialogProps {
  children: ReactNode
  className?: string
  description?: ReactNode
  footer?: ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
  title: ReactNode
}

export function Dialog({
  children,
  className,
  description,
  footer,
  onOpenChange,
  open,
  title,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      className={cn(
        'm-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-visible',
        'bg-transparent p-0 text-foreground backdrop:bg-foreground/35',
        'backdrop:backdrop-blur-[2px]',
      )}
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false)
      }}
      ref={ref}
    >
      <div className={cn('rounded-xl border bg-card p-6 shadow-2xl', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && (
              <div className="text-sm leading-6 text-muted-foreground">{description}</div>
            )}
          </div>
          <Button
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <CloseIcon className="size-4" />
          </Button>
        </div>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  )
}
