import { afterEach, describe, expect, test } from 'bun:test'
import { createLogger, recordHttpRequest, renderMetrics } from '../src'

const originalConsoleLog = console.log

afterEach(() => {
  console.log = originalConsoleLog
})

describe('observability toolkit', () => {
  test('redacts secret values from structured logs', () => {
    let output = ''
    console.log = (value?: unknown) => {
      output = String(value)
    }

    createLogger().info('authentication.completed', {
      userId: 'user-1',
      accessToken: 'must-not-appear',
      nested: { password: 'must-not-appear-either' },
    })

    expect(output).toContain('authentication.completed')
    expect(output).toContain('user-1')
    expect(output).not.toContain('must-not-appear')
    expect(output).toContain('[REDACTED]')
  })

  test('renders Prometheus HTTP metrics', async () => {
    recordHttpRequest({
      method: 'GET',
      route: '/health',
      status: 200,
      durationSeconds: 0.01,
    })

    const metrics = await renderMetrics()
    expect(metrics).toContain('matrix_http_requests_total')
    expect(metrics).toContain('route="/health"')
  })
})
