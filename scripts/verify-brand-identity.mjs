import { readdir, readFile } from 'node:fs/promises'

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

async function sourceFiles(path) {
  const entries = await readdir(new URL(`../${path}/`, import.meta.url), {
    withFileTypes: true,
  })
  const files = []
  for (const entry of entries) {
    const child = `${path}/${entry.name}`
    if (entry.isDirectory()) files.push(...await sourceFiles(child))
    else files.push(child)
  }
  return files
}

async function markdownFiles(path) {
  return (await sourceFiles(path)).filter(file => file.endsWith('.md') && !file.startsWith('docs/superpowers/'))
}

const visibleBrandFiles = [
  ...await sourceFiles('src'),
  ...await sourceFiles('bin'),
  'cordis.patch.yml',
  'cordis.yml',
]
const forbiddenVisibleBrands = [
  '@deepseek-harness-tui/dsh-tui',
  '[dsh-tui]',
  'dsh --profile dsh-tui',
  'dsh-TUI',
]

for (const file of visibleBrandFiles) {
  const content = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
  for (const forbidden of forbiddenVisibleBrands) {
    if (content.includes(forbidden)) failures.push(`${file}: ${forbidden}`)
  }
}

const documentationFiles = ['README.md', 'README.zh.md', ...await markdownFiles('docs')]
const forbiddenDocumentationContracts = [
  '@deepseek-harness-tui/dsh-tui',
  'npm install -g dsh-tui',
  'dsh --profile dsh-tui',
  'DSH_TUI_',
  'CC_TUI_',
  'DSH_CC_',
]
for (const file of documentationFiles) {
  const content = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
  for (const forbidden of forbiddenDocumentationContracts) {
    if (content.includes(forbidden)) failures.push(`${file}: ${forbidden}`)
  }
}

for (const file of ['README.md', 'README.zh.md']) {
  const content = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
  for (const required of [
    'npm install -g @deepseek-ai/dsh deepseek-harness-cli',
    'dsh-cli',
    'dsh-cli --resume',
    'dsh-cli doctor',
    '~/.dsh-cli',
    'DSH_CLI_',
  ]) {
    if (!content.includes(required)) failures.push(`${file}: missing ${required}`)
  }
}

if (failures.length > 0) {
  throw new Error(`brand identity mismatch:\n${failures.join('\n')}`)
}

console.log('brand identity OK')
