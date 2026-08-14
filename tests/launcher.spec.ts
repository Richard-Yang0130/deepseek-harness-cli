import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { isCompatibleDshVersion, profileNeedsBootstrap, runLauncher } from '../src/launcher.js'

describe('dsh-cli launcher', () => {
  it('accepts the supported release-candidate and later compatible releases', () => {
    expect(isCompatibleDshVersion('dsh 0.1.0-rc.6')).toBe(true)
    expect(isCompatibleDshVersion('0.1.0-rc.5')).toBe(false)
    expect(isCompatibleDshVersion('0.2.0')).toBe(false)
  })

  it('bootstraps only until the standalone bundle is registered', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-cli-home-'))
    expect(await profileNeedsBootstrap(home)).toBe(true)
    const profile = join(home, 'profiles', 'dsh-cli')
    await mkdir(profile, { recursive: true })
    await writeFile(join(profile, 'package.json'), JSON.stringify({
      dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'deepseek-harness-cli'] } },
    }))
    expect(await profileNeedsBootstrap(home)).toBe(false)
  })

  it('checks, installs, and forwards argument arrays without a shell', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-cli-run-'))
    const calls: Array<{ args: readonly string[]; inherited: boolean }> = []
    const run = vi.fn(async (args: readonly string[], inherited: boolean) => {
      calls.push({ args, inherited })
      if (args[0] === '--version') return { code: 0, stdout: 'dsh 0.1.0-rc.6\n', stderr: '' }
      if (args[0] === 'plugin') {
        const profile = join(home, 'profiles', 'dsh-cli')
        await mkdir(profile, { recursive: true })
        await writeFile(join(profile, 'package.json'), JSON.stringify({
          dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'deepseek-harness-cli'] } },
        }))
      }
      return { code: 0, stdout: '', stderr: '' }
    })
    const output: string[] = []
    const code = await runLauncher(['--resume', 'example-session'], {
      dshHome: home,
      packageRoot: '/tmp/package root/deepseek-harness-cli',
      runDsh: run,
      write: text => output.push(text),
    })
    expect(code).toBe(0)
    expect(calls).toEqual([
      { args: ['--version'], inherited: false },
      { args: ['plugin', '--profile', 'dsh-cli', 'add', '/tmp/package root/deepseek-harness-cli'], inherited: true },
      { args: ['--profile', 'dsh-cli', '--resume', 'example-session'], inherited: true },
    ])
    expect(output.join('')).toContain('Configured the dsh-cli profile')
    expect(JSON.parse(await readFile(join(home, 'profiles', 'dsh-cli', 'package.json'), 'utf8'))).toBeTruthy()
  })

  it('doctor reports readiness without launching the interface', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-cli-doctor-'))
    const calls: readonly string[][] = []
    const output: string[] = []
    const code = await runLauncher(['doctor'], {
      dshHome: home,
      packageRoot: '/example/deepseek-harness-cli',
      runDsh: async (args) => {
        ;(calls as string[][]).push([...args])
        return { code: 0, stdout: '0.1.0-rc.6', stderr: '' }
      },
      write: text => output.push(text),
    })
    expect(code).toBe(0)
    expect(calls).toEqual([['--version']])
    expect(output.join('')).toContain('profile: not configured')
  })

  it('returns a useful error when dsh is missing', async () => {
    const errors: string[] = []
    const code = await runLauncher([], {
      dshHome: '/example/home',
      packageRoot: '/example/deepseek-harness-cli',
      runDsh: async () => ({ code: 127, stdout: '', stderr: 'spawn dsh ENOENT' }),
      write: text => errors.push(text),
    })
    expect(code).toBe(127)
    expect(errors.join('')).toContain('Install @deepseek-ai/dsh first')
  })
})
