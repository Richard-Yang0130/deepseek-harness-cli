import React from 'react'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import stringWidth from 'string-width'
import { App } from '../src/app.tsx'
import { DEEPSEEK_WHALE } from '../src/components/Whale.tsx'
import type { TuiControllerSnapshot } from '../src/controller.ts'

function snapshot(overrides: Partial<TuiControllerSnapshot> = {}): TuiControllerSnapshot {
  return {
    phase: 'idle',
    cwd: '/workspace/example-project',
    commands: [],
    transcript: [],
    panel: null,
    subagents: [],
    sessionId: 'example-session',
    provider: 'deepseek-official',
    model: 'deepseek-v4-pro',
    permission: 'workspace-write',
    ...overrides,
  }
}

describe('terminal shell', () => {
  it('renders the approved wide eight-row whale and primary status', () => {
    const rows = DEEPSEEK_WHALE.split('\n')
    expect(rows).toHaveLength(8)
    expect(Math.max(...rows.map(row => stringWidth(row.trimEnd())))).toBeGreaterThanOrEqual(32)
    expect(Math.max(...rows.map(row => stringWidth(row)))).toBeLessThanOrEqual(36)
    const view = render(<App snapshot={snapshot()} dispatch={() => {}} columns={100} />)
    const frame = view.lastFrame() ?? ''
    expect(frame).toContain('⠙⠿⣿⣿⣿⣿⣿⣿⠿⠋')
    expect(frame).toContain('DeepSeek Harness')
    expect(frame).toContain('deepseek-v4-pro')
    expect(frame).toContain('workspace-write')
    expect(frame).toContain('/workspace/example-project')
    expect(frame).not.toMatch(/\/Users\/|session-[0-9a-f-]{16,}/)
  })

  it('drops secondary status before primary state at narrow widths', () => {
    const view = render(<App snapshot={snapshot()} dispatch={() => {}} columns={48} />)
    const frame = view.lastFrame() ?? ''
    expect(frame).toContain('workspace-write')
    expect(frame).not.toContain('example-session')
  })
})
