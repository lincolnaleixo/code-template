# Agent Instructions

1. Read `STATUS.md` first when resuming or planning repository work. It records the current baseline, completed areas, known blockers, and the exact continuation order.
2. Read `RULES.md` before changing code.
3. Read `README.md` and the relevant files in `docs/` before changing architecture, infrastructure, UI, or template capabilities.
4. Use `template.config.ts` as the capability manifest and follow `docs/template-customization.md` when enabling, disabling, replacing, or removing a module.
5. Use Conventional Commits for changes that land on `main`. Release Please derives versions and user-facing release notes from those commits; do not edit release-managed version or changelog files during normal development.
6. Do not claim support for a platform or workflow unless it is validated or the limitation is documented.
7. Run `bun run check` plus the relevant integration, end-to-end, container, or native build before considering the work complete.
8. Do not redo work marked complete in `STATUS.md` unless an executable check proves a concrete defect.
