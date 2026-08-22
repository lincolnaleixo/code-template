import { loadServerEnv, type ServerEnv } from './server'

export function createTestEnv(overrides: Partial<Record<keyof ServerEnv, string>> = {}): ServerEnv {
  return loadServerEnv({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://matrix:matrix@localhost:5432/matrix',
    WEB_URL: 'http://localhost:3000',
    CORS_ORIGINS: 'http://localhost:3000',
    AUTH_TRUSTED_ORIGINS: 'http://localhost:3000',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    BETTER_AUTH_URL: 'http://localhost:3001',
    ...overrides,
  })
}
