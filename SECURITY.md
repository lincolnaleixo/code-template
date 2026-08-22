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
- secret scanning with Gitleaks
- source, configuration, and container scanning with Trivy
- CodeQL and dependency review when GitHub Advanced Security is available
- non-root application containers with restricted capabilities
- immutable database migrations
- structured log redaction
- server-side authentication and organization authorization tests
- SBOM and provenance generation for released OCI images

These controls are a baseline. Each generated project must complete its own threat model and adapt the controls to its data, users, jurisdictions, integrations, and deployment environment.

## Secrets and credentials

Never commit live credentials. Rotate any credential immediately if it may have entered Git history, logs, artifacts, screenshots, issue comments, build caches, or chat transcripts. Deleting a file from the latest commit is not sufficient to revoke a disclosed secret.

Native signing material and production deployment secrets must be stored in protected GitHub environments or an external secret manager with least-privilege access and audit logs.
