# Architecture

## Goals

The template optimizes for one TypeScript product codebase, fast development, replaceable infrastructure, explicit boundaries, and support for browser, mobile, and desktop delivery.

## Dependency direction

```text
UI and platform adapters
        -> application services
        -> domain contracts

HTTP adapters
        -> application services
        -> domain contracts

Infrastructure adapters
        -> domain contracts
        -> PostgreSQL, S3, external APIs
```

Domain packages do not import React, Elysia, Drizzle, Capacitor, Tauri, or provider SDKs.

## Runtime flow

```text
React and TanStack Query
  -> Eden typed client
  -> Elysia validation and session guard
  -> application service
  -> repository and authorization interfaces
  -> Drizzle adapters
  -> PostgreSQL
```

Browser deployments use same-origin proxying through Vite locally and Caddy in the full Compose stack. Native builds embed an externally reachable API URL.

## Workspace responsibilities

```text
apps/api              HTTP transport, middleware, auth guard, adapters
apps/web              routes, product composition, browser entry point
apps/mobile           Capacitor packaging and native configuration
apps/desktop          Tauri packaging and native commands
packages/api-client   typed Eden client
packages/auth         identity configuration and transport helpers
packages/db           schema, database client, immutable migrations
packages/domain       use cases, entities, errors, repository ports
packages/env          typed environment boundaries
packages/observability structured logs, metrics, tracing
packages/storage      S3-compatible adapter
packages/ui           design tokens, primitives, patterns, appearance
```

## API boundaries

HTTP routes should remain thin. They:

1. validate transport input
2. resolve identity and authorization
3. call an application service
4. translate domain errors into a stable API envelope
5. attach a request ID

Application services should not know whether they were called from HTTP, a job, a CLI, or a native command.

## Authentication and authorization

Better Auth proves identity and manages sessions. Authorization is enforced separately through membership and permission checks against the active organization.

The browser uses HTTP-only cookies. Native clients use signed bearer sessions through an injected secure token store.

## Data

PostgreSQL is the source of truth. Drizzle schema files are organized by domain and produce reviewed SQL migrations committed to the repository.

Deployment applies committed migrations only. Runtime code must not generate schema changes.

## UI architecture

`packages/ui` contains product-independent primitives and layout patterns. Product routes compose those primitives and may not hardcode brand colors.

```text
semantic tokens
  -> primitives
  -> reusable patterns
  -> product pages
```

Project identity is defined in `apps/web/src/brand.css`. See `docs/ui.md`.

## Optional capabilities

Capabilities are declared in `template.config.ts`. Removal and replacement procedures are documented in `docs/template-customization.md`.
