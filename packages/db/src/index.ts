import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL ?? 'postgres://matrix:matrix@localhost:5432/matrix'
const client = postgres(connectionString)

export const db = drizzle(client, { schema })
export * from './schema'
