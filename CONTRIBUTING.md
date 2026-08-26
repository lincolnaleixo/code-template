# Contributing

This repository is a product template. Changes should improve the default without making every generated project carry unnecessary complexity.

## Before changing code

1. Read [RULES.md](RULES.md).
2. Read the relevant architecture or operational document under [`docs/`](docs/architecture.md).
3. Check `template.config.ts` when the change adds, removes, or couples capabilities.
4. Review [docs/repository-governance.md](docs/repository-governance.md) for ownership or repository-policy changes.
5. Prefer a small, reversible change over a speculative framework or abstraction.

## Change workflow

1. Create a focused branch from `main`.
2. Keep the change scoped to one problem.
3. Add or update tests at the level where the behavior can fail.
4. Update documentation when commands, architecture, configuration, or supported behavior changes.
5. Open a pull request using the repository template and explain any validation marked not applicable.
6. Make sure the commit or squash title that will land on `main` follows Conventional Commits.

Release Please owns `CHANGELOG.md`, `version.txt`, `.release-please-manifest.json`, and the release version fields in package, Tauri, and Cargo metadata. Do not change those release values during ordinary feature work.

## Local Git secret guards

`bun ci` installs the repository hooks through Husky. The hooks are defense in depth and do not replace protected branches or CI.

The commit-message hook:

- scans the complete commit-message file, including lines beginning with `#`, because Git can preserve them with verbatim cleanup
- rejects credentials pasted into a message before the commit is created
- uses the same fail-closed Secretlint canaries as the file guards

The pre-commit hook:

- reads the exact blobs in Git's staged index, not the potentially different working-tree files
- rejects high-risk credential, environment, signing, state, and key filenames
- verifies Secretlint against a safe canary and a known-secret canary before trusting it
- scans staged text with Secretlint while masking detected values
- allows only reviewed image and font binary types and blocks unreviewed binary payloads

The pre-push hook:

- reads the ref updates supplied by Git
- scans every object in annotated-tag chains, commit messages, and every unique changed blob in commits that are not already on the remote
- catches secrets or unsafe payloads that were added in an intermediate commit and removed later
- runs `bun run check` after the outgoing-history scan passes

Run the guards directly when diagnosing them:

```bash
bun run security:hooks:verify
bun run security:secrets:verify
bun run security:policy
bun run security:secrets
bun run security:staged
bun run security:history <base-commit> <head-commit>
```

CI scans every pull-request commit message and every changed blob with the same high-risk path, text-size, binary-signature, and binary-metadata policy. It then repeats the policy against the final tracked tree and runs Secretlint across every tracked text path. Existing Gitleaks, Trivy, dependency-review, and CodeQL checks remain independent remote controls.

A hook can be deliberately bypassed with Git's `--no-verify` behavior or by disabling Husky. Treat bypass as an exceptional local action, record why it was necessary, and never use it to merge around a failing CI check. False positives must be handled with a narrow, documented rule allowance rather than a broad ignored path.

## Commit messages and versions

Conventional Commits are part of the release contract, not just a naming preference. Use a focused type and optional scope, for example:

```text
fix(auth): preserve native bearer sessions
feat(ui): add a reusable command palette
perf(api): reduce duplicate project queries
docs: clarify project initialization
test(auth): cover expired native sessions
ci(release): validate published artifacts
```

The version policy is:

- `fix: ...` produces a patch release.
- `feat: ...` produces a minor release.
- `feat!: ...` or a `BREAKING CHANGE:` footer produces a major release, including before `1.0.0`.
- `docs`, `refactor`, `test`, `build`, `ci`, and `chore` do not create a release by themselves.
- `perf`, `deps`, and `security` are user-facing release-note categories and produce a patch when they are the highest-impact release change.

If the repository uses squash merging, the pull request title becomes the effective release commit and must follow the same convention. See [docs/release.md](docs/release.md) for the complete release policy.

## Architecture boundaries

- Product-independent rules belong in `packages/domain`.
- HTTP validation, cookies, status codes, and request context belong in `apps/api`.
- Database, storage, telemetry, and provider details belong in infrastructure adapters.
- Shared UI primitives and patterns belong in `packages/ui`.
- Product-specific compositions belong in `apps/web` or a product feature package.
- Native wrappers should remain thin and expose narrow adapters to shared TypeScript code.

Do not introduce imports that reverse the dependency direction documented in [docs/architecture.md](docs/architecture.md).

## Dependencies

Before adding a package, confirm that the platform or an existing dependency cannot satisfy the requirement cleanly.

When a dependency is justified:

1. pin an exact version in the root Bun catalog
2. reference it with `catalog:` from the consuming workspace
3. update `bun.lock`
4. review maintenance, security, runtime, and bundle cost
5. update Renovate grouping when the package belongs to an existing dependency family

Do not add an unbounded version or a second tool that duplicates an existing responsibility.

Test-only tools that install into an isolated temporary workspace must still pin exact versions, document why they are isolated, preserve the repository lockfile, and fail clearly when installation or execution fails.

## Database and authentication

Schema changes require committed migrations:

```bash
bun run auth:generate   # when Better Auth configuration changed
bun run db:generate
bun run db:migrate
bun run test:integration
```

Review generated SQL before committing it. Deployment applies committed migrations and never generates schema changes.

Authentication changes should test identity, session transport, authorization, and denied access separately.

## UI changes

Use semantic tokens and preserve keyboard, focus, reduced-motion, light-theme, and dark-theme behavior.

The shadcn CLI is configured for the monorepo. Run it from the app workspace so UI primitives are routed into `packages/ui` and app-level blocks or compositions are routed into `apps/web`:

```bash
bun run ui:info
bun run ui:add button
```

Generated source is a starting point, not an opaque dependency. Review the diff, align it with repository conventions, export shared components deliberately, and add a representative example to `/ui` or `/ui-advanced`.

When shared UI or product layout changes, run the applicable Playwright flow and the axe audit against the full stack:

```bash
bun run test:e2e
bun run test:a11y
```

Automation supports, but does not replace, manual keyboard, screen-reader, zoom, and native-WebView review.

See [docs/ui.md](docs/ui.md).

## Validation

Use the smallest validation set that fully covers the change, then expand it when risk crosses a boundary.

| Change | Minimum validation |
| --- | --- |
| Documentation only | `bun run docs:check`, `bun run lint:ci` |
| TypeScript or shared package | `bun run check` |
| API or database | `bun run check`, `bun run test:integration` |
| Web or shared UI | `bun run check`, `bun run build`, Playwright and accessibility checks |
| Docker or deployment | Compose configuration, image builds, readiness, E2E |
| Bootstrap, layout, package metadata | `bun run test:template-consumer` |
| Mobile or desktop | `bun run build:native` and the retained platform build |
| Governance or ownership | dry-run `bun run repo:protect`, review CODEOWNERS and licensing docs |
| Release mechanics | Follow [docs/release.md](docs/release.md) |

A checkbox may be marked not applicable only with a short reason. Do not claim a command passed when it did not run.

## Security

- Never commit secrets, tokens, certificates, production connection strings, or private customer data.
- Do not weaken authentication, authorization, CSP, container isolation, or workflow permissions merely to make a test pass.
- Redact sensitive fields from logs and examples.
- Add regression coverage when changing redaction, credential handling, or security boundaries.
- Report security issues using [SECURITY.md](SECURITY.md), not a public issue.

## Licensing and ownership

The source template is public and explicitly `UNLICENSED`. Changes that introduce copied source, assets, fonts, icons, generated SDKs, or distributable binaries must consider their license and attribution obligations.

Do not add a public license or change ownership policy without an explicit repository-owner decision. See [docs/licensing.md](docs/licensing.md).

## Generated projects

When adapting this repository into a product, follow [docs/project-bootstrap.md](docs/project-bootstrap.md). Remove unused capabilities completely rather than leaving dormant code, services, dependencies, or workflows. Replace template code owners and choose the product's real license before feature development or external distribution.
