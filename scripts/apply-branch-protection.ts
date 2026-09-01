const apiVersion = '2026-03-10'
const args = process.argv.slice(2)
const apply = args.includes('--apply')

interface ExistingProtection {
  required_status_checks?: {
    checks?: { context?: string }[]
    contexts?: string[]
    strict?: boolean
  } | null
}

interface RequiredStatusChecks {
  contexts: string[]
  strict: boolean
}

function option(name: string): string | undefined {
  const prefix = `--${name}=`
  return args.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)
}

function integerOption(name: string, fallback: number): number {
  const rawValue = option(name)
  if (!rawValue) return fallback

  const value = Number(rawValue)
  if (!Number.isInteger(value) || value < 0 || value > 6) {
    throw new Error(`--${name} must be an integer between 0 and 6.`)
  }

  return value
}

function booleanOption(name: string, fallback: boolean): boolean {
  const rawValue = option(name)
  if (rawValue === undefined) return fallback
  if (rawValue === 'true') return true
  if (rawValue === 'false') return false
  throw new Error(`--${name} must be true or false.`)
}

function parseChecks(value: string | undefined): string[] {
  return (value ?? '')
    .split('|')
    .map((check) => check.trim())
    .filter(Boolean)
}

const repository = option('repository') ?? process.env.GITHUB_REPOSITORY ?? 'lincolnaleixo/code-template'
const branch = option('branch') ?? process.env.BRANCH_NAME ?? 'main'
const approvals = integerOption('approvals', 0)
const requireCodeOwnerReview = booleanOption(
  'code-owner-review',
  process.env.REQUIRE_CODE_OWNER_REVIEW === 'true',
)
const clearChecks = booleanOption('clear-checks', false)
const checksInput = option('checks') ?? process.env.BRANCH_REQUIRED_CHECKS
const configuredChecks = parseChecks(checksInput)
const replaceChecks = configuredChecks.length > 0
const token = process.env.GITHUB_ADMIN_TOKEN ?? process.env.GH_TOKEN

if (!repository.includes('/')) {
  throw new Error('--repository must use owner/name format.')
}

if (clearChecks && replaceChecks) {
  throw new Error('--clear-checks=true cannot be combined with --checks.')
}

function createProtection(requiredStatusChecks: RequiredStatusChecks | null) {
  return {
    required_status_checks: requiredStatusChecks,
    enforce_admins: true,
    required_pull_request_reviews: {
      dismiss_stale_reviews: approvals > 0 || requireCodeOwnerReview,
      require_code_owner_reviews: requireCodeOwnerReview,
      required_approving_review_count: approvals,
      require_last_push_approval: false,
    },
    restrictions: null,
    required_linear_history: false,
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: true,
    lock_branch: false,
    allow_fork_syncing: false,
  }
}

const configuredStatusChecks = replaceChecks ? { strict: true, contexts: configuredChecks } : null
const preview = createProtection(configuredStatusChecks)

console.log(`Repository: ${repository}`)
console.log(`Branch: ${branch}`)
console.log(`Mode: ${apply ? 'apply' : 'dry-run'}`)
if (!replaceChecks && !clearChecks) {
  console.log('Required checks: preserve the current GitHub configuration when applied')
}
console.log(JSON.stringify(preview, null, 2))

if (!apply) {
  console.log('\nNo GitHub settings were changed. Re-run with --apply and GITHUB_ADMIN_TOKEN.')
  process.exit(0)
}

if (!token) {
  throw new Error('GITHUB_ADMIN_TOKEN or GH_TOKEN is required with --apply.')
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': apiVersion,
}

let requiredStatusChecks = configuredStatusChecks

if (!replaceChecks && !clearChecks) {
  const existingResponse = await fetch(
    `https://api.github.com/repos/${repository}/branches/${encodeURIComponent(branch)}/protection`,
    { headers },
  )

  if (existingResponse.ok) {
    const existing = (await existingResponse.json()) as ExistingProtection
    const contexts = [
      ...(existing.required_status_checks?.contexts ?? []),
      ...(existing.required_status_checks?.checks ?? []).flatMap((check) =>
        check.context ? [check.context] : [],
      ),
    ]

    const uniqueContexts = [...new Set(contexts)]
    requiredStatusChecks =
      uniqueContexts.length > 0
        ? {
            strict: existing.required_status_checks?.strict ?? true,
            contexts: uniqueContexts,
          }
        : null
  } else if (existingResponse.status === 404) {
    requiredStatusChecks = null
  } else {
    const body = await existingResponse.text()
    throw new Error(`Unable to read existing branch protection, HTTP ${existingResponse.status}: ${body}`)
  }
}

const protection = createProtection(clearChecks ? null : requiredStatusChecks)
const response = await fetch(
  `https://api.github.com/repos/${repository}/branches/${encodeURIComponent(branch)}/protection`,
  {
    method: 'PUT',
    headers,
    body: JSON.stringify(protection),
  },
)

if (!response.ok) {
  const body = await response.text()
  throw new Error(`GitHub branch protection update failed with HTTP ${response.status}: ${body}`)
}

const result = (await response.json()) as { url?: string }
console.log(`Branch protection applied${result.url ? `: ${result.url}` : '.'}`)
