import {
  gitBytes,
  parseNullSeparated,
  repositoryRoot,
  scanSecretBlobPolicy,
  treeBlobOid,
  verifySecretlintCanary,
} from './secret-guard'

const root = repositoryRoot()
verifySecretlintCanary(root)

const trackedPaths = parseNullSeparated(gitBytes(root, ['ls-files', '-z']))
let failed = false
let scannedFiles = 0

for (const path of trackedPaths) {
  const oid = treeBlobOid(root, 'HEAD', path)
  if (!oid) {
    console.error(`Secret policy could not resolve a tracked blob at HEAD: ${path}`)
    failed = true
    continue
  }

  const content = gitBytes(root, ['cat-file', 'blob', oid])
  scannedFiles += 1
  if (!scanSecretBlobPolicy(root, path, content)) {
    failed = true
  }
}

if (failed) {
  console.error('Tracked repository secret policy failed. Remove or narrowly review the blocked material.')
  process.exit(1)
}

console.log(`Tracked repository secret policy passed for ${scannedFiles} file(s).`)
