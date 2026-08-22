# Template Rules

This repository is a capability library, not a requirement that every generated project use every capability.

## Primary rule

An agent may disable or remove any template feature when it is unnecessary, disproportionate, incompatible with the target project, or replaced by a better project-specific choice.

Do not preserve a service, package, application, workflow, or dependency merely because it exists in this template. Prefer the smallest architecture that fully satisfies the project's real requirements.

An agent must not remove a capability that the project explicitly requires. Decisions must be based on product requirements, deployment constraints, security needs, team skills, and expected scale rather than personal preference.

## Feature manifest

`template.config.ts` is the source of truth for which optional capabilities are enabled.

When disabling a feature:

1. Set its value to `false` in `template.config.ts`.
2. Remove its app, package, service, workflow, environment variables, scripts, and dependencies when they are no longer used.
3. Update Docker Compose, CI, documentation, tests, and imports so no dead references remain.
4. Add an entry to `CHANGELOG.md` describing the project-specific decision.
5. Run `bun run template:validate`, `bun run lint:ci`, `bun run typecheck`, and the relevant tests.

When enabling or restoring a feature, perform the inverse operation and add meaningful validation for it.

## Examples of valid simplification

- Disable `mobile` when the product is web-only.
- Disable `desktop` when native desktop distribution is not required.
- Disable `objectStorage` when the product stores no files.
- Disable `organizations` for a strictly single-user product.
- Disable `observability` exporters for a local prototype while retaining structured logs.
- Disable `containerReleases` when deployment does not use OCI images.
- Disable `nativeReleases` until native signing and distribution are actually required.
- Replace PostgreSQL only when project requirements justify a different persistence model and all database-dependent modules are adapted.
- Replace Caddy with another standards-based reverse proxy when deployment infrastructure already supplies one.

## Non-negotiable engineering rules

### Reproducibility

- Commit `bun.lock`.
- Use exact versions in the root Bun catalog.
- Use `bun ci` in CI and Docker builds.
- Do not introduce `latest`, wildcard, or unbounded dependency versions.

### Database changes

- Drizzle schema changes require reviewed, committed SQL migrations.
- Deployment may apply migrations but must not generate them.
- Destructive migrations require an explicit rollout and rollback plan.
- Application code must remain compatible during rolling deployments when zero downtime is required.

### Authentication and authorization

- Authentication proves identity. Authorization controls access. Implement and test both.
- Never use CORS as an authorization mechanism.
- Protect private routes on the server even when the UI hides them.
- Organization-scoped data must verify membership and permission for the active organization.
- Native bearer tokens must be stored with the platform's secure storage, never plain local storage in a production app.

### Environment and secrets

- Parse environment variables through `@matrix/env`.
- Production must fail fast for missing or unsafe secrets.
- Never commit credentials, private keys, signing certificates, tokens, or production connection strings.
- Keep browser-exposed variables limited to the `VITE_` namespace and treat them as public.

### Architecture

- HTTP handlers translate transport concerns and call application services.
- Application services contain use cases and depend on interfaces.
- Infrastructure adapters implement database, storage, queue, and external API details.
- Domain code must not import Elysia, React, Drizzle, Capacitor, Tauri, or vendor SDKs.
- Add infrastructure only after the workload requires it.

### Observability

- Keep structured logs and request IDs for server applications.
- Redact authorization headers, cookies, passwords, tokens, and secrets.
- Telemetry exporters are optional and controlled by environment configuration.
- Health checks report process liveness. Readiness checks verify required dependencies.

### Security and supply chain

- Use least-privilege GitHub Actions permissions.
- Keep dependency audit, CodeQL, secret scanning, image scanning, SBOM generation, and artifact provenance enabled for production projects unless an equivalent control replaces them.
- Pin third-party GitHub Actions to immutable commit SHAs where practical and let Renovate maintain those pins.
- Containers must run as non-root, expose only required ports, and avoid writable filesystems unless necessary.

### Testing

- Keep fast unit tests independent of external infrastructure.
- Use real PostgreSQL for database integration tests.
- Maintain at least one full browser smoke test through the production-like reverse proxy.
- Native projects require at least compilation validation before release workflows are considered ready.

### Documentation

- Keep `README.md`, `RULES.md`, `CHANGELOG.md`, `.env.example`, and `template.config.ts` synchronized with the actual project.
- Document important deviations from the template and why they were made.
- Do not claim a workflow or platform is supported unless CI validates it or the limitation is stated clearly.

## Decision standard

Before retaining an optional module, ask:

1. Does the product require it now or in an imminent, funded milestone?
2. Does keeping it materially reduce future work?
3. Is its operational and cognitive cost justified?
4. Is it covered by tests, documentation, and ownership?

If the answer is no, disable or remove it cleanly.
