import { forbiddenSecretPath, repositoryRoot, verifySecretlintCanary } from './secret-guard'

const root = repositoryRoot()
verifySecretlintCanary(root)

const blockedPaths = [
  '.env',
  '.env.local',
  '.aws/credentials',
  '.kube/config',
  '.docker/config.json',
  'config/client-secret.production.yaml',
  'config/secrets.json',
  'config/service-account.json',
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
  'certificates/public.pem',
  'config/secrets.example.json',
  'config/service-account.template.json',
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

console.log('Local secret guard canary and path policy passed.')
