import { forbiddenSecretPath, repositoryRoot, verifySecretlintCanary } from './secret-guard'

const root = repositoryRoot()
verifySecretlintCanary(root)

const blockedPaths = [
  '.env',
  '.env.local',
  '.aws/credentials',
  '.kube/config',
  '.docker/config.json',
  'deploy/terraform.tfstate',
  'deploy/prod.tfvars',
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
  'docs/config.sample',
  'apps/desktop/src-tauri/icons/icon.png',
  'certificates/public.pem',
]
for (const path of allowedPaths) {
  if (forbiddenSecretPath(path)) {
    throw new Error(`Expected the secret path policy to allow ${path}.`)
  }
}

console.log('Local secret guard canary and path policy passed.')
