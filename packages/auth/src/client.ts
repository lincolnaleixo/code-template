import { loadClientEnv, resolveApiBaseUrl } from '@matrix/env/client'
import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'
import { accessControl, organizationRoles } from './permissions'

const environment = loadClientEnv({
  VITE_API_URL: import.meta.env?.VITE_API_URL,
  VITE_APP_NAME: import.meta.env?.VITE_APP_NAME,
})

export const authClient = createAuthClient({
  baseURL: resolveApiBaseUrl(environment),
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [
    organizationClient({
      ac: accessControl,
      roles: organizationRoles,
    }),
  ],
})

export const { signIn, signOut, signUp, useSession, organization } = authClient
