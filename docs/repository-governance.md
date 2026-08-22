# Repository Governance

This document defines repository-level controls for maintaining the template. It complements `RULES.md`, which defines engineering standards, and `CONTRIBUTING.md`, which defines the contribution workflow.

## Ownership

`.github/CODEOWNERS` assigns default ownership to the current template maintainer and repeats ownership for high-risk areas such as workflows, applications, shared packages, scripts, and documentation.

A generated product must replace the template owners with the real product team. Review routing is not product ownership by itself. See [licensing.md](licensing.md).

## Main branch baseline

The intended `main` branch policy is:

- changes arrive through pull requests
- at least one approval is required
- code-owner review is required for owned paths
- stale approvals are dismissed after new commits
- unresolved review conversations block merge
- administrators follow the same protection
- force pushes are disabled
- branch deletion is disabled
- required status checks are added only after their final names and execution infrastructure are stable

Requiring broken or ambiguous checks can block all merges. Add required checks only after they have completed successfully with unique names.

## Applying protection

Preview the exact API payload without changing GitHub:

```bash
bun run repo:protect
```

Apply the baseline with a token that can administer repository branch protection:

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

## Adding required checks

After the runner configuration and final check names are stable, preview:

```bash
bun run repo:protect \
  --checks="Quality, schema drift and unit tests|Build web, API and native web bundle|PostgreSQL authentication and authorization integration|Hardened Docker Compose E2E"
```

Then apply the reviewed payload:

```bash
GITHUB_ADMIN_TOKEN=... \
  bun run repo:protect --apply \
  --checks="Quality, schema drift and unit tests|Build web, API and native web bundle|PostgreSQL authentication and authorization integration|Hardened Docker Compose E2E"
```

Check names are separated with `|` because valid job names may contain commas. The `--checks` value replaces the current required-check list. Review it before every apply.

## Verification

After applying protection, verify in GitHub under:

```text
Settings
  -> Branches or Rules
  -> main
```

Confirm that direct pushes, force pushes, branch deletion, missing reviews, missing code-owner review, and unresolved conversations are rejected as expected.

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

Branch protection settings are not copied by GitHub's template operation. Every generated repository must:

1. replace `CODEOWNERS`
2. decide its review count and bypass policy
3. establish stable status-check names
4. run the protection command against its own repository
5. verify protection with a rejected direct push or equivalent administrative test

The product bootstrap is incomplete until ownership and branch policy match the real team and risk level.
