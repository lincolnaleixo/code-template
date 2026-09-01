import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, relative, sep } from 'node:path'

const repositoryRoot = process.cwd()
const temporaryRoot = await mkdtemp(join(tmpdir(), 'matrix-template-consumer-'))
const consumerRoot = join(temporaryRoot, 'product')
const keepWorkspace = process.env.KEEP_TEMPLATE_CONSUMER === '1'
const nativeApiUrl = process.env.TEMPLATE_SMOKE_API_URL ?? 'https://api.example.com'
const ignoredSegments = new Set([
  '.git',
  '.output',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'target',
  'test-results',
])

function shouldCopy(source: string): boolean {
  const path = relative(repositoryRoot, source)
  if (!path) return true

  if (path.split(sep).some((segment) => ignoredSegments.has(segment))) return false

  const fileName = basename(path)
  if (fileName === '.env.example') return true
  if (fileName === '.env' || fileName.startsWith('.env.')) return false

  return true
}

async function run(command: string[], env: Record<string, string> = {}): Promise<void> {
  const child = Bun.spawn(command, {
    cwd: consumerRoot,
    env: { ...process.env, ...env },
    stderr: 'inherit',
    stdout: 'inherit',
  })

  const exitCode = await child.exited
  if (exitCode !== 0) {
    throw new Error(`Consumer smoke command failed with exit code ${exitCode}: ${command.join(' ')}`)
  }
}

async function capture(command: string[]): Promise<string> {
  const child = Bun.spawn(command, {
    cwd: consumerRoot,
    stderr: 'inherit',
    stdout: 'pipe',
  })
  const output = await new Response(child.stdout).text()
  const exitCode = await child.exited

  if (exitCode !== 0) {
    throw new Error(`Consumer smoke command failed with exit code ${exitCode}: ${command.join(' ')}`)
  }

  return output.trim()
}

try {
  console.log(`Creating isolated template consumer at ${consumerRoot}`)
  await cp(repositoryRoot, consumerRoot, {
    filter: shouldCopy,
    recursive: true,
  })

  const releaseConfigPath = join(consumerRoot, 'release-please-config.json')
  const releaseConfig = JSON.parse(await readFile(releaseConfigPath, 'utf8')) as Record<string, unknown>
  const sourceBootstrapSha = releaseConfig['bootstrap-sha']
  if (typeof sourceBootstrapSha !== 'string' || !/^[0-9a-f]{40}$/iu.test(sourceBootstrapSha)) {
    throw new Error('Source release configuration must contain the expected full bootstrap-sha.')
  }
  delete releaseConfig['bootstrap-sha']
  await writeFile(releaseConfigPath, `${JSON.stringify(releaseConfig, null, 2)}\n`)

  await run(['git', 'init', '-b', 'main'])
  await run(['git', 'config', 'user.name', 'template-smoke'])
  await run(['git', 'config', 'user.email', 'template-smoke@example.invalid'])
  await run(['git', 'add', '.'])
  await run(['git', 'commit', '-m', 'chore: initialize generated product'])

  const commitCount = await capture(['git', 'rev-list', '--count', 'HEAD'])
  if (commitCount !== '1') {
    throw new Error(
      `Generated consumer must start with one source-independent commit, received ${commitCount}.`,
    )
  }

  const generatedReleaseConfig = JSON.parse(await readFile(releaseConfigPath, 'utf8')) as Record<
    string,
    unknown
  >
  if ('bootstrap-sha' in generatedReleaseConfig) {
    throw new Error('Generated consumer must not retain the source repository bootstrap-sha.')
  }

  const manifest = JSON.parse(await readFile(join(consumerRoot, 'package.json'), 'utf8')) as {
    name?: string
    private?: boolean
  }

  if (!manifest.name || manifest.private !== true) {
    throw new Error('Generated consumer must have a package name and remain private by default.')
  }

  await run(['bun', 'ci'])
  await run(['bun', 'run', 'security:hooks:verify'])
  await run(['bun', 'run', 'security:secrets:verify'])
  await run(['bun', 'run', 'security:policy'])
  await run(['bun', 'run', 'security:secrets'])
  await run(['bun', 'run', 'check'])
  await run(['bun', 'run', 'build'])
  await run(['bun', 'run', 'build:native'], {
    VITE_API_URL: nativeApiUrl,
    VITE_APP_NAME: 'Template Consumer Smoke',
  })

  const status = await capture(['git', 'status', '--porcelain'])
  if (status) {
    throw new Error(`Consumer validation changed tracked source files:\n${status}`)
  }

  console.log(
    `Fresh template consumer smoke test passed with source bootstrap ${sourceBootstrapSha.slice(0, 12)} removed and local secret guards installed.`,
  )
} finally {
  if (keepWorkspace) console.log(`Template consumer retained at ${consumerRoot}`)
  else await rm(temporaryRoot, { force: true, recursive: true })
}
