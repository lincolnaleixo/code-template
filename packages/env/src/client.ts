import { z } from 'zod'

const clientSchema = z.object({
  VITE_API_URL: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
  VITE_APP_NAME: z.string().min(1).default('Matrix Template'),
})

export type ClientEnv = z.infer<typeof clientSchema>
export type ClientTarget = 'web' | 'native'

export function loadClientEnv(
  source: Record<string, string | boolean | undefined>,
  target: ClientTarget = 'web',
): ClientEnv {
  const parsed = clientSchema.parse(source)

  if (target === 'native' && !parsed.VITE_API_URL) {
    throw new Error('VITE_API_URL is required for Capacitor and Tauri builds.')
  }

  return parsed
}

export function resolveApiBaseUrl(environment: ClientEnv): string {
  if (environment.VITE_API_URL) return environment.VITE_API_URL
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:3001'
}
