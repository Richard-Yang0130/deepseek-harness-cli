/**
 * Debug logger for the ported Ink core. Writes to stderr only when
 * `DSH_CLI_DEBUG` is set, so normal runs stay quiet.
 * @param message - The message to log.
 * @param fields - Optional JSON-serialized fields appended to the line.
 */
export function logForDebugging(message: string, fields?: Record<string, unknown>): void {
  if (!process.env.DSH_CLI_DEBUG) return
  const suffix = fields === undefined ? '' : ` ${JSON.stringify(fields)}`
  process.stderr.write(`[dsh-cli] ${message}${suffix}\n`)
}
