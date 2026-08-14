import type { CommandDescriptor } from '@deepseek-ai/dsh-commands'
import type { LocalCommandDefinition, TuiCommand } from './controller-types.js'

export function commandCatalog(
  harness: readonly CommandDescriptor[],
  terminal: readonly LocalCommandDefinition[],
  skills: readonly LocalCommandDefinition[] = [],
): TuiCommand[] {
  const byName = new Map<string, TuiCommand>()
  for (const item of skills) byName.set(item.name, item)
  for (const item of terminal) byName.set(item.name, item)
  for (const item of harness) {
    byName.set(item.name, {
      name: item.name,
      description: item.description,
      ...(item.input === undefined ? {} : { hint: item.input.hint }),
      source: 'harness',
    })
  }
  const rank: Record<TuiCommand['source'], number> = { harness: 0, terminal: 1, skill: 2 }
  return [...byName.values()].sort((left, right) =>
    rank[left.source] - rank[right.source] || left.name.localeCompare(right.name))
}

export function filterCommands(commands: readonly TuiCommand[], input: string): TuiCommand[] {
  const query = input.startsWith('/') ? input.slice(1).trim().toLocaleLowerCase() : ''
  if (query === '') return [...commands]
  const names = commands.filter(command => command.name.toLocaleLowerCase().startsWith(query))
  if (names.length > 0) return names
  return commands.filter(command => command.description.toLocaleLowerCase().includes(query))
}
