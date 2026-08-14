import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseLatestChangelogEntry, readBannerFacts } from '../src/banner-facts.js'

describe('banner facts', () => {
  it('parses only the latest changelog section and caps it at three bullets', () => {
    const markdown = `# Changelog

## 0.2.0 — 2026-08-14

- First change
- Second change
- Third change
- Fourth change

## 0.1.0 — 2026-08-13

- Old change
`
    expect(parseLatestChangelogEntry(markdown)).toEqual({
      version: '0.2.0',
      bullets: ['First change', 'Second change', 'Third change'],
    })
  })

  it.each([
    ['a document without a release heading', '# Changelog\n\nNothing yet.'],
    ['an empty document', ''],
    ['a release heading without bullets', '## 0.2.0 — 2026-08-14\n\n## 0.1.0 — 2026-08-13'],
  ])('returns undefined for %s', (_label, markdown) => {
    expect(parseLatestChangelogEntry(markdown)).toBeUndefined()
  })

  it('reads package and changelog facts independently', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-cli-banner-'))
    await writeFile(join(root, 'package.json'), JSON.stringify({ version: '0.2.0' }))
    await writeFile(join(root, 'CHANGELOG.md'), '## 0.2.0 — 2026-08-14\n\n- New welcome box\n')
    await expect(readBannerFacts(root)).resolves.toEqual({
      version: '0.2.0',
      latest: { version: '0.2.0', bullets: ['New welcome box'] },
    })
  })

  it('never throws and preserves version when the changelog is missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-cli-banner-'))
    await writeFile(join(root, 'package.json'), JSON.stringify({ version: '0.2.0' }))
    await expect(readBannerFacts(root)).resolves.toEqual({ version: '0.2.0' })
    await expect(readBannerFacts(join(root, 'missing'))).resolves.toEqual({})
  })
})
