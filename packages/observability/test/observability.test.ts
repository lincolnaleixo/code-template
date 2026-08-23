import { afterEach, describe, expect, test } from 'bun:test'
import { createLogger, recordHttpRequest, renderMetrics } from '../src'

const originalConsoleError = console.error
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

afterEach(() => {
  console.error = originalConsoleError
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
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

  test('redacts inherited context, arrays and circular references', () => {
    let output = ''
    console.log = (value?: unknown) => {
      output = String(value)
    }

    const circular: unknown[] = []
    circular.push(circular)

    createLogger({
      base: {
        apiKey: 'base-api-key',
        service: 'api',
      },
    })
      .child({ cookie: 'session-cookie', organizationId: 'org-1' })
      .info('request.completed', {
        credentials: [{ refreshToken: 'refresh-token', provider: 'example' }],
        circular,
      })

    const entry = JSON.parse(output) as Record<string, unknown>

    expect(entry.apiKey).toBe('[REDACTED]')
    expect(entry.cookie).toBe('[REDACTED]')
    expect(entry.service).toBe('api')
    expect(entry.organizationId).toBe('org-1')
    expect(entry.circular).toEqual(['[Circular]'])
    expect(entry.credentials).toEqual([
      {
        refreshToken: '[REDACTED]',
        provider: 'example',
      },
    ])
    expect(output).not.toContain('base-api-key')
    expect(output).not.toContain('session-cookie')
    expect(output).not.toContain('refresh-token')
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
