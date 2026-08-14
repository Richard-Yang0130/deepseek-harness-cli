import React from 'react'
import { EventEmitter } from 'node:events'
import { render } from 'ink-testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BannerFacts } from '../src/banner-facts.ts'
import type { TuiControllerPort, TuiControllerSnapshot } from '../src/controller.ts'
import * as inkMode from '../src/ink-mode.tsx'

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => { setTimeout(resolve, 0) })
}

describe('Ink internals', () => {
  it('exposes replaceable render and stdout dependencies', () => {
    const inkInternals = (inkMode as { inkInternals?: unknown }).inkInternals
    expect(inkInternals).toBeDefined()
  })
})

describe('ConnectedApp', () => {
  it('refreshes after subscribing so an update before the effect is not lost', async () => {
    const ConnectedApp = (inkMode as {
      ConnectedApp?: React.ComponentType<{
        controller: TuiControllerPort
        requestExit: () => void
        bannerFacts: BannerFacts
      }>
    }).ConnectedApp
    expect(ConnectedApp).toBeTypeOf('function')
    if (ConnectedApp === undefined) return

    let current: TuiControllerSnapshot = {
      phase: 'idle', cwd: '/workspace', commands: [], transcript: [], panel: null,
    }
    let listener: (() => void) | undefined
    const answerDecision = vi.fn<TuiControllerPort['answerDecision']>()
    const controller: TuiControllerPort = {
      snapshot: () => current,
      subscribe: next => {
        listener = next
        return () => { listener = undefined }
      },
      start: async () => {},
      submit: async () => {},
      cancel: () => {},
      answerDecision,
      stop: async () => {},
    }

    const view = render(React.createElement(ConnectedApp, {
      controller, requestExit: () => {}, bannerFacts: {},
    }))
    try {
      expect(listener).toBeUndefined()
      current = {
        ...current,
        phase: 'starting',
        panel: {
          kind: 'approval', toolName: 'bash', selected: 0,
          options: [
            { label: 'Reject', outcome: 'rejected' },
            { label: 'Allow once', outcome: 'allowed-once' },
          ],
        },
      }
      listener?.()

      await vi.waitFor(() => { expect(view.lastFrame()).toContain('Allow bash?') })
      await flushEffects()
      view.stdin.write('\u001B[B')
      await vi.waitFor(() => { expect(view.lastFrame()).toContain('❯ ◉ Allow once') })
      await flushEffects()
      view.stdin.write('\r')
      await vi.waitFor(() => {
        expect(answerDecision).toHaveBeenCalledWith({ type: 'answer-approval', outcome: 'allowed-once' })
      })
    } finally {
      view.unmount()
    }
  })
})

class ResizeOutput extends EventEmitter {
  constructor(private readonly order: string[]) {
    super()
  }

  write(value: string): boolean {
    this.order.push(`write:${value}`)
    return true
  }
}

const originalRender = inkMode.inkInternals.render
const originalStdout = inkMode.inkInternals.stdout

afterEach(() => {
  inkMode.inkInternals.render = originalRender
  inkMode.inkInternals.stdout = originalStdout
})

function deferred(): PromiseWithResolvers<void> {
  return Promise.withResolvers<void>()
}

function fakeController(overrides: Partial<TuiControllerPort> = {}): TuiControllerPort {
  return {
    snapshot: () => ({ phase: 'idle', cwd: '/workspace', commands: [], transcript: [], panel: null }),
    subscribe: () => () => {},
    start: async () => {},
    submit: async () => {},
    cancel: () => {},
    answerDecision: () => {},
    stop: async () => {},
    ...overrides,
  }
}

function installFakeInk(order: string[], options: {
  readonly unmountError?: Error
  readonly removeResizeError?: Error
} = {}): {
  readonly instance: ReturnType<typeof inkMode.inkInternals.render>
  readonly requestExit: () => void
} {
  let capturedRequestExit: (() => void) | undefined
  const instance: ReturnType<typeof inkMode.inkInternals.render> = {
    rerender: vi.fn(),
    unmount: vi.fn(() => {
      order.push('unmount')
      if (options.unmountError !== undefined) throw options.unmountError
    }),
    waitUntilExit: vi.fn(async () => {}),
    cleanup: vi.fn(),
    clear: vi.fn(),
  }
  inkMode.inkInternals.render = ((node: React.ReactNode) => {
    order.push('render')
    capturedRequestExit = (node as React.ReactElement<{ requestExit: () => void }>).props.requestExit
    return instance
  }) as typeof inkMode.inkInternals.render
  const output = new ResizeOutput(order)
  if (options.removeResizeError !== undefined) {
    output.off = () => { throw options.removeResizeError }
  }
  inkMode.inkInternals.stdout = output
  return {
    instance,
    requestExit: () => {
      if (capturedRequestExit === undefined) throw new Error('render has not captured requestExit')
      capturedRequestExit()
    },
  }
}

async function isPending(promise: Promise<void>): Promise<boolean> {
  let settled = false
  void promise.then(
    () => { settled = true },
    () => { settled = true },
  )
  await Promise.resolve()
  await Promise.resolve()
  return !settled
}

describe('Ink startup lifecycle', () => {
  it('renders before starting even while start is pending', async () => {
    const order: string[] = []
    const startGate = deferred()
    const controller = fakeController({
      start: vi.fn(async () => {
        order.push('start')
        await startGate.promise
      }),
    })
    const ink = installFakeInk(order)
    const run = inkMode.runInkMode(controller, {})

    try {
      await vi.waitFor(() => { expect(controller.start).toHaveBeenCalledOnce() })
      expect(order.slice(0, 2)).toEqual(['render', 'start'])
    } finally {
      startGate.resolve()
      await vi.waitFor(() => { expect(order).toContain('render') })
      ink.requestExit()
      await run
    }
  })

  it('cancels a pending start, waits for it, skips submit, then stops and unmounts', async () => {
    const order: string[] = []
    const startGate = deferred()
    const submit = vi.fn<TuiControllerPort['submit']>()
    const controller = fakeController({
      start: vi.fn(async () => {
        order.push('start')
        await startGate.promise
        order.push('start settles')
      }),
      submit,
      cancel: vi.fn(() => { order.push('cancel') }),
      stop: vi.fn(async () => { order.push('stop') }),
    })
    const ink = installFakeInk(order)
    const run = inkMode.runInkMode(controller, { prompt: 'hello' })

    await vi.waitFor(() => { expect(controller.start).toHaveBeenCalledOnce() })
    try {
      expect(order[0]).toBe('render')
      ink.requestExit()
      await vi.waitFor(() => { expect(controller.cancel).toHaveBeenCalledOnce() })
      expect(await isPending(run)).toBe(true)
      expect(submit).not.toHaveBeenCalled()
    } finally {
      startGate.resolve()
      await vi.waitFor(() => { expect(order).toContain('render') })
      ink.requestExit()
      await run
    }
    expect(submit).not.toHaveBeenCalled()
    expect(order).toEqual(['render', 'start', 'cancel', 'start settles', 'stop', 'unmount'])
  })

  it('cancels a pending initial submit and waits for it before stopping', async () => {
    const order: string[] = []
    const submitGate = deferred()
    const controller = fakeController({
      start: vi.fn(async () => { order.push('start') }),
      submit: vi.fn(async () => {
        order.push('submit')
        await submitGate.promise
        order.push('submit settles')
      }),
      cancel: vi.fn(() => {
        order.push('cancel')
        submitGate.resolve()
      }),
      stop: vi.fn(async () => { order.push('stop') }),
    })
    const ink = installFakeInk(order)
    const run = inkMode.runInkMode(controller, { prompt: 'hello' })

    await vi.waitFor(() => { expect(controller.submit).toHaveBeenCalledOnce() })
    try {
      expect(order[0]).toBe('render')
      ink.requestExit()
      await run
    } finally {
      submitGate.resolve()
      await vi.waitFor(() => { expect(order).toContain('render') })
      ink.requestExit()
      await run
    }
    expect(order.slice(order.indexOf('cancel'))).toEqual([
      'cancel', 'submit settles', 'stop', 'unmount',
    ])
  })

  it('rejects with a start failure and still stops and unmounts', async () => {
    const order: string[] = []
    const startupError = new Error('start failed')
    const controller = fakeController({
      start: vi.fn(async () => { throw startupError }),
      cancel: vi.fn(() => { order.push('cancel') }),
      stop: vi.fn(async () => { order.push('stop') }),
    })
    installFakeInk(order)

    await expect(inkMode.runInkMode(controller, {})).rejects.toBe(startupError)
    expect(order).toEqual(['render', 'cancel', 'stop', 'unmount'])
  })

  it('preserves a pending start failure after exit was requested first', async () => {
    const order: string[] = []
    const startupError = new Error('late start failure')
    const startGate = deferred()
    const controller = fakeController({
      start: vi.fn(async () => {
        await startGate.promise
        throw startupError
      }),
      cancel: vi.fn(() => { order.push('cancel') }),
      stop: vi.fn(async () => { order.push('stop') }),
    })
    const ink = installFakeInk(order)
    const run = inkMode.runInkMode(controller, {})

    await vi.waitFor(() => { expect(controller.start).toHaveBeenCalledOnce() })
    try {
      expect(order[0]).toBe('render')
      ink.requestExit()
    } finally {
      startGate.resolve()
      await expect(run).rejects.toBe(startupError)
    }
    await expect(run).rejects.toBe(startupError)
    expect(controller.stop).toHaveBeenCalledOnce()
    expect(ink.instance.unmount).toHaveBeenCalledOnce()
  })

  it('prefers a start failure over a stop failure and still unmounts', async () => {
    const order: string[] = []
    const startupError = new Error('start failed')
    const controller = fakeController({
      start: vi.fn(async () => { throw startupError }),
      stop: vi.fn(async () => { throw new Error('stop failed') }),
    })
    const ink = installFakeInk(order)

    await expect(inkMode.runInkMode(controller, {})).rejects.toBe(startupError)
    expect(ink.instance.unmount).toHaveBeenCalledOnce()
  })

  it('returns a stop failure after successful startup and still unmounts', async () => {
    const order: string[] = []
    const stopError = new Error('stop failed')
    const controller = fakeController({
      start: vi.fn(async () => {}),
      cancel: vi.fn(() => { order.push('cancel') }),
      stop: vi.fn(async () => {
        order.push('stop')
        throw stopError
      }),
    })
    const ink = installFakeInk(order)
    const run = inkMode.runInkMode(controller, {})

    await vi.waitFor(() => { expect(controller.start).toHaveBeenCalledOnce() })
    ink.requestExit()
    await expect(run).rejects.toBe(stopError)
    expect(ink.instance.unmount).toHaveBeenCalledOnce()
    expect(order.slice(-3)).toEqual(['cancel', 'stop', 'unmount'])
  })

  it('keeps the first resize cleanup failure and still unmounts', async () => {
    const order: string[] = []
    const cleanupError = new Error('resize cleanup failed')
    const controller = fakeController({ start: vi.fn(async () => {}) })
    const ink = installFakeInk(order, {
      removeResizeError: cleanupError,
      unmountError: new Error('unmount failed'),
    })
    const run = inkMode.runInkMode(controller, {})

    await vi.waitFor(() => { expect(controller.start).toHaveBeenCalledOnce() })
    ink.requestExit()
    await expect(run).rejects.toBe(cleanupError)
    expect(ink.instance.unmount).toHaveBeenCalledOnce()
  })

  it('keeps a cancel failure and still stops and unmounts', async () => {
    const order: string[] = []
    const cancelError = new Error('cancel failed')
    const controller = fakeController({
      start: vi.fn(async () => {}),
      cancel: vi.fn(() => {
        order.push('cancel')
        throw cancelError
      }),
      stop: vi.fn(async () => { order.push('stop') }),
    })
    const ink = installFakeInk(order)
    const run = inkMode.runInkMode(controller, {})

    await vi.waitFor(() => { expect(controller.start).toHaveBeenCalledOnce() })
    ink.requestExit()
    await expect(run).rejects.toBe(cancelError)
    expect(order.slice(-3)).toEqual(['cancel', 'stop', 'unmount'])
  })
})

describe('Ink resize cleanup', () => {
  it('resets Ink and clears the visible screen before its resize renderer runs', () => {
    const installResizeCleanup = (inkMode as {
      installResizeCleanup?: (output: ResizeOutput, clear: () => void) => () => void
    }).installResizeCleanup
    expect(installResizeCleanup).toBeTypeOf('function')
    if (installResizeCleanup === undefined) return

    const order: string[] = []
    const output = new ResizeOutput(order)
    output.on('resize', () => { order.push('ink-render') })
    const remove = installResizeCleanup(output, () => { order.push('ink-clear') })

    output.emit('resize')
    expect(order).toEqual(['ink-clear', 'write:\u001B[2J\u001B[H', 'ink-render'])

    order.length = 0
    remove()
    output.emit('resize')
    expect(order).toEqual(['ink-render'])
  })
})
