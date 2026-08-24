async function run(command: string[]): Promise<void> {
  const process = Bun.spawn(command, {
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const exitCode = await process.exited
  if (exitCode !== 0) process.exit(exitCode)
}

await run(['bun', 'run', 'auth:generate'])
await run(['bun', 'run', 'db:generate'])
await run(['bunx', 'biome', 'check', '--write', 'packages/db/src/auth-schema.ts'])

const statusProcess = Bun.spawn(
  ['git', 'status', '--porcelain', '--', 'packages/db/src/auth-schema.ts', 'packages/db/drizzle'],
  { stdout: 'pipe', stderr: 'inherit' },
)

const status = await new Response(statusProcess.stdout).text()
const exitCode = await statusProcess.exited

if (exitCode !== 0) process.exit(exitCode)

if (status.trim()) {
  console.error('Generated database artifacts are not current:')
  console.error(status.trim())
  process.exit(1)
}

console.log('Generated auth schema and Drizzle migrations are current.')
