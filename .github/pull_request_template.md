## Problem and scope

Describe the problem, the chosen solution, and what is intentionally outside this pull request.

## Capability impact

- [ ] No capability changes
- [ ] `template.config.ts` was updated
- [ ] Added or enabled capability is justified by a current requirement
- [ ] Disabled capability was removed from code, dependencies, environment, infrastructure, workflows, tests, and docs

Explain the capability impact or why it is not applicable.

## Risk and migration

Describe compatibility, data migration, rollout, rollback, security, accessibility, licensing, ownership, and native-platform implications.

## Validation

- [ ] `bun run check`
- [ ] `bun run build`
- [ ] `bun run test:template-consumer`, or not applicable with reason
- [ ] PostgreSQL integration tests, or not applicable with reason
- [ ] Docker Compose and Playwright E2E, or not applicable with reason
- [ ] Axe accessibility audit, or not applicable with reason
- [ ] Retained native target builds, or not applicable with reason
- [ ] Security checks relevant to the change

Commands not executed are listed below with the reason. Do not mark a check as passed when it did not run.

## Ownership and governance

- [ ] `CODEOWNERS` still represents the responsible maintainers
- [ ] Licensing and third-party obligations were reviewed when distributable material changed
- [ ] Branch-protection or required-check changes were previewed and documented, or are not applicable

## Documentation and release

- [ ] Documentation reflects changed commands, architecture, configuration, or behavior
- [ ] The commit or squash title that will land on `main` follows Conventional Commits
- [ ] Release-managed versions, `version.txt`, `.release-please-manifest.json`, and `CHANGELOG.md` were not edited manually, or this pull request explicitly changes release automation or performs documented recovery
- [ ] Generated schemas, migrations, and lockfiles are current
- [ ] The release or project-bootstrap documentation remains accurate
