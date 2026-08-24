import { type ReactNode, useEffect, useRef } from 'react'
import { CloseIcon } from '../icons'
import { cn } from '../utils'
import { Button } from './button'

export interface SheetProps {
  children: ReactNode
  className?: string
  description?: ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
  side?: 'left' | 'right'
  title: ReactNode
}

export function Sheet({
  children,
  className,
  description,
  onOpenChange,
  open,
  side = 'right',
  title,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const sheet = ref.current
    if (!sheet) return

    if (open && !sheet.open) sheet.showModal()
    if (!open && sheet.open) sheet.close()
  }, [open])

  const position = side === 'left' ? 'left-0 border-r' : 'right-0 border-l'

  return (
    <dialog
      className={cn(
        'fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0',
        'text-foreground backdrop:bg-foreground/35 backdrop:backdrop-blur-[2px]',
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
      <section
        className={cn(
          'absolute inset-y-0 flex w-[min(28rem,90vw)] flex-col border-border bg-card shadow-2xl',
          position,
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && <div className="text-sm leading-6 text-muted-foreground">{description}</div>}
          </div>
          <Button
            aria-label="Close panel"
            onClick={() => onOpenChange(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <CloseIcon className="size-4" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </section>
    </dialog>
  )
}
