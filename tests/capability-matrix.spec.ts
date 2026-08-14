import { describe, expect, it } from 'vitest'
import { TUI_CAPABILITIES } from '../src/capability-matrix.ts'

describe('TUI capability matrix', () => {
  it('tracks every Harness capability exactly once', () => {
    const ids = TUI_CAPABILITIES.map(capability => capability.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual([
      'prompt', 'cancel', 'commands', 'model', 'permission', 'plan', 'goal',
      'sessions', 'rename', 'export', 'attachments', 'skills', 'subagents',
      'tools', 'approvals', 'questions', 'jobs', 'workflows', 'deliverables',
      'trajectory', 'workspace', 'settings', 'plugins', 'feedback',
    ])
  })

  it('documents a terminal entry and real adapter for every capability', () => {
    for (const capability of TUI_CAPABILITIES) {
      expect(capability.entry).not.toBe('')
      expect(capability.adapter).not.toBe('')
    }
  })
})
