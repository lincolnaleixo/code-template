import { openapi } from '@elysia/openapi'
import { cors } from '@elysiajs/cors'
import { db, user } from '@matrix/db'
import { DomainError } from '@matrix/domain'
import { getServerEnv } from '@matrix/env/server'
import { createTelemetryPlugin, getMetricsContentType, renderMetrics } from '@matrix/observability'
import { Elysia, t } from 'elysia'
import { projectRoutes } from './features/projects/routes'
import { createApiError, getDomainErrorStatus } from './http/errors'
import { beginRequest, completeRequest, getRequestContext } from './http/request-context'
import { authHandlerPlugin, requireAuthPlugin } from './plugins/auth'

const environment = getServerEnv()

function statusNumber(value: number | string | undefined, fallback: number): number {
  return typeof value === 'number' ? value : fallback
}

function metricsRequestIsAuthorized(request: Request): boolean {
  if (!environment.METRICS_TOKEN) return true
  return request.headers.get('authorization') === `Bearer ${environment.METRICS_TOKEN}`
}

export const app = new Elysia({ name: 'matrix-api' })
  .onRequest(({ request, set }) => {
    const context = beginRequest(request)
    set.headers['x-request-id'] = context.requestId
    set.headers['x-content-type-options'] = 'nosniff'
    set.headers['referrer-policy'] = 'no-referrer'
  })
  .onAfterHandle(({ request, set }) => {
    completeRequest(request, statusNumber(set.status, 200))
  })
  .onError(({ code, error, request, set }) => {
    const context = getRequestContext(request)

    if (error instanceof DomainError) {
      const status = getDomainErrorStatus(error)
      set.status = status
      completeRequest(request, status)
      return createApiError(context.requestId, error.code, error.message, error.details)
    }

    if (code === 'VALIDATION') {
      set.status = 422
      completeRequest(request, 422)
      return createApiError(
        context.requestId,
        'VALIDATION_FAILED',
        'The request did not match the expected schema.',
      )
    }

    if (code === 'NOT_FOUND') {
      set.status = 404
      completeRequest(request, 404)
      return createApiError(context.requestId, 'RESOURCE_NOT_FOUND', 'Route not found.')
    }

    context.logger.error('http.request.failed', {
      error: error instanceof Error ? error.message : String(error),
      code,
    })
    set.status = 500
    completeRequest(request, 500)
    return createApiError(context.requestId, 'INTERNAL_SERVER_ERROR', 'An unexpected server error occurred.')
  })
  .use(createTelemetryPlugin(environment))
  .use(
    cors({
      origin: environment.CORS_ORIGINS,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposeHeaders: ['X-Request-Id'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )
  .use(
    openapi({
      documentation: {
        info: {
          title: 'Matrix Template API',
          version: '0.3.0',
          description: 'Type-safe Elysia API with Better Auth and organization authorization.',
        },
        tags: [
          { name: 'System', description: 'Health and readiness endpoints.' },
          { name: 'Projects', description: 'Organization-scoped project operations.' },
        ],
      },
    }),
  )
  .use(authHandlerPlugin)
  .get('/health', () => ({ ok: true, runtime: 'bun' as const }), {
    response: t.Object({ ok: t.Literal(true), runtime: t.Literal('bun') }),
    detail: { tags: ['System'], summary: 'Process liveness' },
  })
  .get(
    '/ready',
    async ({ set }) => {
      try {
        await db.select({ id: user.id }).from(user).limit(1)
        return { ok: true as const, database: 'ready' as const }
      } catch {
        set.status = 503
        return { ok: false as const, database: 'unavailable' as const }
      }
    },
    {
      detail: { tags: ['System'], summary: 'Dependency readiness' },
    },
  )
  .get(
    '/metrics',
    async ({ request, set, status }) => {
      if (!metricsRequestIsAuthorized(request)) {
        return status(
          401,
          createApiError(
            getRequestContext(request).requestId,
            'AUTHENTICATION_REQUIRED',
            'A metrics bearer token is required.',
          ),
        )
      }

      set.headers['content-type'] = getMetricsContentType()
      return renderMetrics()
    },
    {
      detail: { hide: true },
    },
  )
  .use(requireAuthPlugin)
  .get('/api/me', ({ user, session }) => ({ user, session }), {
    auth: true,
    detail: { tags: ['System'], summary: 'Current authenticated session' },
  })
  .use(projectRoutes)

export type App = typeof app
