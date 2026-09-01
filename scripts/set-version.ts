import { readFile, writeFile } from 'node:fs/promises'

const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const version = args.find((argument) => !argument.startsWith('--'))

if (!version || !exactVersion.test(version)) {
  console.error('Usage: bun run version:set <major.minor.patch[-prerelease]> [--dry-run]')
  process.exit(1)
}

interface Update {
  next: string
  path: string
  previous: string
}

function replaceRequired(
  content: string,
  pattern: RegExp,
  replacement: string | ((substring: string, ...args: string[]) => string),
  description: string,
): string {
  if (!pattern.test(content)) throw new Error(`Unable to find ${description}.`)
  pattern.lastIndex = 0
  return content.replace(pattern, replacement as string)
}

const updates: Update[] = []

const versionPath = 'version.txt'
const versionPrevious = await readFile(versionPath, 'utf8')
updates.push({ next: `${version}\n`, path: versionPath, previous: versionPrevious })

const manifestPath = '.release-please-manifest.json'
const manifestPrevious = await readFile(manifestPath, 'utf8')
const releaseManifest = JSON.parse(manifestPrevious) as Record<string, string>
releaseManifest['.'] = version
const manifestNext = `${JSON.stringify(releaseManifest, null, 2)}\n`
updates.push({ next: manifestNext, path: manifestPath, previous: manifestPrevious })

const rootPath = 'package.json'
const rootPrevious = await readFile(rootPath, 'utf8')
const rootManifest = JSON.parse(rootPrevious) as Record<string, unknown>
rootManifest.version = version
const rootNext = `${JSON.stringify(rootManifest, null, 2)}\n`
updates.push({ next: rootNext, path: rootPath, previous: rootPrevious })

const tauriPath = 'apps/desktop/src-tauri/tauri.conf.json'
const cargoTomlPath = 'apps/desktop/src-tauri/Cargo.toml'
const cargoLockPath = 'apps/desktop/src-tauri/Cargo.lock'
const desktopVersionPaths = [tauriPath, cargoTomlPath, cargoLockPath]
const desktopVersionPathExists = await Promise.all(desktopVersionPaths.map((path) => Bun.file(path).exists()))
const hasAnyDesktopVersionPath = desktopVersionPathExists.some(Boolean)
const hasAllDesktopVersionPaths = desktopVersionPathExists.every(Boolean)

if (hasAnyDesktopVersionPath && !hasAllDesktopVersionPaths) {
  const missing = desktopVersionPaths.filter((_, index) => !desktopVersionPathExists[index])
  throw new Error(`Desktop version metadata is incomplete. Missing: ${missing.join(', ')}`)
}

if (hasAllDesktopVersionPaths) {
  const tauriPrevious = await readFile(tauriPath, 'utf8')
  const tauriConfig = JSON.parse(tauriPrevious) as Record<string, unknown>
  tauriConfig.version = version
  const tauriNext = `${JSON.stringify(tauriConfig, null, 2)}\n`
  updates.push({ next: tauriNext, path: tauriPath, previous: tauriPrevious })

  const cargoTomlPrevious = await readFile(cargoTomlPath, 'utf8')
  const cargoName = cargoTomlPrevious.match(/^name\s*=\s*"([^"]+)"/m)?.[1]
  if (!cargoName) throw new Error('Unable to find the Cargo package name.')

  const cargoTomlNext = replaceRequired(
    cargoTomlPrevious,
    /(\[package\][\s\S]*?^version\s*=\s*")[^"]+("\s*$)/m,
    `$1${version}$2`,
    'the [package] version in Cargo.toml',
  )
  updates.push({ next: cargoTomlNext, path: cargoTomlPath, previous: cargoTomlPrevious })

  const cargoLockPrevious = await readFile(cargoLockPath, 'utf8')
  const escapedCargoName = cargoName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const cargoLockPattern = new RegExp(
    `(\\[\\[package\\]\\]\\s+name = "${escapedCargoName}"\\s+version = ")[^"]+("\\s+)`,
  )
  const cargoLockNext = replaceRequired(
    cargoLockPrevious,
    cargoLockPattern,
    `$1${version}$2`,
    `the ${cargoName} package version in Cargo.lock`,
  )
  updates.push({ next: cargoLockNext, path: cargoLockPath, previous: cargoLockPrevious })
}

const changed = updates.filter((update) => update.previous !== update.next)

for (const update of changed) {
  if (!dryRun) await writeFile(update.path, update.next)
  console.log(`${dryRun ? 'Would update' : 'Updated'} ${update.path}`)
}

if (changed.length === 0) console.log(`Version is already ${version}.`)

console.log('\nNext steps:')
console.log('1. Use version:set only for release bootstrap or recovery, not for normal feature work.')
console.log('2. Run bun run template:validate and the release checks in docs/release.md.')
console.log(
  '3. Normal publication happens only by merging the Release Please pull request; do not tag manually.',
)
