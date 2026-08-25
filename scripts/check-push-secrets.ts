import {
  gitBytes,
  gitText,
  isZeroOid,
  parseNullSeparated,
  repositoryRoot,
  scanSecretBlob,
  verifySecretlintCanary,
} from './secret-guard'

const root = repositoryRoot()
const remoteName = process.argv[2] ?? ''
const input = await Bun.stdin.text()
const refUpdates = input
  .split(/\r?\n/u)
  .filter(Boolean)
  .map((line) => line.trim().split(/\s+/u))
  .filter((fields) => fields.length === 4)

if (refUpdates.length === 0) {
  console.log('Secret guard: no pushed refs to scan.')
  process.exit(0)
}

const configuredRemotes = new Set(
  gitText(root, ['remote'])
    .split(/\r?\n/u)
    .filter(Boolean),
)
const commits = new Set<string>()
const tagObjects = new Set<string>()

for (const [, localOid, , remoteOid] of refUpdates) {
  if (!localOid || !remoteOid || isZeroOid(localOid)) {
    continue
  }

  const objectType = gitText(root, ['cat-file', '-t', localOid]).trim()
  if (objectType === 'tag') {
    tagObjects.add(localOid)
  }

  const revisionArgs = isZeroOid(remoteOid)
    ? configuredRemotes.has(remoteName)
      ? ['rev-list', '--reverse', localOid, '--not', `--remotes=${remoteName}`]
      : ['rev-list', '--reverse', localOid]
    : ['rev-list', '--reverse', `${remoteOid}..${localOid}`]

  for (const commit of gitText(root, revisionArgs).split(/\r?\n/u).filter(Boolean)) {
    commits.add(commit)
  }
}

if (commits.size === 0 && tagObjects.size === 0) {
  console.log('Secret guard: the remote already contains every pushed commit.')
  process.exit(0)
}

verifySecretlintCanary(root)

let failed = false
for (const tagOid of tagObjects) {
  const tagContent = gitBytes(root, ['cat-file', '-p', tagOid])
  if (!scanSecretBlob(root, `annotated-tag-${tagOid.slice(0, 12)}.txt`, tagContent)) {
    failed = true
  }
}

const scannedBlobs = new Set<string>()
let scannedCommits = 0
let scannedFiles = 0
for (const commit of commits) {
  scannedCommits += 1
  const commitMessage = gitBytes(root, ['show', '-s', '--format=%B', commit])
  if (!scanSecretBlob(root, `commit-message-${commit.slice(0, 12)}.txt`, commitMessage)) {
    failed = true
  }

  const changedPaths = new Set(
    parseNullSeparated(
      gitBytes(root, [
        'diff-tree',
        '--root',
        '-m',
        '--no-commit-id',
        '--name-only',
        '--diff-filter=ACMR',
        '-r',
        '-z',
        commit,
      ]),
    ),
  )

  for (const path of changedPaths) {
    const objectSpec = `${commit}:${path}`
    const objectType = gitText(root, ['cat-file', '-t', objectSpec]).trim()
    if (objectType !== 'blob') {
      continue
    }

    const blobOid = gitText(root, ['rev-parse', objectSpec]).trim()
    if (scannedBlobs.has(blobOid)) {
      continue
    }
    scannedBlobs.add(blobOid)
    scannedFiles += 1

    const content = gitBytes(root, ['cat-file', 'blob', objectSpec])
    if (!scanSecretBlob(root, path, content)) {
      failed = true
    }
  }
}

if (failed) {
  console.error(
    'Secret guard blocked the push. Rewrite the affected commits so the sensitive material never reaches the remote.',
  )
  process.exit(1)
}

console.log(
  `Secret guard passed for ${scannedCommits} outgoing commit(s) and ${scannedFiles} unique changed blob(s).`,
)
