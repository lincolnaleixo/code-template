# Repository Governance

This document defines repository-level controls for maintaining the template. It complements `RULES.md`, which defines engineering standards, and `CONTRIBUTING.md`, which defines the contribution workflow.

## Ownership

`.github/CODEOWNERS` assigns default ownership to the current template maintainer and repeats ownership for high-risk areas such as workflows, applications, shared packages, scripts, and documentation.

A generated product must replace the template owners with the real product team. Review routing is not product ownership by itself. See [licensing.md](licensing.md).

## Repository visibility and hosted runners

The source template is intended to be a public GitHub repository. Its workflows use standard GitHub-hosted runner images instead of organization-specific self-hosted infrastructure:

```text
Linux       ubuntu-24.04
macOS       macos-15
Windows     windows-2025
```

Using explicit images makes retained platform claims reviewable and avoids silently changing operating-system generations behind `latest` aliases. Generated repositories may choose another runner policy, but they must document the cost, access, security boundary, architecture, and supported-platform consequences.

The package field `private: true` is retained as package-registry publication protection. It is independent from GitHub repository visibility. See [licensing.md](licensing.md).

## Public visibility review

Changing a repository from private to public exposes the current tree, reachable Git history, branches, pull requests, issues, review discussions, and repository-visible Actions information. Complete this review before changing visibility:

1. inspect tracked files for live credentials, private keys, tokens, certificates, customer data, private URLs, internal hostnames, and personal data
2. scan the complete reachable Git history with Gitleaks or an equivalent history-aware scanner
3. review pull-request and issue text, review comments, retained branches, workflow logs, and downloadable artifacts
4. review every workflow reference to repository secrets, variables, environments, and write permissions
5. confirm that committed credentials are clearly local examples and cannot authenticate to a real service
6. confirm that fonts, icons, images, generated SDKs, and copied source can be made publicly visible
7. confirm the repository license policy and do not confuse public visibility with an open-source license
8. rotate any credential that may have appeared in source, history, logs, artifacts, screenshots, comments, or caches, even if it was later deleted

Delete an Actions artifact that should not become public with a token holding repository `Actions: write` permission:

```bash
gh api -X DELETE repos/OWNER/REPOSITORY/actions/artifacts/ARTIFACT_ID
```

The repository security workflow checks out full history and runs Gitleaks after runner access is available. A green current-tree scan is not enough when a secret may have existed in an older commit.

The only Gitleaks exceptions are two commit-scoped false positives for the
historical S3 client line above. The line reads the validated
`S3_SECRET_KEY` environment variable and contains no credential value. Each
fingerprint is tied to one old commit and line so a changed implementation is
scanned normally.

Playwright reports disable automatic Git commit and diff capture so future browser artifacts do not reproduce author identity or complete source diffs. Browser reports are not uploaded for fork pull requests and are retained for one day.

## Public pull-request safety

Workflows triggered by `pull_request` must treat source from forks as untrusted.

The baseline policy is:

- CI, native compilation, and open-source security scans receive read-only repository contents
- repository secrets are not required by fork pull-request jobs
- preview image publication runs only for a branch in the source repository or an explicit manual dispatch
- release publication runs only after a trusted push to `main` and the Release Please publication gate
- repository variables are not read by untrusted pull-request builds
- write permissions are assigned at the narrowest job that needs them

Do not replace `pull_request` with `pull_request_target` merely to expose secrets or write tokens to untrusted code. A workflow that needs elevated permissions must keep untrusted source from executing in that privileged context.

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

A visibility change is deliberately separate from the default metadata operation. Preview a public transition:

```bash
bun run repo:metadata --visibility=public
```

Apply it only after the public visibility review is complete. The command requires an exact confirmation value in the same invocation:

```bash
GITHUB_ADMIN_TOKEN=... \
  bun run repo:metadata --apply \
  --visibility=public \
  --confirm-visibility=public
```

The command normalizes topics to lowercase, removes duplicates, enforces GitHub topic syntax, limits the payload to 20 topics, never prints the token, and refuses an unconfirmed visibility mutation.

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

A private-to-public transition disables push rulesets. Reapply or verify the intended branch policy after the visibility change and after hosted check names are stable.

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

Repository visibility, metadata, runner selection, and branch protection are not assumed to match a generated product. Every generated repository must:

1. replace `CODEOWNERS`
2. choose private or public visibility deliberately
3. set its real description and topics
4. decide its hosted or self-hosted runner policy
5. decide its review count and bypass policy
6. confirm that the chosen policy cannot lock out the current maintainers
7. establish stable status-check names
8. apply the metadata and protection commands against its own repository
9. verify protection with a rejected direct push or equivalent administrative test

The product bootstrap is incomplete until visibility, ownership, metadata, runner policy, and branch protection match the real team and risk level.
