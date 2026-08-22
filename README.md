# Matrix Code Template

A TypeScript-first, self-hostable product template for web, API, iOS, Android, macOS, Windows and Linux with one shared product codebase and minimal vendor lock-in.

The repository is deliberately modular. It is a capability library, not a mandate to keep every component. Read `RULES.md` before adapting it. Agents and developers may disable features that the target project does not need, provided the feature manifest, dependencies, infrastructure, tests and documentation are cleaned up together.

## Included stack

| Area | Technology |
| --- | --- |
| Language and tooling | TypeScript 7, Bun workspaces, Bun Test, Biome |
| Web | React, TanStack Start, Router, Query and Table, Tailwind CSS |
| API | Bun, Elysia, Eden and OpenAPI |
| Database | PostgreSQL, Drizzle ORM and committed SQL migrations |
| Identity | Better Auth with cookie sessions, signed bearer sessions and organizations |
| Authorization | Organization membership and project permissions enforced by the server |
| Storage | S3-compatible client with MinIO for local development |
| Mobile | Capacitor for iOS and Android |
| Desktop | Tauri 2 for macOS, Windows and Linux |
| Infrastructure | Docker Compose and Caddy |
| Observability | JSON logs, request IDs, Prometheus metrics and optional OpenTelemetry |
| Delivery | GitHub Actions, Playwright, GHCR releases, SBOM and provenance |
| Security | Bun audit, Gitleaks, Trivy, optional CodeQL and Dependency Review |

## Repository layout

```text
apps/
  api/              Elysia API, HTTP adapters and Docker image
  web/              TanStack Start application and Docker image
  mobile/           Capacitor wrapper around the native web bundle
  desktop/          Tauri wrapper around the native web bundle
packages/
  api-client/       Eden client inferred from the Elysia application
  auth/             Better Auth server, browser and native transport helpers
  db/               Drizzle schema, client and immutable migrations
  domain/           Framework-independent use cases and contracts
  env/              Typed server, browser, native and test environment parsing
  observability/    Structured logging, metrics and optional tracing
  storage/          S3-compatible storage operations
  ui/               Shared local UI primitives
tests/
  e2e/              Playwright lifecycle through the full Compose stack
infra/
  Caddyfile
  otel-collector.yaml
  prometheus.yml
scripts/
  validate-template.ts
  check-generated.ts
  pin-catalog.ts
```

## Optional capabilities

`template.config.ts` is the source of truth for enabled template capabilities. It currently enables web, API, PostgreSQL, authentication, organizations, object storage, mobile, desktop, observability, Docker, E2E tests and release workflows.

A project may disable any capability that is unnecessary. For example:

- web-only products can remove Capacitor, Tauri and native release jobs
- products without uploads can remove S3 and MinIO
- single-user tools can remove organizations and project membership rules
- prototypes can disable telemetry exporters while keeping structured logs
- deployments that already provide ingress can replace Caddy

Follow the removal procedure in `RULES.md` and run:

```bash
bun run template:validate
bun run lint:ci
bun run typecheck
bun run test:unit
```

## Prerequisites

- Bun 1.3.14
- Docker with Docker Compose
- Rust only for desktop builds
- Xcode only for iOS builds
- Java 21 and the Android SDK only for Android builds

## Fast local development

This mode keeps Vite and the Bun API on the host for fast reloads. Docker runs PostgreSQL and MinIO.

```bash
cp .env.example .env
bun ci
bun run infra:up
bun run db:migrate
bun dev
```

Local services:

```text
Web and auth proxy   http://localhost:3000
API                  http://localhost:3001
OpenAPI              http://localhost:3001/openapi
Health               http://localhost:3001/health
Readiness            http://localhost:3001/ready
Metrics              http://localhost:3001/metrics
PostgreSQL           localhost:5432
MinIO API            http://localhost:9000
MinIO console        http://localhost:9001
```

Vite proxies `/api`, `/health`, `/ready`, `/metrics` and Better Auth calls to Elysia. Browser cookies therefore remain same-origin during development.

The starter application demonstrates this lifecycle:

```text
create account
  -> create organization
  -> create authorized project
  -> reload with persisted session
  -> sign out
```

## Production-like Docker Compose

The `full` profile builds and starts migrations, API, web and Caddy in addition to PostgreSQL and MinIO.

```bash
cp .env.example .env
# Replace BETTER_AUTH_SECRET before using NODE_ENV=production.
bun run infra:full
```

Open the application at:

```text
Application and API  http://localhost:8080
MinIO console        http://localhost:9001
```

The web and API containers are not published directly to the host. Caddy is the public boundary.

Startup order:

```text
PostgreSQL ready
  -> committed migrations applied
  -> MinIO bucket available
  -> API readiness succeeds
  -> web healthcheck succeeds
  -> Caddy accepts traffic
```

Application containers run as non-root with a read-only filesystem, restricted Linux capabilities, temporary writable memory and separate edge/data networks.

Useful commands:

```bash
bun run infra:logs
bun run infra:down
bun run infra:reset
```

`infra:reset` also removes local PostgreSQL, MinIO and Prometheus volumes.

## Optional observability stack

The API always supports structured JSON logs, request IDs and Prometheus metrics. OpenTelemetry export is disabled unless explicitly enabled.

```bash
bun run infra:observability
```

This starts the full application plus:

```text
Prometheus             http://localhost:9090
OpenTelemetry OTLP     internal ports 4317 and 4318
```

The example Collector writes received spans to its debug exporter. Replace that exporter with the project's chosen self-hosted or managed backend.

Set `METRICS_TOKEN` to require a bearer token for `/metrics`. Update the Prometheus scrape configuration when enabling that protection.

## Database workflow

Application tables are composed in `packages/db/src/schema.ts`. Better Auth tables are generated into `packages/db/src/auth-schema.ts`; domain tables live in their own schema files.

For an application schema change:

```bash
# Edit the Drizzle schema.
bun run db:generate
# Review packages/db/drizzle/*.sql.
bun run db:migrate
bun run test:integration
```

For a Better Auth configuration change:

```bash
bun run auth:generate
bun run db:generate
bun run test:integration
```

Commit both the TypeScript schema and generated SQL. Deployment runs only `bun run db:migrate`. It never generates SQL at runtime.

CI runs `bun run generated:check` and fails if the auth schema or migrations drift from committed files.

## Authentication and authorization

Better Auth uses the same PostgreSQL database and requires no external auth service.

The template includes:

- email and password authentication with a 12-character minimum
- HTTP-only cookie sessions for the browser
- signed bearer sessions for native clients
- organizations, memberships and invitations
- owner, admin and member roles
- server-side project permissions
- `/api/me` as a protected session example

The browser must never be trusted for authorization. Project routes query membership in PostgreSQL before calling the domain service.

For native clients, `@matrix/auth/native` exposes `createNativeAuthFetch`. It requires an injected `SecureTokenStore` and intentionally has no `localStorage` fallback. Implement that interface with the operating system keychain or secure enclave appropriate to the target platform.

## Architecture

HTTP handlers translate transport concerns and call application services:

```text
React and TanStack Query
  -> Eden typed client
  -> Elysia validation and session guard
  -> application service in packages/domain
  -> repository and authorizer interfaces
  -> Drizzle adapters
  -> PostgreSQL
```

Domain code does not import React, Elysia, Drizzle, Capacitor, Tauri or vendor SDKs. This keeps business rules testable and replaceable.

API errors use a stable envelope:

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Permission project:read is required.",
    "requestId": "..."
  }
}
```

The same request ID is returned in `X-Request-Id` and included in structured logs.

## Quality commands

```bash
bun run check
bun run lint
bun run lint:ci
bun run typecheck
bun run test:unit
bun run test:coverage
bun run test:integration
bun run test:e2e
bun run generated:check
bun run template:validate
```

Test layers:

| Layer | Purpose | Infrastructure |
| --- | --- | --- |
| Unit | Domain rules, environment guards, observability and native token transport | None |
| Integration | Better Auth, bearer/cookie sessions, organizations and project authorization | Real PostgreSQL |
| E2E | Account, organization, project, reload and logout through Caddy | Full Docker Compose |
| Native | Tauri, Android and iOS compilation | Platform-specific GitHub runners |

## Continuous integration

`.github/workflows/ci.yml` contains four required stages:

1. Feature validation, Biome, schema drift, TypeScript and coverage.
2. API, SSR web and native SPA builds.
3. PostgreSQL authentication and authorization integration tests.
4. Hardened Docker Compose plus Playwright E2E.

Playwright traces, screenshots and the HTML report are uploaded as workflow artifacts.

## Security automation

`.github/workflows/security.yml` runs:

- Bun dependency audit
- Gitleaks against Git history
- Trivy against source, configuration and both OCI images
- Dependency Review for supported repositories
- CodeQL for public repositories or repositories with `GHAS_ENABLED=true`

`renovate.json` keeps Bun dependencies, Cargo crates, Docker images and GitHub Actions current while preserving exact versions and immutable action digests.

See `SECURITY.md` for private vulnerability reporting and operational responsibilities.

## Container releases

A tag such as `v0.3.0` triggers `.github/workflows/release-containers.yml`.

It publishes multi-architecture images:

```text
ghcr.io/matrix-hq/code-template-api:<version>
ghcr.io/matrix-hq/code-template-web:<version>
```

Each build includes an SBOM, maximum provenance and a GitHub artifact attestation. Stable tags also update the major, minor and `latest` aliases.

## Mobile

The Capacitor wrapper consumes the native SPA bundle.

```bash
export VITE_API_URL=https://api.example.com
bun run build:native
cd apps/mobile
bunx cap add android
bunx cap add ios
bunx cap sync
```

Generated `android/` and `ios/` directories are ignored until a real project starts native customization. At that point, commit them so signing, entitlements, permissions and store metadata are reviewable.

## Desktop

Tauri consumes the same native SPA bundle and applies a restrictive WebView content security policy.

```bash
export VITE_API_URL=https://api.example.com
bun run --cwd apps/desktop dev
bun run build:desktop
```

The Rust surface is intentionally minimal. Add native commands only when the web platform cannot provide a capability cleanly.

## Native build workflow

`.github/workflows/release-native.yml` compiles:

- Tauri on Linux, Windows and macOS
- an Android debug APK
- an unsigned iOS simulator application

It runs for relevant pull requests, manual dispatches and release tags. Signed production binaries require protected environment secrets, Apple provisioning, notarization, Android keystores and store-specific review.

## Object storage

`@matrix/storage` speaks the S3 protocol and provides presigned upload/download URLs plus deletion. Local development uses MinIO and creates the configured bucket automatically. Production can use any compatible implementation without changing domain code.

## Dependency changes

The root Bun catalog contains exact versions and `bun.lock` is committed.

```bash
# Make an intentional dependency change.
bun add <package> --catalog
# Review package.json and bun.lock.
bun run check
```

CI and Docker use `bun ci`, so an out-of-date lockfile fails instead of being rewritten.

## Main commands

```bash
bun dev
bun run build
bun run build:native
bun run check
bun run db:migrate
bun run db:studio
bun run infra:up
bun run infra:full
bun run infra:observability
bun run infra:logs
bun run infra:down
bun run infra:reset
```

## Template principles

1. Start with the smallest architecture that satisfies the product.
2. Remove optional modules instead of carrying unused infrastructure.
3. Keep versions and migrations reproducible.
4. Enforce identity and authorization on the server.
5. Prefer open protocols and replaceable implementations.
6. Keep domain code independent from frameworks.
7. Use fast unit tests and real infrastructure where behavior matters.
8. Treat observability, security and rollback as product capabilities.
9. Keep native wrappers thin and secure platform secrets appropriately.
10. Document every material deviation from the template in `CHANGELOG.md`.
