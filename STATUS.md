# Current Status

Last reviewed: 2026-08-24

This file is the persistent handoff point for continuing work on `matrix-hq/code-template`.

## Baseline

The latest completed repository-side baseline before this status document is:

```text
aa185b8bb8eb5fcec774f93c13e9fb413dc3ef6d
```

PR #7 completed the final quality and governance package. The template remains at version `0.3.0`; the next release must not be published until executable validation is complete.

The detailed continuation checklist lives in GitHub issue #8.

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
- explicit publicly visible `UNLICENSED` source policy without claiming an open-source license
- dry-run-first repository metadata and branch-protection commands
- GitHub Template Repository setting
- Release Please release-PR gate with strict SemVer and focused changelog categories
- manual container and native release workflows that are structurally verify-only
- publisher fail-closed checks that require an existing Release Please tag and GitHub Release
- explicit GitHub-hosted runner images for Ubuntu 24.04, macOS 15, and Windows Server 2025
- fork-safe preview permissions and removal of repository-variable reads from untrusted native PR builds
- Playwright Git metadata capture disabled for future reports
- browser report uploads blocked for fork pull requests and retained for one day only

## Public visibility audit

A pre-public review covered the current tree, representative history where credentials and infrastructure were introduced, retained branches, pull-request and issue text, workflow permissions, environment templates, historical Actions logs, and downloadable test reports.

No live credential, private key, customer data, production endpoint, signing material, or personal dataset was found. Values such as `matrix`, `minio`, `miniosecret`, and the Better Auth placeholder are local development examples bound to localhost or isolated CI services.

Current documentation no longer publishes organization-specific runner machine names. Historical Git commits include an iCloud relay address in author metadata. That address is not a credential and appears to be privacy-preserving, but it will be visible to anyone who clones the public Git history. Rewriting all reachable history would be disruptive and has not been performed.

Two unexpired historical Playwright reports also embed that Git author address because Playwright captured commit metadata automatically on CI:

```text
artifact 9464035422
artifact 9464176353
```

Delete both artifacts before changing repository visibility. Future reports set `captureGitInfo.commit` and `captureGitInfo.diff` to `false`, are not uploaded for fork pull requests, and have one-day retention.

Historical successful job logs were inspected and contained only localhost endpoints, synthetic test identities, and local CI credentials. Failed runs created after private Actions capacity was exhausted executed zero steps and produced no artifacts in the inspected runs.

Historical commits remain part of the Git history, so the complete Gitleaks history scan must run immediately after GitHub-hosted runners become available. Any executable finding blocks the visibility transition or requires immediate rotation and history remediation.

The connector used for this work cannot enumerate stored repository secret values. Workflow references were reviewed instead. The only non-GitHub automation secret required by the proposed release flow is `RELEASE_PLEASE_TOKEN`, and it is available only to the trusted `main` push workflow.

## Intentionally pending

### 1. Repository visibility

The repository is still private until an administrator changes GitHub visibility to public. The connected GitHub integration does not expose repository visibility or Actions artifact deletion mutations.

Before changing visibility:

```bash
gh api -X DELETE repos/matrix-hq/code-template/actions/artifacts/9464035422
gh api -X DELETE repos/matrix-hq/code-template/actions/artifacts/9464176353
```

Then either use GitHub Settings or run the guarded repository command from this branch:

```bash
GITHUB_ADMIN_TOKEN=... \
  bun run repo:metadata --apply \
  --visibility=public \
  --confirm-visibility=public
```

After the visibility change, confirm that standard GitHub-hosted jobs start on these explicit images:

```text
ubuntu-24.04
macos-15
windows-2025
```

No organization-specific self-hosted runner is required by the template baseline.

### 2. Full executable validation

After public hosted runners start, execute and record:

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

Also validate Docker images, full Compose readiness, PostgreSQL migrations from an empty database, auth integration, Playwright through Caddy, full-history Gitleaks, Trivy, CodeQL, dependency review, Tauri targets, Android, and iOS.

### 3. Real GitHub template consumer proof

Create a temporary repository with **Use this template**, follow `docs/project-bootstrap.md`, run the minimal product lifecycle, and confirm there are no hidden assumptions tied to the source repository.

`bun run test:template-consumer` is useful but does not replace the real GitHub template-generation proof.

### 4. Administrative GitHub settings

After hosted checks have stable names:

```bash
GITHUB_ADMIN_TOKEN=... bun run repo:metadata --apply
GITHUB_ADMIN_TOKEN=... bun run repo:protect --apply
```

Apply required CI check names only after the final hosted runs complete successfully.

### 5. Release 0.4.0

Do not publish `0.4.0` until retained platforms have executable evidence.

When validation is complete:

1. merge any remaining tested Conventional Commits into `main`
2. review the Release Please pull request and confirm the proposed version, generated changelog, `version.txt`, manifest, package version, and enabled native versions agree
3. keep the release pull request open until the exact candidate is ready for users
4. merge the Release Please pull request as the explicit publication approval
5. verify the `v0.4.0` GitHub Release, GHCR images, and retained native assets produced by the gated publishers
6. repeat the fresh-template proof from the published tag

Do not run `version:set`, create the tag manually, or publish artifacts from a manual workflow during the normal release path.

## Resume order

When continuing in another session, use this order:

1. read this file and issue #8
2. delete the two historical Playwright artifacts
3. change repository visibility to public
4. confirm minimal Ubuntu, macOS, and Windows jobs start
5. run the full executable validation set, beginning with full-history secret scanning
6. fix only defects proven by those checks
7. run the real GitHub template consumer proof
8. apply repository metadata and branch protection
9. review and merge the Release Please pull request for `0.4.0`
10. verify the gated publishers and fresh-template result
11. close issue #8

## Definition of done

The template is ready for `0.4.0` when historical reports containing Git author metadata are removed, public GitHub-hosted runners execute successfully, the complete history scan is clean, all retained platform claims have executable evidence, the generated-consumer path is proven, GitHub governance is applied, and the Release Please publication gate can reproduce the documented baseline from its immutable tag without overstating unsupported platforms.
