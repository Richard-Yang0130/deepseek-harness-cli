import { describe, expect, it } from 'vitest'
import { parseTuiStartup } from '../src/startup.ts'

describe('tui startup arguments', () => {
  it('accepts a session to resume and an optional first prompt', () => {
    expect(parseTuiStartup(['--resume', 'session-123', 'continue', 'the', 'work']))
      .toEqual({ resume: 'session-123', prompt: 'continue the work' })
  })

  it('starts a fresh interactive session without arguments', () => {
    expect(parseTuiStartup([])).toEqual({})
  })

  it('rejects an empty resume id', () => {
    expect(() => parseTuiStartup(['--resume', ''])).toThrow('session id')
  })
})
