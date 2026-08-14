import { describe, expect, it } from 'vitest'
import { CallId } from '@deepseek-ai/dsh-llm'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { presentSessionEvent } from '../src/event-presenter.ts'

const event = <T extends SessionEvent['type']>(
  type: T,
  data: Extract<SessionEvent, { type: T }>['data'],
  seq = 1,
): Extract<SessionEvent, { type: T }> => ({ type, seq, time: 1, data } as Extract<SessionEvent, { type: T }>)

describe('Ink event presenter', () => {
  it('appends visible deltas to one assistant node and hides reasoning', () => {
    const first = presentSessionEvent([], event('assistant/chunk', {
      turn: 1, step: 1, chunk: { type: 'text-delta', index: 0, text: '你好' },
    }))
    const second = presentSessionEvent(first, event('assistant/chunk', {
      turn: 1, step: 1, chunk: { type: 'text-delta', index: 0, text: '！' },
    }, 2))
    expect(second).toEqual([{ id: 'assistant-1-1', kind: 'assistant', text: '你好！' }])
    expect(presentSessionEvent(second, event('assistant/chunk', {
      turn: 1, step: 1, chunk: { type: 'reasoning-delta', index: 0, text: 'secret' },
    }, 3))).toEqual(second)
  })

  it('projects tool calls as stable running rows', () => {
    expect(presentSessionEvent([], event('tool/call', {
      turn: 1, step: 1, callId: CallId('call-1'), name: 'bash', arguments: '{"cmd":"pwd"}',
    }))).toEqual([{
      id: 'tool-call-1', kind: 'tool', title: 'bash', detail: '{"cmd":"pwd"}', status: 'running',
    }])
  })
})
