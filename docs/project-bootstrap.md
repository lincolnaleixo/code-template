# Project Bootstrap

Use this checklist after creating a repository from `matrix-hq/code-template`. The goal is to turn the capability superset into the smallest coherent product foundation before feature development begins.

## 1. Record the product profile

Write down the current requirements before changing code:

- primary users and critical journey
- web, mobile, and desktop targets
- public SEO pages versus authenticated application pages
- authentication and organization model
- persistence, uploads, realtime, jobs, and external integrations
- deployment environment and compliance constraints
- intended repository visibility, distribution, ownership, and licensing model
- hosted or self-hosted runner policy and expected Actions cost
- team responsible for reviews, releases, and operations

Do not keep a capability only because it may be useful someday.

## 2. Select capabilities

Edit `template.config.ts`, then follow [template-customization.md](template-customization.md) for every disabled or replaced capability.

Typical starting points:

```text
Web SaaS
  web, ui, api, database, authentication, organizations, docker, E2E

Public web application
  web, ui, optional api and database

Mobile-first product
  web bundle, ui, api, database, authentication, mobile

Desktop local tool
  web bundle, ui, desktop, optional api and database
```

Run after pruning:

```bash
bun run template:validate
```

The command should report both missing enabled files and leftover artifacts from disabled capabilities.

## 3. Replace template identity

Update the product identity deliberately rather than applying a blind global replacement.

| Concern | Location |
| --- | --- |
| Root package name and product version | `package.json` |
| Browser title and theme metadata | `apps/web/src/routes/__root.tsx` |
| Default public application name | `.env.example` and deployment environment |
| Mobile application ID and name | `apps/mobile/capacitor.config.ts` |
| Desktop product name, identifier, window title, and version | `apps/desktop/src-tauri/tauri.conf.json` |
| Rust package and library names | `apps/desktop/src-tauri/Cargo.toml` |
| Product copy and example entities | `apps/web/src/routes/` |
| Brand tokens | `apps/web/src/brand.css` |
| Code owners | `.github/CODEOWNERS` |
| Repository documentation | `README.md`, `SECURITY.md`, and `docs/` |

Use a reverse-domain identifier controlled by the product owner, for example:

```text
com.example.product
```

Changing the internal `@matrix/*` workspace scope is optional. It is private implementation naming, not an application-store identity. When changing it, update every workspace package name, dependency, import, Docker build reference, and documentation example together.

## 4. Establish product versioning

A generated product commonly starts at `0.1.0`. Preview and apply the synchronized version change:

```bash
bun run version:set 0.1.0 --dry-run
bun run version:set 0.1.0
```

The command updates the product release state together:

```text
version.txt
.release-please-manifest.json
package.json
apps/desktop/src-tauri/Cargo.toml
apps/desktop/src-tauri/Cargo.lock
apps/desktop/src-tauri/tauri.conf.json
```

The source template currently carries a one-time top-level `bootstrap-sha` in `release-please-config.json` so Release Please can onboard the historical `0.3.0` template baseline even though that repository did not have a matching tag. That SHA belongs only to `matrix-hq/code-template` and does not exist in a repository created with **Use this template**. Remove it before the generated repository begins normal development, or replace it with a full commit SHA from the generated repository when you deliberately want to bound the first Release Please changelog.

During this one-time product bootstrap, replace the template changelog with the product baseline or add the matching initial product section. After bootstrap, Release Please owns `CHANGELOG.md`, version files, and the manifest during normal development. Contributors should drive subsequent versions with Conventional Commits rather than editing release metadata directly.

Run:

```bash
bun run template:validate
```

The validator checks that the current product version agrees across Release Please, package, Tauri, and Cargo state.

After changing Rust dependencies, regenerate the lockfile with Cargo. A version-only change should leave dependency entries untouched.

Decide whether to preserve the template's historical changelog or replace it with a product changelog that records the template baseline and begins at `0.1.0`.

## 5. Define the visual identity

Start in `apps/web/src/brand.css`:

```css
:root {
  --brand-hue: 255;
  --brand-chroma: 0.16;
  --brand-lightness: 0.56;
  --radius: 0.75rem;
}
```

Then review:

```text
/ui
/ui-advanced
```

Validate light, dark, system theme, compact density, comfortable density, keyboard navigation, zoom, and narrow screens. Preserve semantic tokens inside shared components.

See [ui.md](ui.md).

## 6. Configure environments

Copy `.env.example` into the environment-specific secret and configuration system. Do not commit populated environment files.

At minimum, decide:

- production database URL
- authentication URL and trusted origins
- strong authentication secret
- browser application URL
- native API URL
- object-storage endpoint and credentials when enabled
- metrics protection and OpenTelemetry export when enabled

Production should fail fast when a required value is missing or unsafe.

## 7. Adapt authentication and authorization

Confirm whether the product needs:

- email and password
- social or enterprise identity providers
- organizations or a single-user model
- owner, administrator, and member roles
- invitations
- native bearer sessions
- session duration and revocation behavior

Authorization must remain server-side. Rename the example `projects` domain or replace it with the first real protected resource.

Native clients must implement `SecureTokenStore` with operating-system secure storage before production use.

## 8. Establish the database baseline

Replace example domain tables with the first real model, then generate and review the initial product migration:

```bash
bun run auth:generate
bun run db:generate
bun run db:migrate
bun run test:integration
```

Seed only non-sensitive development data. Document backup, restore, and destructive migration policy before production deployment.

## 9. Configure native targets

For Capacitor:

- choose application IDs
- generate Android and iOS projects
- configure icons, splash screens, permissions, deep links, and signing
- commit generated native directories once product customization begins

For Tauri:

- choose the product identifier and bundle metadata
- configure icons, updater strategy, permissions, and signing
- keep native commands behind narrow adapters

See [native.md](native.md).

## 10. Configure deployment and operations

Decide whether to retain the provided Compose and Caddy topology or replace it with the target platform's equivalent.

Before production, document:

- secret delivery
- database migration ownership
- backups and restore tests
- readiness and rollback behavior
- image retention
- logs, metrics, traces, and alerts
- storage lifecycle
- domain and TLS configuration

See [deployment.md](deployment.md).

## 11. Establish visibility, ownership, licensing, runners, and repository policy

Choose the product's repository and distribution policy. Update or configure:

```text
GitHub repository visibility
package.json private and license fields
LICENSE or approved proprietary notice, when applicable
.github/CODEOWNERS
GitHub-hosted or self-hosted runner labels
README.md
SECURITY.md
```

The source template is publicly visible but explicitly `UNLICENSED`. Its root `private: true` field only prevents accidental package publication. A generated product must choose its own private or public repository visibility and its own license. Public visibility is not an open-source license.

Before changing a generated repository from private to public, audit the current tree, complete history, branches, PRs, issues, Actions logs and artifacts, workflow secret references, and distributable assets. Rotate any credential that may have appeared anywhere in those surfaces.

The template's standard runner baseline is:

```text
ubuntu-24.04
macos-15
windows-2025
```

A generated product may keep these GitHub-hosted images or deliberately adopt self-hosted infrastructure. Document runner access, architecture, cost, maintenance, and isolation before changing the labels.

Preview branch protection:

```bash
bun run repo:protect
```

Apply it with an administrative token only after reviewing owners, approval count, bypass policy, and stable check names.

See [licensing.md](licensing.md) and [repository-governance.md](repository-governance.md).

## 12. Validate the product baseline

Run the checks relevant to retained capabilities:

```bash
bun ci
bun run check
bun run build
bun run test:integration
VITE_API_URL=https://api.example.com bun run build:native
bun run test:template-consumer
```

With the full stack running and Chromium installed:

```bash
bun run infra:full
bun run test:e2e
bun run test:a11y
```

Also compile every retained native target before claiming support for it.

## 13. Finish initialization

Before feature development:

- remove placeholder copy and sample data that no longer describe the product
- remove unused dependencies, services, environment variables, and workflows
- update `README.md` and `SECURITY.md`, and initialize the product changelog once
- remove or reseed the source template's Release Please `bootstrap-sha`
- choose repository visibility and complete the matching sensitivity audit
- replace the template code owners with the real team
- choose and document the product license and ownership policy
- configure and validate the product runner policy
- apply and verify the repository branch policy
- verify no template secret or example credential was promoted to production
- create the initial product release plan
- record the source template commit or release for future comparison

A project is initialized when the repository describes the real product, every enabled capability has an owner and requirement, every disabled capability has been removed cleanly, release automation is anchored to the generated repository rather than the source template, and visibility, runner policy, licensing, ownership, and branch governance reflect the real team.
