import { z } from 'zod'

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

const csv = z
  .string()
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))

const booleanFromEnvironment = z.preprocess((value) => {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return value
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}, z.boolean())

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional())
const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional())

const serverSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().max(65_535).default(3001),
    DATABASE_URL: z.string().url().refine((value) => value.startsWith('postgres'), {
      message: 'DATABASE_URL must use a PostgreSQL URL.',
    }),
    WEB_URL: z.string().url(),
    CORS_ORIGINS: csv,
    AUTH_TRUSTED_ORIGINS: csv,
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    S3_ENDPOINT: optionalUrl,
    S3_REGION: z.string().min(1).default('us-east-1'),
    S3_BUCKET: z.string().min(1).default('matrix'),
    S3_ACCESS_KEY: optionalString,
    S3_SECRET_KEY: optionalString,
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    METRICS_TOKEN: optionalString,
    OTEL_ENABLED: booleanFromEnvironment.default(false),
    OTEL_SERVICE_NAME: z.string().min(1).default('matrix-api'),
    OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl,
  })
  .superRefine((value, context) => {
    const hasAccessKey = Boolean(value.S3_ACCESS_KEY)
    const hasSecretKey = Boolean(value.S3_SECRET_KEY)

    if (hasAccessKey !== hasSecretKey) {
      context.addIssue({
        code: 'custom',
        path: ['S3_ACCESS_KEY'],
        message: 'S3_ACCESS_KEY and S3_SECRET_KEY must be configured together.',
      })
    }

    if (value.NODE_ENV === 'production' && value.BETTER_AUTH_SECRET.includes('change-me')) {
      context.addIssue({
        code: 'custom',
        path: ['BETTER_AUTH_SECRET'],
        message: 'The development Better Auth secret is forbidden in production.',
      })
    }

    if (value.OTEL_ENABLED && !value.OTEL_EXPORTER_OTLP_ENDPOINT) {
      context.addIssue({
        code: 'custom',
        path: ['OTEL_EXPORTER_OTLP_ENDPOINT'],
        message: 'OTEL_EXPORTER_OTLP_ENDPOINT is required when OTEL_ENABLED is true.',
      })
    }
  })

export type ServerEnv = z.infer<typeof serverSchema>

let cachedEnvironment: ServerEnv | undefined

export function loadServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  const nodeEnvironment = source.NODE_ENV ?? 'development'
  const developmentDefaults =
    nodeEnvironment === 'production'
      ? {}
      : {
          DATABASE_URL: 'postgres://matrix:matrix@localhost:5432/matrix',
          WEB_URL: 'http://localhost:3000',
          CORS_ORIGINS: 'http://localhost:3000,capacitor://localhost,tauri://localhost',
          AUTH_TRUSTED_ORIGINS: 'http://localhost:3000,capacitor://localhost,tauri://localhost',
          BETTER_AUTH_SECRET: 'change-me-with-at-least-32-random-characters',
          BETTER_AUTH_URL: 'http://localhost:3001',
        }

  return serverSchema.parse({ ...developmentDefaults, ...source, NODE_ENV: nodeEnvironment })
}

export function getServerEnv(): ServerEnv {
  cachedEnvironment ??= loadServerEnv()
  return cachedEnvironment
}

export function resetServerEnvForTests(): void {
  cachedEnvironment = undefined
}
