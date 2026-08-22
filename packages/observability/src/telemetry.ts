import { opentelemetry } from '@elysia/opentelemetry'
import type { ServerEnv } from '@matrix/env/server'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { Elysia } from 'elysia'

export function createTelemetryPlugin(environment: ServerEnv) {
  if (!environment.OTEL_ENABLED || !environment.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return new Elysia({ name: 'telemetry-disabled' })
  }

  return opentelemetry({
    serviceName: environment.OTEL_SERVICE_NAME,
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
        }),
      ),
    ],
  })
}
