import {
  type ButtonHTMLAttributes,
  createContext,
  type HTMLAttributes,
  type KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react'
import { cn } from '../utils'

interface TabsContextValue {
  baseId: string
  onValueChange: (value: string) => void
  panels: ReadonlySet<string>
  registerPanel: (value: string) => () => void
  value: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tabs components must be used inside Tabs.')
  return context
}

function tabId(baseId: string, value: string) {
  return `${baseId}-tab-${value.replace(/\s+/g, '-')}`
}

function panelId(baseId: string, value: string) {
  return `${baseId}-panel-${value.replace(/\s+/g, '-')}`
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  onValueChange: (value: string) => void
  value: string
}

export function Tabs({ children, onValueChange, value, ...props }: TabsProps) {
  const baseId = useId()
  const [panels, setPanels] = useState<ReadonlySet<string>>(() => new Set())
  const registerPanel = useCallback((panelValue: string) => {
    setPanels((current) => {
      if (current.has(panelValue)) return current
      const next = new Set(current)
      next.add(panelValue)
      return next
    })

    return () => {
      setPanels((current) => {
        if (!current.has(panelValue)) return current
        const next = new Set(current)
        next.delete(panelValue)
        return next
      })
    }
  }, [])

  return (
    <TabsContext.Provider value={{ baseId, onValueChange, panels, registerPanel, value }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

function moveTabFocus(event: KeyboardEvent<HTMLDivElement>) {
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
  )
  const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement)
  if (currentIndex < 0) return

  let nextIndex: number | null = null
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
  if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = tabs.length - 1
  if (nextIndex === null) return

  event.preventDefault()
  tabs[nextIndex]?.focus()
  tabs[nextIndex]?.click()
}

export function TabsList({ className, onKeyDown, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex min-h-[var(--control-height)] items-center rounded-lg bg-muted p-1',
        'text-muted-foreground',
        className,
      )}
      onKeyDown={(event) => {
        moveTabFocus(event)
        onKeyDown?.(event)
      }}
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
  const controls = context.panels.has(value) ? panelId(context.baseId, value) : undefined

  return (
    <button
      aria-controls={controls}
      aria-selected={active}
      className={cn(
        'inline-flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm',
        'font-medium transition-all focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50',
        active && 'bg-background text-foreground shadow-xs',
        className,
      )}
      id={tabId(context.baseId, value)}
      onClick={(event) => {
        context.onValueChange(value)
        onClick?.(event)
      }}
      role="tab"
      tabIndex={active ? 0 : -1}
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
  const active = context.value === value
  const registerPanel = context.registerPanel

  useEffect(() => registerPanel(value), [registerPanel, value])

  return (
    <div
      aria-labelledby={tabId(context.baseId, value)}
      className={cn('mt-4 outline-none', className)}
      hidden={!active}
      id={panelId(context.baseId, value)}
      role="tabpanel"
      tabIndex={active ? 0 : -1}
      {...props}
    >
      {children}
    </div>
  )
}
