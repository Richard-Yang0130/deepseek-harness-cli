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

export const inkInternals: { render: typeof render; stdout: ResizeOutput } = { render, stdout: process.stdout }

export function installResizeCleanup(output: ResizeOutput, clearInkOutput: () => void): () => void {
  const clearBeforeResize = (): void => {
    clearInkOutput()
    output.write('\u001B[2J\u001B[H')
  }
  output.prependListener('resize', clearBeforeResize)
  return () => { output.off('resize', clearBeforeResize) }
}

export function ConnectedApp({ controller, requestExit, bannerFacts }: {
  readonly controller: TuiControllerPort
  readonly requestExit: () => void
  readonly bannerFacts: BannerFacts
}): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<TuiControllerSnapshot>(() => controller.snapshot())
  useEffect(() => {
    const refresh = (): void => { setSnapshot(controller.snapshot()) }
    const unsubscribe = controller.subscribe(refresh)
    refresh()
    return unsubscribe
  }, [controller])
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
  const exit = Promise.withResolvers<void>()
  let closing = false
  let startupFailure: { readonly error: unknown } | undefined
  let teardownFailure: { readonly error: unknown } | undefined
  const requestExit = (): void => {
    closing = true
    exit.resolve()
  }
  const instance = inkInternals.render(
    <ConnectedApp controller={controller} requestExit={requestExit} bannerFacts={bannerFacts} />,
    { exitOnCtrlC: false, patchConsole: false },
  )
  const removeResizeCleanup = installResizeCleanup(inkInternals.stdout, () => { instance.clear() })
  const startupTask = (async () => {
    try {
      await controller.start(startup.resume)
      if (!closing && startup.prompt !== undefined) await controller.submit(startup.prompt)
    } catch (error: unknown) {
      startupFailure = { error }
      exit.reject(error)
    }
  })()
  const recordTeardownFailure = (error: unknown): void => {
    teardownFailure ??= { error }
  }
  try {
    await exit.promise
  } catch {
    // Startup failures are rethrown after teardown.
  } finally {
    closing = true
    try {
      controller.cancel()
    } catch (error: unknown) {
      recordTeardownFailure(error)
    }
    await startupTask
    try {
      await controller.stop()
    } catch (error: unknown) {
      recordTeardownFailure(error)
    }
    try {
      removeResizeCleanup()
    } catch (error: unknown) {
      recordTeardownFailure(error)
    }
    try {
      instance.unmount()
    } catch (error: unknown) {
      recordTeardownFailure(error)
    }
  }
  if (startupFailure !== undefined) throw startupFailure.error
  if (teardownFailure !== undefined) throw teardownFailure.error
}
