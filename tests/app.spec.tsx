import React from 'react'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { App } from '../src/app.tsx'

describe('Ink app', () => {
  it('renders the Harness product name', () => {
    const view = render(
      <App snapshot={{ phase: 'idle', cwd: '/work', commands: [], transcript: [], panel: null }} dispatch={() => {}} />,
    )
    expect(view.lastFrame()).toContain('DeepSeek Harness')
  })
})
