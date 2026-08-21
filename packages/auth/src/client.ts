import { createAuthClient } from 'better-auth/react'

const serverBaseUrl = process.env.API_URL ?? 'http://localhost:3001'
const configuredBrowserBaseUrl = import.meta.env?.VITE_API_URL?.trim()
const browserBaseUrl = configuredBrowserBaseUrl || (typeof window === 'undefined' ? serverBaseUrl : window.location.origin)

export const authClient = createAuthClient({
  baseURL: typeof window === 'undefined' ? serverBaseUrl : browserBaseUrl,
})

export const { signIn, signOut, signUp, useSession } = authClient
