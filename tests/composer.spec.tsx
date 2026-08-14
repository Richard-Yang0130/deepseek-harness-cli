import React from 'react'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { App, type AppIntent } from '../src/app.tsx'
import { ctrlCIntent } from '../src/components/Composer.tsx'
import type { TuiControllerSnapshot } from '../src/controller.ts'

const snapshot: TuiControllerSnapshot = {
  phase: 'idle',
  cwd: '/work',
  transcript: [],
  panel: null,
  commands: [
    { name: 'compact', description: 'Compact history', source: 'harness' },
    { name: 'goal', description: 'Set a goal', hint: '[objective]', source: 'harness' },
  ],
}

describe('slash command composer', () => {
  it('opens below the input and completes the selected real command', async () => {
    const dispatched: AppIntent[] = []
    const view = render(<App snapshot={snapshot} dispatch={intent => dispatched.push(intent)} />)
    await new Promise(resolve => setTimeout(resolve, 0))
    view.stdin.write('/')
    await new Promise(resolve => setTimeout(resolve, 0))
    const frame = view.lastFrame() ?? ''
    expect(frame).toContain('/compact')
    expect(frame.indexOf('❯ /')).toBeLessThan(frame.indexOf('/compact'))
    view.stdin.write('\u001B[B')
    await new Promise(resolve => setTimeout(resolve, 0))
    view.stdin.write('\r')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(dispatched).toContainEqual({ type: 'complete-command', value: '/goal ' })
  })

  it('exits on Ctrl+C while idle and cancels while running', () => {
    expect(ctrlCIntent(false)).toEqual({ type: 'exit' })
    expect(ctrlCIntent(true)).toEqual({ type: 'cancel' })
  })
})
