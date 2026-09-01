import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { YAML } from 'bun'
import { templateFeatures } from '../template.config'

type YamlRecord = Record<string, unknown>

const requiredWorkflowPaths = [
  '.github/workflows/ci.yml',
  '.github/workflows/release-please.yml',
  '.github/workflows/security.yml',
  ...(templateFeatures.docker ? ['.github/workflows/preview-images.yml'] : []),
  ...(templateFeatures.containerReleases ? ['.github/workflows/release-containers.yml'] : []),
  ...(templateFeatures.nativeReleases ? ['.github/workflows/release-native.yml'] : []),
]

function discoverAutomationPaths(): string[] {
  const result = spawnSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
      '--',
      ':(glob).github/workflows/*.yml',
      ':(glob).github/workflows/*.yaml',
      ':(glob)**/action.yml',
      ':(glob)**/action.yaml',
    ],
    { encoding: 'utf8' },
  )

  if (result.status !== 0) {
    const detail = result.stderr?.trim()
    throw new Error(`Unable to enumerate GitHub automation files${detail ? `: ${detail}` : '.'}`)
  }

  return [
    ...new Set(
      (result.stdout ?? '')
        .split('\0')
        .filter(Boolean)
        .filter((path) => existsSync(path)),
    ),
  ].sort()
}

function isRecord(value: unknown): value is YamlRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function visitYaml(
  value: unknown,
  visitor: (key: string, child: unknown) => void,
  visited = new WeakSet<object>(),
): void {
  if (typeof value !== 'object' || value === null) return
  if (visited.has(value)) return
  visited.add(value)

  if (Array.isArray(value)) {
    for (const child of value) visitYaml(child, visitor, visited)
    return
  }

  for (const [key, child] of Object.entries(value)) {
    visitor(key, child)
    visitYaml(child, visitor, visited)
  }
}

function hasOwn(record: YamlRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function triggerConfiguration(root: YamlRecord, trigger: string): unknown {
  const on = root.on
  if (typeof on === 'string') return on === trigger ? true : undefined
  if (Array.isArray(on)) return on.includes(trigger) ? true : undefined
  if (!isRecord(on)) return undefined
  return hasOwn(on, trigger) ? on[trigger] : undefined
}

function hasTrigger(root: YamlRecord, trigger: string): boolean {
  return triggerConfiguration(root, trigger) !== undefined
}

function hasWorkflowDispatchPublishInput(root: YamlRecord): boolean {
  const dispatch = triggerConfiguration(root, 'workflow_dispatch')
  if (!isRecord(dispatch)) return false
  const inputs = dispatch.inputs
  return isRecord(inputs) && hasOwn(inputs, 'publish')
}

function referencesSelfHosted(value: unknown): boolean {
  if (typeof value === 'string') return value.toLowerCase() === 'self-hosted'
  return Array.isArray(value) && value.some((entry) => referencesSelfHosted(entry))
}

function validatesExternalActionReference(reference: string): boolean {
  if (reference.startsWith('./')) return true
  const separator = reference.lastIndexOf('@')
  const revision = separator >= 0 ? reference.slice(separator + 1) : ''
  return /^[0-9a-f]{40}$/iu.test(revision)
}

const errors: string[] = []
const automationPaths = discoverAutomationPaths()
const workflows = new Map<string, string>()
const documents = new Map<string, YamlRecord>()

for (const path of requiredWorkflowPaths) {
  if (!automationPaths.includes(path)) {
    errors.push(`Required workflow is missing: ${path}`)
  }
}
if (automationPaths.length === 0) {
  errors.push('No GitHub workflow or composite-action files were discovered.')
}

for (const path of automationPaths) {
  const text = await Bun.file(path).text()
  workflows.set(path, text)

  try {
    const parsed = YAML.parse(text)
    if (!isRecord(parsed)) {
      errors.push(`${path}: GitHub automation YAML must contain one top-level mapping.`)
      continue
    }
    documents.set(path, parsed)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    errors.push(`${path}: invalid YAML: ${detail}`)
  }
}

function requireText(path: string, text: string, expected: string, reason: string): void {
  if (!text.includes(expected)) {
    errors.push(`${path}: ${reason}`)
  }
}

for (const [path, document] of documents) {
  const actionReferences = new Set<string>()
  let pullRequestTarget = false
  let writeAll = false
  let inheritsSecrets = false
  let continuesOnError = false
  let selfHosted = false

  visitYaml(document, (key, value) => {
    if (key === 'pull_request_target') pullRequestTarget = true
    if (key === 'permissions' && value === 'write-all') writeAll = true
    if (key === 'secrets' && value === 'inherit') inheritsSecrets = true
    if (key === 'continue-on-error' && value === true) continuesOnError = true
    if (key === 'runs-on' && referencesSelfHosted(value)) selfHosted = true
    if (key === 'uses') {
      if (typeof value === 'string') actionReferences.add(value)
      else errors.push(`${path}: every uses value must be a string.`)
    }
  })

  if (pullRequestTarget) {
    errors.push(
      `${path}: pull_request_target is forbidden because it can expose privileged context to fork code.`,
    )
  }
  if (writeAll) errors.push(`${path}: write-all permissions are forbidden.`)
  if (inheritsSecrets) {
    errors.push(`${path}: reusable workflows must not inherit every repository secret.`)
  }
  if (continuesOnError) {
    errors.push(`${path}: required security and delivery checks must not continue after errors.`)
  }
  if (selfHosted) {
    errors.push(`${path}: the public template baseline must use explicit GitHub-hosted runner images.`)
  }

  for (const reference of actionReferences) {
    if (!validatesExternalActionReference(reference)) {
      errors.push(`${path}: external action ${reference} must be pinned to a full commit SHA.`)
    }
  }

  const workflowPermissions = document.permissions
  if (isRecord(workflowPermissions)) {
    const writablePermission = Object.entries(workflowPermissions).find(([, value]) => value === 'write')
    if (writablePermission) {
      errors.push(
        `${path}: workflow-level permission ${writablePermission[0]} must remain read-only; grant writes only to the narrow job that needs them.`,
      )
    }
  }
}

const sameRepository = 'github.event.pull_request.head.repo.full_name == github.repository'

const previewPath = '.github/workflows/preview-images.yml'
if (templateFeatures.docker) {
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
}

const ciPath = '.github/workflows/ci.yml'
const ci = workflows.get(ciPath) ?? ''
if (templateFeatures.endToEndTests) {
  requireText(
    ciPath,
    ci,
    `if: always() && (github.event_name != 'pull_request' || ${sameRepository})`,
    'browser reports must not be uploaded from fork pull requests.',
  )
}

const nativePath = '.github/workflows/release-native.yml'
if (templateFeatures.nativeReleases) {
  const native = workflows.get(nativePath) ?? ''
  const nativeDocument = documents.get(nativePath)
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
  if (nativeDocument && hasWorkflowDispatchPublishInput(nativeDocument)) {
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
}

const containersPath = '.github/workflows/release-containers.yml'
if (templateFeatures.containerReleases) {
  const containers = workflows.get(containersPath) ?? ''
  const containersDocument = documents.get(containersPath)
  if (containersDocument && hasWorkflowDispatchPublishInput(containersDocument)) {
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
}

const releasePath = '.github/workflows/release-please.yml'
const release = workflows.get(releasePath) ?? ''
const releaseDocument = documents.get(releasePath)
if (releaseDocument && hasTrigger(releaseDocument, 'workflow_dispatch')) {
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
const expectedPublisherCount =
  Number(templateFeatures.containerReleases) + Number(templateFeatures.nativeReleases)
const releaseCreatedGuardCount = release.split(releaseCreatedGuard).length - 1
if (releaseCreatedGuardCount < expectedPublisherCount) {
  errors.push(
    `${releasePath}: every enabled publisher must require Release Please to report a created release.`,
  )
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
