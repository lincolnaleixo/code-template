import { cors } from '@elysiajs/cors'
import { openapi } from '@elysia/openapi'
import { authHandlerPlugin } from '@matrix/auth'
import { db, user } from '@matrix/db'
import { getServerEnv } from '@matrix/env/server'
import { collectMetrics, createLogger, initializeTelemetry, metricsContentType } from '@matrix/observability'
import { Elysia, t } from 'elysia'
import { createProjectRoutes } from './features/projects/routes'
import { DrizzleProjectAuthorizer } from './features/projects/drizzle-project-authorizer'
import { DrizzleProjectRepository } from './features/projects/drizzle-project-repository'
import { ProjectService } from '@matrix/domain'
import { createRequestContext } from './http/request-context'

const environment = getServerEnv()

initializeTelemetry({
  enabled: environment.OTEL_ENABLED,
  endpoint: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
  serviceName: environment.OTEL_SERVICE_NAME,
})

const logger = createLogger({ level: environment.LOG_LEVEL, service: environment.OTEL_SERVICE_NAME })
const projectService = new ProjectService(
  new DrizzleProjectRepository(),
  new DrizzleProjectAuthorizer(),
)

export const app = new Elysia()
  .derive(({ request, set }) => {
    const context = createRequestContext(request)
    set.headers['x-request-id'] = context.requestId
    const requestLogger = logger.child({ requestId: context.requestId })

    return {
      requestId: context.requestId,
      requestLogger,
      requestStartedAt: context.startedAt,
    }
  })
  .onAfterHandle(({ request, requestLogger, requestStartedAt, set }) => {
    requestLogger.info('request.completed', {
      method: request.method,
      path: new URL(request.url).pathname,
      status: set.status,
      durationMs: Date.now() - requestStartedAt,
    })
  })
  .onError(({ error, request, requestLogger, requestStartedAt, set }) => {
    requestLogger.error('request.failed', {
      method: request.method,
      path: new URL(request.url).pathname,
      status: set.status,
      durationMs: Date.now() - requestStartedAt,
      error,
    })
  })
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
  .get('/health', () => ({ ok: true as const, runtime: 'bun' as const }), {
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
      if (environment.METRICS_TOKEN) {
        const authorization = request.headers.get('authorization')
        if (authorization !== `Bearer ${environment.METRICS_TOKEN}`) {
          return status(401, { error: 'unauthorized' })
        }
      }

      set.headers['content-type'] = metricsContentType
      return collectMetrics()
    },
    {
      detail: { tags: ['System'], summary: 'Prometheus metrics' },
    },
  )
  .use(createProjectRoutes(projectService))
