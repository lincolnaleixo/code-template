import { forbiddenSecretPath, repositoryRoot, verifySecretlintCanary } from './secret-guard'

const expectedIgnoredBinaryPatterns = [
  'apps/desktop/src-tauri/icons/*.gif',
  'apps/desktop/src-tauri/icons/*.icns',
  'apps/desktop/src-tauri/icons/*.ico',
  'apps/desktop/src-tauri/icons/*.jpeg',
  'apps/desktop/src-tauri/icons/*.jpg',
  'apps/desktop/src-tauri/icons/*.png',
  'apps/desktop/src-tauri/icons/*.webp',
]
const configuredIgnorePatterns = (await Bun.file('.secretlintignore').text())
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith('#'))
const expectedIgnoreSet = new Set(expectedIgnoredBinaryPatterns)
const configuredIgnoreSet = new Set(configuredIgnorePatterns)
const unexpectedIgnorePatterns = configuredIgnorePatterns.filter(
  (pattern) => !expectedIgnoreSet.has(pattern),
)
const missingIgnorePatterns = expectedIgnoredBinaryPatterns.filter(
  (pattern) => !configuredIgnoreSet.has(pattern),
)

if (
  configuredIgnoreSet.size !== configuredIgnorePatterns.length ||
  unexpectedIgnorePatterns.length > 0 ||
  missingIgnorePatterns.length > 0
) {
  throw new Error(
    [
      'Secretlint ignore policy must contain only the reviewed desktop binary patterns.',
      unexpectedIgnorePatterns.length > 0
        ? `Unexpected: ${unexpectedIgnorePatterns.join(', ')}`
        : undefined,
      missingIgnorePatterns.length > 0 ? `Missing: ${missingIgnorePatterns.join(', ')}` : undefined,
      configuredIgnoreSet.size !== configuredIgnorePatterns.length
        ? 'Duplicate ignore patterns are not allowed.'
        : undefined,
    ]
      .filter(Boolean)
      .join(' '),
  )
}

if (process.argv.includes('--ignore-only')) {
  console.log('Local secret ignore policy passed.')
  process.exit(0)
}

const root = repositoryRoot()
verifySecretlintCanary(root)

const blockedPaths = [
  '.env',
  '.env.local',
  '.aws/credentials',
  '.aws/credentials.example',
  '.kube/config',
  '.docker/config.json',
  'config/client-secret.production.yaml',
  'config/client-secret.team-a.yaml',
  'config/secrets.json',
  'config/service-account.json',
  'deploy/prod.auto.tfvars',
  'deploy/prod.auto.tfvars.json',
  'deploy/prod.tfvars',
  'deploy/terraform.tfstate',
  'deploy/terraform.tfstate.backup',
  'signing/release.example.p12',
  'signing/release.p12',
  'ssh/id_ed25519',
]
for (const path of blockedPaths) {
  if (!forbiddenSecretPath(path)) {
    throw new Error(`Expected the secret path policy to block ${path}.`)
  }
}

const allowedPaths = [
  '.env.example',
  '.env.local.template',
  'certificates/public.pem',
  'config/secrets.example.json',
  'config/service-account.template.json',
  'deploy/example.tfvars',
  'deploy/prod.sample.auto.tfvars.json',
  'deploy/terraform.tfstate.example',
  'docs/config.sample',
  'scripts/check-push-secrets.ts',
  'scripts/check-staged-secrets.ts',
  'src/secrets-manager.ts',
]
for (const path of allowedPaths) {
  if (forbiddenSecretPath(path)) {
    throw new Error(`Expected the secret path policy to allow ${path}.`)
  }
}

console.log('Local secret guard canary, ignore policy, and path policy passed.')
