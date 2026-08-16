import { spawnSync } from 'node:child_process'

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const commands = [
  ['build'],
  ['verify:brand'],
  ['verify:license'],
  ['verify:profile-migration'],
  ['verify:launcher-compat'],
  ['verify:legacy-commands'],
  ['verify:dynamic-commands'],
  ['verify:plain-reporter'],
  ['smoke'],
  ['verify:package'],
]

for (const args of commands) {
  const label = `${pnpm} ${args.join(' ')}`
  console.log(`\n[release] ${label}`)
  const result = spawnSync(pnpm, args, { stdio: 'inherit' })
  if (result.error !== undefined) {
    console.error(`[release] failed to start: ${label}\n${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) {
    console.error(`[release] failed: ${label}`)
    process.exit(result.status ?? 1)
  }
}

console.log('\nrelease gate OK')
