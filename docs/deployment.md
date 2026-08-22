# Deployment

## Development modes

### Fast local development

Run PostgreSQL and MinIO in Docker while Bun and Vite run on the host:

```bash
cp .env.example .env
bun ci
bun run infra:up
bun run db:migrate
bun dev
```

### Production-like local stack

Build and run migrations, API, web, Caddy, PostgreSQL, and MinIO:

```bash
bun run infra:full
```

The public boundary is `http://localhost:8080`.

### Observability profile

```bash
bun run infra:observability
```

This adds Prometheus and an OpenTelemetry Collector.

## Configuration

All server configuration is parsed by `@matrix/env`. Production must fail fast for missing or unsafe values.

Required production concerns include:

- strong `BETTER_AUTH_SECRET`
- production PostgreSQL connection string
- trusted browser and native origins
- S3 credentials when object storage is enabled
- public API URL for native builds
- metrics protection when metrics are exposed beyond a private network

Browser variables use the `VITE_` prefix and must be treated as public.

## Database migrations

Generate migrations during development:

```bash
bun run auth:generate
bun run db:generate
```

Review and commit the generated SQL. Deployment runs:

```bash
bun run db:migrate
```

It must not run migration generation.

## Containers

Runtime containers:

- run as non-root
- use read-only filesystems where possible
- drop unnecessary capabilities
- expose only required internal ports
- use health and readiness checks
- install from the committed lockfile

Caddy is the public ingress in the provided Compose topology. Replace it when the target platform already supplies an equivalent boundary.

## Container releases

A semantic version tag triggers `.github/workflows/release-containers.yml`, publishing multi-architecture API and web images to GHCR with SBOM and provenance.

Pull requests can publish OCI preview coordinates through the preview workflow for deployment on any compatible environment.

## Rollback

A deployment plan should identify:

- previous application image
- database compatibility window
- migration rollback or forward-fix strategy
- object storage compatibility
- secret rotation impact
- readiness behavior during partial rollout

Destructive database changes require an explicit staged rollout.
