# Matrix Code Template

Opinionated TypeScript-first template for shipping the same product across web, API, iOS, Android, macOS, Windows and Linux with minimal vendor lock-in.

## Stack

- TypeScript + Bun workspaces
- React + TanStack Start + TanStack Router + TanStack Query
- Tailwind CSS with local shadcn-style primitives backed by Radix
- Elysia on Bun with Eden end-to-end types
- PostgreSQL + Drizzle ORM
- Better Auth stored in PostgreSQL
- S3-compatible object storage, with MinIO locally
- Capacitor for iOS and Android
- Tauri 2 for macOS, Windows and Linux
- Docker Compose + Caddy for self-hosted infrastructure
- Bun Test + Playwright for unit, integration and browser coverage

## Repository layout

```text
apps/
  api/        Elysia backend and Docker image
  web/        TanStack Start application and Docker image
  mobile/     Capacitor wrapper around the native web bundle
  desktop/    Tauri wrapper around the native web bundle
packages/
  api-client/ Eden client typed from the Elysia app
  auth/       Better Auth server and browser clients
  db/         Drizzle schema, client and migrations
  storage/    S3-compatible storage client
  ui/         shared local UI primitives
tests/
  e2e/        Playwright tests against the full Compose stack
infra/
  Caddyfile
```

## Prerequisites

- Bun 1.3.14 or newer
- Docker with Docker Compose
- Rust only when building desktop targets
- Xcode only when building iOS
- Android Studio and the Android SDK only when building Android

## Fast local development

This mode keeps Vite and the Bun API on the host for fast reloads. Docker runs only PostgreSQL and MinIO.

```bash
cp .env.example .env
bun install
bun run infra:up
bun run db:generate
bun run db:migrate
bun dev
```

Services:

```text
Web             http://localhost:3000
API             http://localhost:3001
API health      http://localhost:3001/health
API readiness   http://localhost:3001/ready
MinIO API       http://localhost:9000
MinIO console   http://localhost:9001
```

The Vite server proxies `/api`, `/health` and `/ready` to Elysia. Browser requests therefore remain same-origin during development.

## Complete Docker Compose stack

The `full` profile builds and starts migration, API, web and Caddy containers in addition to PostgreSQL and MinIO.

```bash
cp .env.example .env
bun run infra:full
```

Open:

```text
Application     http://localhost:8080
Direct web      http://localhost:3000
Direct API      http://localhost:3001
MinIO console   http://localhost:9001
```

The startup sequence is health-aware:

```text
PostgreSQL ready
  -> migration completes
  -> API readiness succeeds
  -> web healthcheck succeeds
  -> Caddy accepts traffic
```

Useful commands:

```bash
bun run infra:logs
bun run infra:down
bun run infra:reset
```

`infra:reset` also removes local PostgreSQL and MinIO volumes.

## Database

Application schema lives in `packages/db/src/schema.ts`.

```bash
bun run db:generate
bun run db:migrate
bun run db:studio
```

The template migration image generates and applies the starter schema so a clean repository can boot. Once a real project begins, commit generated migrations and change production deployment to apply committed migrations only.

## Authentication

Better Auth is configured in `packages/auth` and mounted directly into Elysia. It uses PostgreSQL and does not require an external auth service.

The browser client defaults to the current origin. Vite and Caddy proxy auth calls to the API. Native packages can set `VITE_API_URL` to a remote API URL.

Generate Better Auth schema after changing auth configuration:

```bash
bun run auth:generate
```

Review the generated schema before merging it into the database package and creating a migration.

## Typed API

`apps/api/src/app.ts` exports the Elysia application without opening a network port. This keeps Eden type imports and tests free from startup side effects.

The request path is:

```text
React and TanStack Query
  -> Eden typed client
  -> Elysia validation
  -> Drizzle
  -> PostgreSQL
```

## Tests

```bash
bun run typecheck
bun run test:unit
bun run test:integration
bun run test:e2e
```

- Unit tests validate endpoints that do not require infrastructure.
- Integration tests run against a real PostgreSQL instance and verify migrations, readiness, validation and CRUD.
- E2E tests run through Caddy against the complete Docker Compose stack using Playwright.

## GitHub Actions

The CI workflow is split by responsibility:

| Job | Purpose | PostgreSQL |
| --- | --- | --- |
| Quality | Typecheck, unit test and Compose validation | No |
| Build | API, SSR web and native SPA builds | No |
| PostgreSQL integration | Migrations and API integration tests | Yes, service container |
| Docker Compose E2E | Build images, boot the complete stack and run Playwright | Yes, Compose |

Playwright traces, screenshots and the HTML report are uploaded as workflow artifacts when available.

## Mobile

The Capacitor project is intentionally a thin wrapper around the native SPA build.

Initial platform setup:

```bash
cd apps/mobile
bunx cap add ios
bunx cap add android
bun run build
```

Then:

```bash
bun run ios
bun run android
```

Native `ios/` and `android/` directories are ignored by default. Commit them after native customization begins.

## Desktop

Tauri uses the same native SPA bundle.

```bash
bun run --cwd apps/desktop dev
bun run build:desktop
```

The Rust surface stays minimal. Add native commands only where the web platform cannot provide the capability cleanly.

## Object storage

`packages/storage` speaks the S3 API. Local development uses MinIO and creates the configured bucket automatically. Production can use MinIO, AWS S3, Cloudflare R2, Backblaze B2 or another S3-compatible service by changing environment variables.

## Main commands

```bash
bun dev
bun run build
bun run build:native
bun run typecheck
bun run test:unit
bun run test:integration
bun run test:e2e
bun run infra:up
bun run infra:full
bun run infra:logs
bun run infra:down
bun run infra:reset
```

## Template principles

1. TypeScript is the default language across product code.
2. PostgreSQL is the source of truth.
3. Prefer open protocols and replaceable infrastructure.
4. Keep mobile and desktop wrappers thin.
5. Put shared UI and domain code in packages instead of duplicating apps.
6. Add Redis, NATS or heavier infrastructure only when the workload proves it is needed.
7. Treat vendor services as deployment choices, not architectural requirements.
8. Keep fast checks independent from external services.
9. Use real infrastructure for integration tests instead of mocks where behavior matters.
10. Make Docker and local development exercise the same application boundaries.
