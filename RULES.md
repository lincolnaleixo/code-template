# Engineering Rules

These rules define how code in this repository should be designed, written, reviewed, and maintained. Operational instructions belong in `README.md` and `docs/`.

## Priorities

When tradeoffs are necessary, prefer this order:

1. Correctness and security.
2. Simplicity and readability.
3. Maintainability and testability.
4. User experience and accessibility.
5. Performance supported by evidence.
6. Cleverness and abstraction last.

## KISS

- Prefer the smallest design that satisfies the current requirement.
- Choose explicit code over hidden behavior, metaprogramming, or unnecessary indirection.
- Keep control flow easy to follow.
- Do not introduce infrastructure, patterns, or frameworks without a concrete need.
- A new contributor should be able to understand the common path without reconstructing the system mentally.

## YAGNI

- Do not build speculative extension points.
- Do not retain unused modules, dependencies, flags, or compatibility layers for hypothetical future work.
- Add complexity when a real requirement proves it is necessary.
- Prefer reversible decisions when requirements are uncertain.

## DRY with judgment

- Remove duplication when the duplicated concept is genuinely the same and changes together.
- Do not force unrelated behavior behind a shared abstraction merely because the code looks similar.
- A small amount of local duplication is preferable to the wrong abstraction.
- Extract abstractions after their boundary is understood, not before.

## Modules and functions

- Keep modules cohesive and focused on one responsibility.
- Prefer small functions with clear inputs, outputs, and names.
- Avoid boolean parameter combinations that create hidden modes. Use named options or separate functions.
- Keep side effects at system boundaries.
- Use composition instead of inheritance.
- Delete dead code instead of commenting it out.

## Naming and readability

- Name things by domain meaning, not implementation accidents.
- Use verbs for actions and nouns for values or entities.
- Avoid unexplained abbreviations.
- Comments should explain why a decision exists, not narrate obvious code.
- Prefer code that does not need comments to explain its mechanics.

## Types and validation

- Keep TypeScript strict.
- Do not use `any` unless integrating with an untyped boundary and the reason is documented.
- Prefer `unknown` at untrusted boundaries and narrow it explicitly.
- Validate external input at the boundary before it enters domain code.
- Model impossible states out of the type system when doing so remains understandable.
- Keep browser-exposed configuration separate from server secrets.

## Architecture and boundaries

- Domain code must remain independent from transport, persistence, UI, and vendor SDKs.
- HTTP handlers translate protocol concerns and call application services.
- Application services implement use cases and depend on interfaces.
- Infrastructure adapters implement database, storage, queue, and external API interfaces.
- UI primitives must not depend on product-specific business logic.
- Cross-package imports must follow the documented dependency direction.
- Avoid circular dependencies.

## Errors

- Never swallow errors silently.
- Return stable, actionable error codes at API boundaries.
- Preserve the original cause when wrapping an error.
- Do not expose secrets, SQL, stack traces, tokens, or internal identifiers to end users.
- Log enough context to diagnose a failure without logging sensitive data.
- Use expected domain errors for expected business outcomes and exceptions for unexpected failures.

## Data and migrations

- Schema changes require reviewed, committed migrations.
- Deployment applies migrations but does not generate them.
- Destructive changes require an explicit rollout and rollback plan.
- Preserve compatibility during rolling deployments when zero downtime is required.
- Use transactions when a use case must succeed or fail atomically.

## Dependencies

- Prefer platform capabilities and existing dependencies before adding a package.
- Every dependency must justify its maintenance, security, and bundle cost.
- Use exact versions and keep the lockfile committed.
- Prefer open standards and replaceable implementations.
- Avoid packages that duplicate a small, clear function that can be maintained safely in the repository.

## UI and CSS

- Use semantic design tokens such as `background`, `foreground`, `primary`, `muted`, `border`, and `destructive`.
- Do not hardcode brand colors inside reusable components.
- Keep primitives accessible, keyboard operable, and visually consistent.
- Prefer native browser behavior when it is accessible and sufficient.
- Respect reduced motion, system theme, zoom, and high contrast needs.
- Keep responsive behavior intentional rather than shrinking desktop layouts blindly.
- Use visual effects sparingly. Hierarchy should come primarily from typography, spacing, contrast, and alignment.

## Security

- Apply least privilege to users, services, containers, and automation tokens.
- Enforce authentication and authorization on the server.
- Never use CORS, hidden UI, or client state as authorization.
- Never commit credentials, keys, certificates, tokens, or production connection strings.
- Redact authorization headers, cookies, passwords, tokens, and secrets from logs.
- Store native credentials only in operating-system secure storage.

## Observability

- Server requests should have a request ID and structured logs.
- Health checks report process liveness.
- Readiness checks verify required dependencies.
- Metrics and traces must not expose sensitive or high-cardinality data.
- Add telemetry that answers an operational question. Do not instrument noise for its own sake.

## Testing

- Test behavior and contracts rather than implementation details.
- Keep unit tests fast and independent from external infrastructure.
- Use real infrastructure for integration behavior that mocks cannot represent faithfully.
- Add regression tests for defects when practical.
- Keep at least one production-like end-to-end path for critical user journeys.
- Do not remove a failing test only to make CI green. Fix the behavior or update the test when the contract intentionally changes.

## Performance

- Measure before optimizing.
- Prefer algorithmic and architectural improvements over micro-optimizations.
- Avoid unnecessary client JavaScript, network requests, database round trips, and large dependency graphs.
- Keep performance-sensitive changes covered by evidence or repeatable benchmarks.

## Review standard

Before considering work complete, verify that:

- the implementation is simpler than the alternatives considered
- names and boundaries communicate intent
- error paths are handled
- security and accessibility were considered
- tests match the risk of the change
- generated files and migrations are current
- documentation and changelog entries are updated when behavior or architecture changed
- `bun run check` and relevant builds pass
