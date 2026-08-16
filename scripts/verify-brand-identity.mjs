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

const pathsSource = await readFile(
  new URL('../src/utils/paths.ts', import.meta.url),
  'utf8',
)

if (!pathsSource.includes("'.dsh-cli'")) {
  failures.push('DATA_DIR is not ~/.dsh-cli')
}

if (!pathsSource.includes("DSH_TUI_THEME: 'DSH_CLI_THEME'")) {
  failures.push('DSH_TUI_THEME compatibility mapping is absent')
}

if (failures.length > 0) {
  throw new Error(`brand identity mismatch:\n${failures.join('\n')}`)
}

console.log('brand identity OK')
