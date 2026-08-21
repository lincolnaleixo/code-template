import { expect, test } from '@playwright/test'

test('serves the web app and persists data through the proxied API', async ({ page, request }) => {
  const healthResponse = await request.get('/health')
  expect(healthResponse.status()).toBe(200)
  await expect(healthResponse.json()).resolves.toEqual({ ok: true, runtime: 'bun' })

  const email = `e2e-${String(Date.now())}@example.com`
  const createResponse = await request.post('/api/users', {
    data: {
      email,
      name: 'E2E User',
    },
  })

  expect(createResponse.status()).toBe(201)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /One TypeScript stack/i })).toBeVisible()
  await expect(page.getByText('E2E User')).toBeVisible()
})
