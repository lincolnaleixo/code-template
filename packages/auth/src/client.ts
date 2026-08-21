import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: typeof window === 'undefined' ? 'http://localhost:3001' : window.location.origin,
})

export const { signIn, signOut, signUp, useSession } = authClient
