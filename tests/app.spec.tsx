import React from 'react'
import { render } from 'ink-testing-library'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../src/app.tsx'
import { buildWelcomeRail } from '../src/components/WelcomeBox.tsx'

describe('Ink app', () => {
  it('renders the Harness product name', () => {
    const view = render(
      <App snapshot={{ phase: 'idle', cwd: '/work', commands: [], transcript: [], panel: null }} dispatch={() => {}} />,
    )
    expect(view.lastFrame()).toContain('DeepSeek Harness')
  })

  it('rebuilds the welcome rail when the terminal width changes', async () => {
    const view = render(
      <App snapshot={{ phase: 'idle', cwd: '/work', commands: [], transcript: [], panel: null }} dispatch={() => {}} />,
    )
    const frameCountBeforeResize = view.frames.length
    Object.defineProperty(view.stdout, 'columns', { configurable: true, value: 72 })
    view.stdout.emit('resize')

    await vi.waitFor(() => {
      const rail = (view.lastFrame() ?? '').split('\n')[0] ?? ''
      expect(rail).toBe(buildWelcomeRail('DeepSeek Harness', 70))
    })
    for (const frame of view.frames.slice(frameCountBeforeResize)) {
      expect(frame.split('\n')[0] ?? '').toBe(buildWelcomeRail('DeepSeek Harness', 70))
    }
  })
})
