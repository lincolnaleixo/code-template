import { loadClientEnv, resolveApiBaseUrl } from '@matrix/env/client'
import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { accessControl, organizationRoles } from './permissions'

const viteEnvironment = (
  import.meta as ImportMeta & {
    env?: Record<string, string | boolean | undefined>
  }
).env

const environment = loadClientEnv({
  VITE_API_URL: viteEnvironment?.VITE_API_URL,
  VITE_APP_NAME: viteEnvironment?.VITE_APP_NAME,
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
