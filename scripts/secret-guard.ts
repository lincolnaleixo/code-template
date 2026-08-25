import { spawnSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { extname, resolve } from 'node:path'

const MAX_PROCESS_OUTPUT_BYTES = 32 * 1024 * 1024
const MAX_SCANNABLE_TEXT_BYTES = 8 * 1024 * 1024
const MAX_BINARY_SNIFF_BYTES = 64 * 1024
const MIN_PRINTABLE_STRING_LENGTH = 4
const ZERO_OID_PATTERN = /^0+$/u
const NULL_BYTE = 0
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
const BLOCKED_FILE_EXTENSIONS = new Set([
  '.age',
  '.asc',
  '.jks',
  '.kdb',
  '.kdbx',
  '.key',
  '.keystore',
  '.mobileprovision',
  '.ovpn',
  '.p12',
  '.pfx',
  '.pkcs12',
  '.ppk',
  '.tfstate',
  '.tfvars',
])
const BLOCKED_EXACT_BASENAMES = new Set([
  '_auth',
  'credentials',
  'credentials.json',
  'credentials.tfrc.json',
  'dockerconfigjson',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
  'id_rsa',
  'terraform.tfstate',
])
const BLOCKED_PATH_SEGMENTS = new Set([
  '.aws',
  '.azure',
  '.docker',
  '.gnupg',
  '.kube',
  '.ssh',
])
const BLOCKED_FILENAME_PATTERN = /(^|[._-])(credential|credentials|keystore|secret|secrets)([._-]|$)/u
const ALLOWED_TEMPLATE_SUFFIXES = ['.example', '.sample', '.template']
const utf8Decoder = new TextDecoder()
const strictUtf8Decoder = new TextDecoder('utf-8', { fatal: true })
const utf8Encoder = new TextEncoder()

type CommandResult = {
  status: number
  stdout: Buffer
  stderr: Buffer
  error?: Error
}

function commandForDisplay(command: string, args: string[]): string {
  return [command, ...args].join(' ')
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  input?: Uint8Array,
): CommandResult {
  const result = spawnSync(command, args, {
    cwd,
    input,
    maxBuffer: MAX_PROCESS_OUTPUT_BYTES,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  return {
    status: result.status ?? 2,
    stdout: result.stdout ?? Buffer.alloc(0),
    stderr: result.stderr ?? Buffer.alloc(0),
    error: result.error,
  }
}

function commandError(command: string, args: string[], result: CommandResult): Error {
  const stderr = utf8Decoder.decode(result.stderr).trim()
  const reason = result.error?.message ?? (stderr || `exit code ${result.status}`)
  return new Error(`${commandForDisplay(command, args)} failed: ${reason}`)
}

export function repositoryRoot(): string {
  const invocationDirectory = realpathSync(process.cwd())
  const result = runCommand('git', ['rev-parse', '--show-toplevel'], invocationDirectory)
  if (result.status !== 0) {
    throw commandError('git', ['rev-parse', '--show-toplevel'], result)
  }

  const root = utf8Decoder.decode(result.stdout).trim()
  if (!root) {
    throw new Error('Git returned an empty repository root.')
  }

  return realpathSync(root)
}

export function gitBytes(root: string, args: string[]): Buffer {
  const result = runCommand('git', args, root)
  if (result.status !== 0) {
    throw commandError('git', args, result)
  }
  return result.stdout
}

export function gitText(root: string, args: string[]): string {
  return utf8Decoder.decode(gitBytes(root, args)).trim()
}

export function parseNullSeparated(content: Uint8Array): string[] {
  return utf8Decoder
    .decode(content)
    .split('\0')
    .filter(Boolean)
}

function isTemplatePath(fileName: string): boolean {
  return ALLOWED_TEMPLATE_SUFFIXES.some((suffix) => fileName.endsWith(suffix))
}

export function forbiddenSecretPath(fileName: string): boolean {
  const normalized = fileName.replaceAll('\\', '/').toLowerCase()
  const parts = normalized.split('/').filter(Boolean)
  const basename = parts.at(-1) ?? ''
  const extension = extname(basename)

  if (isTemplatePath(basename)) {
    return false
  }
  if (basename === '.env' || basename.startsWith('.env.')) {
    return true
  }
  if (BLOCKED_FILE_EXTENSIONS.has(extension)) {
    return true
  }
  if (BLOCKED_EXACT_BASENAMES.has(basename)) {
    return true
  }
  if (parts.some((part) => BLOCKED_PATH_SEGMENTS.has(part))) {
    return true
  }
  return BLOCKED_FILENAME_PATTERN.test(basename)
}

function containsBinaryControlCharacter(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)
    if (
      (code >= 0 && code <= 8) ||
      code === 11 ||
      code === 12 ||
      (code >= 14 && code <= 31) ||
      code === 127
    ) {
      return true
    }
  }
  return false
}

export function isBinaryContent(content: Uint8Array): boolean {
  const inspected = content.subarray(0, Math.min(content.byteLength, MAX_BINARY_SNIFF_BYTES))
  if (inspected.includes(NULL_BYTE)) {
    return true
  }

  try {
    const text = strictUtf8Decoder.decode(inspected)
    return containsBinaryControlCharacter(text)
  } catch {
    return true
  }
}

function startsWithBytes(content: Uint8Array, expected: readonly number[], offset = 0): boolean {
  if (content.byteLength < offset + expected.length) {
    return false
  }
  return expected.every((byte, index) => content[offset + index] === byte)
}

function startsWithAscii(content: Uint8Array, expected: string, offset = 0): boolean {
  return startsWithBytes(content, [...utf8Encoder.encode(expected)], offset)
}

export function hasReviewedBinarySignature(fileName: string, content: Uint8Array): boolean {
  const extension = extname(fileName).toLowerCase()
  switch (extension) {
    case '.png':
      return startsWithBytes(content, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case '.jpg':
    case '.jpeg':
      return startsWithBytes(content, [0xff, 0xd8, 0xff])
    case '.gif':
      return startsWithAscii(content, 'GIF87a') || startsWithAscii(content, 'GIF89a')
    case '.webp':
      return startsWithAscii(content, 'RIFF') && startsWithAscii(content, 'WEBP', 8)
    case '.ico':
      return startsWithBytes(content, [0x00, 0x00, 0x01, 0x00])
    case '.icns':
      return startsWithAscii(content, 'icns')
    case '.woff':
      return startsWithAscii(content, 'wOFF')
    case '.woff2':
      return startsWithAscii(content, 'wOF2')
    case '.otf':
      return (
        startsWithAscii(content, 'OTTO') ||
        startsWithBytes(content, [0x00, 0x01, 0x00, 0x00])
      )
    case '.ttf':
      return (
        startsWithBytes(content, [0x00, 0x01, 0x00, 0x00]) || startsWithAscii(content, 'true')
      )
    default:
      return false
  }
}

function extractPrintableAscii(content: Uint8Array): Uint8Array {
  const lines: string[] = []
  let current = ''
  let extractedBytes = 0

  const flush = (): void => {
    if (current.length >= MIN_PRINTABLE_STRING_LENGTH) {
      lines.push(current)
      extractedBytes += current.length + 1
    }
    current = ''
  }

  for (const byte of content) {
    if (byte === 9 || (byte >= 32 && byte <= 126)) {
      current += String.fromCharCode(byte)
    } else {
      flush()
    }

    if (extractedBytes + current.length > MAX_SCANNABLE_TEXT_BYTES) {
      throw new Error('Reviewed binary contains more printable metadata than the secret guard can scan safely.')
    }
  }
  flush()

  return utf8Encoder.encode(lines.join('\n'))
}

function secretlintResult(root: string, fileName: string, content: Uint8Array): CommandResult {
  const packagePath = resolve(root, 'node_modules', 'secretlint', 'package.json')
  if (!existsSync(packagePath)) {
    throw new Error('Secretlint is not installed. Run `bun ci` before committing or pushing.')
  }

  return runCommand(
    process.execPath,
    [
      'x',
      'secretlint',
      '--secretlintrc',
      '.secretlintrc.json',
      `--stdinFileName=${fileName}`,
    ],
    root,
    content,
  )
}

function printCommandOutput(result: CommandResult): void {
  if (result.stdout.length > 0) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr.length > 0) {
    process.stderr.write(result.stderr)
  }
}

function scanWithSecretlint(root: string, fileName: string, content: Uint8Array): boolean {
  const result = secretlintResult(root, fileName, content)
  if (result.status === 0) {
    return true
  }
  printCommandOutput(result)
  if (result.status === 1) {
    return false
  }
  throw commandError(process.execPath, ['x', 'secretlint', `--stdinFileName=${fileName}`], result)
}

export function verifySecretlintCanary(root: string): void {
  const safeResult = secretlintResult(
    root,
    'secret-guard-safe-canary.txt',
    utf8Encoder.encode('public_example = "not-a-secret"\n'),
  )
  if (safeResult.status !== 0) {
    printCommandOutput(safeResult)
    throw new Error(`Secretlint rejected the safe canary with exit code ${safeResult.status}.`)
  }

  const secretResult = secretlintResult(
    root,
    'secret-guard-secret-canary.txt',
    utf8Encoder.encode(
      `token = "ghp_${'7Qm4vZ2xN9cR'}${'6sT8uW3yA5bD'}${'1eF0gHkJpLqM'}"\n`,
    ),
  )
  if (secretResult.status === 0) {
    throw new Error('Secretlint did not detect its GitHub token canary; refusing to continue.')
  }
  if (secretResult.status !== 1) {
    printCommandOutput(secretResult)
    throw new Error(`Secretlint canary failed with unexpected exit code ${secretResult.status}.`)
  }
}

export function scanSecretBlob(root: string, fileName: string, content: Uint8Array): boolean {
  if (forbiddenSecretPath(fileName)) {
    console.error(`Secret guard blocked high-risk credential path: ${fileName}`)
    return false
  }

  const extension = extname(fileName).toLowerCase()
  const reviewedBinary = SAFE_BINARY_EXTENSIONS.has(extension)
  const binary = reviewedBinary || isBinaryContent(content)
  if (binary) {
    if (!reviewedBinary) {
      console.error(`Secret guard blocked unreviewed binary payload: ${fileName}`)
      return false
    }
    if (!hasReviewedBinarySignature(fileName, content)) {
      console.error(
        `Secret guard blocked binary content whose signature does not match ${extension}: ${fileName}`,
      )
      return false
    }

    let printableContent: Uint8Array
    try {
      printableContent = extractPrintableAscii(content)
    } catch (error) {
      console.error(`${fileName}: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
    if (printableContent.byteLength === 0) {
      return true
    }
    return scanWithSecretlint(root, `${fileName}.printable-metadata.txt`, printableContent)
  }

  if (content.byteLength > MAX_SCANNABLE_TEXT_BYTES) {
    console.error(
      `Secret guard blocked oversized text file ${fileName} (${content.byteLength} bytes; limit ${MAX_SCANNABLE_TEXT_BYTES}).`,
    )
    return false
  }

  return scanWithSecretlint(root, fileName, content)
}

export function stagedBlobOid(root: string, fileName: string): string {
  const entries = parseNullSeparated(gitBytes(root, ['ls-files', '--stage', '-z', '--', fileName]))
  const entry = entries.at(0)
  const match = entry?.match(/^\d+ ([0-9a-f]+) \d+\t/u)
  if (!match?.[1]) {
    throw new Error(`Unable to resolve staged blob for ${fileName}.`)
  }
  return match[1]
}

export function treeBlobOid(root: string, commit: string, fileName: string): string | undefined {
  const entries = parseNullSeparated(gitBytes(root, ['ls-tree', '-z', commit, '--', fileName]))
  const entry = entries.at(0)
  if (!entry) {
    return undefined
  }
  const match = entry.match(/^\d+ (\w+) ([0-9a-f]+)\t/u)
  if (!match?.[2] || match[1] !== 'blob') {
    return undefined
  }
  return match[2]
}

export function isZeroOid(oid: string): boolean {
  return ZERO_OID_PATTERN.test(oid)
}
