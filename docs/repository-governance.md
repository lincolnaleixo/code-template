# Repository Governance

This document defines repository-level controls for maintaining the template. It complements `RULES.md`, which defines engineering standards, and `CONTRIBUTING.md`, which defines the contribution workflow.

## Ownership

`.github/CODEOWNERS` assigns default ownership to the current template maintainer and repeats ownership for high-risk areas such as workflows, applications, shared packages, scripts, and documentation.

A generated product must replace the template owners with the real product team. Review routing is not product ownership by itself. See [licensing.md](licensing.md).

## Repository metadata

The template should have a clear description and focused topics so its purpose and technology boundary are visible in GitHub.

Preview the metadata payload:

```bash
bun run repo:metadata
```

Apply it with a token that can administer repository settings:

```bash
GITHUB_ADMIN_TOKEN=... bun run repo:metadata --apply
```

Override values when adapting a generated product:

```bash
GITHUB_ADMIN_TOKEN=... \
  bun run repo:metadata --apply \
  --repository=owner/product \
  --description="Product description" \
  --topics="typescript,bun,react,product-category"
```

The command normalizes topics to lowercase, removes duplicates, enforces GitHub topic syntax, limits the payload to 20 topics, and never prints the token.

## Main branch baseline

The safe baseline for a repository with one maintainer is:

- changes arrive through pull requests
- unresolved review conversations block merge
- administrators follow the same protection
- force pushes are disabled
- branch deletion is disabled
- zero approvals are required until an independent reviewer exists
- code-owner review is not enforced until a different code owner can review the author
- current required status checks are preserved unless the command explicitly replaces or clears them

A pull request requirement still prevents direct pushes while allowing a solo maintainer to merge through the reviewed PR interface. Requiring an approval or code-owner review when the only owner is also the author can make every change unmergeable.

When two or more qualified maintainers exist, raise the policy deliberately:

```bash
bun run repo:protect --approvals=1 --code-owner-review=true
```

Requiring broken or ambiguous checks can also block all merges. Add required checks only after they have completed successfully with unique names.

## Applying protection

Preview the exact baseline without changing GitHub:

```bash
bun run repo:protect
```

When no check option is supplied, dry-run output states that existing required checks will be preserved during apply. The JSON preview shows the new baseline fields, while the apply path reads the current protection first and carries its check names and strictness forward.

Apply the solo-maintainer baseline with a token that can administer repository branch protection:

```bash
GITHUB_ADMIN_TOKEN=... bun run repo:protect --apply
```

The token is read from the environment and is never printed. Do not put it in command arguments, committed files, shell history, or logs.

To target another generated repository:

```bash
GITHUB_ADMIN_TOKEN=... \
  bun run repo:protect --apply \
  --repository=owner/product \
  --branch=main
```

To require one independent approval and code-owner review:

```bash
GITHUB_ADMIN_TOKEN=... \
  bun run repo:protect --apply \
  --approvals=1 \
  --code-owner-review=true
```

Do not enable that policy until another eligible reviewer is available.

## Managing required checks

After the runner configuration and final check names are stable, preview replacement of the required-check list:

```bash
bun run repo:protect \
  --checks="Quality, schema drift and unit tests|Build web, API and native web bundle|Fresh template consumer smoke|PostgreSQL authentication and authorization integration|Hardened Docker Compose E2E"
```

Then apply the reviewed payload:

```bash
GITHUB_ADMIN_TOKEN=... \
  bun run repo:protect --apply \
  --checks="Quality, schema drift and unit tests|Build web, API and native web bundle|Fresh template consumer smoke|PostgreSQL authentication and authorization integration|Hardened Docker Compose E2E"
```

Check names are separated with `|` because valid job names may contain commas. Supplying `--checks` replaces the current required-check list.

To remove all required checks deliberately:

```bash
GITHUB_ADMIN_TOKEN=... \
  bun run repo:protect --apply \
  --clear-checks=true
```

`--clear-checks=true` cannot be combined with `--checks`. Omitting both preserves the existing required-check configuration.

## Verification

After applying protection, verify in GitHub under:

```text
Settings
  -> Branches or Rules
  -> main
```

Confirm that direct pushes, force pushes, branch deletion, and unresolved conversations are rejected. When approval or code-owner review is enabled, confirm those requirements with a PR authored by a different maintainer.

Also verify the API response with an administrative token:

```bash
curl --fail --silent \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_ADMIN_TOKEN" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  https://api.github.com/repos/matrix-hq/code-template/branches/main/protection
```

Never print the token or the complete shell environment.

## Generated repositories

Repository metadata and branch protection settings are not assumed to match a generated product. Every generated repository must:

1. replace `CODEOWNERS`
2. set its real description and topics
3. decide its review count and bypass policy
4. confirm that the chosen policy cannot lock out the current maintainers
5. establish stable status-check names
6. apply the metadata and protection commands against its own repository
7. verify protection with a rejected direct push or equivalent administrative test

The product bootstrap is incomplete until ownership, metadata, and branch policy match the real team and risk level.
