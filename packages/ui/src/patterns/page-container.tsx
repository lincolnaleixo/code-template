import { type HTMLAttributes } from 'react'
import { cn } from '../utils'

export type PageContainerProps = HTMLAttributes<HTMLDivElement>

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-6xl space-y-[var(--section-gap)]', className)}
      {...props}
    />
  )
}
