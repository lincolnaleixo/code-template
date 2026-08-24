# Release Process

Template releases establish a reproducible baseline for repositories created afterward. Normal development lands on `main`, but publication is a separate decision: a version is published only when a maintainer merges the Release Please pull request.

## Normal release flow

1. Merge tested Conventional Commits into `main`.
2. Release Please opens or updates one release pull request with the next semantic version, synchronized version files, and generated changelog.
3. Leave that pull request open while more changes should accumulate. Nothing is published while it remains open.
4. Review the proposed version, changelog, version sources, and required checks.
5. Merge the release pull request only when that exact version is ready to publish.
6. Release Please creates the `vX.Y.Z` tag and canonical GitHub Release.
7. The same trusted workflow calls the enabled container and native publishers with that tag.
8. Publishers verify that the tag points at the checked-out source and that the GitHub Release already exists before writing artifacts.

Merging the release pull request is the publication approval. Do not merge it as routine repository housekeeping.

## Version policy

The repository uses strict Semantic Versioning, including before `1.0.0`.

| Change | Commit example | Result from `0.3.0` |
| --- | --- | --- |
| Backward-compatible bug fix | `fix(auth): preserve native sessions` | `0.3.1` |
| Backward-compatible feature | `feat(ui): add command palette` | `0.4.0` |
| Incompatible change | `feat!: replace repository layout` | `1.0.0` |

Release notes expose the categories that matter to consumers: features, bug fixes, performance, dependencies, and security.

The following commit types are hidden from user-facing release notes and do not create a release by themselves:

```text
docs
refactor
test
build
ci
chore
```

Use a breaking change only when a generated project, repository contract, configuration, migration path, or supported integration becomes incompatible.

If a specific next version is genuinely required for recovery, Release Please supports a `Release-As: X.Y.Z` trailer on an appropriate commit. Do not use it to replace or reuse an already published version.

## Release-managed files

Release Please uses `version.txt` as the simple-strategy version source and keeps these values synchronized in the release pull request:

```text
version.txt
.release-please-manifest.json
package.json
apps/desktop/src-tauri/tauri.conf.json
apps/desktop/src-tauri/Cargo.toml
apps/desktop/src-tauri/Cargo.lock
CHANGELOG.md
```

`bun run template:validate` verifies the synchronization contract. It also verifies that the configured `Cargo.lock` array index still points to the root `matrix-template` package, so dependency changes cannot silently make Release Please update the wrong package.

Do not edit release versions, `.release-please-manifest.json`, or `CHANGELOG.md` during ordinary feature work. Commit messages are the input to the next release pull request.

`bun run version:set X.Y.Z` remains available only for bootstrap or documented recovery. It synchronizes the local version sources and manifest, but it is not the normal publication path and it must not be followed by a manually created tag.

## Release pull request review

Before merging the automated release pull request, confirm:

- the proposed SemVer bump matches the commits on `main`
- the changelog contains consumer-relevant changes and excludes implementation noise
- all synchronized version sources contain the same version
- repository checks and retained-platform evidence are green
- capability changes are reflected in release publishers and documentation
- no secret, signing material, private path, or environment-specific value is present

There is no release calendar enforced by automation. Merge the release pull request when the accumulated changes are worth shipping and the evidence is sufficient.

## Verify without publishing

Manual runs of release publisher workflows are always verify-only.

For containers, run `Release containers` from GitHub Actions. An optional existing tag can be supplied to verify that exact source. The manual path has read-only repository permissions, never logs into GHCR, and uses `push: false`.

For native builds, run `Native builds` from GitHub Actions. An optional existing tag can be supplied to verify that exact source. The build artifacts are retained as workflow artifacts, but the job that writes to the GitHub Release is unreachable from `workflow_dispatch`.

Manual inputs do not include a publish switch. There is no supported manual path that creates a tag, GitHub Release, registry image, or release asset.

## Publication gate and permissions

Official publication is reachable only through `.github/workflows/release-please.yml` after Release Please reports that a release was created from a merged release pull request.

The workflow uses repository-level concurrency group `code-template-release` with cancellation disabled, so a second official release cannot run concurrently with the first one.

Publisher permissions are split by mode:

- manual container verification receives `contents: read` only
- official container publication receives package, OIDC, and attestation write permissions only in its publish job
- native compile jobs receive `contents: read`
- the native asset upload job receives `contents: write` only when invoked through the official reusable workflow path

Container and native workflows do not create GitHub Releases. They fail closed if the requested release does not already exist or if the tag does not resolve to the checked-out source.

## Release Please token

The release workflow prefers a repository secret named `RELEASE_PLEASE_TOKEN` when one is configured and otherwise falls back to `GITHUB_TOKEN`.

A dedicated GitHub App or appropriately scoped token is useful when the organization wants workflows on Release Please-created pull requests to start without the approval behavior associated with pull requests opened by `GITHUB_TOKEN`. Keep the token least-privileged and repository-scoped.

The release flow does not require a separate token merely to create the release pull request, tag, or GitHub Release when repository Actions permissions allow those operations.

## Repository checks

Run the repository-level checks before publication:

```bash
bun ci
bun run check
bun run build
VITE_API_URL=https://api.example.com bun run build:native
bun run test:template-consumer
```

`bun run check` validates:

- capability dependencies and complete removals
- explicit license policy
- exact dependency versions and committed lockfiles
- synchronized template and Release Please versions
- Release Please publisher references for enabled release capabilities
- shadcn monorepo configuration
- semantic UI contracts
- local documentation links
- formatting and linting
- generated authentication schema and migrations
- TypeScript
- unit tests

The consumer smoke test copies the working tree into a temporary repository, creates a clean initial commit, installs from the committed lockfile, runs repository checks, and builds both server and native web outputs. It must leave tracked source unchanged.

## Infrastructure and browser checks

With PostgreSQL and Docker available:

```bash
bun run infra:up
bun run db:migrate
bun run test:integration
bun run infra:full
bunx playwright install --with-deps chromium
bun run test:e2e
bun run test:a11y
```

Confirm that:

- committed migrations apply to an empty database
- authentication and authorization behavior passes against PostgreSQL
- the full Compose stack reaches readiness
- the browser lifecycle passes through the public reverse-proxy boundary
- axe reports no configured WCAG A or AA violations on public product and UI routes in light and dark themes
- browser and accessibility reports are retained with the release evidence
- shutdown removes temporary resources without deleting expected persistent data

## Container checks

Before publishing, verify image architecture, non-root execution, read-only filesystem assumptions, health checks, SBOM generation, provenance, and registry permissions.

A manual `Release containers` run builds both runtime images for `linux/amd64` and `linux/arm64` without pushing them. The official path publishes SemVer and source-SHA tags to GHCR, generates SBOM and provenance data, and records build provenance attestations.

## Native checks

Compile every platform the release claims to support:

```text
Tauri Linux
Tauri macOS
Tauri Windows
Capacitor Android
Capacitor iOS
```

The current template builds unsigned desktop bundles, an Android debug APK, and an unsigned iOS simulator application. These artifacts prove compilation only. Production distribution additionally requires the product-specific signing, notarization, provisioning, store metadata, and protected credentials appropriate to that product.

A platform that was not compiled must be documented as unverified for that release.

## Optional release capabilities

`containerReleases` and `nativeReleases` are explicit capabilities in `template.config.ts`.

When disabling either capability, remove its workflow and remove the matching `publish-containers` or `publish-native` job from `.github/workflows/release-please.yml`. `bun run template:validate` enforces both sides of this contract so the release orchestrator cannot retain a reference to a removed publisher.

When both publishers are disabled, Release Please can still own source versioning, changelog, tags, and GitHub Releases. Remove the root release automation only if the generated product deliberately adopts another documented release model and updates its validation policy accordingly.

## Security and governance checks

Review:

- dependency audit
- secret scan
- filesystem and image vulnerabilities
- workflow token permissions
- generated SBOMs and provenance
- authentication and authorization regressions
- CSP and native permission changes
- new environment variables and log redaction
- root license policy and third-party obligations
- `CODEOWNERS` accuracy
- branch protection and required-check configuration

Security exceptions need an owner, justification, compensating control, and expiration or review date.

Preview repository protection with:

```bash
bun run repo:protect
```

Do not require status checks until their final names have completed successfully. See [repository-governance.md](repository-governance.md) and [licensing.md](licensing.md).

## Post-release verification

After publishing:

- verify the GitHub Release points to the expected immutable tag
- verify expected container images and native assets exist
- pull published images using the intended audience permissions
- create a temporary repository using the GitHub **Use this template** action when bootstrap or repository layout changed
- follow [project-bootstrap.md](project-bootstrap.md)
- run `bun run test:template-consumer` from the release commit as supporting evidence
- install the generated repository with its committed lockfile
- run the minimal web/API flow
- confirm documentation links and commands are correct for a fresh clone
- replace ownership and licensing placeholders in the generated consumer

The automated consumer smoke test does not replace the real GitHub template operation for a release that changes bootstrap, file layout, generated configuration, or repository metadata.

## Failed releases and correction

If a publisher fails after Release Please created the tag and GitHub Release, fix the underlying operational cause and rerun the failed job when rerunning does not change source. Do not move the tag or reuse the version for different source code.

If a code change is required, merge a Conventional Commit and let Release Please propose the next version.

For a defective release:

1. document the impact clearly
2. publish a corrective version instead of rewriting the tag
3. provide migration or revert instructions for repositories already generated from the defective release
4. keep database compatibility and destructive migration constraints explicit
5. let the corrective release update the changelog through normal automation

The release is complete only when a fresh consumer can reproduce the documented baseline from the published tag.
