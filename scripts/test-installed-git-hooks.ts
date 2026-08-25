import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const MAX_OUTPUT_BYTES = 32 * 1024 * 1024
const CANARY_TOKEN = `ghp_${'7Qm4vZ2xN9cR'}${'6sT8uW3yA5bD'}${'1eF0gHkJpLqM'}`
const sourceRoot = process.cwd()
const temporaryRoot = await mkdtemp(join(tmpdir(), 'matrix-installed-hooks-'))
const repositoryRoot = join(temporaryRoot, 'repository')
const remoteRoot = join(temporaryRoot, 'remote.git')

type CommandResult = {
  status: number
  stdout: string
  stderr: string
}

function execute(command: string, args: string[], cwd: string): CommandResult {
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
  if (result.status === expected) {
    return
  }
  throw new Error(
    `${label} returned ${result.status}; expected ${expected}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  )
}

function expectSecretMasked(result: CommandResult, label: string): void {
  const output = `${result.stdout}\n${result.stderr}`
  if (output.includes(CANARY_TOKEN)) {
    throw new Error(`${label} printed the unmasked canary token.`)
  }
}

function git(args: string[], cwd = repositoryRoot): string {
  const result = execute('git', args, cwd)
  expectStatus(result, 0, `git ${args.join(' ')}`)
  return result.stdout.trim()
}

function canarySecret(): string {
  return `token = "${CANARY_TOKEN}"\n`
}

try {
  await mkdir(repositoryRoot, { recursive: true })
  await symlink(join(sourceRoot, 'node_modules'), join(repositoryRoot, 'node_modules'), 'dir')
  await symlink(join(sourceRoot, 'scripts'), join(repositoryRoot, 'guard-scripts'), 'dir')
  await cp(join(sourceRoot, '.husky'), join(repositoryRoot, '.husky'), { recursive: true })
  await cp(join(sourceRoot, '.secretlintrc.json'), join(repositoryRoot, '.secretlintrc.json'))
  await cp(join(sourceRoot, '.secretlintignore'), join(repositoryRoot, '.secretlintignore'))
  await writeFile(
    join(repositoryRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'installed-hook-test',
        private: true,
        scripts: {
          'prepush:check': 'bun -e "process.exit(0)"',
          'security:commit-message': 'bun guard-scripts/check-commit-message-secrets.ts',
          'security:push': 'bun guard-scripts/check-push-secrets.ts',
          'security:staged': 'bun guard-scripts/check-staged-secrets.ts',
        },
      },
      null,
      2,
    )}\n`,
  )

  git(['init', '-b', 'main'])
  git(['config', 'user.name', 'installed-hook-test'])
  git(['config', 'user.email', 'installed-hook-test@example.invalid'])
  git(['config', 'core.hooksPath', '.husky/_'])

  await writeFile(join(repositoryRoot, 'README.md'), '# Installed Git hook test\n')
  git(['add', 'README.md'])
  git(['commit', '-m', 'chore: initialize installed hook test'])

  git(['init', '--bare', remoteRoot], temporaryRoot)
  git(['remote', 'add', 'origin', remoteRoot])
  git(['push', '--set-upstream', 'origin', 'main'])

  const secretPath = join(repositoryRoot, 'staged-secret.txt')
  await writeFile(secretPath, canarySecret())
  git(['add', 'staged-secret.txt'])
  const preCommitResult = execute(
    'git',
    ['commit', '-m', 'test: reject staged secret'],
    repositoryRoot,
  )
  expectStatus(preCommitResult, 1, 'installed pre-commit hook')
  expectSecretMasked(preCommitResult, 'installed pre-commit hook')
  git(['reset', '--hard', 'HEAD'])
  await rm(secretPath, { force: true })

  await writeFile(join(repositoryRoot, 'safe.txt'), 'safe content\n')
  git(['add', 'safe.txt'])
  const commitMessageResult = execute(
    'git',
    ['commit', '-m', canarySecret().trim()],
    repositoryRoot,
  )
  expectStatus(commitMessageResult, 1, 'installed commit-msg hook')
  expectSecretMasked(commitMessageResult, 'installed commit-msg hook')
  git(['commit', '-m', 'test: accept safe commit message'])
  git(['push', 'origin', 'main'])
  const publishedOid = git(['rev-parse', 'HEAD'])

  await writeFile(join(repositoryRoot, 'outgoing.txt'), canarySecret())
  git(['add', 'outgoing.txt'])
  git(['commit', '--no-verify', '-m', 'test: bypass local secret commit'])
  await writeFile(join(repositoryRoot, 'outgoing.txt'), 'safe replacement\n')
  git(['add', 'outgoing.txt'])
  git(['commit', '--no-verify', '-m', 'test: remove visible secret'])

  const prePushResult = execute('git', ['push', 'origin', 'main'], repositoryRoot)
  expectStatus(prePushResult, 1, 'installed pre-push hook')
  expectSecretMasked(prePushResult, 'installed pre-push hook')

  const remoteOid = git(['--git-dir', remoteRoot, 'rev-parse', 'refs/heads/main'], temporaryRoot)
  if (remoteOid !== publishedOid) {
    throw new Error('The rejected push changed the remote branch unexpectedly.')
  }

  console.log('Installed Husky commit-msg, pre-commit, and pre-push hooks passed end-to-end tests.')
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
