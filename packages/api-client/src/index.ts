import { treaty } from '@elysiajs/eden'
import type { App } from '@matrix/api'

const serverBaseUrl = process.env.API_URL ?? 'http://localhost:3001'
const configuredBrowserBaseUrl = import.meta.env?.VITE_API_URL?.trim()
const browserBaseUrl = configuredBrowserBaseUrl || (typeof window === 'undefined' ? serverBaseUrl : window.location.origin)

export const api = treaty<App>(typeof window === 'undefined' ? serverBaseUrl : browserBaseUrl)
