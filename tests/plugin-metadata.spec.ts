import { describe, expect, it } from 'vitest'
import { inject } from '../src/index.ts'

describe('TUI plugin metadata', () => {
  it('declares every context service used during startup', () => {
    expect(inject).toEqual(expect.arrayContaining([
      'agentDefaultModel', 'agents', 'attachments', 'jobs', 'llm', 'sessions',
      'sessionPersistence', 'sessionQuery', 'sessionTitle', 'settings', 'subagents',
      'userQuestions', 'workspaceRegistry',
    ]))
  })
})
