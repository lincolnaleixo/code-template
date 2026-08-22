import { createLogger, type Logger } from '@matrix/observability'
import { getServerEnv } from '@matrix/env/server'

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

export function getRootLogger(): Logger {
  return rootLogger
}
