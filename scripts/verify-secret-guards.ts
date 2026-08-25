import { forbiddenSecretPath, repositoryRoot, verifySecretlintCanary } from './secret-guard'

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

console.log('Local secret guard canary and path policy passed.')
