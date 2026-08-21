import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL ?? 'postgres://matrix:matrix@localhost:5432/matrix'

export const databaseClient = postgres(connectionString)
export const db = drizzle(databaseClient, { schema })

export async function closeDatabase() {
  await databaseClient.end()
}

export * from './schema'
