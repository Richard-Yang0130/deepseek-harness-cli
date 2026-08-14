import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { satisfies } from 'semver'

export const PROFILE_NAME = 'dsh-cli'
export const BUNDLE_NAME = 'deepseek-harness-cli'
export const DSH_VERSION_RANGE = '>=0.1.0-rc.6 <0.2.0'

export interface CommandResult {
  readonly code: number
  readonly stdout: string
  readonly stderr: string
}

export interface LauncherOptions {
  readonly dshHome?: string
  readonly packageRoot?: string
  readonly runDsh?: (args: readonly string[], inherited: boolean) => Promise<CommandResult>
  readonly write?: (text: string) => void
}

export function isCompatibleDshVersion(output: string): boolean {
  const version = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/.exec(output)?.[0]
  return version !== undefined && satisfies(version, DSH_VERSION_RANGE, { includePrerelease: true })
}

function defaultDshHome(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

function defaultPackageRoot(): string {
  return dirname(dirname(fileURLToPath(import.meta.url)))
}

export async function profileNeedsBootstrap(dshHome: string): Promise<boolean> {
  try {
    const manifest = JSON.parse(await readFile(
      join(dshHome, 'profiles', PROFILE_NAME, 'package.json'),
      'utf8',
    )) as { dsh?: { profile?: { bundles?: unknown } } }
    const bundles = manifest.dsh?.profile?.bundles
    return !Array.isArray(bundles) || !bundles.includes(BUNDLE_NAME)
  } catch {
    return true
  }
}

async function spawnDsh(args: readonly string[], inherited: boolean): Promise<CommandResult> {
  return await new Promise(resolve => {
    const child = spawn('dsh', [...args], {
      shell: false,
      stdio: inherited ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    if (!inherited) {
      child.stdout?.setEncoding('utf8').on('data', chunk => { stdout += chunk })
      child.stderr?.setEncoding('utf8').on('data', chunk => { stderr += chunk })
    }
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP']
    const handlers = new Map<NodeJS.Signals, () => void>()
    for (const signal of signals) {
      const handler = (): void => { child.kill(signal) }
      handlers.set(signal, handler)
      process.once(signal, handler)
    }
    const finish = (result: CommandResult): void => {
      for (const [signal, handler] of handlers) process.removeListener(signal, handler)
      resolve(result)
    }
    child.once('error', error => finish({
      code: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 127 : 1,
      stdout,
      stderr: `${stderr}${error.message}`,
    }))
    child.once('close', (code, signal) => finish({
      code: code ?? (signal === 'SIGINT' ? 130 : 1),
      stdout,
      stderr,
    }))
  })
}

export async function runLauncher(args: readonly string[], options: LauncherOptions = {}): Promise<number> {
  const dshHome = options.dshHome ?? defaultDshHome()
  const packageRoot = options.packageRoot ?? defaultPackageRoot()
  const runDsh = options.runDsh ?? spawnDsh
  const write = options.write ?? (text => process.stderr.write(text))

  const version = await runDsh(['--version'], false)
  if (version.code === 127) {
    write('dsh-cli: dsh was not found. Install @deepseek-ai/dsh first:\n  npm install -g @deepseek-ai/dsh\n')
    return 127
  }
  if (version.code !== 0) {
    write(`dsh-cli: could not run dsh --version.\n${version.stderr}`)
    return version.code
  }
  if (!isCompatibleDshVersion(version.stdout || version.stderr)) {
    write(`dsh-cli: unsupported dsh version (${(version.stdout || version.stderr).trim()}). Required: ${DSH_VERSION_RANGE}.\n`)
    return 1
  }

  const needsBootstrap = await profileNeedsBootstrap(dshHome)
  if (args.length === 1 && args[0] === 'doctor') {
    write(`dsh-cli doctor\n  dsh: ${(version.stdout || version.stderr).trim()}\n  profile: ${needsBootstrap ? 'not configured' : 'ready'}\n  package: ${packageRoot}\n`)
    return 0
  }

  if (needsBootstrap) {
    write('dsh-cli: configuring the isolated terminal profile...\n')
    const installed = await runDsh(['plugin', '--profile', PROFILE_NAME, 'add', packageRoot], true)
    if (installed.code !== 0) {
      write(`dsh-cli: profile setup failed with exit code ${installed.code}.\n`)
      return installed.code
    }
    write('dsh-cli: Configured the dsh-cli profile.\n')
  }

  return (await runDsh(['--profile', PROFILE_NAME, ...args], true)).code
}
