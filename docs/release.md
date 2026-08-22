# Release Process

Template releases establish a reproducible baseline for repositories created afterward. Do not publish a release merely because implementation is merged. Publish when the version, changelog, generated artifacts, tests, builds, and delivery paths agree.

## Versioning

Use semantic versioning for the template:

- patch: compatible fixes and documentation corrections
- minor: new optional capabilities, components, patterns, or compatible architecture improvements
- major: incompatible repository structure, configuration, or generated-project migration requirements

Keep an `Unreleased` section at the top of `CHANGELOG.md`.

## Version sources

A release version must match in:

```text
package.json
apps/desktop/src-tauri/Cargo.toml
apps/desktop/src-tauri/Cargo.lock
apps/desktop/src-tauri/tauri.conf.json
CHANGELOG.md
```

Preview and apply a synchronized version update with:

```bash
bun run version:set 0.4.0 --dry-run
bun run version:set 0.4.0
```

The command updates the root package, Tauri configuration, Cargo package metadata, and only the root application package entry in `Cargo.lock`. It does not rewrite dependency versions or create a changelog section.

After changing Rust dependencies, regenerate `Cargo.lock` with Cargo. After changing only the product version, review the focused lockfile diff produced by `version:set`.

`bun run template:validate` checks the version contract when the desktop capability is enabled.

## Prepare the changelog

1. Review every entry under `Unreleased`.
2. Group entries under Added, Changed, Deprecated, Removed, Fixed, or Security.
3. Remove implementation trivia that does not help a template consumer.
4. Add migration instructions for incompatible changes.
5. Move the entries into a dated version section matching the new version.
6. Restore an empty `Unreleased` section for future work.

## Repository checks

Run the repository-level checks:

```bash
bun ci
bun run check
bun run build
VITE_API_URL=https://api.example.com bun run build:native
```

`bun run check` validates:

- capability dependencies and complete removals
- exact dependency versions and committed lockfiles
- synchronized template versions
- shadcn monorepo configuration
- semantic UI contracts
- local documentation links
- formatting and linting
- generated authentication schema and migrations
- TypeScript
- unit tests

## Infrastructure checks

With PostgreSQL and Docker available:

```bash
bun run infra:up
bun run db:migrate
bun run test:integration
bun run infra:full
bun run test:e2e
```

Confirm that:

- committed migrations apply to an empty database
- authentication and authorization behavior passes against PostgreSQL
- the full Compose stack reaches readiness
- the browser lifecycle passes through the public reverse-proxy boundary
- shutdown removes temporary resources without deleting expected persistent data

## Container checks

Build both runtime images and inspect their effective configuration:

```bash
docker build --target runtime --tag matrix-template-api:release --file apps/api/Dockerfile .
docker build --target runtime --tag matrix-template-web:release --file apps/web/Dockerfile .
docker compose --profile full --profile observability config --quiet
```

Before publishing, verify image architecture, non-root execution, read-only filesystem assumptions, health checks, SBOM generation, provenance, and registry permissions.

## Native checks

Compile every platform the release claims to support:

```text
Tauri Linux
Tauri macOS
Tauri Windows
Capacitor Android
Capacitor iOS
```

Unsigned simulator or debug artifacts prove compilation only. Production distribution additionally requires signing, notarization, provisioning, store metadata, and protected credentials.

A platform that was not compiled must be documented as unverified for that release.

## Security checks

Review:

- dependency audit
- secret scan
- filesystem and image vulnerabilities
- workflow token permissions
- generated SBOMs and provenance
- authentication and authorization regressions
- CSP and native permission changes
- new environment variables and log redaction

Security exceptions need an owner, justification, compensating control, and expiration or review date.

## Publish

After all required checks pass:

1. merge the release preparation pull request
2. create an annotated semantic version tag such as `v0.4.0`
3. push the tag
4. verify container and native release workflows
5. create or verify the GitHub release notes
6. attach or link the expected artifacts
7. record any platform-specific limitation

Do not move or reuse a published version tag.

## Post-release verification

After publishing:

- create a temporary repository from the GitHub template
- follow [project-bootstrap.md](project-bootstrap.md)
- install with the committed lockfile
- run the minimal web/API flow
- confirm documentation links and commands are correct for a fresh clone
- verify published images can be pulled by the intended audience
- confirm release artifacts match the tag and expected architectures

## Rollback and correction

Application artifacts can be rolled back to a previous image or binary, but a bad template release also affects newly generated repositories.

For a defective release:

1. document the impact clearly
2. publish a corrective version instead of rewriting the tag
3. provide migration or revert instructions for repositories already generated from the defective release
4. keep database compatibility and destructive migration constraints explicit
5. update the changelog with the correction

The release is complete only when a fresh consumer can reproduce the documented baseline from the published tag.
