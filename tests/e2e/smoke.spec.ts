import { expect, test } from '@playwright/test'

test('completes the authenticated organization project lifecycle', async ({ page, request }) => {
  const healthResponse = await request.get('/health')
  expect(healthResponse.status()).toBe(200)
  await expect(healthResponse.json()).resolves.toEqual({ ok: true, runtime: 'bun' })

  const uniqueId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const email = `e2e-${uniqueId}@example.com`
  const organizationName = `E2E Organization ${uniqueId}`
  const projectName = `E2E Project ${uniqueId}`

  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: /One TypeScript product across web, API, mobile and desktop/i,
    }),
  ).toBeVisible()

  await page.getByLabel('Name').fill('E2E User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('a-secure-e2e-password')
  await page.getByRole('button', { name: 'Create account', exact: true }).last().click()

  await expect(page.getByRole('heading', { name: 'E2E User' })).toBeVisible()
  await expect(page.getByRole('complementary').getByText(email, { exact: true })).toBeVisible()

  await page.getByLabel('New organization').fill(organizationName)
  await page.getByRole('button', { name: 'Create organization' }).click()
  await expect(page.getByRole('heading', { name: organizationName })).toBeVisible()

  await page.getByLabel('Project name').fill(projectName)
  await page.getByRole('button', { name: 'Add project' }).click()
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'E2E User' })).toBeVisible()
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(
    page.getByRole('heading', {
      name: /One TypeScript product across web, API, mobile and desktop/i,
    }),
  ).toBeVisible()
})
