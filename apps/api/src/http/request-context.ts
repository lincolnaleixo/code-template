import { getServerEnv } from '@matrix/env/server'
import { createLogger, type Logger, recordHttpRequest } from '@matrix/observability'

export interface RequestContext {
  requestId: string
  startedAt: number
  logger: Logger
}

const environment = getServerEnv()
const rootLogger = createLogger({
  level: environment.LOG_LEVEL,
  base: { service: environment.OTEL_SERVICE_NAME },
})
const requestContexts = new WeakMap<Request, RequestContext>()
const completedRequests = new WeakSet<Request>()

export function beginRequest(request: Request): RequestContext {
  const requestId = request.headers.get('x-request-id')?.trim() || crypto.randomUUID()
  const context: RequestContext = {
    requestId,
    startedAt: performance.now(),
    logger: rootLogger.child({ requestId }),
  }
  requestContexts.set(request, context)
  return context
}

export function getRequestContext(request: Request): RequestContext {
  return requestContexts.get(request) ?? beginRequest(request)
}

export function completeRequest(request: Request, status: number): void {
  if (completedRequests.has(request)) return
  completedRequests.add(request)

  const context = getRequestContext(request)
  const durationMs = performance.now() - context.startedAt
  const pathname = new URL(request.url).pathname

  recordHttpRequest({
    method: request.method,
    route: pathname,
    status,
    durationSeconds: durationMs / 1_000,
  })

  context.logger.info('http.request.completed', {
    method: request.method,
    route: pathname,
    status,
    durationMs: Number(durationMs.toFixed(2)),
  })
}

export function getRootLogger(): Logger {
  return rootLogger
}
