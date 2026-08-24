import { templateFeatures, type TemplateFeature } from '../template.config'

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  exports?: Record<string, unknown>
  imports?: Record<string, string>
  license?: string
  packageManager?: string
  peerDependencies?: Record<string, string>
  version?: string
  workspaces?: {
    catalog?: Record<string, string>
  }
}

interface ReleasePleaseExtraFile {
  jsonpath?: string
  path?: string
  type?: string
}

interface ReleasePleaseSection {
  hidden?: boolean
  section?: string
  type?: string
}

interface ReleasePleasePackage {
  'changelog-path'?: string
  'changelog-sections'?: ReleasePleaseSection[]
  'extra-files'?: ReleasePleaseExtraFile[]
  'release-type'?: string
  'skip-github-release'?: boolean
  'version-file'?: string
}

interface ReleasePleaseConfig {
  'bump-minor-pre-major'?: boolean
  'bump-patch-for-minor-pre-major'?: boolean
  'include-component-in-tag'?: boolean
  'include-v-in-tag'?: boolean
  packages?: Record<string, ReleasePleasePackage>
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
  endToEndTests: [
    'playwright.config.ts',
    'scripts/check-accessibility.ts',
    'tests/e2e/smoke.spec.ts',
  ],
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
  '.github/workflows/release-please.yml',
  '.release-please-manifest.json',
  'AGENTS.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'README.md',
  'RULES.md',
  'SECURITY.md',
  'bun.lock',
  'docs/architecture.md',
  'docs/release.md',
  'docs/template-customization.md',
  'package.json',
  'release-please-config.json',
  'template.config.ts',
  'version.txt',
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
const releaseVersion = (await Bun.file('version.txt').text()).trim()
const releaseManifest = (await Bun.file('.release-please-manifest.json').json()) as Record<
  string,
  string
>
const releaseConfig = (await Bun.file('release-please-config.json').json()) as ReleasePleaseConfig
const rootReleaseConfig = releaseConfig.packages?.['.']
const releaseWorkflow = await Bun.file('.github/workflows/release-please.yml').text()

if (!exactVersion.test(rootVersion)) {
  errors.push(`Root package version must be exact semantic versioning, received "${rootVersion}".`)
}
if (!exactVersion.test(releaseVersion)) {
  errors.push(`version.txt must contain an exact semantic version, received "${releaseVersion}".`)
}
if (releaseVersion !== rootVersion) {
  errors.push(`version.txt version ${releaseVersion || '<missing>'} must match ${rootVersion}.`)
}
if (releaseManifest['.'] !== rootVersion) {
  errors.push(
    `Release Please manifest version ${releaseManifest['.'] ?? '<missing>'} must match ${rootVersion}.`,
  )
}

if (!rootReleaseConfig) {
  errors.push('release-please-config.json must configure the repository root package.')
} else {
  if (rootReleaseConfig['release-type'] !== 'simple') {
    errors.push('Release Please must use the simple release strategy for the repository root.')
  }
  if (rootReleaseConfig['version-file'] !== 'version.txt') {
    errors.push('Release Please must own version.txt as its version file.')
  }
  if (rootReleaseConfig['changelog-path'] !== 'CHANGELOG.md') {
    errors.push('Release Please must own CHANGELOG.md.')
  }
  if (rootReleaseConfig['skip-github-release'] !== false) {
    errors.push('Release Please must create the canonical GitHub Release.')
  }

  const requiredExtraFiles = [
    ['json', 'package.json', '$.version'],
    ['json', 'apps/desktop/src-tauri/tauri.conf.json', '$.version'],
    ['toml', 'apps/desktop/src-tauri/Cargo.toml', '$.package.version'],
  ] as const

  for (const [type, path, jsonpath] of requiredExtraFiles) {
    const configured = rootReleaseConfig['extra-files']?.some(
      (extra) => extra.type === type && extra.path === path && extra.jsonpath === jsonpath,
    )
    if (!configured) {
      errors.push(`Release Please is missing the ${path} version update at ${jsonpath}.`)
    }
  }

  const visibleTypes = ['feat', 'fix', 'perf', 'deps', 'security']
  const hiddenTypes = ['docs', 'refactor', 'test', 'build', 'ci', 'chore']
  const sections = rootReleaseConfig['changelog-sections'] ?? []

  for (const type of visibleTypes) {
    const section = sections.find((candidate) => candidate.type === type)
    if (!section || section.hidden === true) {
      errors.push(`Release Please changelog type "${type}" must remain user-visible.`)
    }
  }
  for (const type of hiddenTypes) {
    const section = sections.find((candidate) => candidate.type === type)
    if (!section || section.hidden !== true) {
      errors.push(`Release Please changelog type "${type}" must remain hidden.`)
    }
  }
}

if (releaseConfig['include-component-in-tag'] !== false) {
  errors.push('Release tags must not include a component prefix.')
}
if (releaseConfig['include-v-in-tag'] !== true) {
  errors.push('Release tags must keep the v prefix.')
}
if (releaseConfig['bump-minor-pre-major'] !== false) {
  errors.push('Breaking changes must use strict SemVer major bumps, including before 1.0.0.')
}
if (releaseConfig['bump-patch-for-minor-pre-major'] !== false) {
  errors.push('Features must use strict SemVer minor bumps, including before 1.0.0.')
}

const publisherReferences = [
  ['containerReleases', './.github/workflows/release-containers.yml'],
  ['nativeReleases', './.github/workflows/release-native.yml'],
] as const

for (const [feature, workflow] of publisherReferences) {
  const referenced = releaseWorkflow.includes(`uses: ${workflow}`)
  if (templateFeatures[feature] && !referenced) {
    errors.push(`Release Please must invoke ${workflow} while ${feature} is enabled.`)
  }
  if (!templateFeatures[feature] && referenced) {
    errors.push(`Release Please must stop invoking ${workflow} when ${feature} is disabled.`)
  }
}

if (!rootManifest.license?.trim()) {
  errors.push('Root package license policy must be explicit.')
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
if (rootVersion) {
  const releaseHeading = new RegExp(`^##\\s+\\[?${escapeRegExp(rootVersion)}\\]?(?:\\s|\\(|$)`, 'm')
  if (!releaseHeading.test(changelog)) {
    errors.push(`CHANGELOG.md does not contain a release section for version ${rootVersion}.`)
  }
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

    const cargoLockExtra = rootReleaseConfig?.['extra-files']?.find(
      (extra) => extra.type === 'toml' && extra.path === 'apps/desktop/src-tauri/Cargo.lock',
    )
    const cargoLockIndexMatch = cargoLockExtra?.jsonpath?.match(/^\$\.package\[(\d+)\]\.version$/)
    if (!cargoLockIndexMatch) {
      errors.push('Release Please must target the root Cargo.lock package version by array index.')
    } else {
      const configuredIndex = Number(cargoLockIndexMatch[1])
      const cargoPackages = [
        ...cargoLock.matchAll(/\[\[package\]\]\s+name = "([^"]+)"\s+version = "([^"]+)"/g),
      ]
      const configuredPackage = cargoPackages[configuredIndex]
      if (configuredPackage?.[1] !== cargoName) {
        errors.push(
          `Release Please Cargo.lock index ${configuredIndex} points to ${configuredPackage?.[1] ?? '<missing>'} instead of ${cargoName}.`,
        )
      }
    }
  } else {
    errors.push('Cargo.toml package name is missing.')
  }
}

if (errors.length > 0) {
  console.error(errors.sort().join('\n'))
  process.exit(1)
}

console.log('Template capabilities, release automation, versions, UI contracts, and dependency policies are consistent.')
