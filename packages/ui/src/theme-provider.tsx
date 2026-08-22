import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Button } from './components/button'
import { MoonIcon, MonitorIcon, SunIcon } from './icons'

export type Theme = 'light' | 'dark' | 'system'
export type Density = 'compact' | 'comfortable'

interface AppearanceContextValue {
  density: Density
  setDensity: (density: Density) => void
  setTheme: (theme: Theme) => void
  theme: Theme
}

const THEME_STORAGE_KEY = 'matrix-theme'
const DENSITY_STORAGE_KEY = 'matrix-density'

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function isDensity(value: string | null): value is Density {
  return value === 'compact' || value === 'comfortable'
}

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.dataset.theme = theme

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  themeColor?.setAttribute('content', dark ? '#17181c' : '#ffffff')
}

function applyDensity(density: Density) {
  document.documentElement.dataset.density = density
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [density, setDensityState] = useState<Density>('comfortable')

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    const storedDensity = localStorage.getItem(DENSITY_STORAGE_KEY)

    const initialTheme = isTheme(storedTheme) ? storedTheme : 'system'
    const initialDensity = isDensity(storedDensity) ? storedDensity : 'comfortable'

    setThemeState(initialTheme)
    setDensityState(initialDensity)
    applyTheme(initialTheme)
    applyDensity(initialDensity)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      if (theme === 'system') applyTheme('system')
    }

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  const value = useMemo<AppearanceContextValue>(
    () => ({
      density,
      setDensity: (nextDensity) => {
        localStorage.setItem(DENSITY_STORAGE_KEY, nextDensity)
        setDensityState(nextDensity)
        applyDensity(nextDensity)
      },
      setTheme: (nextTheme) => {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
        setThemeState(nextTheme)
        applyTheme(nextTheme)
      },
      theme,
    }),
    [density, theme],
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance() {
  const value = useContext(AppearanceContext)
  if (!value) throw new Error('useAppearance must be used inside AppearanceProvider.')
  return value
}

const themeOptions: Array<{ icon: typeof SunIcon; label: string; value: Theme }> = [
  { icon: SunIcon, label: 'Light theme', value: 'light' },
  { icon: MoonIcon, label: 'Dark theme', value: 'dark' },
  { icon: MonitorIcon, label: 'System theme', value: 'system' },
]

export function ThemeToggle() {
  const { setTheme, theme } = useAppearance()
  const option = themeOptions.find((item) => item.value === theme) ?? themeOptions[2]
  const nextIndex = (themeOptions.indexOf(option) + 1) % themeOptions.length
  const next = themeOptions[nextIndex]
  const Icon = option.icon

  return (
    <Button
      aria-label={`${option.label}. Switch to ${next.label.toLowerCase()}.`}
      onClick={() => setTheme(next.value)}
      size="icon"
      title={option.label}
      type="button"
      variant="ghost"
    >
      <Icon className="size-4" />
    </Button>
  )
}

export function DensityToggle() {
  const { density, setDensity } = useAppearance()
  const compact = density === 'compact'

  return (
    <Button
      aria-label={`Density: ${density}. Switch to ${compact ? 'comfortable' : 'compact'}.`}
      onClick={() => setDensity(compact ? 'comfortable' : 'compact')}
      size="sm"
      type="button"
      variant="ghost"
    >
      {compact ? 'Compact' : 'Comfortable'}
    </Button>
  )
}
