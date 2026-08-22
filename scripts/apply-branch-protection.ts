const apiVersion = '2026-03-10'
const args = process.argv.slice(2)
const apply = args.includes('--apply')

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

const repository = option('repository') ?? process.env.GITHUB_REPOSITORY ?? 'matrix-hq/code-template'
const branch = option('branch') ?? process.env.BRANCH_NAME ?? 'main'
const approvals = integerOption('approvals', 1)
const requiredChecks = (option('checks') ?? process.env.BRANCH_REQUIRED_CHECKS ?? '')
  .split(',')
  .map((check) => check.trim())
  .filter(Boolean)
const token = process.env.GITHUB_ADMIN_TOKEN ?? process.env.GH_TOKEN

if (!repository.includes('/')) {
  throw new Error('--repository must use owner/name format.')
}

const protection = {
  required_status_checks:
    requiredChecks.length > 0
      ? {
          strict: true,
          contexts: requiredChecks,
        }
      : null,
  enforce_admins: true,
  required_pull_request_reviews: {
    dismiss_stale_reviews: true,
    require_code_owner_reviews: true,
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

console.log(`Repository: ${repository}`)
console.log(`Branch: ${branch}`)
console.log(`Mode: ${apply ? 'apply' : 'dry-run'}`)
console.log(JSON.stringify(protection, null, 2))

if (!apply) {
  console.log('\nNo GitHub settings were changed. Re-run with --apply and GITHUB_ADMIN_TOKEN.')
  process.exit(0)
}

if (!token) {
  throw new Error('GITHUB_ADMIN_TOKEN or GH_TOKEN is required with --apply.')
}

const response = await fetch(
  `https://api.github.com/repos/${repository}/branches/${encodeURIComponent(branch)}/protection`,
  {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': apiVersion,
    },
    body: JSON.stringify(protection),
  },
)

if (!response.ok) {
  const body = await response.text()
  throw new Error(`GitHub branch protection update failed with HTTP ${response.status}: ${body}`)
}

const result = (await response.json()) as { url?: string }
console.log(`Branch protection applied${result.url ? `: ${result.url}` : '.'}`)
