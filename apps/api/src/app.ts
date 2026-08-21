import { cors } from '@elysiajs/cors'
import { auth } from '@matrix/auth'
import { db, users } from '@matrix/db'
import { Elysia, t } from 'elysia'

const corsOrigins = (process.env.CORS_ORIGINS ?? process.env.WEB_URL ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const app = new Elysia({ name: 'matrix-api' })
  .use(
    cors({
      origin: corsOrigins,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  .mount(auth.handler)
  .get('/health', () => ({ ok: true, runtime: 'bun' }))
  .get('/ready', async ({ set }) => {
    try {
      await db.select({ id: users.id }).from(users).limit(1)
      return { ok: true, database: 'ready' }
    } catch {
      set.status = 503
      return { ok: false, database: 'unavailable' }
    }
  })
  .get('/api/users', async () => db.select().from(users))
  .post(
    '/api/users',
    async ({ body, set }) => {
      const [user] = await db.insert(users).values(body).returning()
      set.status = 201
      return user
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        name: t.Optional(t.String()),
      }),
    },
  )

export type App = typeof app
