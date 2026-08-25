import {
  gitBytes,
  gitText,
  isZeroOid,
  parseNullSeparated,
  repositoryRoot,
  scanSecretBlob,
  treeBlobOid,
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

  const objectType = gitText(root, ['cat-file', '-t', localOid])
  if (objectType === 'tag') {
    annotatedTags.add(localOid)
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
const scannedBlobs = new Set<string>()

for (const tagOid of annotatedTags) {
  const tagContent = gitBytes(root, ['cat-file', 'tag', tagOid])
  if (!scanSecretBlob(root, `.git-tag-${tagOid}.txt`, tagContent)) {
    failed = true
  }
}

for (const commit of commits) {
  const commitMessage = gitBytes(root, ['show', '-s', '--format=%B', commit])
  if (!scanSecretBlob(root, `.git-commit-message-${commit}.txt`, commitMessage)) {
    failed = true
  }

  const changedPaths = new Set(
    parseNullSeparated(
      gitBytes(root, [
        'diff-tree',
        '--root',
        '--no-commit-id',
        '--name-only',
        '-r',
        '-m',
        '-z',
        '--diff-filter=ACMR',
        commit,
      ]),
    ),
  )

  for (const path of changedPaths) {
    const oid = treeBlobOid(root, commit, path)
    if (!oid) {
      continue
    }
    const blobKey = `${oid}\0${path}`
    if (scannedBlobs.has(blobKey)) {
      continue
    }
    scannedBlobs.add(blobKey)
    const content = gitBytes(root, ['cat-file', 'blob', oid])
    if (!scanSecretBlob(root, path, content)) {
      failed = true
    }
  }
}

if (failed) {
  console.error('Push blocked: outgoing history contains a secret, credential path, or unsafe binary.')
  console.error('Remove the material from every affected commit, rotate any live credential, then retry.')
  process.exit(1)
}

console.log(
  `Pre-push secret guard passed for ${commits.size} outgoing commit(s), ${annotatedTags.size} annotated tag(s), and ${scannedBlobs.size} changed blob(s).`,
)
