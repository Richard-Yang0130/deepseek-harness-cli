import { constants } from 'node:fs'
import { access, copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const PROFILE_MIGRATION_VERSION = 1

const MARKER = '.deepseek-harness-cli-migration.json'
const BACKUP_ROOT = '.deepseek-harness-cli-backups'
const MANAGED_FILES = ['package.json', 'cordis.patch.yml'] as const

export interface ProfileMigrationResult {
  readonly migrated: boolean
  readonly backupDir?: string
}

export interface ProfileMigrationOptions {
  readonly profileDir: string
  readonly now?: () => Date
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function migrateManagedProfile(
  options: ProfileMigrationOptions,
): Promise<ProfileMigrationResult> {
  const markerPath = join(options.profileDir, MARKER)
  try {
    const marker = JSON.parse(await readFile(markerPath, 'utf8')) as { version?: unknown }
    if (typeof marker.version === 'number' && marker.version >= PROFILE_MIGRATION_VERSION) {
      return { migrated: false }
    }
  } catch {
    // Missing or malformed markers are handled as an unrecorded migration.
  }

  const backupDir = join(options.profileDir, BACKUP_ROOT, `migration-v${PROFILE_MIGRATION_VERSION}`)
  await mkdir(backupDir, { recursive: true })
  for (const file of MANAGED_FILES) {
    const source = join(options.profileDir, file)
    const target = join(backupDir, file)
    if (await exists(source) && !(await exists(target))) {
      await copyFile(source, target, constants.COPYFILE_EXCL)
    }
  }

  const marker = `${JSON.stringify({
    version: PROFILE_MIGRATION_VERSION,
    migratedAt: (options.now ?? (() => new Date()))().toISOString(),
  }, null, 2)}\n`
  const temporaryMarker = `${markerPath}.${process.pid}.tmp`
  await writeFile(temporaryMarker, marker, { flag: 'wx' })
  await rename(temporaryMarker, markerPath)
  return { migrated: true, backupDir }
}
