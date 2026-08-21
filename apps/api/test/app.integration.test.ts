import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { closeDatabase, db, users } from '@matrix/db'
import { app } from '../src/app'

describe('API with PostgreSQL', () => {
  beforeEach(async () => {
    await db.delete(users)
  })

  afterAll(async () => {
    await closeDatabase()
  })

  test('reports readiness after migrations are applied', async () => {
    const response = await app.handle(new Request('http://localhost/ready'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, database: 'ready' })
  })

  test('creates and lists a user through the typed API surface', async () => {
    const createResponse = await app.handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'integration@example.com',
          name: 'Integration User',
        }),
      }),
    )

    expect(createResponse.status).toBe(201)
    const createdUser = (await createResponse.json()) as { email: string; name: string | null }
    expect(createdUser.email).toBe('integration@example.com')
    expect(createdUser.name).toBe('Integration User')

    const listResponse = await app.handle(new Request('http://localhost/api/users'))
    const listedUsers = (await listResponse.json()) as Array<{ email: string }>

    expect(listResponse.status).toBe(200)
    expect(listedUsers).toHaveLength(1)
    expect(listedUsers[0]?.email).toBe('integration@example.com')
  })

  test('rejects invalid request bodies before touching the database', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      }),
    )

    expect(response.status).toBe(422)
  })
})
