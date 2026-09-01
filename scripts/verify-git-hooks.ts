import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { gitText, repositoryRoot } from './secret-guard'

const root = repositoryRoot()
const hooksPath = gitText(root, ['config', '--get', 'core.hooksPath'])
if (hooksPath !== '.husky/_') {
  throw new Error(
    `Expected core.hooksPath to be .husky/_, received ${hooksPath || '<empty>'}. Run \`bun ci\`.`,
  )
}

for (const hook of ['commit-msg', 'pre-commit', 'pre-push']) {
  const sourceHook = join(root, '.husky', hook)
  const installedWrapper = join(root, '.husky', '_', hook)
  if (!existsSync(sourceHook)) {
    throw new Error(`Missing repository-owned Git hook: .husky/${hook}`)
  }
  if (!existsSync(installedWrapper)) {
    throw new Error(`Husky did not install its ${hook} wrapper. Run \`bun ci\`.`)
  }
}

console.log('Husky commit-msg, pre-commit, and pre-push hooks are installed.')
