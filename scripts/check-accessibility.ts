import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const axePlaywrightVersion = '4.11.3'
const playwrightVersion = '1.62.1'
const baseUrl = (process.env.E2E_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '')
const routes = (process.env.A11Y_ROUTES ?? '/,/ui,/ui-advanced')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean)
const colorSchemes = (process.env.A11Y_COLOR_SCHEMES ?? 'light,dark')
  .split(',')
  .map((scheme) => scheme.trim())
  .filter((scheme): scheme is 'light' | 'dark' => scheme === 'light' || scheme === 'dark')
const outputDirectory = resolve(process.env.A11Y_RESULTS_DIR ?? 'test-results/accessibility')
const keepWorkspace = process.env.KEEP_A11Y_WORKSPACE === '1'

if (routes.length === 0) throw new Error('A11Y_ROUTES must contain at least one route.')
if (colorSchemes.length === 0) {
  throw new Error('A11Y_COLOR_SCHEMES must contain light, dark, or both.')
}

async function run(command: string[], cwd: string, env: Record<string, string>): Promise<void> {
  const child = Bun.spawn(command, {
    cwd,
    env: { ...process.env, ...env },
    stderr: 'inherit',
    stdout: 'inherit',
  })

  const exitCode = await child.exited
  if (exitCode !== 0) {
    throw new Error(`Command failed with exit code ${exitCode}: ${command.join(' ')}`)
  }
}

const workspace = await mkdtemp(join(tmpdir(), 'matrix-accessibility-'))

const scannerSource = `
import AxeBuilder from '@axe-core/playwright'
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const baseUrl = process.env.SCAN_BASE_URL
const outputDirectory = process.env.SCAN_OUTPUT_DIRECTORY
const routes = JSON.parse(process.env.SCAN_ROUTES_JSON ?? '[]')
const colorSchemes = JSON.parse(process.env.SCAN_COLOR_SCHEMES_JSON ?? '[]')
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

if (!baseUrl || !outputDirectory) throw new Error('Accessibility scanner configuration is incomplete.')

function slug(route, colorScheme) {
  const routeSlug = route === '/' ? 'home' : route.replace(/^\\/+|\\/+$/g, '').replace(/[^a-z0-9]+/gi, '-')
  return \`\${routeSlug || 'page'}-\${colorScheme}\`
}

function printViolation(route, colorScheme, violation) {
  console.error(\`\\n[\${violation.impact ?? 'unknown'}] \${violation.id} on \${route} (\${colorScheme})\`)
  console.error(violation.help)
  console.error(violation.helpUrl)

  for (const node of violation.nodes) {
    console.error(\`  target: \${node.target.join(' > ')}\`)
    console.error(\`  summary: \${node.failureSummary ?? 'No failure summary provided.'}\`)
  }
}

await mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch({ headless: true })
let violationCount = 0

try {
  for (const colorScheme of colorSchemes) {
    const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce' })

    try {
      for (const route of routes) {
        const page = await context.newPage()
        const url = new URL(route, \`\${baseUrl}/\`).toString()
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' })

        if (!response?.ok()) {
          throw new Error(\`Accessibility target returned HTTP \${response?.status() ?? 'unknown'}: \${url}\`)
        }

        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)

        const results = await new AxeBuilder({ page }).withTags(tags).analyze()
        const reportPath = join(outputDirectory, \`\${slug(route, colorScheme)}.json\`)
        await writeFile(reportPath, \`\${JSON.stringify(results, null, 2)}\\n\`)

        if (results.violations.length === 0) {
          console.log(\`Accessibility passed: \${route} (\${colorScheme})\`)
        } else {
          violationCount += results.violations.length
          for (const violation of results.violations) printViolation(route, colorScheme, violation)
        }

        await page.close()
      }
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}

if (violationCount > 0) {
  console.error(\`\\nAccessibility audit failed with \${violationCount} rule violation(s).\`)
  process.exit(1)
}

console.log('Accessibility audit passed for every configured route and color scheme.')
`

try {
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(
    join(workspace, 'package.json'),
    `${JSON.stringify(
      {
        private: true,
        type: 'module',
        dependencies: {
          '@axe-core/playwright': axePlaywrightVersion,
          playwright: playwrightVersion,
        },
      },
      null,
      2,
    )}\n`,
  )
  await writeFile(
    join(workspace, 'bunfig.toml'),
    '[install]\nlinker = "isolated"\nminimumReleaseAge = 259200\n',
  )
  await writeFile(join(workspace, 'scan.ts'), scannerSource)

  console.log(
    `Installing isolated accessibility tools: @axe-core/playwright@${axePlaywrightVersion} and playwright@${playwrightVersion}`,
  )
  await run(['bun', 'install', '--ignore-scripts'], workspace, {})
  await run(['bun', 'run', 'scan.ts'], workspace, {
    SCAN_BASE_URL: baseUrl,
    SCAN_COLOR_SCHEMES_JSON: JSON.stringify(colorSchemes),
    SCAN_OUTPUT_DIRECTORY: outputDirectory,
    SCAN_ROUTES_JSON: JSON.stringify(routes),
  })
} finally {
  if (keepWorkspace) console.log(`Accessibility tool workspace retained at ${workspace}`)
  else await rm(workspace, { force: true, recursive: true })
}
