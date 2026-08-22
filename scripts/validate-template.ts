import { templateFeatures, type TemplateFeature } from '../template.config'

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  exports?: Record<string, unknown>
  imports?: Record<string, string>
  packageManager?: string
  peerDependencies?: Record<string, string>
  version?: string
  workspaces?: {
    catalog?: Record<string, string>
  }
}

interface ShadcnConfig {
  aliases?: Record<string, string>
  iconLibrary?: string
  rsc?: boolean
  style?: string
  tailwind?: {
    baseColor?: string
    config?: string
    cssVariables?: boolean
    prefix?: string
  }
  tsx?: boolean
}

const requiredPaths: Partial<Record<TemplateFeature, string[]>> = {
  web: ['apps/web/package.json'],
  ui: [
    'apps/web/components.json',
    'apps/web/public/appearance-bootstrap.js',
    'apps/web/src/brand.css',
    'apps/web/src/routes/ui.tsx',
    'apps/web/src/routes/ui-advanced.tsx',
    'packages/ui/components.json',
    'packages/ui/package.json',
    'packages/ui/src/index.ts',
    'packages/ui/src/styles.css',
    'packages/ui/src/theme-provider.tsx',
  ],
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
    'apps/desktop/src-tauri/tauri.conf.json',
  ],
  observability: [
    'packages/observability/package.json',
    'infra/otel-collector.yaml',
    'infra/prometheus.yml',
  ],
  docker: ['docker-compose.yml', 'apps/api/Dockerfile', 'apps/web/Dockerfile'],
  endToEndTests: ['playwright.config.ts', 'tests/e2e/smoke.spec.ts'],
  containerReleases: ['.github/workflows/release-containers.yml'],
  nativeReleases: ['.github/workflows/release-native.yml'],
}

const featureDependencies: Partial<Record<TemplateFeature, TemplateFeature[]>> = {
  ui: ['web'],
  authentication: ['api', 'database'],
  organizations: ['authentication'],
  mobile: ['web'],
  desktop: ['web'],
  observability: ['api'],
  docker: ['api', 'database', 'web'],
  endToEndTests: ['api', 'docker', 'web'],
  containerReleases: ['api', 'docker', 'web'],
  nativeReleases: ['desktop', 'mobile', 'web'],
}

const alwaysRequired = [
  '.editorconfig',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/ISSUE_TEMPLATE/feature_request.yml',
  '.github/pull_request_template.md',
  'AGENTS.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'README.md',
  'RULES.md',
  'SECURITY.md',
  'bun.lock',
  'docs/architecture.md',
  'docs/deployment.md',
  'docs/native.md',
  'docs/project-bootstrap.md',
  'docs/release.md',
  'docs/template-customization.md',
  'docs/ui.md',
  'package.json',
  'scripts/check-doc-links.ts',
  'template.config.ts',
]

const errors: string[] = []
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

async function pathExists(path: string): Promise<boolean> {
  return Bun.file(path).exists()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

for (const path of alwaysRequired) {
  if (!(await pathExists(path))) errors.push(`Required path "${path}" is missing.`)
}

for (const [feature, enabled] of Object.entries(templateFeatures) as [TemplateFeature, boolean][]) {
  const paths = requiredPaths[feature] ?? []

  if (enabled) {
    for (const dependency of featureDependencies[feature] ?? []) {
      if (!templateFeatures[dependency]) {
        errors.push(`Feature "${feature}" requires enabled feature "${dependency}".`)
      }
    }

    for (const path of paths) {
      if (!(await pathExists(path))) {
        errors.push(`Feature "${feature}" is enabled but required path "${path}" is missing.`)
      }
    }
  } else {
    for (const path of paths) {
      if (await pathExists(path)) {
        errors.push(`Feature "${feature}" is disabled but path "${path}" still exists.`)
      }
    }
  }
}

const rootManifest = (await Bun.file('package.json').json()) as PackageManifest
const catalog = rootManifest.workspaces?.catalog ?? {}
const rootVersion = rootManifest.version ?? ''

if (!exactVersion.test(rootVersion)) {
  errors.push(`Root package version must be exact semantic versioning, received "${rootVersion}".`)
}

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

const changelog = await Bun.file('CHANGELOG.md').text()
if (!changelog.includes('## [Unreleased]')) {
  errors.push('CHANGELOG.md must keep an Unreleased section.')
}
if (rootVersion && !changelog.includes(`## [${rootVersion}] - `)) {
  errors.push(`CHANGELOG.md does not contain a dated release section for version ${rootVersion}.`)
}

for (const path of ['docker-compose.yml', 'apps/api/Dockerfile', 'apps/web/Dockerfile']) {
  if (!(await pathExists(path))) continue
  const content = await Bun.file(path).text()
  if (content.includes(':latest')) errors.push(`${path} contains a mutable Docker image tag.`)
}

if (templateFeatures.ui) {
  const literalPaletteClass =
    /(?:bg|border|fill|from|ring|stroke|text|to|via)-(?:amber|blue|cyan|emerald|fuchsia|gray|green|indigo|lime|neutral|orange|pink|purple|red|rose|sky|slate|stone|teal|violet|yellow|zinc)-\d{2,3}/
  const uiSourceGlob = new Bun.Glob('packages/ui/src/**/*.{ts,tsx}')

  for await (const path of uiSourceGlob.scan('.')) {
    const content = await Bun.file(path).text()
    if (literalPaletteClass.test(content)) {
      errors.push(`${path} hardcodes a palette color instead of using a semantic token.`)
    }
  }

  const rootRoute = await Bun.file('apps/web/src/routes/__root.tsx').text()
  if (!rootRoute.includes('src="/appearance-bootstrap.js"')) {
    errors.push('The web root must load the external appearance bootstrap.')
  }
  if (rootRoute.includes('dangerouslySetInnerHTML')) {
    errors.push('The web root must not use an inline appearance script.')
  }

  const webConfig = (await Bun.file('apps/web/components.json').json()) as ShadcnConfig
  const uiConfig = (await Bun.file('packages/ui/components.json').json()) as ShadcnConfig

  for (const property of ['style', 'iconLibrary'] as const) {
    if (webConfig[property] !== uiConfig[property]) {
      errors.push(`Shadcn ${property} must match in web and UI workspace configurations.`)
    }
  }

  for (const property of ['baseColor', 'cssVariables', 'prefix'] as const) {
    if (webConfig.tailwind?.[property] !== uiConfig.tailwind?.[property]) {
      errors.push(`Shadcn tailwind.${property} must match in web and UI workspace configurations.`)
    }
  }

  for (const [path, config] of [
    ['apps/web/components.json', webConfig],
    ['packages/ui/components.json', uiConfig],
  ] as const) {
    if (config.rsc !== false) errors.push(`${path} must keep rsc=false for the TanStack Start setup.`)
    if (config.tsx !== true) errors.push(`${path} must keep tsx=true.`)
    if (config.tailwind?.config !== '') {
      errors.push(`${path} must leave tailwind.config empty for Tailwind CSS v4.`)
    }
    if (config.tailwind?.cssVariables !== true) {
      errors.push(`${path} must keep semantic CSS variables enabled.`)
    }
  }

  const webManifest = (await Bun.file('apps/web/package.json').json()) as PackageManifest
  const uiManifest = (await Bun.file('packages/ui/package.json').json()) as PackageManifest

  for (const alias of ['#components/*', '#hooks/*', '#lib/*']) {
    if (!webManifest.imports?.[alias]) errors.push(`apps/web/package.json is missing import alias "${alias}".`)
    if (!uiManifest.imports?.[alias]) errors.push(`packages/ui/package.json is missing import alias "${alias}".`)
  }

  for (const exportPath of ['.', './styles.css', './components/*', './lib/*', './patterns/*']) {
    if (!(exportPath in (uiManifest.exports ?? {}))) {
      errors.push(`packages/ui/package.json is missing export "${exportPath}".`)
    }
  }

  const tsconfig = (await Bun.file('tsconfig.json').json()) as {
    compilerOptions?: { resolvePackageJsonImports?: boolean }
  }
  if (tsconfig.compilerOptions?.resolvePackageJsonImports !== true) {
    errors.push('tsconfig.json must enable resolvePackageJsonImports for workspace aliases.')
  }
}

if (templateFeatures.desktop) {
  const tauriConfig = (await Bun.file('apps/desktop/src-tauri/tauri.conf.json').json()) as {
    app?: { security?: { csp?: string } }
    version?: string
  }
  const cargoToml = await Bun.file('apps/desktop/src-tauri/Cargo.toml').text()
  const cargoLock = await Bun.file('apps/desktop/src-tauri/Cargo.lock').text()
  const cargoName = cargoToml.match(/^name\s*=\s*"([^"]+)"/m)?.[1]
  const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1]

  if (!tauriConfig.app?.security?.csp?.includes("script-src 'self'")) {
    errors.push('The Tauri CSP must keep scripts restricted to same-origin resources.')
  }
  if (tauriConfig.version !== rootVersion) {
    errors.push(`Tauri config version ${tauriConfig.version ?? '<missing>'} must match ${rootVersion}.`)
  }
  if (cargoVersion !== rootVersion) {
    errors.push(`Cargo.toml version ${cargoVersion ?? '<missing>'} must match ${rootVersion}.`)
  }

  if (cargoName) {
    const lockPattern = new RegExp(
      `\\[\\[package\\]\\]\\s+name = "${escapeRegExp(cargoName)}"\\s+version = "([^"]+)"`,
    )
    const lockVersion = cargoLock.match(lockPattern)?.[1]
    if (lockVersion !== rootVersion) {
      errors.push(`Cargo.lock version ${lockVersion ?? '<missing>'} must match ${rootVersion}.`)
    }
  } else {
    errors.push('Cargo.toml package name is missing.')
  }
}

if (errors.length > 0) {
  console.error(errors.sort().join('\n'))
  process.exit(1)
}

console.log('Template capabilities, versions, UI contracts, and dependency policies are consistent.')
