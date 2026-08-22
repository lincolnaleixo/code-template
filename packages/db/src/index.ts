import { getServerEnv } from '@matrix/env/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const environment = getServerEnv()

export const databaseClient = postgres(environment.DATABASE_URL, {
  max: environment.NODE_ENV === 'production' ? 20 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(databaseClient, { schema })

export async function closeDatabase(): Promise<void> {
  await databaseClient.end()
}

export * from './schema'
