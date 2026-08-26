import { gitBytes, parseNullSeparated, scanSecretBlob, treeBlobOid } from './secret-guard'

export interface HistorySecretScanResult {
  failed: boolean
  commitCount: number
  scannedBlobCount: number
}

export function scanCommitHistory(
  root: string,
  commits: Iterable<string>,
): HistorySecretScanResult {
  const uniqueCommits = [...new Set(commits)]
  const scannedBlobs = new Set<string>()
  let failed = false

  for (const commit of uniqueCommits) {
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

  return {
    failed,
    commitCount: uniqueCommits.length,
    scannedBlobCount: scannedBlobs.size,
  }
}
