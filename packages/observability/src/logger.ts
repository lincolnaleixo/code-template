export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId?: string
  traceId?: string
  userId?: string
  organizationId?: string
  [key: string]: unknown
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  child(context: LogContext): Logger
}

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const sensitiveKeys = /authorization|cookie|password|secret|token|api[-_]?key|private[-_]?key/i

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) return '[Circular]'

  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, seen))
  }

  const output: Record<string, unknown> = {}

  for (const [key, nestedValue] of Object.entries(value)) {
    output[key] = sensitiveKeys.test(key) ? '[REDACTED]' : redactValue(nestedValue, seen)
  }

  return output
}

function redactContext(context: LogContext): Record<string, unknown> {
  const redacted = redactValue(context, new WeakSet<object>())

  if (!redacted || typeof redacted !== 'object' || Array.isArray(redacted)) {
    return {}
  }

  return redacted as Record<string, unknown>
}

export function createLogger(
  options: { level?: LogLevel; base?: LogContext } = {},
): Logger {
  const minimumLevel = options.level ?? 'info'
  const base = options.base ?? {}

  const write = (level: LogLevel, message: string, context: LogContext = {}) => {
    if (levels[level] < levels[minimumLevel]) return

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...redactContext({ ...base, ...context }),
    }

    const serialized = JSON.stringify(entry)
    if (level === 'error') console.error(serialized)
    else if (level === 'warn') console.warn(serialized)
    else console.log(serialized)
  }

  return {
    debug: (message, context) => write('debug', message, context),
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
    child: (context) => createLogger({ level: minimumLevel, base: { ...base, ...context } }),
  }
}
