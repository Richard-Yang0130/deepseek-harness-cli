import { readFile } from 'node:fs/promises'

const manifest = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

const failures = []

if (manifest.name !== 'deepseek-harness-cli') {
  failures.push(`package name: ${manifest.name}`)
}

if (JSON.stringify(manifest.bin) !== JSON.stringify({ 'dsh-cli': './bin/dsh-cli.js' })) {
  failures.push(`bin: ${JSON.stringify(manifest.bin)}`)
}

if (manifest.dsh?.bundle?.patch !== './cordis.patch.yml') {
  failures.push('bundle patch export')
}

if (failures.length > 0) {
  throw new Error(`brand identity mismatch:\n${failures.join('\n')}`)
}

console.log('brand identity OK')
