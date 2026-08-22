import { describe, expect, test } from 'bun:test'
import { createNativeAuthFetch, type SecureTokenStore } from '../src/native'

class MemoryTokenStore implements SecureTokenStore {
  constructor(public token: string | null) {}

  async get(): Promise<string | null> {
    return this.token
  }

  async set(token: string): Promise<void> {
    this.token = token
  }

  async remove(): Promise<void> {
    this.token = null
  }
}

describe('native auth transport', () => {
  test('reads and rotates bearer tokens through the injected secure store', async () => {
    const store = new MemoryTokenStore('old-token')
    let authorization = ''

    const nativeFetch = createNativeAuthFetch({
      baseUrl: 'https://api.example.com',
      tokenStore: store,
      fetchImplementation: async (_input, init) => {
        authorization = new Headers(init?.headers).get('authorization') ?? ''
        return new Response(null, {
          status: 200,
          headers: { 'set-auth-token': 'rotated-token' },
        })
      },
    })

    await nativeFetch('/api/me')

    expect(authorization).toBe('Bearer old-token')
    expect(store.token).toBe('rotated-token')
  })

  test('removes an invalid bearer token after an unauthorized response', async () => {
    const store = new MemoryTokenStore('expired-token')
    const nativeFetch = createNativeAuthFetch({
      baseUrl: 'https://api.example.com',
      tokenStore: store,
      fetchImplementation: async () => new Response(null, { status: 401 }),
    })

    await nativeFetch('/api/me')
    expect(store.token).toBeNull()
  })
})
