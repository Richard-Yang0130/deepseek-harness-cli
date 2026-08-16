import assert from 'node:assert/strict'
import { LEGACY_COMMAND_ALIASES, rewriteLegacyCommand } from '../lib/types/legacyCommands.js'

assert.deepEqual(LEGACY_COMMAND_ALIASES, {
  sessions: 'resume',
  models: 'model',
  presets: 'preset',
  stats: 'cost',
  subagents: 'agents',
})
assert.equal(rewriteLegacyCommand('/sessions bug fix'), '/resume bug fix')
assert.equal(rewriteLegacyCommand('/models'), '/model')
assert.equal(rewriteLegacyCommand('/goal ship'), '/goal ship')
assert.equal(rewriteLegacyCommand('plain text'), 'plain text')

console.log('legacy command aliases OK')
