import { cors } from '@elysiajs/cors'
import { auth } from '@matrix/auth'
import { db, users } from '@matrix/db'
import { Elysia, t } from 'elysia'

export const app = new Elysia()
  .use(
    cors({
      origin: process.env.WEB_URL ?? 'http://localhost:3000',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  .mount(auth.handler)
  .get('/health', () => ({ ok: true, runtime: 'bun' }))
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
  .listen(Number(process.env.PORT ?? 3001))

export type App = typeof app

console.log(`API listening at http://${app.server?.hostname}:${app.server?.port}`)
