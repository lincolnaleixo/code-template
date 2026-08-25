import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'

const MAX_SCANNABLE_TEXT_BYTES = 8 * 1024 * 1024
const MAX_PROCESS_OUTPUT_BYTES = 32 * 1024 * 1024
const ZERO_OID_PATTERN = /^0+$/
const SAFE_BINARY_EXTENSIONS = new Set([
  '.gif',
  '.icns',
  '.ico',
  '.jpeg',
  '.jpg',
  '.otf',
  '.png',
  '.ttf',
  '.webp',
  '.woff',
  '.woff2',
])
const BLOCKED_BASENAMES = new Set([
  '.git-credentials',
  '.netrc',
  '.pypirc',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
  'id_rsa',
])
const BLOCKED_EXTENSIONS = new Set(['.jks', '.key', '.kdbx', '.keystore', '.mobileprovision', '.p12', '.pfx'])
const decoder = new TextDecoder()

type CommandResult = {
  status: number
  stdout: Uint8Array
  stderr: Uint8Array
}

type TreeRecord = {
  mode: string
  type: string
  oid: string
  path: string
}

function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; input?: Uint8Array },
): CommandResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'buffer',
    input: options.input,
    maxBuffer: MAX_PROCESS_OUTPUT_BYTES,
  })

  return {
    status: result.status ?? 2,
    stdout: result.stdout ?? new Uint8Array(),
    stderr: result.stderr ?? new Uint8Array(),
  }
}

function commandFailure(command: string, args: string[], result: CommandResult): Error {
  const detail = decoder.decode(result.stderr).trim() || decoder.decode(result.stdout).trim()
  return new Error(
    `${command} ${args.join(' ')} failed with exit code ${result.status}${detail ? `: ${detail}` : ''}`,
  )
}

function parseTreeRecord(record: string): TreeRecord | undefined {
  const separator = record.indexOf('\t')
  if (separator < 0) {
    return undefined
  }

  const [mode, type, oid] = record.slice(0, separator).split(/\s+/u)
  if (!mode || !type || !oid) {
    return undefined
  }

  return {
    mode,
    type,
    oid,
    path: record.slice(separator + 1),
  }
}

export function gitText(root: string, args: string[]): string {
  const result = runCommand('git', args, { cwd: root })
  if (result.status !== 0) {
    throw commandFailure('git', args, result)
  }
  return decoder.decode(result.stdout)
}

export function gitBytes(root: string, args: string[]): Uint8Array {
  const result = runCommand('git', args, { cwd: root })
  if (result.status !== 0) {
    throw commandFailure('git', args, result)
  }
  return result.stdout
}

export function repositoryRoot(cwd = process.cwd()): string {
  return gitText(cwd, ['rev-parse', '--show-toplevel']).trim()
}

export function parseNullSeparated(value: Uint8Array | string): string[] {
  const text = typeof value === 'string' ? value : decoder.decode(value)
  return text.split('\0').filter(Boolean)
}

export function stagedBlobOid(root: string, path: string): string {
  const records = parseNullSeparated(gitBytes(root, ['ls-files', '--stage', '-z', '--', path]))
  for (const record of records) {
    const separator = record.indexOf('\t')
    if (separator < 0) {
      continue
    }
    const [mode, oid, stage] = record.slice(0, separator).split(/\s+/u)
    if (mode && oid && stage === '0') {
      return oid
    }
  }
  throw new Error(`Unable to resolve the staged blob for ${path}; resolve index conflicts first.`)
}

export function treeBlobOid(root: string, commit: string, path: string): string | undefined {
  const records = parseNullSeparated(gitBytes(root, ['ls-tree', '-z', commit, '--', path]))
  for (const rawRecord of records) {
    const record = parseTreeRecord(rawRecord)
    if (record?.type === 'blob' && record.path === path) {
      return record.oid
    }
  }
  return undefined
}

export function isZeroOid(value: string): boolean {
  return ZERO_OID_PATTERN.test(value)
}

export function forbiddenSecretPath(path: string): string | undefined {
  const normalized = path.replaceAll('\\', '/')
  const lower = normalized.toLowerCase()
  const basename = lower.split('/').at(-1) ?? lower
  const extension = extname(basename)

  const isDotEnv = basename === '.env' || basename.startsWith('.env.')
  const isDotEnvTemplate = ['.example', '.sample', '.template'].some((suffix) => basename.endsWith(suffix))
  if (isDotEnv && !isDotEnvTemplate) {
    return 'environment files must stay local; commit an .env.example, .env.sample, or .env.template instead'
  }

  if (BLOCKED_BASENAMES.has(basename)) {
    return 'known credential or private-key filename'
  }
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return 'private key, signing material, credential store, or provisioning profile'
  }
  if (lower.endsWith('/.aws/credentials') || lower === '.aws/credentials') {
    return 'AWS shared credentials file'
  }
  if (lower.endsWith('/.kube/config') || lower === '.kube/config') {
    return 'Kubernetes client configuration can contain bearer tokens and client keys'
  }
  if (lower.endsWith('/.docker/config.json') || lower === '.docker/config.json') {
    return 'Docker client configuration can contain registry credentials'
  }
  if (/terraform\.tfstate(?:\.backup)?$/.test(lower) || lower.endsWith('.tfstate')) {
    return 'Terraform state commonly contains resolved credentials and sensitive outputs'
  }
  if (lower.endsWith('.tfvars')) {
    return 'Terraform variable files may contain deployment secrets; commit a documented example instead'
  }
  if (/(?:^|\/)(?:service[-_]?account|credentials)[^/]*\.json$/.test(lower)) {
    return 'service-account or credential JSON file'
  }

  return undefined
}

export function isBinaryContent(content: Uint8Array): boolean {
  const inspectedLength = Math.min(content.byteLength, 8192)
  for (let index = 0; index < inspectedLength; index += 1) {
    if (content[index] === 0) {
      return true
    }
  }
  return false
}

function secretlintResult(root: string, fileName: string, content: Uint8Array): CommandResult {
  const packagePath = join(root, 'node_modules', 'secretlint', 'package.json')
  if (!existsSync(packagePath)) {
    throw new Error('Secretlint is not installed. Run `bun ci` before committing or pushing.')
  }

  return runCommand(
    process.execPath,
    [
      'x',
      'secretlint',
      `--secretlintrc=${join(root, '.secretlintrc.json')}`,
      `--stdinFileName=${fileName}`,
      '--no-color',
      '--no-terminalLink',
    ],
    { cwd: root, input: content },
  )
}

function printSecretlintResult(result: CommandResult): void {
  if (result.stdout.byteLength > 0) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr.byteLength > 0) {
    process.stderr.write(result.stderr)
  }
}

export function verifySecretlintCanary(root: string): void {
  const safeResult = secretlintResult(
    root,
    'safe-canary.txt',
    new TextEncoder().encode('public_example = "not-a-secret"\n'),
  )
  if (safeResult.status !== 0) {
    printSecretlintResult(safeResult)
    throw new Error(`Secretlint rejected the safe canary with exit code ${safeResult.status}.`)
  }

  const canary = `github_token = "ghp_${'aBcDeFgHiJkLmNoPqRsT'}${'uVwXyZ0123456789'}"\n`
  const secretResult = secretlintResult(root, 'secret-canary.txt', new TextEncoder().encode(canary))
  if (secretResult.status !== 1) {
    printSecretlintResult(secretResult)
    throw new Error(
      `Secretlint failed closed-canary verification; expected exit code 1 and received ${secretResult.status}.`,
    )
  }
}

export function scanSecretBlob(root: string, fileName: string, content: Uint8Array): boolean {
  const forbiddenReason = forbiddenSecretPath(fileName)
  if (forbiddenReason) {
    console.error(`Secret guard blocked ${fileName}: ${forbiddenReason}.`)
    return false
  }

  if (isBinaryContent(content)) {
    const extension = extname(fileName).toLowerCase()
    if (SAFE_BINARY_EXTENSIONS.has(extension)) {
      return true
    }
    console.error(
      `Secret guard blocked binary file ${fileName}. Review it explicitly and add a narrowly documented safe type only when required.`,
    )
    return false
  }

  if (content.byteLength > MAX_SCANNABLE_TEXT_BYTES) {
    console.error(
      `Secret guard blocked ${fileName}: text files larger than ${MAX_SCANNABLE_TEXT_BYTES} bytes are not accepted without explicit review.`,
    )
    return false
  }

  const result = secretlintResult(root, fileName, content)
  if (result.status === 0) {
    return true
  }

  printSecretlintResult(result)
  if (result.status !== 1) {
    console.error(`Secretlint failed unexpectedly while scanning ${fileName}.`)
  }
  return false
}
