import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const MAX_OUTPUT_BYTES = 32 * 1024 * 1024
const sourceRoot = process.cwd()
const temporaryRoot = await mkdtemp(join(tmpdir(), 'secret-guard-git-edges-'))
const repositoryRoot = join(temporaryRoot, 'repository')
const stagedGuard = join(sourceRoot, 'scripts', 'check-staged-secrets.ts')
const trackedPolicy = join(sourceRoot, 'scripts', 'check-tracked-secret-policy.ts')
const historyGuard = join(sourceRoot, 'scripts', 'check-history-secrets.ts')

type CommandResult = {
  status: number
  stdout: string
  stderr: string
}

function execute(command: string, args: string[], cwd = repositoryRoot): CommandResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: MAX_OUTPUT_BYTES,
  })
  return {
    status: result.status ?? 2,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

function expectStatus(result: CommandResult, expected: number, label: string): void {
  if (result.status === expected) return
  throw new Error(
    `${label} returned ${result.status}; expected ${expected}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  )
}

function git(args: string[]): string {
  const result = execute('git', args)
  expectStatus(result, 0, `git ${args.join(' ')}`)
  return result.stdout.trim()
}

try {
  await mkdir(repositoryRoot, { recursive: true })
  await symlink(join(sourceRoot, 'node_modules'), join(repositoryRoot, 'node_modules'), 'dir')
  await cp(join(sourceRoot, '.secretlintrc.json'), join(repositoryRoot, '.secretlintrc.json'))
  await cp(join(sourceRoot, '.secretlintignore'), join(repositoryRoot, '.secretlintignore'))

  git(['init', '-b', 'main'])
  git(['config', 'user.name', 'secret-guard-edge-test'])
  git(['config', 'user.email', 'secret-guard-edge-test@example.invalid'])
  await writeFile(join(repositoryRoot, 'safe.txt'), 'safe\n')
  git(['add', 'safe.txt'])
  git(['commit', '-m', 'test: initialize edge-case repository'])

  const pathspecMagicName = ':(glob)a*.bin'
  await writeFile(join(repositoryRoot, pathspecMagicName), new Uint8Array([0, 1, 2, 3]))
  git(['add', '--', `:(literal)${pathspecMagicName}`])
  expectStatus(
    execute(process.execPath, [stagedGuard]),
    1,
    'literal pathspec staged binary scan',
  )
  git(['commit', '--no-verify', '-m', 'test: force pathspec-magic binary into history'])
  expectStatus(
    execute(process.execPath, [trackedPolicy]),
    1,
    'literal pathspec tracked binary policy',
  )
  git(['rm', '--', `:(literal)${pathspecMagicName}`])
  git(['commit', '--no-verify', '-m', 'test: remove pathspec-magic binary'])

  await writeFile(join(repositoryRoot, 'safe-target.txt'), 'safe target\n')
  await symlink('safe-target.txt', join(repositoryRoot, 'type-change.bin'))
  git(['add', 'safe-target.txt', 'type-change.bin'])
  git(['commit', '--no-verify', '-m', 'test: add safe symlink'])
  const beforeTypeChange = git(['rev-parse', 'HEAD'])

  await rm(join(repositoryRoot, 'type-change.bin'))
  await writeFile(join(repositoryRoot, 'type-change.bin'), new Uint8Array([0, 1, 2, 3]))
  git(['add', 'type-change.bin'])
  git(['commit', '--no-verify', '-m', 'test: replace symlink with unsafe binary'])
  await rm(join(repositoryRoot, 'type-change.bin'))
  await symlink('safe-target.txt', join(repositoryRoot, 'type-change.bin'))
  git(['add', 'type-change.bin'])
  git(['commit', '--no-verify', '-m', 'test: restore safe symlink'])
  const afterTypeChange = git(['rev-parse', 'HEAD'])

  expectStatus(
    execute(process.execPath, [historyGuard, beforeTypeChange, afterTypeChange]),
    1,
    'intermediate type-change history scan',
  )

  console.log('Git pathspec-magic and type-change secret-guard regressions passed.')
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
