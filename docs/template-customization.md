# Template Customization

The repository is a capability library. A project should keep only the modules justified by its product, deployment model, team, and near-term roadmap.

`template.config.ts` is the source of truth for enabled capabilities.

## Decision standard

Before retaining an optional module, ask:

1. Does the product require it now or in an imminent funded milestone?
2. Does keeping it materially reduce future work?
3. Is its operational and cognitive cost justified?
4. Is it covered by tests, documentation, and clear ownership?

When the answer is no, remove it cleanly.

## Disabling a capability

1. Set the capability to `false` in `template.config.ts`.
2. Remove its application, package, routes, imports, configuration, and generated artifacts when no longer used.
3. Remove unused dependencies from package manifests and update `bun.lock`.
4. Remove environment variables from `.env.example` and environment parsers.
5. Remove related Docker services, volumes, networks, health checks, and exposed ports.
6. Remove or adapt CI, security, preview, release, and native jobs.
7. Remove or adapt tests that exercised the capability.
8. Update `README.md`, relevant files in `docs/`, and `CHANGELOG.md`.
9. Run `bun run template:validate`, `bun run check`, and all builds that remain supported.

A capability is not disabled when its code is merely unreachable. No dead implementation, dependency, service, or workflow should remain.

## Enabling or replacing a capability

Perform the inverse process:

- update `template.config.ts`
- add the smallest implementation that satisfies the requirement
- define boundaries and ownership
- add environment validation
- add meaningful tests
- update deployment and release paths
- document the decision and migration path

A replacement should preserve stable domain contracts where that reduces migration risk. Avoid compatibility layers that have no removal plan.

## Common project shapes

### Web-only SaaS

Keep web, API, PostgreSQL, authentication, organizations, UI, Docker, and browser tests. Remove Capacitor, Tauri, and native release workflows.

### Public content site

Keep web and UI. Remove API, PostgreSQL, authentication, organizations, object storage, and native wrappers unless the product needs them. Re-evaluate whether the application-oriented TanStack shell is appropriate for all public pages.

### Internal desktop tool

Keep Tauri, UI, and the native web bundle. Remove server modules when the tool is fully local, or retain API and authentication when it connects to shared data.

### Prototype

Keep structured logs and basic health checks. Telemetry exporters, container releases, native signing, and complex authorization can remain disabled until required.

### Product without uploads

Remove `@matrix/storage`, MinIO, S3 variables, bucket initialization, storage tests, and storage documentation.

## Replacing infrastructure

PostgreSQL, MinIO, and Caddy are replaceable choices rather than proprietary platform dependencies.

When replacing one of them:

- keep domain contracts independent from the implementation
- migrate data explicitly
- preserve security properties
- update readiness checks and operational documentation
- validate backup and rollback procedures
- remove the old implementation completely after migration

## Validation

The minimum adaptation check is:

```bash
bun run template:validate
bun run check
bun run build
```

Also run the relevant commands for retained capabilities:

```bash
bun run test:integration
bun run test:e2e
bun run build:native
bun run build:desktop
bun run build:mobile
```
