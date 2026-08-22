# Changelog

All notable changes to this template are documented in this file.

The format follows Keep a Changelog and the project uses semantic versioning for template releases.

## [Unreleased]

### Added

- Repository-owned UI foundation inspired by shadcn with semantic OKLCH tokens.
- Project-level `brand.css` for hue, chroma, lightness, chart, and dark-theme customization.
- Light, dark, and system appearance modes with flash-free bootstrap.
- Compact and comfortable density modes.
- Shared button, badge, card, input, textarea, label, select, switch, separator, skeleton, alert, avatar, dialog, and tabs primitives.
- App shell, sidebar, page header, form field, empty state, and stat card patterns.
- `/ui` development playground for branding and component review.
- `typeset` rich-content styling for markdown, documentation, and AI output.
- Dedicated architecture, deployment, native, UI, and template customization documentation.

### Changed

- Refactored the starter product flow to use semantic UI primitives rather than hardcoded Zinc and red utilities.
- Reworked `RULES.md` to contain engineering and coding standards only.
- Moved template operation and module removal instructions to `README.md` and `docs/template-customization.md`.
- Reduced `AGENTS.md` to repository navigation, validation, and documentation responsibilities.
- Added UI as an explicit capability in `template.config.ts`.

## [0.3.0] - 2026-08-22

### Added

- Root feature manifest and validation command for optional template capabilities.
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
