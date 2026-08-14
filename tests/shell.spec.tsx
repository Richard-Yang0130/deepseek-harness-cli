import React from 'react'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { App } from '../src/app.tsx'
import type { TuiControllerSnapshot } from '../src/controller.ts'

function snapshot(overrides: Partial<TuiControllerSnapshot> = {}): TuiControllerSnapshot {
  return {
    phase: 'idle',
    cwd: '/work',
    commands: [],
    transcript: [],
    panel: null,
    subagents: [],
    sessionId: 'session-ad7d1613',
    provider: 'deepseek-official',
    model: 'deepseek-v4-pro',
    permission: 'workspace-write',
    ...overrides,
  }
}

describe('terminal shell', () => {
  it('renders the approved compact whale and primary status', () => {
    const view = render(<App snapshot={snapshot()} dispatch={() => {}} columns={100} />)
    const frame = view.lastFrame() ?? ''
    expect(frame).toContain('⠈⠛⠿⣿⣿⣿⣿⠿⠋')
    expect(frame).toContain('DeepSeek Harness')
    expect(frame).toContain('deepseek-v4-pro')
    expect(frame).toContain('workspace-write')
  })

  it('drops secondary status before primary state at narrow widths', () => {
    const view = render(<App snapshot={snapshot()} dispatch={() => {}} columns={48} />)
    const frame = view.lastFrame() ?? ''
    expect(frame).toContain('workspace-write')
    expect(frame).not.toContain('session-ad7d1613')
  })
})
