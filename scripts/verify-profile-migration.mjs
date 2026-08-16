import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { migrateManagedProfile } from '../lib/types/utils/profileMigration.js'

const profileDir = await mkdtemp(join(tmpdir(), 'dsh-cli-profile-'))
const manifest = {
  dsh: {
    profile: {
      bundles: ['@deepseek-ai/dsh-base', 'deepseek-harness-cli', 'user-mcp-bundle'],
    },
  },
}
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`
const patchText = '# user-owned patch\n- id: user-mcp-bundle\n'
await writeFile(join(profileDir, 'package.json'), manifestText)
await writeFile(join(profileDir, 'cordis.patch.yml'), patchText)

const now = () => new Date('2026-08-16T00:00:00.000Z')
const first = await migrateManagedProfile({ profileDir, now })
const second = await migrateManagedProfile({ profileDir, now })

assert.equal(first.migrated, true)
assert.equal(second.migrated, false)
assert.equal(first.backupDir, join(profileDir, '.deepseek-harness-cli-backups', 'migration-v1'))
assert.equal(await readFile(join(profileDir, 'package.json'), 'utf8'), manifestText)
assert.equal(await readFile(join(first.backupDir, 'package.json'), 'utf8'), manifestText)
assert.equal(await readFile(join(first.backupDir, 'cordis.patch.yml'), 'utf8'), patchText)
await access(join(profileDir, '.deepseek-harness-cli-migration.json'))

console.log('profile migration OK (backup, unchanged profile, idempotent marker)')
