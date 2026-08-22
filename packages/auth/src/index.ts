import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@matrix/db'
import * as schema from '@matrix/db/schema'
import { getServerEnv } from '@matrix/env/server'
import { betterAuth } from 'better-auth'
import { bearer, organization } from 'better-auth/plugins'
import { accessControl, organizationRoles } from './permissions'

const environment = getServerEnv()

export const auth = betterAuth({
  appName: 'Matrix Template',
  baseURL: environment.BETTER_AUTH_URL,
  secret: environment.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  trustedOrigins: environment.AUTH_TRUSTED_ORIGINS,
  advanced: {
    useSecureCookies: environment.NODE_ENV === 'production',
    database: {
      joins: true,
    },
  },
  plugins: [
    organization({
      ac: accessControl,
      roles: organizationRoles,
      allowUserToCreateOrganization: true,
    }),
    bearer({ requireSignature: true }),
  ],
})
