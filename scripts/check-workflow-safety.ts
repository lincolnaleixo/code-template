import { spawnSync } from 'node:child_process'

const requiredWorkflowPaths = [
  '.github/workflows/ci.yml',
  '.github/workflows/preview-images.yml',
  '.github/workflows/release-containers.yml',
  '.github/workflows/release-native.yml',
  '.github/workflows/release-please.yml',
  '.github/workflows/security.yml',
]

function discoverAutomationPaths(): string[] {
  const result = spawnSync(
    'git',
    [
      'ls-files',
      '-z',
      '--',
      ':(glob).github/workflows/*.yml',
      ':(glob).github/workflows/*.yaml',
      ':(glob).github/actions/**/action.yml',
      ':(glob).github/actions/**/action.yaml',
    ],
    { encoding: 'utf8' },
  )

  if (result.status !== 0) {
    const detail = result.stderr?.trim()
    throw new Error(`Unable to enumerate GitHub automation files${detail ? `: ${detail}` : '.'}`)
  }

  return (result.stdout ?? '').split('\0').filter(Boolean).sort()
}

const errors: string[] = []
const automationPaths = discoverAutomationPaths()
const workflows = new Map<string, string>()

for (const path of requiredWorkflowPaths) {
  if (!automationPaths.includes(path)) {
    errors.push(`Required workflow is missing: ${path}`)
  }
}
if (automationPaths.length === 0) {
  errors.push('No GitHub workflow or composite-action files were discovered.')
}

for (const path of automationPaths) {
  workflows.set(path, await Bun.file(path).text())
}

function requireText(path: string, text: string, expected: string, reason: string): void {
  if (!text.includes(expected)) {
    errors.push(`${path}: ${reason}`)
  }
}

function headerBeforeJobs(text: string): string {
  const jobsIndex = text.indexOf('\njobs:')
  return jobsIndex >= 0 ? text.slice(0, jobsIndex) : text
}

function dispatchSection(text: string): string {
  const start = text.indexOf('  workflow_dispatch:')
  if (start < 0) return ''
  const end = text.indexOf('\npermissions:', start)
  return end >= 0 ? text.slice(start, end) : text.slice(start)
}

for (const [path, text] of workflows) {
  if (/\bpull_request_target\s*:/u.test(text)) {
    errors.push(
      `${path}: pull_request_target is forbidden because it can expose privileged context to fork code.`,
    )
  }
  if (/permissions:\s*write-all/u.test(text)) {
    errors.push(`${path}: write-all permissions are forbidden.`)
  }
  if (/\bsecrets:\s*inherit\b/u.test(text)) {
    errors.push(`${path}: reusable workflows must not inherit every repository secret.`)
  }
  if (/continue-on-error:\s*true/u.test(text)) {
    errors.push(`${path}: required security and delivery checks must not continue after errors.`)
  }
  if (/runs-on:\s*(?:self-hosted|\[[^\]\n]*self-hosted)/iu.test(text)) {
    errors.push(`${path}: the public template baseline must use explicit GitHub-hosted runner images.`)
  }

  for (const match of text.matchAll(/^\s*(?:-\s+)?uses:\s+([^\s#]+)/gmu)) {
    const reference = match[1]
    if (!reference || reference.startsWith('./')) continue

    const separator = reference.lastIndexOf('@')
    const revision = separator >= 0 ? reference.slice(separator + 1) : ''
    if (!/^[0-9a-f]{40}$/iu.test(revision)) {
      errors.push(`${path}: external action ${reference} must be pinned to a full commit SHA.`)
    }
  }

  const header = headerBeforeJobs(text)
  if (
    /\b(?:actions|checks|contents|deployments|id-token|issues|packages|pull-requests|security-events|statuses):\s*write\b/u.test(
      header,
    )
  ) {
    errors.push(
      `${path}: workflow-level permissions must remain read-only; grant writes only to the narrow job that needs them.`,
    )
  }
}

const sameRepository = 'github.event.pull_request.head.repo.full_name == github.repository'

const previewPath = '.github/workflows/preview-images.yml'
const preview = workflows.get(previewPath) ?? ''
requireText(
  previewPath,
  preview,
  `if: github.event_name == 'workflow_dispatch' || ${sameRepository}`,
  'preview publication must be limited to same-repository pull requests or explicit manual verification.',
)
requireText(
  previewPath,
  preview,
  'packages: write',
  'the gated preview job must own its package-write permission explicitly.',
)

const ciPath = '.github/workflows/ci.yml'
const ci = workflows.get(ciPath) ?? ''
requireText(
  ciPath,
  ci,
  `if: always() && (github.event_name != 'pull_request' || ${sameRepository})`,
  'browser reports must not be uploaded from fork pull requests.',
)
requireText(
  ciPath,
  ci,
  'fetch-depth: 0',
  'the pull-request history guard must receive complete Git history.',
)
requireText(
  ciPath,
  ci,
  'SECRET_GUARD_BASE: ${{ github.event.pull_request.base.sha }}',
  'the pull-request history guard must start from the exact base SHA.',
)
requireText(
  ciPath,
  ci,
  'SECRET_GUARD_HEAD: ${{ github.event.pull_request.head.sha }}',
  'the pull-request history guard must scan the exact head SHA.',
)
requireText(
  ciPath,
  ci,
  'SECRET_GUARD_BASE: ${{ github.event.before }}',
  'the push history guard must start from the previous main SHA.',
)
requireText(
  ciPath,
  ci,
  'SECRET_GUARD_HEAD: ${{ github.sha }}',
  'the push history guard must scan the pushed SHA.',
)
const historyCommand = 'bun run security:history "$SECRET_GUARD_BASE" "$SECRET_GUARD_HEAD"'
if (ci.split(historyCommand).length - 1 < 2) {
  errors.push(
    `${ciPath}: pull-request and push events must both scan every new commit with the repository secret policy.`,
  )
}

const nativePath = '.github/workflows/release-native.yml'
const native = workflows.get(nativePath) ?? ''
const nativeArtifactGuard = `if: github.event_name != 'pull_request' || ${sameRepository}`
const nativeArtifactGuardCount = native.split(nativeArtifactGuard).length - 1
if (nativeArtifactGuardCount < 3) {
  errors.push(
    `${nativePath}: desktop, Android, and iOS artifact retention must all reject fork pull requests.`,
  )
}
if (/\$\{\{\s*vars\./u.test(native)) {
  errors.push(`${nativePath}: untrusted native pull requests must not read repository variables.`)
}
if (/\bpublish\s*:/u.test(dispatchSection(native))) {
  errors.push(`${nativePath}: workflow_dispatch must not expose a publication input.`)
}
requireText(
  nativePath,
  native,
  'if: inputs.publish == true',
  'release attachment must require internal publication authorization.',
)
requireText(
  nativePath,
  native,
  'gh release view "$RELEASE_TAG"',
  'native publication must require an existing GitHub Release.',
)
requireText(
  nativePath,
  native,
  'test "$(git rev-list -n 1 "$RELEASE_TAG")" = "$(git rev-parse HEAD)"',
  'native publication must verify that the release tag matches the checked-out source.',
)

const containersPath = '.github/workflows/release-containers.yml'
const containers = workflows.get(containersPath) ?? ''
if (/\bpublish\s*:/u.test(dispatchSection(containers))) {
  errors.push(`${containersPath}: workflow_dispatch must not expose a publication input.`)
}
requireText(
  containersPath,
  containers,
  'if: inputs.publish == true',
  'container publication must require internal publication authorization.',
)
requireText(
  containersPath,
  containers,
  'push: false',
  'manual container execution must build without publishing.',
)
requireText(
  containersPath,
  containers,
  'gh release view "$RELEASE_TAG"',
  'container publication must require an existing GitHub Release.',
)
requireText(
  containersPath,
  containers,
  'test "$(git rev-list -n 1 "$RELEASE_TAG")" = "$(git rev-parse HEAD)"',
  'container publication must verify that the release tag matches the checked-out source.',
)

const releasePath = '.github/workflows/release-please.yml'
const release = workflows.get(releasePath) ?? ''
if (/\bworkflow_dispatch\s*:/u.test(release)) {
  errors.push(`${releasePath}: the official release orchestrator must not be manually dispatchable.`)
}
requireText(
  releasePath,
  release,
  'branches: [main]',
  'Release Please must run only after a trusted main push.',
)
requireText(
  releasePath,
  release,
  'secrets.RELEASE_PLEASE_TOKEN',
  'Release Please must use the dedicated automation token.',
)
if (/secrets\.GITHUB_TOKEN|github\.token/u.test(release)) {
  errors.push(`${releasePath}: the release orchestrator must not fall back to the automatic GitHub token.`)
}
const releaseCreatedGuard = "needs.release-please.outputs.release_created == 'true'"
if (release.split(releaseCreatedGuard).length - 1 < 2) {
  errors.push(`${releasePath}: every publisher must require Release Please to report a created release.`)
}
requireText(
  releasePath,
  release,
  'cancel-in-progress: false',
  'official releases must not cancel one another.',
)

const securityPath = '.github/workflows/security.yml'
const security = workflows.get(securityPath) ?? ''
requireText(securityPath, security, 'fetch-depth: 0', 'the secret scan must receive complete Git history.')
requireText(
  securityPath,
  security,
  'Verify Gitleaks safe and secret canaries',
  'Gitleaks must prove both safe and detecting behavior before scanning history.',
)
requireText(
  securityPath,
  security,
  'commits scanned',
  'Gitleaks success must prove that history was actually scanned.',
)

if (errors.length > 0) {
  console.error('Workflow safety validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(
  `Public workflow safety passed for ${automationPaths.length} workflow and composite-action file(s).`,
)
