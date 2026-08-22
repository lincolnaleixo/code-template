import { templateFeatures, type TemplateFeature } from '../template.config'

const requiredPaths: Partial<Record<TemplateFeature, string[]>> = {
  web: ['apps/web/package.json'],
  api: ['apps/api/package.json'],
  database: ['packages/db/package.json'],
  authentication: ['packages/auth/package.json'],
  organizations: ['packages/auth/src/permissions.ts'],
  objectStorage: ['packages/storage/package.json'],
  mobile: ['apps/mobile/package.json'],
  desktop: ['apps/desktop/package.json'],
  observability: ['packages/observability/package.json'],
  docker: ['docker-compose.yml'],
  endToEndTests: ['playwright.config.ts', 'tests/e2e/smoke.spec.ts'],
  containerReleases: ['.github/workflows/release-containers.yml'],
  nativeReleases: ['.github/workflows/release-native.yml'],
}

const errors: string[] = []

for (const [feature, enabled] of Object.entries(templateFeatures) as [TemplateFeature, boolean][]) {
  if (!enabled) continue

  for (const path of requiredPaths[feature] ?? []) {
    if (!(await Bun.file(path).exists())) {
      errors.push(`Feature "${feature}" is enabled but required path "${path}" is missing.`)
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('Template feature manifest is consistent.')
