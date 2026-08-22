# Changelog

All notable changes to this template are documented in this file.

The format follows Keep a Changelog and the project uses semantic versioning for template releases.

## [Unreleased]

### Added

- Root feature manifest and validation command for optional template capabilities.
- Agent rules that explicitly allow clean removal of unnecessary template modules.
- Bun dependency catalogs, isolated workspace installs, and a supply-chain release-age gate.
- Biome formatting and linting.
- Typed server, client, native, and test environment validation.
- Versioned Drizzle migrations with drift verification.
- Complete Better Auth schema, organization support, custom permissions, and native bearer support.
- Protected API routes and authentication integration tests.
- Domain and application layers with infrastructure adapters.
- Structured logs, request IDs, metrics, and optional OpenTelemetry export.
- Hardened production Compose topology and optional observability services.
- Dependency automation, CodeQL, dependency review, secret scanning, image scanning, SBOMs, and provenance.
- OCI container release workflow and native desktop/mobile build workflow.
- Expanded unit, PostgreSQL integration, browser, authentication, and authorization coverage.

### Changed

- Docker deployment applies committed migrations without generating SQL at runtime.
- CI uses reproducible `bun ci` installs and validates migration drift.
- Browser API and authentication clients use same-origin requests by default.
- Runtime containers install or copy only production requirements and run without root privileges.

### Removed

- Unbounded dependency versions from workspace package manifests.
- Runtime migration generation.

## [0.2.0] - 2026-08-22

### Added

- Production-oriented Dockerfiles for Bun/Elysia and TanStack Start.
- Full Docker Compose profile with PostgreSQL, MinIO, migrations, API, web, and Caddy.
- PostgreSQL integration tests and Playwright E2E smoke coverage.
- Multi-job GitHub Actions pipeline for quality, builds, integration tests, and full-stack E2E.

### Fixed

- Empty browser API URL handling in same-origin deployments.
- TanStack route generation before type checking.
- GitHub Actions runtime deprecation warnings by upgrading core actions.

## [0.1.0] - 2026-08-21

### Added

- Initial TypeScript-first monorepo template.
- Bun, React, TanStack Start, Elysia, Eden, PostgreSQL, Drizzle, Better Auth, Tailwind, Capacitor, Tauri, MinIO, Docker Compose, and Caddy.
