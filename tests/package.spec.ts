import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('public package', () => {
  it('ships one dsh bundle and one executable', async () => {
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
      name?: string
      bin?: Record<string, string>
      dsh?: { bundle?: { patch?: string } }
      files?: string[]
    }
    expect(manifest.name).toBe('deepseek-harness-cli')
    expect(manifest.bin).toEqual({ 'dsh-cli': 'bin/dsh-cli.js' })
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(manifest.files).toContain('cordis.patch.yml')
  })
})
