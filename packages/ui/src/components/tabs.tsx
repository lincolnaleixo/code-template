import {
  createContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useContext,
} from 'react'
import { cn } from '../utils'

interface TabsContextValue {
  onValueChange: (value: string) => void
  value: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tabs components must be used inside Tabs.')
  return context
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  onValueChange: (value: string) => void
  value: string
}

export function Tabs({ children, onValueChange, value, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ onValueChange, value }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-flex min-h-[var(--control-height)] items-center rounded-lg bg-muted p-1 text-muted-foreground', className)}
      role="tablist"
      {...props}
    />
  )
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ children, className, onClick, value, ...props }: TabsTriggerProps) {
  const context = useTabsContext()
  const active = context.value === value

  return (
    <button
      aria-selected={active}
      className={cn(
        'inline-flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50',
        active && 'bg-background text-foreground shadow-xs',
        className,
      )}
      onClick={(event) => {
        context.onValueChange(value)
        onClick?.(event)
      }}
      role="tab"
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ children, className, value, ...props }: TabsContentProps) {
  const context = useTabsContext()
  if (context.value !== value) return null

  return (
    <div className={cn('mt-4 outline-none', className)} role="tabpanel" {...props}>
      {children as ReactNode}
    </div>
  )
}
