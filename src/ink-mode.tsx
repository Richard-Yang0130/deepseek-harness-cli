import React, { useEffect, useState } from 'react'
import { render } from 'ink'
import { App, type AppIntent } from './app.js'
import { readBannerFacts, type BannerFacts } from './banner-facts.js'
import type { TuiControllerPort, TuiControllerSnapshot } from './controller.js'
import type { TuiStartupValues } from './startup.js'

interface ResizeOutput {
  prependListener(event: 'resize', listener: () => void): unknown
  off(event: 'resize', listener: () => void): unknown
  write(value: string): unknown
}

export function installResizeCleanup(output: ResizeOutput, clearInkOutput: () => void): () => void {
  const clearBeforeResize = (): void => {
    clearInkOutput()
    output.write('\u001B[2J\u001B[H')
  }
  output.prependListener('resize', clearBeforeResize)
  return () => { output.off('resize', clearBeforeResize) }
}

function ConnectedApp({ controller, requestExit, bannerFacts }: {
  readonly controller: TuiControllerPort
  readonly requestExit: () => void
  readonly bannerFacts: BannerFacts
}): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<TuiControllerSnapshot>(() => controller.snapshot())
  useEffect(() => controller.subscribe(() => { setSnapshot(controller.snapshot()) }), [controller])
  useEffect(() => {
    if (snapshot.exitRequested === true) requestExit()
  }, [requestExit, snapshot.exitRequested])

  const dispatch = (intent: AppIntent): void => {
    if (intent.type === 'submit') {
      void controller.submit(intent.value)
      return
    }
    if (intent.type === 'cancel') {
      controller.cancel()
      return
    }
    if (intent.type === 'exit') requestExit()
    if (intent.type === 'answer-approval' || intent.type === 'answer-question' || intent.type === 'cancel-decision') {
      controller.answerDecision(intent)
    }
  }

  return <App snapshot={snapshot} dispatch={dispatch} bannerFacts={bannerFacts} />
}

/** Mount the interactive Ink surface over the shared Harness controller. */
export async function runInkMode(
  controller: TuiControllerPort,
  startup: TuiStartupValues,
): Promise<void> {
  const bannerFacts = await readBannerFacts()
  await controller.start(startup.resume)
  if (startup.prompt !== undefined) await controller.submit(startup.prompt)
  const exit = Promise.withResolvers<void>()
  const instance = render(
    <ConnectedApp controller={controller} requestExit={() => { exit.resolve() }} bannerFacts={bannerFacts} />,
    { exitOnCtrlC: false, patchConsole: false },
  )
  const removeResizeCleanup = installResizeCleanup(process.stdout, () => { instance.clear() })
  try {
    await exit.promise
  } finally {
    removeResizeCleanup()
    instance.unmount()
    await controller.stop()
  }
}
