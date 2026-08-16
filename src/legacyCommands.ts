export const LEGACY_COMMAND_ALIASES = {
  sessions: 'resume',
  models: 'model',
  presets: 'preset',
  stats: 'cost',
  subagents: 'agents',
} as const

export function rewriteLegacyCommand(input: string): string {
  const match = /^\/([^\s]+)(.*)$/u.exec(input)
  if (match === null) return input
  const replacement = LEGACY_COMMAND_ALIASES[
    match[1] as keyof typeof LEGACY_COMMAND_ALIASES
  ]
  return replacement === undefined ? input : `/${replacement}${match[2]}`
}
