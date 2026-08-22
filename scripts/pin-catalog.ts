import { dirname, join } from 'node:path'

interface PackageManifest {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const rootPath = join(process.cwd(), 'package.json')
const rootManifest = (await Bun.file(rootPath).json()) as PackageManifest & {
  workspaces: { catalog: Record<string, string> }
}

const manifestPaths = [rootPath]
for (const pattern of ['apps/*/package.json', 'packages/*/package.json']) {
  const glob = new Bun.Glob(pattern)
  for await (const path of glob.scan({ cwd: process.cwd(), absolute: true })) manifestPaths.push(path)
}

const manifests = await Promise.all(
  manifestPaths.map(async (path) => ({
    directory: dirname(path),
    manifest: (await Bun.file(path).json()) as PackageManifest,
  })),
)

function usesCatalog(manifest: PackageManifest, dependency: string): boolean {
  return [manifest.dependencies, manifest.devDependencies, manifest.peerDependencies].some(
    (group) => group?.[dependency]?.startsWith('catalog:') ?? false,
  )
}

async function readInstalledManifest(directory: string, dependency: string): Promise<PackageManifest | null> {
  const packagePath = join(directory, 'node_modules', dependency, 'package.json')
  if (!(await Bun.file(packagePath).exists())) return null
  return (await Bun.file(packagePath).json()) as PackageManifest
}

async function findResolvedVersion(dependency: string): Promise<string> {
  const candidateDirectories = [
    ...manifests.filter(({ manifest }) => usesCatalog(manifest, dependency)).map(({ directory }) => directory),
    process.cwd(),
  ]

  for (const directory of new Set(candidateDirectories)) {
    const manifest = await readInstalledManifest(directory, dependency)
    if (manifest?.name === dependency && manifest.version) return manifest.version
  }

  throw new Error(`Unable to resolve installed version for catalog dependency "${dependency}".`)
}

for (const dependency of Object.keys(rootManifest.workspaces.catalog).sort()) {
  rootManifest.workspaces.catalog[dependency] = await findResolvedVersion(dependency)
}

await Bun.write(rootPath, `${JSON.stringify(rootManifest, null, 2)}\n`)
console.log(`Pinned ${Object.keys(rootManifest.workspaces.catalog).length} catalog dependencies.`)
