import { describe, expect, it } from 'vitest'
import { runLineMode, type TerminalIo } from '../src/line-mode.ts'

describe('line mode', () => {
  it('drives startup, prompts, and shutdown through the shared controller', async () => {
    const calls: string[] = []
    const input = ['second', '/exit']
    const io: TerminalIo = {
      write: () => {},
      error: () => {},
      read: () => Promise.resolve(input.shift()),
      onInterrupt: () => {},
      close: () => {},
    }
    await runLineMode({
      snapshot: () => ({ phase: 'idle', cwd: '/work', commands: [], transcript: [], panel: null }),
      subscribe: () => () => {},
      start: (resume) => { calls.push(`start:${resume ?? ''}`); return Promise.resolve() },
      submit: (text) => { calls.push(`submit:${text}`); return Promise.resolve() },
      cancel: () => {},
      answerDecision: () => {},
      stop: () => { calls.push('stop'); return Promise.resolve() },
    }, io, { resume: 'session-1', prompt: 'first' })
    expect(calls).toEqual(['start:session-1', 'submit:first', 'submit:second', 'stop'])
  })
})
