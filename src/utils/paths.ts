/**
 * Data-directory paths for the dsh-cli profile, renamed from `~/.dsh-cc` to
 * `~/.dsh-cli` (issue #120). On first launch the legacy directory is COPIED
 * (not moved) to the new location; afterwards only the new directory is read
 * and written. The one exception is `resume.txt`, which sessionHistory
 * dual-writes for old launchers — see the launcher contract there.
 *
 * The compiled copy (lib/types/utils/paths.js) is also imported by the bin
 * launcher, mirroring the shellQuote precedent.
 */

import { cpSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * The user's home directory. `os.homedir()` first; the USERPROFILE/HOME
 * spellings are the last-resort fallback for stripped-down environments.
 * @returns Absolute home path.
 */
export function homeDir(): string {
  return homedir() || process.env.USERPROFILE || process.env.HOME || ''
}

/** Data directory all preferences/history live in (`~/.dsh-cli`). */
export const DATA_DIR = join(homeDir(), '.dsh-cli')

/** Previous product data directory (`~/.dsh-tui`), read only for migration. */
export const LEGACY_DATA_DIR = join(homeDir(), '.dsh-tui')

/** Oldest known data directory (`~/.dsh-cc`), read only for migration. */
export const OLDEST_DATA_DIR = join(homeDir(), '.dsh-cc')

/** Legacy directories in newest-first migration order. */
export const LEGACY_DATA_DIRS = [LEGACY_DATA_DIR, OLDEST_DATA_DIR] as const

/**
 * Copy the legacy data directory to the new location on first launch.
 * A copy (not a move) so old launchers keep working and the user can delete
 * the legacy directory themselves once satisfied. No-op when the legacy
 * directory is absent or the new one already exists.
 * @param legacy - Legacy directory (injectable for tests).
 * @param target - New directory (injectable for tests).
 * @returns True when a migration copy happened.
 */
export function migrateLegacyDataDir(
  legacy: string | readonly string[] = LEGACY_DATA_DIRS,
  target: string = DATA_DIR,
): boolean {
  if (existsSync(target)) return false
  const candidates = typeof legacy === 'string' ? [legacy] : legacy
  const source = candidates.find(candidate => existsSync(candidate))
  if (source === undefined) return false
  cpSync(source, target, { recursive: true })
  return true
}

/**
 * Env vars renamed in issue #120 that no longer take effect: old name → new
 * name. `DSH_CC_RESUME_SESSION` is deliberately absent — it remains a valid
 * half of the dual-read launcher contract (see sessionHistory.ts).
 */
export const RENAMED_ENV: Readonly<Record<string, string>> = {
  DSH_TUI_THEME: 'DSH_CLI_THEME',
  DSH_TUI_LANG: 'DSH_CLI_LANG',
  DSH_TUI_PERSONA: 'DSH_CLI_PERSONA',
  DSH_TUI_PRESET: 'DSH_CLI_PRESET',
  DSH_TUI_DISABLE_MOUSE: 'DSH_CLI_DISABLE_MOUSE',
  DSH_TUI_DEBUG: 'DSH_CLI_DEBUG',
  DSH_TUI_COMPACT_RATIO: 'DSH_CLI_COMPACT_RATIO',
  DSH_TUI_COMPACT_RETAIN: 'DSH_CLI_COMPACT_RETAIN',
  DSH_TUI_UPDATED_FROM: 'DSH_CLI_UPDATED_FROM',
  DSH_TUI_RENDER_LOG: 'DSH_CLI_RENDER_LOG',
  DSH_TUI_SESSION_ROOT: 'DSH_CLI_SESSION_ROOT',
  DSH_TUI_WORKSPACE: 'DSH_CLI_WORKSPACE',
  DSH_TUI_WORKSPACE_TARGET: 'DSH_CLI_WORKSPACE_TARGET',
  DSH_TUI_RESUME_SESSION: 'DSH_CLI_RESUME_SESSION',
  CC_TUI_THEME: 'DSH_CLI_THEME',
  CC_TUI_LANG: 'DSH_CLI_LANG',
  CC_TUI_PERSONA: 'DSH_CLI_PERSONA',
  CC_TUI_PRESET: 'DSH_CLI_PRESET',
  CC_TUI_DISABLE_MOUSE: 'DSH_CLI_DISABLE_MOUSE',
  CC_TUI_DEBUG: 'DSH_CLI_DEBUG',
  CC_TUI_COMPACT_RATIO: 'DSH_CLI_COMPACT_RATIO',
  CC_TUI_COMPACT_RETAIN: 'DSH_CLI_COMPACT_RETAIN',
  DSH_CC_UPDATED_FROM: 'DSH_CLI_UPDATED_FROM',
  DSH_CC_RENDER_LOG: 'DSH_CLI_RENDER_LOG',
  DSH_CC_SESSION_ROOT: 'DSH_CLI_SESSION_ROOT',
  DSH_CC_WORKSPACE: 'DSH_CLI_WORKSPACE',
  DSH_CC_RESUME_SESSION: 'DSH_CLI_RESUME_SESSION',
}

/**
 * Copy legacy environment values into their current names without replacing
 * an explicitly configured current value.
 */
export function applyLegacyEnv(env: NodeJS.ProcessEnv = process.env): void {
  for (const [oldName, newName] of Object.entries(RENAMED_ENV)) {
    if (env[newName] === undefined && env[oldName] !== undefined) {
      env[newName] = env[oldName]
    }
  }
}

/**
 * Old env-var names still set in the environment (they no longer take
 * effect). Used to print one deprecation line per name before the TUI
 * renders — stderr writes break the fullscreen UI once it is up.
 * @param env - Environment to scan (defaults to process.env; injectable).
 * @returns The legacy names found, in RENAMED_ENV order.
 */
export function detectLegacyEnv(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  return Object.keys(RENAMED_ENV).filter(name => env[name] !== undefined)
}
