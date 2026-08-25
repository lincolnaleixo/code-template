import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const MAX_OUTPUT_BYTES = 32 * 1024 * 1024
const sourceRoot = process.cwd()
const temporaryRoot = await mkdtemp(join(tmpdir(), 'matrix-secret-guards-'))
const repositoryRoot = join(temporaryRoot, 'repository')
const remoteRoot = join(temporaryRoot, 'remote.git')
const commitMessageGuard = join(sourceRoot, 'scripts', 'check-commit-message-secrets.ts')
const stagedGuard = join(sourceRoot, 'scripts', 'check-staged-secrets.ts')
const pushGuard = join(sourceRoot, 'scripts', 'check-push-secrets.ts')
const trackedGuard = join(sourceRoot, 'scripts', 'check-tracked-secrets.ts')
const encoder = new TextEncoder()

type CommandResult = {
  status: number
  stdout: string
  stderr: string
}

function execute(command: string, args: string[], cwd: string, input?: string): CommandResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    input,
    maxBuffer: MAX_OUTPUT_BYTES,
  })

  return {
    status: result.status ?? 2,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

function expectStatus(result: CommandResult, expected: number, label: string): void {
  if (result.status === expected) {
    return
  }

  throw new Error(
    `${label} returned ${result.status}; expected ${expected}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  )
}

function git(args: string[], cwd = repositoryRoot): string {
  const result = execute('git', args, cwd)
  expectStatus(result, 0, `git ${args.join(' ')}`)
  return result.stdout.trim()
}

function canarySecret(): string {
  return `token = "ghp_${'7Qm4vZ2xN9cR'}${'6sT8uW3yA5bD'}${'1eF0gHkJpLqM'}"\n`
}

function prePushInput(localOid: string, remoteOid: string): string {
  return `refs/heads/main ${localOid} refs/heads/main ${remoteOid}\n`
}

try {
  const hooksPathResult = execute('git', ['config', '--get', 'core.hooksPath'], sourceRoot)
  expectStatus(hooksPathResult, 0, 'Husky hooks path lookup')
  if (hooksPathResult.stdout.trim() !== '.husky/_') {
    throw new Error(`Husky configured an unexpected hooks path: ${hooksPathResult.stdout.trim()}`)
  }
  for (const hook of ['commit-msg', 'pre-commit', 'pre-push']) {
    if (!existsSync(join(sourceRoot, '.husky', '_', hook))) {
      throw new Error(`Husky did not install the ${hook} wrapper.`)
    }
  }

  await mkdir(repositoryRoot, { recursive: true })
  await symlink(join(sourceRoot, 'node_modules'), join(repositoryRoot, 'node_modules'), 'dir')
  await cp(join(sourceRoot, '.secretlintrc.json'), join(repositoryRoot, '.secretlintrc.json'))
  await cp(join(sourceRoot, '.secretlintignore'), join(repositoryRoot, '.secretlintignore'))

  git(['init', '-b', 'main'])
  git(['config', 'user.name', 'secret-guard-test'])
  git(['config', 'user.email', 'secret-guard-test@example.invalid'])
  await writeFile(join(repositoryRoot, 'README.md'), '# Secret guard test\n')
  git(['add', 'README.md'])
  git(['commit', '-m', 'chore: initialize secret guard test'])

  await writeFile(join(repositoryRoot, '.gitignore'), 'ignored-secret.txt\n')
  git(['add', '.gitignore'])
  git(['commit', '-m', 'test: add ignored tracked-file fixture'])
  await writeFile(join(repositoryRoot, 'ignored-secret.txt'), canarySecret())
  git(['add', '--force', 'ignored-secret.txt'])
  expectStatus(
    execute(process.execPath, [trackedGuard], repositoryRoot),
    1,
    'force-tracked ignored secret scan',
  )
  git(['rm', '--cached', '--force', 'ignored-secret.txt'])
  await rm(join(repositoryRoot, 'ignored-secret.txt'))

  git(['init', '--bare', remoteRoot], temporaryRoot)
  git(['remote', 'add', 'origin', remoteRoot])
  git(['push', '--set-upstream', 'origin', 'main'])
  const remoteOid = git(['rev-parse', 'refs/remotes/origin/main'])

  const commitMessagePath = join(repositoryRoot, '.git', 'COMMIT_EDITMSG')
  await writeFile(commitMessagePath, 'fix: keep the commit message safe\n')
  expectStatus(
    execute(process.execPath, [commitMessageGuard, commitMessagePath], repositoryRoot),
    0,
    'safe commit-message scan',
  )
  await writeFile(commitMessagePath, canarySecret())
  expectStatus(
    execute(process.execPath, [commitMessageGuard, commitMessagePath], repositoryRoot),
    1,
    'secret commit-message scan',
  )
  await writeFile(commitMessagePath, `fix: safe subject\n\n# ${canarySecret()}`)
  expectStatus(
    execute(process.execPath, [commitMessageGuard, commitMessagePath], repositoryRoot),
    1,
    'comment-prefixed secret commit-message scan',
  )

  const partialPath = join(repositoryRoot, 'partial.txt')
  await writeFile(partialPath, 'safe staged content\n')
  git(['add', 'partial.txt'])
  await writeFile(partialPath, canarySecret())
  expectStatus(execute(process.execPath, [stagedGuard], repositoryRoot), 0, 'staged-index-only scan')

  git(['add', 'partial.txt'])
  expectStatus(execute(process.execPath, [stagedGuard], repositoryRoot), 1, 'staged secret scan')
  await writeFile(partialPath, 'safe staged content\n')
  git(['add', 'partial.txt'])
  git(['commit', '-m', 'test: keep only safe staged content'])

  await writeFile(join(repositoryRoot, '.env'), 'PUBLIC_VALUE=example\n')
  git(['add', '.env'])
  expectStatus(execute(process.execPath, [stagedGuard], repositoryRoot), 1, 'forbidden .env path scan')
  git(['rm', '--cached', '.env'])
  await rm(join(repositoryRoot, '.env'))

  await writeFile(join(repositoryRoot, 'payload.bin'), new Uint8Array([0, 1, 2, 3]))
  git(['add', 'payload.bin'])
  expectStatus(execute(process.execPath, [stagedGuard], repositoryRoot), 1, 'unreviewed binary scan')
  git(['rm', '--cached', 'payload.bin'])
  await rm(join(repositoryRoot, 'payload.bin'))

  await writeFile(join(repositoryRoot, 'spoofed.png'), new Uint8Array([0, 1, 2, 3]))
  git(['add', 'spoofed.png'])
  expectStatus(
    execute(process.execPath, [stagedGuard], repositoryRoot),
    1,
    'spoofed reviewed binary extension scan',
  )
  git(['rm', '--cached', 'spoofed.png'])
  await rm(join(repositoryRoot, 'spoofed.png'))

  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  await writeFile(join(repositoryRoot, 'icon.png'), pngHeader)
  git(['add', 'icon.png'])
  expectStatus(execute(process.execPath, [stagedGuard], repositoryRoot), 0, 'reviewed binary signature scan')
  git(['rm', '--cached', 'icon.png'])
  await rm(join(repositoryRoot, 'icon.png'))

  await writeFile(
    join(repositoryRoot, 'icon-with-secret.png'),
    new Uint8Array([...pngHeader, ...encoder.encode(canarySecret())]),
  )
  git(['add', 'icon-with-secret.png'])
  expectStatus(
    execute(process.execPath, [stagedGuard], repositoryRoot),
    1,
    'reviewed binary printable metadata scan',
  )
  git(['rm', '--cached', 'icon-with-secret.png'])
  await rm(join(repositoryRoot, 'icon-with-secret.png'))

  await writeFile(join(repositoryRoot, 'invalid-utf8.bin'), new Uint8Array([0xff, 0xd8, 0xff]))
  git(['add', 'invalid-utf8.bin'])
  expectStatus(execute(process.execPath, [stagedGuard], repositoryRoot), 1, 'invalid UTF-8 binary scan')
  git(['rm', '--cached', 'invalid-utf8.bin'])
  await rm(join(repositoryRoot, 'invalid-utf8.bin'))

  await mkdir(join(repositoryRoot, 'certificates'), { recursive: true })
  await writeFile(join(repositoryRoot, 'certificates', 'public.pem'), canarySecret())
  git(['add', 'certificates/public.pem'])
  expectStatus(
    execute(process.execPath, [stagedGuard], repositoryRoot),
    1,
    'allowed certificate path content scan',
  )
  git(['rm', '--cached', 'certificates/public.pem'])
  await rm(join(repositoryRoot, 'certificates'), { recursive: true })

  await writeFile(join(repositoryRoot, 'outgoing.txt'), canarySecret())
  git(['add', 'outgoing.txt'])
  git(['commit', '-m', 'test: add outgoing canary'])
  await writeFile(join(repositoryRoot, 'outgoing.txt'), 'safe replacement\n')
  git(['add', 'outgoing.txt'])
  git(['commit', '-m', 'test: remove outgoing canary'])
  const addThenRemoveOid = git(['rev-parse', 'HEAD'])
  expectStatus(
    execute(
      process.execPath,
      [pushGuard, 'origin', remoteRoot],
      repositoryRoot,
      prePushInput(addThenRemoveOid, remoteOid),
    ),
    1,
    'intermediate outgoing commit scan',
  )

  git(['reset', '--hard', remoteOid])
  await writeFile(join(repositoryRoot, 'outgoing.txt'), 'safe outgoing content\n')
  git(['add', 'outgoing.txt'])
  git(['commit', '-m', 'test: add safe outgoing content'])
  const safeOutgoingOid = git(['rev-parse', 'HEAD'])
  expectStatus(
    execute(
      process.execPath,
      [pushGuard, 'origin', remoteRoot],
      repositoryRoot,
      prePushInput(safeOutgoingOid, remoteOid),
    ),
    0,
    'safe outgoing commit scan',
  )
  expectStatus(
    execute(
      process.execPath,
      [pushGuard, 'origin', remoteRoot],
      repositoryRoot,
      prePushInput(safeOutgoingOid, 'f'.repeat(remoteOid.length)),
    ),
    0,
    'safe outgoing scan with an unavailable remote SHA',
  )

  git(['commit', '--allow-empty', '-m', canarySecret().trim()])
  const secretMessageOid = git(['rev-parse', 'HEAD'])
  expectStatus(
    execute(
      process.execPath,
      [pushGuard, 'origin', remoteRoot],
      repositoryRoot,
      prePushInput(secretMessageOid, remoteOid),
    ),
    1,
    'outgoing commit-message scan',
  )
  git(['reset', '--hard', safeOutgoingOid])

  git(['tag', '-a', 'v0.0.0-canary', '-m', canarySecret().trim()])
  const tagOid = git(['rev-parse', 'refs/tags/v0.0.0-canary'])
  const zeroOid = '0'.repeat(remoteOid.length)
  const tagInput = `refs/tags/v0.0.0-canary ${tagOid} refs/tags/v0.0.0-canary ${zeroOid}\n`
  expectStatus(
    execute(process.execPath, [pushGuard, 'origin', remoteRoot], repositoryRoot, tagInput),
    1,
    'annotated tag-message scan',
  )

  expectStatus(
    execute(
      process.execPath,
      [pushGuard, 'origin', remoteRoot],
      repositoryRoot,
      prePushInput(remoteOid, remoteOid),
    ),
    0,
    'already-published range scan',
  )

  console.log('Local commit-message, pre-commit, and pre-push secret guard behavior passed.')
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
