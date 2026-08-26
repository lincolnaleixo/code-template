import { scanCommitHistory } from './git-history-secret-scan'
import {
  annotatedTagChain,
  gitBytes,
  gitText,
  isZeroOid,
  repositoryRoot,
  scanSecretBlob,
  verifySecretlintCanary,
} from './secret-guard'

const root = repositoryRoot()
verifySecretlintCanary(root)

const remoteName = process.argv[2] ?? ''
const input = await Bun.stdin.text()
const refUpdates = input
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.split(/\s+/u))
  .filter((fields): fields is [string, string, string, string] => fields.length === 4)

if (refUpdates.length === 0) {
  console.log('No ref updates supplied to the pre-push secret guard.')
  process.exit(0)
}

const configuredRemotes = new Set(
  gitText(root, ['remote'])
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter(Boolean),
)
const commits = new Set<string>()
const annotatedTags = new Set<string>()

for (const [, localOid] of refUpdates) {
  if (isZeroOid(localOid)) {
    continue
  }

  for (const tagOid of annotatedTagChain(root, localOid)) {
    annotatedTags.add(tagOid)
  }

  const revisionArgs = configuredRemotes.has(remoteName)
    ? ['rev-list', '--reverse', localOid, '--not', `--remotes=${remoteName}`]
    : ['rev-list', '--reverse', localOid]

  const revisions = gitText(root, revisionArgs)
  for (const commit of revisions.split(/\r?\n/u).filter(Boolean)) {
    commits.add(commit)
  }
}

let failed = false

for (const tagOid of annotatedTags) {
  const tagContent = gitBytes(root, ['cat-file', 'tag', tagOid])
  if (!scanSecretBlob(root, `.git-tag-${tagOid}.txt`, tagContent)) {
    failed = true
  }
}

const historyResult = scanCommitHistory(root, commits)
if (historyResult.failed) {
  failed = true
}

if (failed) {
  console.error('Push blocked: outgoing history contains a secret, credential path, or unsafe binary.')
  console.error('Remove the material from every affected commit, rotate any live credential, then retry.')
  process.exit(1)
}

console.log(
  `Pre-push secret guard passed for ${historyResult.commitCount} outgoing commit(s), ${annotatedTags.size} annotated tag(s), and ${historyResult.scannedBlobCount} changed blob(s).`,
)
