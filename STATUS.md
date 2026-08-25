# Current Status

Last reviewed: 2026-08-25

This file is the persistent handoff point for continuing work on the source template at `lincolnaleixo/code-template`. The repository was transferred from `matrix-hq/code-template`; GitHub redirects historical links, but new repository-specific references should use the canonical identity or remain source-repository neutral.

## Baseline

Current `main` baseline:

```text
314b58ec6ad0218b4942f46571a903054e113291
```

The public template remains at version `0.3.0`. PR #10 contains the Release Please publication gate, public hosted-runner baseline, public pull-request safety controls, and fixes proven by executable platform builds. Issue #8 is the authoritative completion checklist.

## Completed foundation

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
- KISS and YAGNI-focused engineering rules
- capability, dependency, UI, documentation-link, synchronized-version, consumer, and release-contract validation
- logger secret-redaction regression coverage
- Playwright authenticated lifecycle and axe accessibility audit
- isolated fresh-template consumer smoke command
- CODEOWNERS and dry-run-first repository governance commands

## Completed public transition

- repository visibility is public
- GitHub Template Repository status is preserved
- repository description and topics are populated
- merge policy permits squash only and deletes merged branches
- root `private: true` remains package-publication protection, not repository visibility
- public source remains explicitly `UNLICENSED` and does not claim an open-source license
- historical browser artifacts `9464035422` and `9464176353` are no longer accessible
- current tree, reachable history, environment examples, workflows, issues, pull requests, known logs, and known artifacts were reviewed
- no live credential, private key, customer data, production endpoint, signing material, or personal dataset was found

Historical Git author metadata remains reachable. It is not a credential. History was not rewritten because doing so would replace commit SHAs and invalidate bootstrap references.

## Release and runner implementation in PR #10

PR #10 implements:

- Release Please as the single release preparation and publication gate
- Conventional Commits as the SemVer input
- focused changelog categories
- manual container and native workflows that are structurally verify-only
- publisher checks requiring the canonical tag and existing GitHub Release
- one repository-level release concurrency gate
- mandatory `RELEASE_PLEASE_TOKEN` with no `GITHUB_TOKEN` fallback
- explicit `ubuntu-24.04`, `macos-15`, and `windows-2025` hosted images
- same-repository-only preview publication
- no repository-variable reads from untrusted native pull requests
- no browser-report or native-binary artifact uploads from fork pull requests
- Playwright Git metadata capture disabled and one-day browser-report retention

## Executable evidence

The current PR #10 head has complete public hosted evidence:

- CI, PostgreSQL, template consumer, Docker Compose, Playwright, and axe: https://github.com/lincolnaleixo/code-template/actions/runs/32845151973
- dependency audit, Gitleaks canaries and full history, Trivy, dependency review, CodeQL, and OCI scans: https://github.com/lincolnaleixo/code-template/actions/runs/32845152047
- Tauri on Ubuntu, macOS, and Windows, plus Capacitor Android and iOS: https://github.com/lincolnaleixo/code-template/actions/runs/32845151929
- API and web preview images: https://github.com/lincolnaleixo/code-template/actions/runs/32845151936

Gitleaks uses the current `v8.30.1` image with a safe canary and a genuinely random high-entropy secret canary. The history step also proves that at least one commit was scanned before accepting success.

## Remaining blockers before merging PR #10

The following evidence is still required:

1. confirm repository-scoped `RELEASE_PLEASE_TOKEN` exists without exposing its value
2. confirm a `main` protection rule or ruleset blocks force push and deletion
3. confirm the stable green CI, Security, and Native check names are required before merge
4. execute a real fork pull request and prove it receives no secrets, package-write path, release path, or repository-hosted native binary upload
5. create a real repository through GitHub **Use this template**
6. follow `docs/project-bootstrap.md` in that generated repository
7. remove or reseed the source-specific Release Please `bootstrap-sha`
8. prove install, documentation, minimal web/API lifecycle, and source-independent identity
9. delete or archive the temporary proof repository after recording evidence

The connected integration receives HTTP 403 when reading branch protection and cannot enumerate Actions secret names. Those items require administrative UI/API confirmation or a real protected execution.

## Local secret guards in PR #12

PR #12 is a separate stacked follow-up. It adds:

- `commit-msg` Secretlint scanning before a message enters history
- exact staged-index scanning in `pre-commit`
- all outgoing commits, intermediate blobs, commit messages, and annotated tags in `pre-push`
- fail-closed safe and secret canaries
- high-risk path, text-size, binary-signature, and printable binary-metadata policy
- CI parity so local `--no-verify` never removes the remote gate
- hook installation and Secretlint canary verification on Linux, macOS, and Windows

PR #12 does not block PR #10. After PR #10 lands, retarget PR #12 to `main`, update it, verify its focused diff, and merge it independently.

## Release sequence

When the remaining administrative evidence is recorded:

1. mark PR #10 ready only while its current head is green
2. squash-merge PR #10 with its existing Conventional Commit title
3. confirm the `main` push runs Release Please using `RELEASE_PLEASE_TOKEN`
4. review the generated release PR, synchronized versions, and changelog
5. keep the release PR open until explicit publication approval
6. merge the Release Please PR to create `v0.4.0`
7. verify the immutable tag, GitHub Release, GHCR images, SBOM, provenance, and retained native assets
8. repeat the fresh-template proof against the released tag
9. retarget and finish PR #12 independently
10. close issue #8 only after all evidence is recorded

Do not run `version:set`, create or move the tag manually, or publish artifacts from a manual workflow during the normal release path.

## Resume order

1. read this file and issue #8
2. record the four remaining administrative proofs for PR #10
3. mark PR #10 ready and squash-merge it
4. review and merge the Release Please PR only as explicit publication approval
5. verify `v0.4.0` and every retained artifact
6. repeat the real GitHub template proof from the release
7. retarget, update, and finish PR #12
8. close issue #8

## Definition of done

The source template is ready for `v0.4.0` when protected `main` has merged PR #10, public fork safety and a real generated consumer are proven, Release Please has produced the immutable release, released containers and native artifacts are verified, and the post-release fresh-template check passes without overstating unsupported platforms.
