import React from 'react'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { Transcript } from '../src/components/Transcript.tsx'

describe('transcript todo list', () => {
  it('renders distinct markers for pending, active, and completed items', () => {
    const view = render(<Transcript nodes={[{
      id: 'todos',
      kind: 'todos',
      items: [
        { content: 'Waiting', status: 'pending' },
        { content: 'Working', status: 'in_progress' },
        { content: 'Finished', status: 'completed' },
      ],
    }]} />)

    expect(view.lastFrame()).toContain('○ Waiting')
    expect(view.lastFrame()).toContain('● Working')
    expect(view.lastFrame()).toContain('✓ Finished')
  })
})
