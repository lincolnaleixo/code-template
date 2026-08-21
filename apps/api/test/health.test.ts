import { afterAll, describe, expect, test } from 'bun:test'
import { closeDatabase } from '@matrix/db'
import { app } from '../src/app'

describe('health endpoint', () => {
  afterAll(async () => {
    await closeDatabase()
  })

  test('reports the Bun runtime without requiring PostgreSQL', async () => {
    const response = await app.handle(new Request('http://localhost/health'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, runtime: 'bun' })
  })
})
