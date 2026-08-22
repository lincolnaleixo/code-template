# Matrix Code Template

A TypeScript-first, self-hostable product template for web, API, iOS, Android, macOS, Windows, and Linux with one shared product codebase and minimal vendor lock-in.

This repository is configured as a GitHub template. It is deliberately modular: keep only the capabilities justified by the target product. Operational customization is documented in `README.md` and `docs/`; engineering style is defined in `RULES.md`.

## Included stack

| Area | Technology |
| --- | --- |
| Language and tooling | TypeScript 7, Bun workspaces, Bun Test, Biome |
| Web | React, TanStack Start, Router, Query and Table, Tailwind CSS |
| UI | Repository-owned shadcn-inspired primitives, OKLCH tokens, light/dark/system themes |
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
  web/              TanStack Start application, brand overrides and Docker image
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
  ui/               Semantic tokens, primitives, patterns and appearance state
tests/
  e2e/              Playwright lifecycle through the full Compose stack
docs/
  architecture.md
  deployment.md
  native.md
  project-bootstrap.md
  release.md
  template-customization.md
  ui.md
```

## Create a project

Use the GitHub **Use this template** action to create a new repository without carrying this repository's pull-request history.

Before feature development, follow [docs/project-bootstrap.md](docs/project-bootstrap.md) to:

- select and prune capabilities
- replace application identities and sample domain concepts
- establish product versioning
- configure branding, environments, authentication, and deployment
- validate every platform the product intends to support

Do not begin by blindly renaming every occurrence of `matrix`. Some values are product identity, while others are private workspace implementation names that may remain unchanged.

## Quick start

Prerequisites:

- Bun 1.3.14
- Docker with Docker Compose
- Rust only for desktop builds
- Xcode only for iOS builds
- Java 21 and the Android SDK only for Android builds

Start the fast local development mode:

```bash
cp .env.example .env
bun ci
bun run infra:up
bun run db:migrate
bun dev
```

Open:

```text
Web and auth proxy       http://localhost:3000
API                      http://localhost:3001
OpenAPI                  http://localhost:3001/openapi
Core UI playground       http://localhost:3000/ui
Advanced UI playground   http://localhost:3000/ui-advanced
MinIO console            http://localhost:9001
```

Vite and the Bun API run on the host for fast reloads. Docker runs PostgreSQL and MinIO.

## Product demonstration

The starter application exercises a real, tested lifecycle:

```text
create account
  -> create organization
  -> create authorized project
  -> reload with persisted session
  -> sign out
```

This proves the path from React and TanStack Query through Eden, Elysia, Better Auth, domain services, Drizzle, and PostgreSQL.

## UI foundation

`packages/ui` is a repository-owned design system inspired by shadcn. It includes:

- semantic OKLCH tokens
- light, dark, and system themes
- compact and comfortable density
- accessible controls, surfaces, feedback, overlays, tables, and typography
- app shell, page headers, states, settings, typed data table, search, and pagination patterns
- core and advanced playground routes for visual review
- a prose `typeset` class for markdown and rich content
- a CSP-safe external appearance bootstrap for Tauri and web

Project identity lives in:

```text
apps/web/src/brand.css
```

Change `--brand-hue`, `--brand-chroma`, `--brand-lightness`, radius, typography, sidebar colors, or chart colors without changing reusable components. Components use semantic roles such as `primary`, `muted`, `border`, `success`, and `destructive` rather than hardcoded brand colors.

The monorepo includes compatible `components.json` files and package aliases for the shadcn CLI. Generated components remain repository-owned source:

```bash
bun run ui:info
bun run ui:add button
```

Review generated code before keeping it, align it with the existing semantic tokens and accessibility contracts, and add a representative example to a playground route.

The lightweight `DataTable` pattern covers common lists. TanStack Table remains part of the web stack for advanced sorting, grouping, column control, and virtualization.

See [docs/ui.md](docs/ui.md).

## Adapting the template

`template.config.ts` is the capability manifest. A project may disable or replace web, API, database, authentication, organizations, object storage, UI, mobile, desktop, observability, Docker, browser tests, or release workflows when the requirement does not justify them.

A clean removal updates all connected surfaces:

- source code and imports
- workspaces and dependencies
- environment variables and validators
- migrations and generated files
- Docker services, networks, volumes, and health checks
- CI, security, preview, release, and native workflows
- tests and documentation

The validator checks capability dependencies and reports both missing files for enabled features and leftover files for disabled features.

Follow [docs/template-customization.md](docs/template-customization.md), update `CHANGELOG.md`, and run:

```bash
bun run template:validate
bun run check
bun run build
```

## Development commands

```bash
bun dev                 # API and web with fast reloads
bun run check           # capabilities, docs, lint, generated files, types and unit tests
bun run docs:check      # local Markdown links
bun run build           # API and SSR web builds
bun run build:native    # SPA bundle for Capacitor and Tauri
bun run test:integration
bun run test:e2e
bun run db:migrate
bun run db:studio
bun run ui:info         # inspect shadcn workspace configuration
bun run ui:add button   # add source to packages/ui for review
```

## Docker Compose

Start only development infrastructure:

```bash
bun run infra:up
```

Start the production-like stack:

```bash
bun run infra:full
```

Start the stack with Prometheus and OpenTelemetry Collector:

```bash
bun run infra:observability
```

The full startup order is dependency-aware:

```text
PostgreSQL ready
  -> committed migrations applied
  -> MinIO bucket available
  -> API readiness succeeds
  -> web healthcheck succeeds
  -> Caddy accepts traffic
```

Application containers run as non-root with read-only filesystems, restricted capabilities, temporary writable memory, and separated edge/data networks.

See [docs/deployment.md](docs/deployment.md).

## Database workflow

Application tables are composed in `packages/db/src/schema.ts`. Better Auth tables are generated into `packages/db/src/auth-schema.ts`. Domain tables live in dedicated schema files.

For a schema change:

```bash
bun run auth:generate   # only when Better Auth configuration changed
bun run db:generate
# Review packages/db/drizzle/*.sql
bun run db:migrate
bun run test:integration
```

Commit the TypeScript schema and generated SQL. Deployment runs only `bun run db:migrate` and never generates SQL at runtime.

## Authentication and authorization

The template includes:

- email and password authentication
- HTTP-only browser cookie sessions
- signed native bearer sessions
- organizations, memberships, and invitations
- owner, admin, and member roles
- protected project routes
- `SecureTokenStore` for platform-specific native credential storage

Authorization is enforced by the API, not by hidden UI or client state.

## Architecture

```text
React and TanStack Query
  -> Eden typed client
  -> Elysia validation and session guard
  -> application service in packages/domain
  -> repository and authorization interfaces
  -> Drizzle adapters
  -> PostgreSQL
```

Domain code does not import React, Elysia, Drizzle, Capacitor, Tauri, or provider SDKs.

See [docs/architecture.md](docs/architecture.md).

## Continuous integration

The main pipeline validates:

1. capability dependencies, versions, documentation links, Biome, schema and migration drift, TypeScript, and coverage
2. API, SSR web, native SPA, and UI builds
3. PostgreSQL authentication and authorization integration tests
4. hardened Docker Compose and Playwright end-to-end behavior

Security workflows add dependency audit, secret scanning, filesystem and image scanning, SBOM, and provenance. Native workflows compile the retained desktop and mobile targets.

## Native delivery

Capacitor and Tauri consume the same native SPA build. Native production builds require an externally reachable HTTPS API URL:

```bash
export VITE_API_URL=https://api.example.com
bun run build:native
```

See [docs/native.md](docs/native.md).

## Releases

Template versions follow semantic versioning. Version values, the changelog, migrations, web/API builds, Compose behavior, security checks, and retained native platforms must agree before publishing a tag.

See [docs/release.md](docs/release.md).

## Documentation index

- [Engineering and coding style](RULES.md)
- [Contribution guide](CONTRIBUTING.md)
- [Project bootstrap](docs/project-bootstrap.md)
- [Architecture](docs/architecture.md)
- [UI foundation and branding](docs/ui.md)
- [Template customization](docs/template-customization.md)
- [Deployment](docs/deployment.md)
- [Native delivery](docs/native.md)
- [Release process](docs/release.md)
- [Security policy](SECURITY.md)
- [Change history](CHANGELOG.md)

## Template principles

1. Start with the smallest architecture that satisfies the product.
2. Remove optional modules instead of carrying unused infrastructure.
3. Keep versions and migrations reproducible.
4. Enforce identity and authorization on the server.
5. Prefer open protocols and replaceable implementations.
6. Keep domain code independent from frameworks.
7. Use semantic design tokens and own the UI source.
8. Use fast unit tests and real infrastructure where behavior matters.
9. Keep native wrappers thin and store credentials securely.
10. Document material deviations and architectural changes.
