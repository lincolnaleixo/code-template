import { treaty } from '@elysiajs/eden'
import type { App } from '@matrix/api'

export const api = treaty<App>(
  typeof window === 'undefined'
    ? process.env.API_URL ?? 'http://localhost:3001'
    : (import.meta.env?.VITE_API_URL ?? 'http://localhost:3001'),
)
