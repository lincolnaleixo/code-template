import type { ReactNode } from 'react'
import { Button } from '../components/button'
import { Dialog } from '../components/dialog'

export interface ConfirmDialogProps {
  cancelLabel?: string
  children?: ReactNode
  confirmLabel?: string
  description: ReactNode
  destructive?: boolean
  onCancel?: () => void
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  pending?: boolean
  title: ReactNode
}

export function ConfirmDialog({
  cancelLabel = 'Cancel',
  children,
  confirmLabel = 'Confirm',
  description,
  destructive = false,
  onCancel,
  onConfirm,
  onOpenChange,
  open,
  pending = false,
  title,
}: ConfirmDialogProps) {
  const close = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog
      description={description}
      footer={
        <>
          <Button disabled={pending} onClick={close} type="button" variant="outline">
            {cancelLabel}
          </Button>
          <Button
            disabled={pending}
            onClick={onConfirm}
            type="button"
            variant={destructive ? 'destructive' : 'default'}
          >
            {pending ? 'Working...' : confirmLabel}
          </Button>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      {children}
    </Dialog>
  )
}
