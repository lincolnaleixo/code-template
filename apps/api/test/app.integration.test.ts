import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import {
  account,
  closeDatabase,
  db,
  invitation,
  member,
  organization,
  project,
  session,
  user,
  verification,
} from '@matrix/db'
import { app } from '../src/app'

interface TestIdentity {
  cookie: string
  bearerToken: string
  userId: string
}

function cookiesFromResponse(response: Response): string {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie
  const values = getSetCookie?.call(response.headers) ?? []

  if (values.length === 0) {
    const fallback = response.headers.get('set-cookie')
    if (fallback) values.push(fallback)
  }

  return values.map((value) => value.split(';', 1)[0]).join('; ')
}

async function jsonRequest(
  path: string,
  options: {
    method?: string
    body?: unknown
    cookie?: string
    bearerToken?: string
  } = {},
): Promise<Response> {
  const headers = new Headers({
    accept: 'application/json',
    'content-type': 'application/json',
  })

  if (options.cookie) headers.set('cookie', options.cookie)
  if (options.bearerToken) headers.set('authorization', `Bearer ${options.bearerToken}`)

  return app.handle(
    new Request(`http://localhost${path}`, {
      method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }),
  )
}

async function createIdentity(seed: string): Promise<TestIdentity> {
  const response = await jsonRequest('/api/auth/sign-up/email', {
    body: {
      name: `Integration ${seed}`,
      email: `${seed}@example.com`,
      password: 'a-secure-integration-password',
    },
  })

  expect(response.status).toBe(200)
  const payload = (await response.json()) as { user: { id: string } }
  const cookie = cookiesFromResponse(response)
  const bearerToken = response.headers.get('set-auth-token') ?? ''

  expect(cookie.length).toBeGreaterThan(0)
  expect(bearerToken.length).toBeGreaterThan(0)

  return {
    cookie,
    bearerToken,
    userId: payload.user.id,
  }
}

async function clearDatabase(): Promise<void> {
  await db.delete(project)
  await db.delete(invitation)
  await db.delete(member)
  await db.delete(organization)
  await db.delete(session)
  await db.delete(account)
  await db.delete(verification)
  await db.delete(user)
}

describe('API with PostgreSQL and Better Auth', () => {
  beforeEach(clearDatabase)

  afterAll(async () => {
    await clearDatabase()
    await closeDatabase()
  })

  test('reports readiness after committed migrations are applied', async () => {
    const response = await app.handle(new Request('http://localhost/ready'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, database: 'ready' })
  })

  test('supports cookie and signed bearer sessions', async () => {
    const identity = await createIdentity('session-user')

    const cookieResponse = await jsonRequest('/api/me', { cookie: identity.cookie })
    expect(cookieResponse.status).toBe(200)
    expect(((await cookieResponse.json()) as { user: { id: string } }).user.id).toBe(identity.userId)

    const bearerResponse = await jsonRequest('/api/me', { bearerToken: identity.bearerToken })
    expect(bearerResponse.status).toBe(200)
    expect(((await bearerResponse.json()) as { user: { id: string } }).user.id).toBe(identity.userId)
  })

  test('enforces organization membership and project permissions', async () => {
    const owner = await createIdentity('organization-owner')
    const outsider = await createIdentity('organization-outsider')

    const organizationResponse = await jsonRequest('/api/auth/organization/create', {
      cookie: owner.cookie,
      body: {
        name: 'Integration Organization',
        slug: `integration-${crypto.randomUUID()}`,
      },
    })

    expect(organizationResponse.status).toBe(200)
    const createdOrganization = (await organizationResponse.json()) as { id: string }

    const createProjectResponse = await jsonRequest(
      `/api/organizations/${createdOrganization.id}/projects`,
      {
        cookie: owner.cookie,
        body: { name: '  Production   Template  ' },
      },
    )

    expect(createProjectResponse.status).toBe(201)
    const createdProject = (await createProjectResponse.json()) as {
      name: string
      organizationId: string
      createdBy: string
    }
    expect(createdProject.name).toBe('Production Template')
    expect(createdProject.organizationId).toBe(createdOrganization.id)
    expect(createdProject.createdBy).toBe(owner.userId)

    const ownerListResponse = await jsonRequest(
      `/api/organizations/${createdOrganization.id}/projects`,
      { cookie: owner.cookie },
    )
    expect(ownerListResponse.status).toBe(200)
    expect((await ownerListResponse.json()) as unknown[]).toHaveLength(1)

    const outsiderListResponse = await jsonRequest(
      `/api/organizations/${createdOrganization.id}/projects`,
      { cookie: outsider.cookie },
    )
    expect(outsiderListResponse.status).toBe(403)
    expect(
      ((await outsiderListResponse.json()) as { error: { code: string } }).error.code,
    ).toBe('PERMISSION_DENIED')
  })

  test('invalidates protected access after sign out', async () => {
    const identity = await createIdentity('sign-out-user')

    const signOutResponse = await jsonRequest('/api/auth/sign-out', {
      cookie: identity.cookie,
      body: {},
    })
    expect(signOutResponse.status).toBe(200)

    const protectedResponse = await jsonRequest('/api/me', { cookie: identity.cookie })
    expect(protectedResponse.status).toBe(401)
    expect(((await protectedResponse.json()) as { error: { code: string } }).error.code).toBe(
      'AUTHENTICATION_REQUIRED',
    )
  })

  test('rejects invalid project payloads before reaching the application service', async () => {
    const owner = await createIdentity('validation-owner')
    const organizationResponse = await jsonRequest('/api/auth/organization/create', {
      cookie: owner.cookie,
      body: {
        name: 'Validation Organization',
        slug: `validation-${crypto.randomUUID()}`,
      },
    })
    const createdOrganization = (await organizationResponse.json()) as { id: string }

    const response = await jsonRequest(`/api/organizations/${createdOrganization.id}/projects`, {
      cookie: owner.cookie,
      body: { name: 'x' },
    })

    expect(response.status).toBe(422)
  })
})
