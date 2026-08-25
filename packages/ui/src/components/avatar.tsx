import type { HTMLAttributes, ImgHTMLAttributes } from 'react'
import { cn } from '../utils'

export function Avatar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full bg-muted', className)}
      {...props}
    />
  )
}

export type AvatarImageProps = ImgHTMLAttributes<HTMLImageElement> & { alt: string }

export function AvatarImage({ alt, className, ...props }: AvatarImageProps) {
  return <img alt={alt} className={cn('aspect-square size-full object-cover', className)} {...props} />
}

export function AvatarFallback({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex size-full items-center justify-center text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}
