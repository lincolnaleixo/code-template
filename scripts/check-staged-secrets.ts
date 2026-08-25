import {
  gitBytes,
  parseNullSeparated,
  repositoryRoot,
  scanSecretBlob,
  stagedBlobOid,
  verifySecretlintCanary,
} from './secret-guard'

const root = repositoryRoot()
const stagedPaths = parseNullSeparated(
  gitBytes(root, ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']),
)

if (stagedPaths.length === 0) {
  console.log('Secret guard: no staged files to scan.')
  process.exit(0)
}

verifySecretlintCanary(root)

let scannedFiles = 0
let failed = false
for (const path of stagedPaths) {
  const blobOid = stagedBlobOid(root, path)
  const content = gitBytes(root, ['cat-file', 'blob', blobOid])
  scannedFiles += 1
  if (!scanSecretBlob(root, path, content)) {
    failed = true
  }
}

if (failed) {
  console.error('Secret guard blocked the commit. Remove the sensitive material and stage the safe content.')
  process.exit(1)
}

console.log(`Secret guard passed for ${scannedFiles} staged file(s).`)
