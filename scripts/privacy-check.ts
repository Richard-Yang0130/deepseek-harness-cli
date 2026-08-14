import { readdir, readFile } from 'node:fs/promises'
import { extname, relative } from 'node:path'

const root = new URL('../', import.meta.url)
const skipped = new Set(['.git', '.worktrees', 'coverage', 'lib', 'node_modules'])
const binary = new Set(['.gif', '.jpg', '.jpeg', '.png', '.webp', '.zip'])
const checks: readonly [string, RegExp][] = [
  ['macOS home path', /\/Users\/[^/\s]+\//],
  ['Windows home path', /(?:C:)?\\Users\\[^\\\s]+\\/i],
  ['macOS temporary path', /\/var\/folders\//],
  ['API credential', /(?:sk-[A-Za-z0-9_-]{20,}|api[_-]?key\s*[:=]\s*['"][^'"]{12,})/i],
  ['email address', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
]

async function files(directory: URL): Promise<URL[]> {
  const output: URL[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
    if (entry.isDirectory()) output.push(...await files(url))
    else if (!binary.has(extname(entry.name).toLowerCase())) output.push(url)
  }
  return output
}

const failures: string[] = []
for (const file of await files(root)) {
  const text = await readFile(file, 'utf8')
  for (const [label, pattern] of checks) {
    if (pattern.test(text)) failures.push(`${relative(new URL('.', root).pathname, file.pathname)}: ${label}`)
  }
}
if (failures.length > 0) {
  process.stderr.write(`Privacy check failed:\n${failures.map(item => `- ${item}`).join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write('Privacy check passed.\n')
}
