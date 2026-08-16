import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const license = await readFile(new URL('../LICENSE', import.meta.url), 'utf8')
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(license, /MIT License/u)
assert.match(license, /Copyright \(c\) 2026, chimney \(ccch1mneyyy\)/u)
assert.match(license, /Copyright \(c\) 2026 deepseek-harness-cli contributors/u)
assert.equal(manifest.license, 'MIT')

console.log('license notices OK')
