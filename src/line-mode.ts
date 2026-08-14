import type { TuiControllerPort } from './controller.js'
import type { TuiStartupValues } from './startup.js'

export interface TerminalIo {
  write(text: string): void
  error(text: string): void
  read(prompt: string): Promise<string | undefined>
  onInterrupt(listener: () => void): void
  close(): void
}

/** Drive the shared controller with newline-delimited input for pipes and basic terminals. */
export async function runLineMode(
  controller: TuiControllerPort,
  io: TerminalIo,
  startup: TuiStartupValues,
): Promise<void> {
  const showNotice = (): void => {
    const notice = controller.snapshot().notice
    if (notice !== undefined) io.write(`${notice}\n`)
  }
  io.onInterrupt(() => {
    if (controller.snapshot().phase === 'running') controller.cancel()
    else io.close()
  })
  try {
    await controller.start(startup.resume)
    if (startup.prompt !== undefined) {
      await controller.submit(startup.prompt)
      showNotice()
    }
    while (true) {
      const value = await io.read('you> ')
      if (value === undefined || value.trim() === '/exit' || value.trim() === '/quit') break
      await controller.submit(value)
      showNotice()
    }
  } finally {
    await controller.stop()
    io.close()
  }
}
