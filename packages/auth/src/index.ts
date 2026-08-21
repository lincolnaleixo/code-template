import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@matrix/db'
import { betterAuth } from 'better-auth/minimal'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  trustedOrigins: [process.env.WEB_URL ?? 'http://localhost:3000'],
})
