import React from 'react'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { App } from '../src/app.tsx'
import type { BannerFacts } from '../src/banner-facts.ts'
import { DEEPSEEK_WHALE } from '../src/components/Whale.tsx'
import type { TuiControllerSnapshot } from '../src/controller.ts'

function snapshot(overrides: Partial<TuiControllerSnapshot> = {}): TuiControllerSnapshot {
  return {
    phase: 'idle',
    cwd: '/workspace/example-project',
    commands: [],
    transcript: [],
    panel: null,
    sessionId: 'example-session',
    provider: 'deepseek-official',
    model: 'deepseek-v4-pro',
    permission: 'workspace-write',
    ...overrides,
  }
}

describe('terminal shell', () => {
  const bannerFacts: BannerFacts = {
    version: '0.1.5',
    latest: { version: '0.1.5', bullets: ['新增 Claude 风格欢迎框', '保留全部 dsh 命令映射'] },
  }

  it('renders the bordered welcome box and primary status', () => {
    expect(DEEPSEEK_WHALE).toBe('🐳')
    const view = render(<App snapshot={snapshot()} dispatch={() => {}} columns={100} bannerFacts={bannerFacts} />)
    const frame = view.lastFrame() ?? ''
    expect(frame).toContain('╭─ DeepSeek Harness v0.1.5 ')
    expect(frame).toContain('🐳')
    expect(frame).toContain('Welcome back!')
    expect(frame).toContain('快速上手')
    expect(frame).toContain('本次更新 v0.1.5')
    expect(frame).toContain('新增 Claude 风格欢迎框')
    expect(frame).toContain('deepseek-v4-pro')
    expect(frame).toContain('workspace-write')
    expect(frame).toContain('example-project')
    expect(frame).not.toMatch(/\/Users\/|session-[0-9a-f-]{16,}/)
  })

  it('drops secondary status before primary state at narrow widths', () => {
    const view = render(<App snapshot={snapshot()} dispatch={() => {}} columns={64} bannerFacts={bannerFacts} />)
    const frame = view.lastFrame() ?? ''
    expect(frame).toContain('workspace-write')
    expect(frame).not.toContain('example-session')
    expect(frame).toContain('🐳 DeepSeek Harness')
    expect(frame).not.toContain('╭─')
    expect(frame).not.toContain('/workspace/example-project')
  })

  it.each([72, 99, 100])('uses the emoji welcome box at %i columns', columns => {
    const frame = render(<App snapshot={snapshot()} dispatch={() => {}} columns={columns} />).lastFrame() ?? ''
    expect(frame).toContain('╭─ DeepSeek Harness ')
    expect(frame).toContain('🐳')
    expect(frame).not.toContain('⢀⣠⣤⣶')
    expect(frame).not.toContain('本次更新')
  })
})
