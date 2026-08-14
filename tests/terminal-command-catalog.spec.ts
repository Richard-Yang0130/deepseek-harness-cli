import { describe, expect, it } from 'vitest'
import { TERMINAL_COMMANDS } from '../src/index.js'

describe('terminal command catalog contract', () => {
  it('publishes unique command names covered by the exhaustive dispatcher', () => {
    const names = TERMINAL_COMMANDS.map(command => command.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toHaveLength(24)
  })
})
