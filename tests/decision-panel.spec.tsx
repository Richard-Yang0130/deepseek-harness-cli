import React from 'react'
import { render } from 'ink-testing-library'
import { describe, expect, it, vi } from 'vitest'
import { DecisionPanel, type DecisionIntent } from '../src/components/DecisionPanel.tsx'
import type { ApprovalPanelState, QuestionPanelState } from '../src/controller-types.ts'

async function tick(): Promise<void> {
  await new Promise((resolve) => { setTimeout(resolve, 0) })
}

describe('decision panel', () => {
  it('settles approval with the highlighted choice', async () => {
    const panel: ApprovalPanelState = {
      kind: 'approval', toolName: 'bash', reason: 'run tests', selected: 0,
      options: [
        { label: 'Reject', outcome: 'rejected' },
        { label: 'Allow once', outcome: 'allowed-once' },
      ],
    }
    const dispatched: DecisionIntent[] = []
    const view = render(<DecisionPanel panel={panel} dispatch={intent => dispatched.push(intent)} />)
    await tick()
    view.stdin.write('\u001B[B')
    await vi.waitFor(() => { expect(view.lastFrame()).toContain('❯ ◉ Allow once') })
    view.stdin.write('\r')
    await tick()
    expect(dispatched).toContainEqual({ type: 'answer-approval', outcome: 'allowed-once' })
  })

  it('toggles multiple answers with Space and submits with Enter', async () => {
    const panel: QuestionPanelState = {
      kind: 'multi-question', id: 'q1', prompt: 'Choose', selected: 0,
      options: [{ label: 'one', checked: false }, { label: 'two', checked: false }],
    }
    const dispatched: DecisionIntent[] = []
    const view = render(<DecisionPanel panel={panel} dispatch={intent => dispatched.push(intent)} />)
    await tick()
    view.stdin.write(' ')
    await vi.waitFor(() => { expect(view.lastFrame()).toContain('❯ [x] one') })
    view.stdin.write('\u001B[B')
    await vi.waitFor(() => { expect(view.lastFrame()).toContain('❯ [ ] two') })
    view.stdin.write(' ')
    await vi.waitFor(() => { expect(view.lastFrame()).toContain('❯ [x] two') })
    view.stdin.write('\r')
    await tick()
    expect(dispatched).toContainEqual({ type: 'answer-question', selected: ['one', 'two'] })
  })
})
