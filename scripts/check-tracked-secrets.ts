import { spawnSync } from 'node:child_process'
import { gitBytes, parseNullSeparated, repositoryRoot, verifySecretlintCanary } from './secret-guard'

const MAX_OUTPUT_BYTES = 32 * 1024 * 1024
const MAX_ARGUMENT_CHARACTERS = 16_000
const root = repositoryRoot()

verifySecretlintCanary(root)

const trackedPaths = parseNullSeparated(gitBytes(root, ['ls-files', '-z']))
if (trackedPaths.length === 0) {
  throw new Error('Tracked secret scan found no Git-tracked files.')
}

function createChunks(paths: string[]): string[][] {
  const chunks: string[][] = []
  let current: string[] = []
  let currentCharacters = 0

  for (const path of paths) {
    const nextCharacters = currentCharacters + path.length + 1
    if (current.length > 0 && nextCharacters > MAX_ARGUMENT_CHARACTERS) {
      chunks.push(current)
      current = []
      currentCharacters = 0
    }
    current.push(path)
    currentCharacters += path.length + 1
  }

  if (current.length > 0) {
    chunks.push(current)
  }
  return chunks
}

let scannedFiles = 0
for (const paths of createChunks(trackedPaths)) {
  const result = spawnSync(
    process.execPath,
    [
      'x',
      'secretlint',
      '--secretlintrc',
      '.secretlintrc.json',
      '--secretlintignore',
      '.secretlintignore',
      '--no-color',
      '--no-terminalLink',
      '--no-glob',
      '--no-gitignore',
      '--',
      ...paths,
    ],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: MAX_OUTPUT_BYTES,
    },
  )

  if (result.stdout) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }

  const status = result.status ?? 2
  if (status === 1) {
    console.error('Tracked secret scan found sensitive material.')
    process.exit(1)
  }
  if (status !== 0) {
    throw new Error(
      `Secretlint failed while scanning tracked files with exit code ${status}${result.error ? `: ${result.error.message}` : ''}.`,
    )
  }

  scannedFiles += paths.length
}

console.log(`Secretlint passed for ${scannedFiles} Git-tracked file(s), including ignored paths.`)
