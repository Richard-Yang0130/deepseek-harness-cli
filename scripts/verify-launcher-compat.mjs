import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = await mkdtemp(join(tmpdir(), 'dsh-cli-launcher-'))
const fakeBin = join(root, 'bin')
const dshHome = join(root, 'dsh-home')
const userHome = join(root, 'home')
const capture = join(root, 'capture.json')
await mkdir(fakeBin, { recursive: true })
await mkdir(join(userHome, '.dsh-cli'), { recursive: true })
await mkdir(join(dshHome, 'profiles', 'dsh-cli', 'node_modules', 'deepseek-harness-cli'), { recursive: true })
await writeFile(
  join(dshHome, 'profiles', 'dsh-cli', 'node_modules', 'deepseek-harness-cli', 'package.json'),
  JSON.stringify({ name: 'deepseek-harness-cli', version: '0.7.2' }),
)
const fakeDsh = join(fakeBin, 'dsh')
await writeFile(fakeDsh, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
if (process.argv[2] === '--version') process.exit(0)
writeFileSync(process.env.DSH_CLI_CAPTURE, JSON.stringify({
  argv: process.argv.slice(2),
  resume: process.env.DSH_CLI_RESUME_SESSION,
  legacyResume: process.env.DSH_CC_RESUME_SESSION,
  workspace: process.env.DSH_CLI_WORKSPACE_TARGET,
}))
`)
await chmod(fakeDsh, 0o755)

const launcher = resolve('bin/dsh-cli.js')
function launch(args) {
  const result = spawnSync(process.execPath, [launcher, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}${delimiter}${process.env.PATH ?? ''}`,
      HOME: userHome,
      DSH_HOME: dshHome,
      DSH_CLI_CAPTURE: capture,
      DSH_CLI_LANG: 'en',
      DSH_CLI_RESUME_SESSION: undefined,
      DSH_CC_RESUME_SESSION: undefined,
      DSH_CLI_WORKSPACE_TARGET: undefined,
    },
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(readFileSync(capture, 'utf8'))
}

let captured = launch(['--resume', 'session-1'])
assert.equal(captured.resume, 'session-1')
assert.equal(captured.legacyResume, undefined)

await writeFile(join(userHome, '.dsh-cli', 'resume.txt'), 'session-last\n')
captured = launch(['--continue'])
assert.equal(captured.resume, 'session-last')
captured = launch(['-c'])
assert.equal(captured.resume, 'session-last')

captured = launch(['run tests'])
assert.deepEqual(captured.argv, ['--profile', 'dsh-cli', 'run tests'])

const workspace = join(root, 'workspace')
await mkdir(workspace)
captured = launch([workspace])
assert.equal(captured.workspace, workspace)
assert.deepEqual(captured.argv, ['--profile', 'dsh-cli'])

await writeFile(capture, 'not-launched')
const doctor = spawnSync(process.execPath, [launcher, 'doctor'], {
  encoding: 'utf8',
  env: {
    ...process.env,
    PATH: `${fakeBin}${delimiter}${process.env.PATH ?? ''}`,
    HOME: userHome,
    DSH_HOME: dshHome,
    DSH_CLI_CAPTURE: capture,
    DSH_CLI_LANG: 'en',
  },
})
assert.equal(doctor.status, 0, doctor.stderr)
assert.match(doctor.stdout, /deepseek-harness-cli v0\.7\.2/u)
assert.match(doctor.stdout, /profile dsh-cli: v0\.7\.2/u)
assert.equal(readFileSync(capture, 'utf8'), 'not-launched')

console.log('launcher compatibility OK (resume, continue, prompt, workspace, doctor)')
