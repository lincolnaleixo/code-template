# Current Status

Last reviewed: 2026-08-24

This file is the persistent handoff point for continuing work on `matrix-hq/code-template`.

## Baseline

The latest completed repository-side baseline before this status document is:

```text
aa185b8bb8eb5fcec774f93c13e9fb413dc3ef6d
```

PR #7 completed the final quality and governance package. The template remains at version `0.3.0`; the next release must not be published until executable validation is complete.

The detailed continuation checklist lives in GitHub issue #8:

```text
https://github.com/matrix-hq/code-template/issues/8
```

## Completed

Do not redo these areas unless an executable failure proves a concrete defect:

- production-oriented Bun and TypeScript monorepo architecture
- React and TanStack Start web application
- Bun, Elysia, and Eden API
- PostgreSQL and committed Drizzle migrations
- Better Auth, organizations, roles, browser cookies, native bearer sessions, and server-side authorization
- S3-compatible storage with MinIO for local development
- Docker Compose and Caddy topology
- structured logging, request IDs, metrics, and optional OpenTelemetry
- Capacitor and Tauri thin wrappers
- repository-owned semantic OKLCH UI system
- light, dark, and system themes plus compact and comfortable density
- `/ui` and `/ui-advanced` playgrounds
- shadcn monorepo configuration
- KISS/YAGNI-focused engineering rules
- README, contribution, bootstrap, customization, UI, licensing, governance, deployment, native, and release documentation
- capability, dependency, UI, documentation-link, synchronized-version, and release-contract validation
- logger secret-redaction fix and regression tests
- axe accessibility audit command
- isolated fresh-template consumer smoke command
- CODEOWNERS
- explicit private `UNLICENSED` policy for the template
- dry-run-first repository metadata and branch-protection commands
- GitHub Template Repository setting
- Release Please release-PR gate with strict SemVer and focused changelog categories
- manual container and native release workflows that are structurally verify-only
- publisher fail-closed checks that require an existing Release Please tag and GitHub Release

## Intentionally pending

### 1. Runner routing

The organization already documents:

```text
runner-linux-01
  [self-hosted, linux, x64, matrix]

runner-macos-01
  [self-hosted, matrix, macOS, ARM64]
```

The `code-template` workflows still request GitHub-hosted labels. Runner routing is intentionally deferred to a separate session.

There is no shared Matrix Windows runner documented yet. Decide whether to add one or gate Windows validation until it exists.

### 2. Full executable validation

After runner routing is corrected, execute and record:

```bash
bun ci
bun run check
bun run build
VITE_API_URL=https://api.example.com bun run build:native
bun run test:integration
bun run test:template-consumer
bun run test:a11y
bun run test:e2e
```

Also validate Docker images, full Compose readiness, PostgreSQL migrations from an empty database, auth integration, Playwright through Caddy, security scans, Tauri targets, Android, and iOS.

### 3. Real GitHub template consumer proof

Create a temporary repository with **Use this template**, follow `docs/project-bootstrap.md`, run the minimal product lifecycle, and confirm there are no hidden assumptions tied to the source repository.

`bun run test:template-consumer` is useful but does not replace the real GitHub template-generation proof.

### 4. Administrative GitHub settings

Known current state:

```text
is_template: true
description: empty
topics: empty
main branch protection: not yet applied or confirmed
```

Prepared commands:

```bash
GITHUB_ADMIN_TOKEN=... bun run repo:metadata --apply
GITHUB_ADMIN_TOKEN=... bun run repo:protect --apply
```

Apply required CI check names only after the final runner-backed check names are stable.

### 5. Release 0.4.0

Do not publish `0.4.0` until retained platforms have executable evidence.

When validation is complete:

1. merge any remaining tested Conventional Commits into `main`
2. review the Release Please pull request and confirm the proposed version, generated changelog, `version.txt`, manifest, package version, Tauri version, and Cargo versions agree
3. keep the release pull request open until the exact candidate is ready for users
4. merge the Release Please pull request as the explicit publication approval
5. verify the `v0.4.0` GitHub Release, GHCR images, and retained native assets produced by the gated publishers
6. repeat the fresh-template proof from the published tag

Do not run `version:set`, create the tag manually, or publish artifacts from a manual workflow during the normal release path.

## Resume order

When continuing in another session, use this order:

1. read this file and issue #8
2. fix runner routing only
3. run minimal Linux and macOS probes
4. run the full executable validation set
5. fix only defects proven by those checks
6. run the real GitHub template consumer proof
7. apply repository metadata and branch protection
8. review and merge the Release Please pull request for `0.4.0`
9. verify the gated publishers and fresh-template result
10. close issue #8

## Definition of done

The template is ready for `0.4.0` when runner routing is intentional, all retained platform claims have executable evidence, the generated-consumer path is proven, GitHub governance is applied, and the Release Please publication gate can reproduce the documented baseline from its immutable tag without overstating unsupported platforms.
