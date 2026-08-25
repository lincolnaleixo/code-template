const apiVersion = '2026-03-10'
const args = process.argv.slice(2)
const apply = args.includes('--apply')

function option(name: string): string | undefined {
  const prefix = `--${name}=`
  return args.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)
}

const repository = option('repository') ?? process.env.GITHUB_REPOSITORY ?? 'matrix-hq/code-template'
const description =
  option('description') ??
  process.env.REPOSITORY_DESCRIPTION ??
  'TypeScript-first self-hostable product template for web, API, mobile and desktop.'
const topics = (
  option('topics') ??
  process.env.REPOSITORY_TOPICS ??
  'typescript,bun,react,tanstack,elysia,postgresql,capacitor,tauri,self-hosted,template'
)
  .split(',')
  .map((topic) => topic.trim().toLowerCase())
  .filter(Boolean)
const requestedVisibility = option('visibility')
const confirmedVisibility = option('confirm-visibility')
const token = process.env.GITHUB_ADMIN_TOKEN ?? process.env.GH_TOKEN

if (!repository.includes('/')) {
  throw new Error('--repository must use owner/name format.')
}

if (description.length > 350) {
  throw new Error('Repository description must contain at most 350 characters.')
}

for (const topic of topics) {
  if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(topic)) {
    throw new Error(`Invalid repository topic: ${topic}`)
  }
}

const allowedVisibilities = ['public', 'private', 'internal'] as const
type RepositoryVisibility = (typeof allowedVisibilities)[number]

let visibility: RepositoryVisibility | undefined
if (requestedVisibility !== undefined) {
  if (!allowedVisibilities.includes(requestedVisibility as RepositoryVisibility)) {
    throw new Error('--visibility must be public, private, or internal.')
  }
  visibility = requestedVisibility as RepositoryVisibility
}

if (apply && visibility && confirmedVisibility !== visibility) {
  throw new Error(`Visibility changes require --confirm-visibility=${visibility} in the same command.`)
}

const repositoryPayload: { description: string; visibility?: RepositoryVisibility } = {
  description,
}
if (visibility) repositoryPayload.visibility = visibility

const topicsPayload = { names: [...new Set(topics)].slice(0, 20) }

console.log(`Repository: ${repository}`)
console.log(`Mode: ${apply ? 'apply' : 'dry-run'}`)
console.log('Repository payload:')
console.log(JSON.stringify(repositoryPayload, null, 2))
console.log('Topics payload:')
console.log(JSON.stringify(topicsPayload, null, 2))

if (!apply) {
  console.log('\nNo GitHub settings were changed. Re-run with --apply and GITHUB_ADMIN_TOKEN.')
  if (visibility) {
    console.log(`An apply run must also include --confirm-visibility=${visibility}.`)
  }
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

const repositoryResponse = await fetch(`https://api.github.com/repos/${repository}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify(repositoryPayload),
})

if (!repositoryResponse.ok) {
  const body = await repositoryResponse.text()
  throw new Error(`GitHub repository update failed with HTTP ${repositoryResponse.status}: ${body}`)
}

const topicsResponse = await fetch(`https://api.github.com/repos/${repository}/topics`, {
  method: 'PUT',
  headers,
  body: JSON.stringify(topicsPayload),
})

if (!topicsResponse.ok) {
  const body = await topicsResponse.text()
  throw new Error(`GitHub topics update failed with HTTP ${topicsResponse.status}: ${body}`)
}

console.log(
  visibility
    ? `Repository description, topics, and visibility=${visibility} applied.`
    : 'Repository description and topics applied.',
)
