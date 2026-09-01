import { treaty } from '@elysiajs/eden'
import type { App } from '@matrix/api'
import { loadClientEnv, resolveApiBaseUrl } from '@matrix/env/client'

const viteEnvironment = (
  import.meta as ImportMeta & {
    env?: Record<string, string | boolean | undefined>
  }
).env

const environment = loadClientEnv({
  VITE_API_URL: viteEnvironment?.VITE_API_URL,
  VITE_APP_NAME: viteEnvironment?.VITE_APP_NAME,
})

const serverBaseUrl = process.env.API_URL?.trim() || 'http://localhost:3001'
const browserBaseUrl = resolveApiBaseUrl(environment)

export const api = treaty<App>(typeof window === 'undefined' ? serverBaseUrl : browserBaseUrl, {
  fetch: {
    credentials: 'include',
  },
})
