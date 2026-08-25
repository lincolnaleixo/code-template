# Current Status

Last reviewed: 2026-08-25

This file is the persistent handoff point for `lincolnaleixo/code-template`.

## Main baseline

The current `main` commit is:

```text
314b58ec6ad0218b4942f46571a903054e113291
```

The public template remains at version `0.3.0`. PR #10 contains the Release Please publication gate, explicit GitHub-hosted runners, public pull-request safety controls, repository governance updates, and fixes proven by executable platform builds. PR #12 is the separate stacked follow-up for local Git secret guards. Issue #8 is the completion checklist.

## Completed foundation

Do not redo these areas unless an executable failure proves a concrete defect:

- Bun and TypeScript monorepo architecture
- React and TanStack Start web application
- Bun, Elysia, and Eden API
- PostgreSQL with committed Drizzle migrations
- Better Auth, organizations, roles, browser cookies, native bearer sessions, and server-side authorization
- S3-compatible storage with MinIO for local development
- Docker Compose and Caddy topology
- structured logging, request IDs, metrics, and optional OpenTelemetry
- Capacitor and Tauri wrappers
- repository-owned semantic UI system with light, dark, system, compact, and comfortable modes
- Playwright authenticated lifecycle and axe accessibility audit
- isolated fresh-template consumer smoke test
- CODEOWNERS and dry-run-first repository governance commands

## Public repository transition

Completed and verified:

- repository visibility is public
- GitHub Template Repository status is enabled
- repository description and topics are populated
- squash merge is enabled while merge commits and rebase merge are disabled
- merged branches are deleted automatically
- root `private: true` prevents package-registry publication and does not control GitHub visibility
- public source remains explicitly `UNLICENSED`
- historical browser artifacts `9464035422` and `9464176353` are unavailable
- current tree, reachable history, workflows, environment examples, known logs, issues, pull requests, and known artifacts were reviewed
- no live credential, private key, customer data, production endpoint, signing material, or personal dataset was found

Historical Git author metadata remains reachable. It is not a credential. History was not rewritten because doing so would replace commit SHAs and invalidate bootstrap references.

## Branch governance

The `main` branch is protected. GitHub reports:

- protection enabled for everyone, including administrators
- force pushes disabled
- branch deletion disabled
- required pull requests and conversation resolution
- stable CI, Security, CodeQL, dependency review, container, browser, Android, iOS, Linux, macOS, and Windows checks required before merge

The required check set includes:

```text
Audit, secrets and repository scan
Build and scan OCI images
Build web, API and native web bundle
Capacitor Android
Capacitor iOS simulator
CodeQL
Dependency review
Fresh template consumer smoke
Hardened Docker Compose E2E
PostgreSQL authentication and authorization integration
Quality, schema drift and unit tests
Tauri macos-15
Tauri ubuntu-24.04
Tauri windows-2025
```

## PR #10 validation

PR #10 implements:

- Release Please as the single release preparation and publication gate
- Conventional Commits as the SemVer input
- focused changelog categories
- manual container and native workflows that are structurally verify-only
- publisher checks requiring the canonical tag and an existing GitHub Release
- one repository-level release concurrency gate
- mandatory `RELEASE_PLEASE_TOKEN` with no `GITHUB_TOKEN` fallback
- explicit `ubuntu-24.04`, `macos-15`, and `windows-2025` images
- same-repository-only preview publication
- no repository-variable reads from untrusted native pull requests
- no browser-report or native-binary artifact uploads from fork pull requests
- Playwright Git metadata capture disabled and one-day browser-report retention

Previous current-head evidence completed successfully for CI, PostgreSQL, consumer smoke, Docker Compose, Playwright, axe, Gitleaks, Trivy, dependency review, CodeQL, OCI scans, Tauri on three operating systems, Android, iOS, and preview image builds. Every new commit must rerun the same gates before merge.

## PR #12 validation

PR #12 adds:

- `commit-msg` secret scanning
- exact staged-index scanning in `pre-commit`
- outgoing commit, intermediate blob, commit-message, and annotated-tag scanning in `pre-push`
- fail-closed Secretlint canaries
- high-risk path, text-size, binary-signature, and printable binary-metadata policy
- CI parity so local `--no-verify` does not remove the remote barrier
- hook installation and behavior tests in temporary repositories

Its current stacked head has successful CI, Security, Native, and Preview runs. After PR #10 lands, retarget PR #12 to `main`, update it, verify its focused diff, rerun the suites, and merge it independently.

## Remaining evidence

Before merging PR #10:

1. prove that repository-scoped `RELEASE_PLEASE_TOKEN` exists without exposing its value
2. execute a real fork pull request and prove it receives no repository secrets, package-write path, release path, preview publication, or repository-hosted native binary upload
3. create a temporary repository through GitHub **Use this template**
4. follow `docs/project-bootstrap.md` in that generated repository
5. remove or reseed the source-specific Release Please `bootstrap-sha`
6. prove install, documentation, minimal web/API lifecycle, and source-independent identity
7. delete or archive the temporary proof repository after recording evidence

The connected GitHub integration can verify repository files, pull requests, workflow runs, and branch protection. It cannot enumerate Actions secret names, create a fork under another account, or create a new repository through the template endpoint.

## Release sequence

1. complete the remaining evidence
2. mark PR #10 ready only while its current head is green
3. squash-merge PR #10 with its Conventional Commit title
4. confirm the `main` push runs Release Please using `RELEASE_PLEASE_TOKEN`
5. retarget and finish PR #12 so the first release can include the local guards
6. review the generated release pull request, synchronized versions, and changelog
7. merge the release pull request only as explicit publication approval
8. verify `v0.4.0`, the immutable tag, GitHub Release, GHCR images, SBOM, provenance, and native assets
9. repeat the real template proof against the released tag
10. close issue #8 only after all evidence is recorded

Do not run `version:set`, create or move a tag manually, or publish artifacts from a manual workflow during the normal release path.

## Definition of done

The template is complete when protected `main` contains PRs #10 and #12, fork safety and a real generated consumer are proven, Release Please has produced `v0.4.0`, all published artifacts are verified, and the post-release template proof passes.
