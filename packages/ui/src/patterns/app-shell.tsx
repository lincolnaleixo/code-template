import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, useState } from 'react'
import { Button } from '../components/button'
import { CloseIcon, MenuIcon } from '../icons'
import { cn } from '../utils'

export interface AppShellProps {
  children: ReactNode
  className?: string
  header?: ReactNode
  sidebar: ReactNode
}

export function AppShell({ children, className, header, sidebar }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className={cn('min-h-dvh bg-background', className)}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
        <div className="h-full overflow-y-auto p-4">{sidebar}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(22rem,88vw)] border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-2xl">
            <div className="mb-3 flex justify-end">
              <Button aria-label="Close navigation" onClick={() => setMobileOpen(false)} size="icon" type="button" variant="ghost">
                <CloseIcon className="size-4" />
              </Button>
            </div>
            <div className="h-[calc(100%_-_3rem)] overflow-y-auto">{sidebar}</div>
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/88 px-[var(--page-gutter)] backdrop-blur-xl">
          <Button aria-label="Open navigation" className="lg:hidden" onClick={() => setMobileOpen(true)} size="icon" type="button" variant="ghost">
            <MenuIcon className="size-5" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">{header}</div>
        </header>
        <main className="px-[var(--page-gutter)] py-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}

export function SidebarSection({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-2', className)} {...props} />
}

export function SidebarLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('px-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground', className)} {...props} />
}

export interface SidebarItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: ReactNode
}

export function SidebarItem({ active, children, className, icon, ...props }: SidebarItemProps) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        className,
      )}
      type="button"
      {...props}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  )
}
