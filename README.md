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
- Docker Compose + Caddy for local/self-hosted infrastructure

## Repository layout

```text
apps/
  api/        Elysia backend
  web/        TanStack Start application
  mobile/     Capacitor wrapper around the web build
  desktop/    Tauri wrapper around the web build
packages/
  api-client/ Eden client typed from the Elysia app
  auth/       Better Auth server/client setup
  db/         Drizzle schema, client and migrations
  storage/    S3-compatible storage client
  ui/         shared local UI primitives
infra/
  Caddyfile
```

## Prerequisites

- Bun
- Docker + Docker Compose
- Rust toolchain only when building desktop
- Xcode only when building iOS
- Android Studio/SDK only when building Android

## Start locally

```bash
cp .env.example .env
bun install
bun run infra:up
bun run db:generate
bun run db:migrate
bun dev
```

Web: http://localhost:3000

API: http://localhost:3001

MinIO API: http://localhost:9000

MinIO console: http://localhost:9001

## Database

Application schema lives in `packages/db/src/schema.ts`.

```bash
bun run db:generate
bun run db:migrate
bun run db:studio
```

## Authentication

Better Auth is configured in `packages/auth` and mounted directly into Elysia. It uses the same PostgreSQL database and does not require an external auth SaaS.

Generate Better Auth schema when changing auth configuration:

```bash
bun run auth:generate
```

Review the generated schema before merging it into the database package and creating the corresponding Drizzle migration.

## Typed API

`apps/api` exports the Elysia `App` type. `packages/api-client` consumes that type through Eden, so frontend calls infer request and response types without a generated SDK.

The starter route demonstrates:

```text
React/TanStack Query -> Eden -> Elysia -> Drizzle -> PostgreSQL
```

## Mobile

The Capacitor project is intentionally a thin wrapper around the web application.

Initial native platform setup:

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

Native `ios/` and `android/` directories are ignored by default so teams can decide whether to generate them per project or commit them once native customization begins.

## Desktop

Tauri uses the same web frontend.

```bash
bun run --cwd apps/desktop dev
bun run build:desktop
```

The Rust surface is intentionally minimal. Add native commands only when the web platform cannot provide a capability cleanly.

## Object storage

`packages/storage` speaks the S3 API. Local development uses MinIO, but production can use MinIO, AWS S3, Cloudflare R2, Backblaze B2 or another S3-compatible service by changing environment variables.

## Useful commands

```bash
bun dev
bun run build
bun run typecheck
bun test
bun run infra:up
bun run infra:down
bun run build:mobile
bun run build:desktop
```

## Template philosophy

1. TypeScript is the default language across product code.
2. PostgreSQL is the source of truth.
3. Prefer open protocols and replaceable infrastructure.
4. Mobile and desktop wrappers stay thin.
5. Shared UI and domain code live in packages, not duplicated apps.
6. Introduce Redis, NATS or heavier infrastructure only when the workload proves it is needed.
7. Vendor services may be used as deployment choices, never as architectural requirements.
