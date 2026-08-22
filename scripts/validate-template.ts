import { templateFeatures, type TemplateFeature } from '../template.config'

interface PackageManifest {
  packageManager?: string
  workspaces?: {
    catalog?: Record<string, string>
  }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const requiredPaths: Partial<Record<TemplateFeature, string[]>> = {
  web: ['apps/web/package.json'],
  api: ['apps/api/package.json'],
  database: ['packages/db/package.json', 'packages/db/drizzle/meta/_journal.json'],
  authentication: ['packages/auth/package.json', 'packages/db/src/auth-schema.ts'],
  organizations: ['packages/auth/src/permissions.ts', 'packages/db/src/project-schema.ts'],
  objectStorage: ['packages/storage/package.json'],
  mobile: ['apps/mobile/package.json', 'apps/mobile/capacitor.config.ts'],
  desktop: [
    'apps/desktop/package.json',
    'apps/desktop/src-tauri/Cargo.toml',
    'apps/desktop/src-tauri/Cargo.lock',
  ],
  observability: ['packages/observability/package.json', 'infra/otel-collector.yaml', 'infra/prometheus.yml'],
  docker: ['docker-compose.yml', 'apps/api/Dockerfile', 'apps/web/Dockerfile'],
  endToEndTests: ['playwright.config.ts', 'tests/e2e/smoke.spec.ts'],
  containerReleases: ['.github/workflows/release-containers.yml'],
  nativeReleases: ['.github/workflows/release-native.yml'],
}

const alwaysRequired = [
  'AGENTS.md',
  'CHANGELOG.md',
  'README.md',
  'RULES.md',
  'SECURITY.md',
  'bun.lock',
  'package.json',
  'template.config.ts',
]

const errors: string[] = []

for (const path of alwaysRequired) {
  if (!(await Bun.file(path).exists())) errors.push(`Required path "${path}" is missing.`)
}

for (const [feature, enabled] of Object.entries(templateFeatures) as [TemplateFeature, boolean][]) {
  if (!enabled) continue

  for (const path of requiredPaths[feature] ?? []) {
    if (!(await Bun.file(path).exists())) {
      errors.push(`Feature "${feature}" is enabled but required path "${path}" is missing.`)
    }
  }
}

const rootManifest = (await Bun.file('package.json').json()) as PackageManifest
const catalog = rootManifest.workspaces?.catalog ?? {}
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

if (!/^bun@\d+\.\d+\.\d+$/.test(rootManifest.packageManager ?? '')) {
  errors.push('packageManager must pin an exact Bun version.')
}

for (const [dependency, version] of Object.entries(catalog)) {
  if (!exactVersion.test(version)) {
    errors.push(`Catalog dependency "${dependency}" must use an exact version, received "${version}".`)
  }
}

const manifestGlob = new Bun.Glob('{apps,packages}/*/package.json')
for await (const path of manifestGlob.scan('.')) {
  const manifest = (await Bun.file(path).json()) as PackageManifest

  for (const group of [manifest.dependencies, manifest.devDependencies, manifest.peerDependencies]) {
    for (const [dependency, version] of Object.entries(group ?? {})) {
      const allowed = version === 'catalog:' || version.startsWith('workspace:') || exactVersion.test(version)
      if (!allowed) {
        errors.push(`${path}: dependency "${dependency}" has an open version "${version}".`)
      }
    }
  }
}

for (const path of ['docker-compose.yml', 'apps/api/Dockerfile', 'apps/web/Dockerfile']) {
  if (!(await Bun.file(path).exists())) continue
  const content = await Bun.file(path).text()
  if (content.includes(':latest')) errors.push(`${path} contains a mutable Docker image tag.`)
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('Template features, lockfiles and dependency versions are consistent.')
