import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ignoredDirectories = new Set(['.git', '.output', 'dist', 'node_modules', 'target'])
const markdownGlob = new Bun.Glob('**/*.md')
const errors: string[] = []

function isIgnoredPath(path: string): boolean {
  return path.split(/[\\/]/).some((segment) => ignoredDirectories.has(segment))
}

function extractTarget(rawTarget: string): string {
  const trimmed = rawTarget.trim()

  if (trimmed.startsWith('<')) {
    const closingBracket = trimmed.indexOf('>')
    return closingBracket >= 0 ? trimmed.slice(1, closingBracket) : trimmed
  }

  return trimmed.match(/^(\S+)/)?.[1] ?? trimmed
}

function localPathFromTarget(rawTarget: string): string | null {
  const target = extractTarget(rawTarget)

  if (!target || target.startsWith('#') || target.startsWith('/')) return null
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(target)) return null

  const fragmentIndex = target.indexOf('#')
  const queryIndex = target.indexOf('?')
  const cutIndexes = [fragmentIndex, queryIndex].filter((index) => index >= 0)
  const cutIndex = cutIndexes.length > 0 ? Math.min(...cutIndexes) : target.length
  const path = target.slice(0, cutIndex)

  if (!path) return null

  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

for await (const markdownPath of markdownGlob.scan('.')) {
  if (isIgnoredPath(markdownPath)) continue

  const content = await Bun.file(markdownPath).text()
  const targets = new Set<string>()
  const patterns = [/!?\[[^\]]*]\(([^)\n]+)\)/g, /^\s*\[[^\]]+]:\s*(\S+)/gm]

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      if (match[1]) targets.add(match[1])
    }
  }

  for (const target of targets) {
    const localPath = localPathFromTarget(target)
    if (!localPath) continue

    const resolvedPath = resolve(dirname(markdownPath), localPath)
    if (!(await pathExists(resolvedPath))) {
      errors.push(`${markdownPath}: local link "${target}" does not exist.`)
    }
  }
}

if (errors.length > 0) {
  console.error(errors.sort().join('\n'))
  process.exit(1)
}

console.log('Local Markdown links are valid.')
