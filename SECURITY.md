# Security Policy

## Reporting a vulnerability

Do not disclose suspected vulnerabilities in public issues, discussions, pull requests, or chat channels.

Use GitHub private vulnerability reporting when it is enabled for this repository. Otherwise, contact the organization maintainers through an approved private channel and include:

- affected component and version
- impact and realistic attack scenario
- reproduction steps or proof of concept
- suggested mitigation, when known
- whether the issue is already public or under active exploitation

Do not include production credentials, customer data, private keys, session tokens, or personal data in the report.

## Response expectations

Maintainers should acknowledge a complete report within five business days, assess severity, coordinate a fix, and publish an advisory when disclosure is appropriate. Timelines vary by impact and complexity.

## Supported versions

This repository is a template rather than a deployed product. Security fixes are applied to the current `main` branch and the latest tagged template release. Projects created from the template own their dependency updates, deployment patches, incident response, and backports.

## Security controls in this template

The default workflows provide:

- reproducible Bun installs from a committed lockfile
- dependency audit
- local staged-index, commit-message, and outgoing-history secret gates
- dependency review and CodeQL on public repositories
- secret scanning with Gitleaks
- source, configuration, and container scanning with Trivy
- non-root application containers with restricted capabilities
- immutable database migrations
- structured log redaction
- server-side authentication and organization authorization tests
- SBOM and provenance generation for released OCI images

These controls are a baseline. Each generated project must complete its own threat model and adapt the controls to its data, users, jurisdictions, integrations, and deployment environment.

## Local secret gates

`bun ci` runs Husky's `prepare` script and installs repository-owned `commit-msg`, `pre-commit`, and `pre-push` hooks automatically. Verify the installation and scanner policy at any time with:

```bash
bun run security:hooks:verify
bun run security:secrets:verify
```

The hooks use Secretlint with the repository policy in `.secretlintrc.json`:

- `commit-msg` removes Git comment lines, then scans the message that would be recorded in history
- `pre-commit` reads the exact blobs staged in the Git index, not unstaged worktree content
- `pre-push` reads every outgoing commit, including intermediate add-then-remove commits, plus outgoing commit and annotated tag messages
- high-risk credential paths such as non-template `.env*`, private key stores, credential directories, and Terraform state fail closed even when content scanning finds no provider token
- unknown binary payloads and oversized text payloads fail closed because content scanners cannot inspect them reliably
- reviewed image and font payloads are accepted only when their extension matches a known file signature, and printable binary metadata is still scanned for secrets
- safe and secret canaries run before repository content so a missing, broken, or over-broad scanner blocks the operation instead of silently passing

CI runs the same path, size, binary-signature, and binary-metadata policy against every tracked blob, then performs a batched Secretlint scan of tracked text. Existing Gitleaks, Trivy, dependency-review, and CodeQL jobs remain independent remote barriers.

Local hooks are defense in depth and can be bypassed deliberately with Git's `--no-verify`. Bypass does not waive the CI gate or the requirement to rotate a credential that may have been exposed. Handle false positives with narrow reviewed examples or fingerprints. Do not add broad ignored directories or disable a provider rule merely to make a check pass.

## Secrets and credentials

Never commit live credentials. Rotate any credential immediately if it may have entered Git history, logs, artifacts, screenshots, issue comments, build caches, or chat transcripts. Deleting a file from the latest commit is not sufficient to revoke a disclosed secret.

Native signing material and production deployment secrets must be stored in protected GitHub environments or an external secret manager with least-privilege access and audit logs.
