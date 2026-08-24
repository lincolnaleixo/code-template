import { describe, expect, test } from 'bun:test'
import { loadClientEnv } from '../src/client'
import { loadServerEnv } from '../src/server'

const productionBase = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://matrix:matrix@database.example.com:5432/matrix',
  WEB_URL: 'https://app.example.com',
  CORS_ORIGINS: 'https://app.example.com',
  AUTH_TRUSTED_ORIGINS: 'https://app.example.com',
  BETTER_AUTH_SECRET: 'a-production-secret-with-more-than-thirty-two-characters',
  BETTER_AUTH_URL: 'https://app.example.com',
}

describe('environment validation', () => {
  test('rejects the development authentication secret in production', () => {
    expect(() =>
      loadServerEnv({
        ...productionBase,
        BETTER_AUTH_SECRET: 'change-me-with-at-least-32-random-characters',
      }),
    ).toThrow()
  })

  test('requires S3 credentials as a pair', () => {
    expect(() =>
      loadServerEnv({
        ...productionBase,
        S3_ACCESS_KEY: 'access-key',
      }),
    ).toThrow()
  })

  test('requires an externally reachable API URL for native builds', () => {
    expect(() => loadClientEnv({}, 'native')).toThrow('VITE_API_URL is required')
    expect(loadClientEnv({ VITE_API_URL: 'https://api.example.com' }, 'native').VITE_API_URL).toBe(
      'https://api.example.com',
    )
  })
})
