/**
 * Persisted "the user has seen the trajectory" flag, at
 * `~/.dsh-tui/trajectory.json`.
 *
 * It exists so the key hint beside the status-line wake can retire itself.
 * A permanent `ctrl+t` printed on every frame forever is the classic symptom
 * of an affordance that does not carry its own meaning — it is read once and
 * then becomes furniture. Showing it only until the feature has actually been
 * opened keeps the teaching where teaching belongs (the first minute) and
 * leaves the steady state clean.
 *
 * Best effort, like every other pref here: a missing, unreadable or corrupt
 * file simply means "not seen yet", which fails toward showing the hint.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DATA_DIR } from './utils/paths.js'

const FILE = 'trajectory.json'

/**
 * Parse a persisted `{ seen }` value.
 *
 * @param text - Raw file contents.
 * @returns True only for an explicit `seen: true`.
 */
export function parseTrajectorySeen(text: string): boolean {
  try {
    const parsed: unknown = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return false
    return (parsed as Record<string, unknown>).seen === true
  } catch {
    return false
  }
}

/**
 * Whether the trajectory scene has ever been opened on this machine.
 *
 * @param dir - Prefs directory (injectable for tests).
 * @returns True when the flag is set.
 */
export function readTrajectorySeen(dir: string = DATA_DIR): boolean {
  try {
    return parseTrajectorySeen(readFileSync(join(dir, FILE), 'utf8'))
  } catch {
    return false
  }
}

/**
 * Record that the trajectory has been opened (best effort).
 *
 * @param dir - Prefs directory (injectable for tests).
 * @returns True when the file was written.
 */
export function writeTrajectorySeen(dir: string = DATA_DIR): boolean {
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, FILE), JSON.stringify({ seen: true }, null, 2))
    return true
  } catch {
    return false
  }
}
