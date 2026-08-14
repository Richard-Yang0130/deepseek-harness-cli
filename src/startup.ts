/** Command-line provider for the interactive terminal surface. */
import { Command } from 'commander'
import type { Context } from '@deepseek-ai/cordis'
import { parseCmdline } from '@deepseek-ai/dsh-cmdline'

export const name = 'tui-startup'
export const inject = ['cmdlineArgs']
export const TUI_STARTUP_SERVICE = 'tuiStartup'

export interface TuiStartupValues {
  resume?: string
  prompt?: string
}

/** Pure parser used by tests and by the Cordis command provider. */
export function parseTuiStartup(args: readonly string[]): TuiStartupValues {
  let resume: string | undefined
  const prompt: string[] = []
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index] as string
    if (value === '--resume') {
      resume = args[index + 1]
      index += 1
      if (resume === undefined || resume.trim() === '') throw new Error('a non-empty session id is required after --resume')
      continue
    }
    prompt.push(value)
  }
  const joined = prompt.join(' ').trim()
  return {
    ...(resume === undefined ? {} : { resume }),
    ...(joined === '' ? {} : { prompt: joined }),
  }
}

function tuiCommand(): Command {
  return new Command()
    .name('dsh tui')
    .description('Start an interactive DeepSeek Harness terminal session.')
    .helpOption('-h, --help', 'show this help')
    .option('--resume <session>', 'resume a persisted session')
    .argument('[prompt...]', 'optional first prompt')
    .addHelpText('after', `
Examples:
  dsh tui
  dsh tui "inspect this repository"
  dsh tui --resume session-123
`)
}

export function apply(ctx: Context): void {
  const program = tuiCommand()
  program.action(() => {
    try {
      ctx.provide(TUI_STARTUP_SERVICE, parseTuiStartup([
        ...(program.opts<{ resume?: string }>().resume === undefined
          ? []
          : ['--resume', program.opts<{ resume?: string }>().resume as string]),
        ...program.args,
      ]))
    } catch (error) {
      program.error(`error: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
  parseCmdline(ctx, program)
}
