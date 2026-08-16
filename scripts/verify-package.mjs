import { readFile } from 'node:fs/promises'

const input = await new Promise((resolve, reject) => {
  let value = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', chunk => { value += chunk })
  process.stdin.on('end', () => resolve(value))
  process.stdin.on('error', reject)
})

const reports = JSON.parse(input)
// npm 10 emits an array while npm 11 emits an object keyed by package name.
const report = Array.isArray(reports) ? reports[0] : Object.values(reports)[0]
if (report === undefined || !Array.isArray(report.files)) {
  throw new Error('npm pack did not return a package file list')
}

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const packed = new Set(report.files.map(file => file.path.replaceAll('\\', '/')))
const targets = new Set()

const addTarget = value => {
  if (typeof value === 'string') targets.add(value.replace(/^\.\//u, ''))
}

addTarget(manifest.main)
addTarget(manifest.types)
for (const target of Object.values(manifest.bin ?? {})) addTarget(target)

const collectExports = value => {
  if (typeof value === 'string') {
    addTarget(value)
    return
  }
  if (value === null || typeof value !== 'object') return
  for (const nested of Object.values(value)) collectExports(nested)
}
collectExports(manifest.exports)

const missing = [...targets].filter(target => !packed.has(target))
if (missing.length > 0) {
  throw new Error(`package exports missing from tarball: ${missing.join(', ')}`)
}
for (const required of [
  'bin/dsh-cli.js',
  'lib/types/index.js',
  'cordis.patch.yml',
  'cordis.yml',
  'LICENSE',
  'README.md',
  'README.zh.md',
]) {
  if (!packed.has(required)) throw new Error(`release file missing from tarball: ${required}`)
}
for (const prefix of ['presets/', 'skills/']) {
  if (![...packed].some(path => path.startsWith(prefix))) {
    throw new Error(`release directory missing from tarball: ${prefix}`)
  }
}
for (const forbidden of ['bin/dsh-tui.js', 'docs/superpowers/', 'test/', 'tests/', 'screenshots/']) {
  if ([...packed].some(path => path === forbidden || path.startsWith(forbidden))) {
    throw new Error(`forbidden release path in tarball: ${forbidden}`)
  }
}
for (const presetFile of [
  'presets/liangshen/agent.cordis.yml',
  'presets/liangshen/preset.yml',
  'presets/liangshen/.dsh-cli-managed.json',
  'presets/liangshen/tool-bootstrap.mjs',
]) {
  if (!packed.has(presetFile)) throw new Error(`packaged preset file missing from tarball: ${presetFile}`)
}
if ([...packed].some(path => path.startsWith('src/'))) {
  throw new Error('npm package unexpectedly contains TypeScript sources')
}
if (packed.has('lib/invariant.js')) {
  throw new Error('npm package contains the obsolete hand-built invariant entry')
}

const workspace = process.cwd()
for (const map of [...packed].filter(path => path.endsWith('.map'))) {
  const content = await readFile(new URL(`../${map}`, import.meta.url), 'utf8')
  if (content.includes(workspace)) {
    throw new Error(`source map exposes the build workspace: ${map}`)
  }
}

await import(new URL(`../${manifest.main}`, import.meta.url))
const invariant = await import(new URL('../lib/types/dsh-adapter/invariant.js', import.meta.url))
if (invariant.name !== 'dsh-cli-invariant' || typeof invariant.apply !== 'function') {
  throw new Error('compiled invariant entry does not expose the expected contract')
}

console.log(`package surface OK (${packed.size} files, ${targets.size} entry targets)`)
