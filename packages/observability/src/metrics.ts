import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client'

export interface HttpMetricInput {
  method: string
  route: string
  status: number
  durationSeconds: number
}

const registry = new Registry()

collectDefaultMetrics({
  register: registry,
  prefix: 'matrix_',
})

const requestCounter = new Counter({
  name: 'matrix_http_requests_total',
  help: 'Total HTTP requests handled by the API.',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
})

const requestDuration = new Histogram({
  name: 'matrix_http_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
})

export function recordHttpRequest(input: HttpMetricInput): void {
  const labels = {
    method: input.method,
    route: input.route,
    status: String(input.status),
  }
  requestCounter.inc(labels)
  requestDuration.observe(labels, input.durationSeconds)
}

export function getMetricsContentType(): string {
  return registry.contentType
}

export async function renderMetrics(): Promise<string> {
  return registry.metrics()
}
