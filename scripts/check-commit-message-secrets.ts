import { readFile } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { repositoryRoot, scanSecretBlob, verifySecretlintCanary } from './secret-guard'

const messageFile = process.argv[2]
if (!messageFile) {
  throw new Error('The commit-msg hook requires Git to provide a commit message file.')
}

const root = repositoryRoot()
const messagePath = isAbsolute(messageFile) ? messageFile : resolve(root, messageFile)
const message = await readFile(messagePath)

if (message.byteLength === 0) {
  process.exit(0)
}

verifySecretlintCanary(root)
if (!scanSecretBlob(root, '.git-commit-message.txt', message)) {
  console.error('Secret guard blocked the commit message. Remove the sensitive value and retry.')
  process.exit(1)
}

console.log('Commit message secret guard passed.')
