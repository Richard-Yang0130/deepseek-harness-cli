import { describe, expect, it } from 'vitest'
import { commandCatalog, filterCommands } from '../src/command-catalog.ts'

describe('command catalog', () => {
  it('prefers a Harness command over terminal and skill collisions', () => {
    expect(commandCatalog(
      [{ name: 'model', description: 'plugin model', input: { hint: '<id>' } }],
      [{ name: 'model', description: 'terminal model', source: 'terminal' }],
      [{ name: 'model', description: 'model skill', source: 'skill' }],
    )).toEqual([{ name: 'model', description: 'plugin model', hint: '<id>', source: 'harness' }])
  })

  it('filters by name and description', () => {
    const commands = commandCatalog(
      [{ name: 'permission', description: 'Switch preset' }, { name: 'plan', description: 'Enter plan mode' }],
      [{ name: 'sessions', description: 'Browse persisted sessions', source: 'terminal' }],
    )
    expect(filterCommands(commands, '/per').map(command => command.name)).toEqual(['permission'])
    expect(filterCommands(commands, '/mode').map(command => command.name)).toEqual(['plan'])
  })
})
