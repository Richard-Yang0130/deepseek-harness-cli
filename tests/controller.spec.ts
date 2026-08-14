import { describe, expect, it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { TuiController, type TuiDecisionHandlers, type TuiServices } from '../src/controller.ts'

function services(overrides: Partial<TuiServices> = {}): TuiServices {
  return {
    listCommands: () => [],
    listSkills: () => [],
    listTerminalCommands: () => [],
    executeCommand: () => Promise.resolve(undefined),
    executeTerminalCommand: () => Promise.resolve(undefined),
    prompt: () => Promise.resolve(),
    cancel: () => {},
    flush: () => Promise.resolve(),
    dispose: () => Promise.resolve(),
    ...overrides,
  }
}

describe('TUI controller dispatch', () => {
  it('publishes and settles approval requests through the active panel', async () => {
    let decisions: TuiDecisionHandlers | undefined
    const controller = new TuiController(services({
      connectDecisions: (handlers) => { decisions = handlers; return () => {} },
    }))
    await controller.start()
    const answer = decisions?.approval({ toolName: 'bash', reason: 'run tests' })
    expect(controller.snapshot().panel?.kind).toBe('approval')
    controller.answerDecision({ type: 'answer-approval', outcome: 'allowed-once' })
    await expect(answer).resolves.toBe('allowed-once')
    expect(controller.snapshot().panel).toBeNull()
  })

  it('rejects a pending approval and clears its panel during stop', async () => {
    let decisions: TuiDecisionHandlers | undefined
    const controller = new TuiController(services({
      connectDecisions: (handlers) => { decisions = handlers; return () => {} },
    }))
    await controller.start()
    const answer = decisions?.approval({ toolName: 'bash' })
    await controller.stop()
    await expect(answer).resolves.toBe('rejected')
    expect(controller.snapshot().panel).toBeNull()
  })

  it('publishes durable session events as transcript updates', async () => {
    let publish: ((event: SessionEvent) => void) | undefined
    let updates = 0
    const controller = new TuiController(services({
      subscribeEvents: (listener) => { publish = listener; return () => {} },
    }))
    controller.subscribe(() => { updates += 1 })
    await controller.start()
    publish?.({
      type: 'assistant/chunk', seq: 1, time: 1,
      data: { turn: 1, step: 1, chunk: { type: 'text-delta', index: 0, text: 'hello' } },
    })
    expect(controller.snapshot().transcript).toEqual([
      { id: 'assistant-1-1', kind: 'assistant', text: 'hello' },
    ])
    expect(updates).toBeGreaterThan(0)
  })

  it('publishes command catalog changes from the Harness registry', async () => {
    let refresh: (() => void) | undefined
    let commands = [{ name: 'first', description: 'First' }]
    const controller = new TuiController(services({
      listCommands: () => commands,
      subscribeCatalog: (listener) => { refresh = listener; return () => {} },
    }))
    await controller.start()
    let updates = 0
    controller.subscribe(() => { updates += 1 })
    commands = [{ name: 'second', description: 'Second' }]
    refresh?.()
    expect(controller.snapshot().commands.map(command => command.name)).toEqual(['second'])
    expect(updates).toBe(1)
  })

  it('executes registered Harness commands without prompting the model', async () => {
    const executed: string[] = []
    const prompts: string[] = []
    const controller = new TuiController(services({
      listCommands: () => [{ name: 'real', description: 'Run it' }],
      executeCommand: (line) => { executed.push(line); return Promise.resolve({ kind: 'success', text: 'ran' }) },
      prompt: (text) => { prompts.push(text); return Promise.resolve() },
    }))
    await controller.submit('/real now')
    expect(executed).toEqual(['/real now'])
    expect(prompts).toEqual([])
  })

  it('does not duplicate a Harness command result already shown by its lifecycle card', async () => {
    let publish: ((event: SessionEvent) => void) | undefined
    const controller = new TuiController(services({
      listCommands: () => [{ name: 'goal', description: 'Set goal' }],
      subscribeEvents: (listener) => { publish = listener; return () => {} },
      executeCommand: () => {
        publish?.({
          type: 'command/done', seq: 1, time: 1,
          data: { commandId: 'command-1', kind: 'success', text: 'Goal updated.' },
        })
        return Promise.resolve({ kind: 'success', text: 'Goal updated.' })
      },
    }))
    await controller.start()
    await controller.submit('/goal ship it')
    expect(controller.snapshot().notice).toBeUndefined()
    expect(controller.snapshot().transcript).toEqual([{
      id: 'command-command-1', kind: 'command', title: 'command', detail: 'Goal updated.', status: 'success',
    }])
  })

  it('leaves known skill gestures for the existing pre-step injector', async () => {
    const prompts: string[] = []
    const controller = new TuiController(services({
      listSkills: () => [{ name: 'review', description: 'Review changes', source: 'skill' }],
      prompt: (text) => { prompts.push(text); return Promise.resolve() },
    }))
    await controller.submit('/review current diff')
    expect(prompts).toEqual(['/review current diff'])
  })

  it('executes terminal-owned commands through their capability adapter', async () => {
    const executed: string[] = []
    const controller = new TuiController(services({
      listTerminalCommands: () => [{ name: 'sessions', description: 'List sessions', source: 'terminal' }],
      executeTerminalCommand: (line) => { executed.push(line); return Promise.resolve('listed') },
    }))
    await controller.submit('/sessions')
    expect(executed).toEqual(['/sessions'])
    expect(controller.snapshot().notice).toBe('listed')
  })

  it('requests application exit when /exit is typed directly', async () => {
    let executed = false
    const controller = new TuiController(services({
      listTerminalCommands: () => [{ name: 'exit', description: 'Quit', source: 'terminal' }],
      executeTerminalCommand: () => { executed = true; return Promise.resolve(undefined) },
    }))
    await controller.submit('/exit')
    expect(controller.snapshot().exitRequested).toBe(true)
    expect(executed).toBe(false)
  })

  it('replaces the transcript after a terminal command switches sessions', async () => {
    let sessionId = 'session-old'
    let events: SessionEvent[] = [{
      type: 'assistant/chunk', seq: 0, time: 1,
      data: { turn: 1, step: 1, chunk: { type: 'text-delta', index: 0, text: 'old history' } },
    }]
    const controller = new TuiController(services({
      listTerminalCommands: () => [{ name: 'resume', description: 'Resume', source: 'terminal' }],
      details: () => ({ cwd: '/work', sessionId }),
      events: () => events,
      executeTerminalCommand: () => {
        sessionId = 'session-new'
        events = [{
          type: 'assistant/chunk', seq: 0, time: 2,
          data: { turn: 2, step: 1, chunk: { type: 'text-delta', index: 0, text: 'new history' } },
        }]
        return Promise.resolve(undefined)
      },
    }))
    await controller.start()
    expect(controller.snapshot().transcript).toHaveLength(1)
    await controller.submit('/resume session-new')
    expect(controller.snapshot().sessionId).toBe('session-new')
    expect(controller.snapshot().transcript).toEqual([
      { id: 'assistant-2-1', kind: 'assistant', text: 'new history' },
    ])
  })

  it('reports unknown slash input locally without prompting the model', async () => {
    const prompts: string[] = []
    const controller = new TuiController(services({
      prompt: (text) => { prompts.push(text); return Promise.resolve() },
    }))
    await controller.submit('/missing')
    expect(prompts).toEqual([])
    expect(controller.snapshot().notice).toBe('Unknown command: /missing')
  })
})
