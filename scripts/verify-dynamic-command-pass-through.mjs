import assert from 'node:assert/strict'
import {
  mergeRegistryCommands,
  registryCommandLine,
} from '../lib/types/dsh-adapter/command-trees.js'

const names = [
  'settings',
  'credentials',
  'jobs',
  'plugins',
  'trajectory',
  'message-feedback',
  'permission',
  'plan',
  'goal',
]
const descriptors = names.map(name => ({
  name,
  description: `${name} description`,
  input: { hint: '<args>' },
}))
const commands = mergeRegistryCommands([], descriptors)
assert.deepEqual(commands.map(command => command.name), names)
assert.equal(commands.every(command => command.external === true), true)
assert.equal(registryCommandLine('plan', ' off --reason "user choice"'), '/plan off --reason "user choice"')
assert.equal(registryCommandLine('goal', ''), '/goal')

console.log('dynamic command pass-through OK (catalog and raw arguments)')
