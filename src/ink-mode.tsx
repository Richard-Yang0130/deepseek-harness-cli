import React, { useEffect, useState } from 'react'
import { render } from 'ink'
import { App, type AppIntent } from './app.js'
import type { TuiControllerPort, TuiControllerSnapshot } from './controller.js'
import type { TuiStartupValues } from './startup.js'

function ConnectedApp({ controller, requestExit }: {
  readonly controller: TuiControllerPort
  readonly requestExit: () => void
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

  return <App snapshot={snapshot} dispatch={dispatch} />
}

/** Mount the interactive Ink surface over the shared Harness controller. */
export async function runInkMode(
  controller: TuiControllerPort,
  startup: TuiStartupValues,
): Promise<void> {
  await controller.start(startup.resume)
  if (startup.prompt !== undefined) await controller.submit(startup.prompt)
  const exit = Promise.withResolvers<void>()
  const instance = render(
    <ConnectedApp controller={controller} requestExit={() => { exit.resolve() }} />,
    { exitOnCtrlC: false, patchConsole: false },
  )
  try {
    await exit.promise
  } finally {
    instance.unmount()
    await controller.stop()
  }
}
