import { scanCommitHistory } from './git-history-secret-scan'
import { gitText, isZeroOid, repositoryRoot, verifySecretlintCanary } from './secret-guard'

const [baseRevision, headRevision] = process.argv.slice(2)
if (!baseRevision || !headRevision) {
  throw new Error('Usage: bun run security:history <base-revision> <head-revision>')
}

const root = repositoryRoot()
verifySecretlintCanary(root)

const revisionArgs = isZeroOid(baseRevision)
  ? ['rev-list', '--reverse', headRevision]
  : ['rev-list', '--reverse', headRevision, '--not', baseRevision]
const commits = gitText(root, revisionArgs).split(/\r?\n/u).filter(Boolean)
const result = scanCommitHistory(root, commits)

if (result.failed) {
  console.error(
    'History secret guard failed: reachable commits contain a secret, credential path, or unsafe binary.',
  )
  process.exit(1)
}

console.log(
  `History secret guard passed for ${result.commitCount} commit(s) and ${result.scannedBlobCount} changed blob(s).`,
)
