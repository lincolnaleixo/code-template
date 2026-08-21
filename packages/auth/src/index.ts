import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@matrix/db'
import { betterAuth } from 'better-auth/minimal'

const trustedOrigins = (process.env.AUTH_TRUSTED_ORIGINS ?? process.env.WEB_URL ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  trustedOrigins,
})
