import { describe, expect, it } from 'vitest'
import { CallId, createToolResultMessage } from '@deepseek-ai/dsh-llm'
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
      id: 'tool-call-1', kind: 'tool', title: 'bash', detail: '{"cmd":"pwd"}', status: 'running', turn: 1,
    }])
  })

  it('derives produced files from successful edit-tool presentation locations', () => {
    const callId = CallId('call-edit')
    const pending = presentSessionEvent([], event('tool/call', {
      turn: 3, step: 1, callId, name: 'write', arguments: '{"path":"result.txt"}',
    }), () => ({ title: 'Write result.txt', producedPaths: ['result.txt'] }))
    const settled = presentSessionEvent(pending, event('tool/result', {
      message: createToolResultMessage({ callId, content: [{ type: 'text', text: 'written' }] }),
    }, 2))
    expect(settled).toContainEqual({ id: 'deliverables-3', kind: 'deliverables', paths: ['result.txt'] })
  })

  it('folds durable workflow records into a settled workflow row', () => {
    const start = {
      type: 'tool-workflow/run-start', seq: 1, time: 1,
      data: { runId: 'workflow-1', name: 'review' },
    } as unknown as SessionEvent
    const agent = {
      type: 'tool-workflow/agent-start', seq: 2, time: 2,
      data: { runId: 'workflow-1', seq: 1, label: 'Inspect tests', childId: 'session-child' },
    } as unknown as SessionEvent
    const end = {
      type: 'tool-workflow/run-end', seq: 3, time: 3,
      data: { runId: 'workflow-1', stopReason: 'completed' },
    } as unknown as SessionEvent
    const nodes = presentSessionEvent(presentSessionEvent(presentSessionEvent([], start), agent), end)
    expect(nodes).toEqual([{
      id: 'workflow-workflow-1', kind: 'workflow', title: 'review', detail: '● Inspect tests', status: 'success',
    }])
  })

  it('keeps only the latest todo list snapshot in its original transcript position', () => {
    const first = presentSessionEvent([], event('todo/write', {
      todos: [{ content: 'Inspect implementation', status: 'in_progress' }],
    }))
    const withLaterOutput = [...first, { id: 'later', kind: 'assistant', text: 'Working…' } as const]
    const second = presentSessionEvent(withLaterOutput, event('todo/write', {
      todos: [
        { content: 'Inspect implementation', status: 'completed' },
        { content: 'Add tests', status: 'pending' },
      ],
    }, 2))

    expect(first).toEqual([{
      id: 'todos', kind: 'todos', items: [{ content: 'Inspect implementation', status: 'in_progress' }],
    }])
    expect(second).toHaveLength(2)
    expect(second[0]).toEqual({
      id: 'todos',
      kind: 'todos',
      items: [
        { content: 'Inspect implementation', status: 'completed' },
        { content: 'Add tests', status: 'pending' },
      ],
    })
    expect(second[1]).toEqual({ id: 'later', kind: 'assistant', text: 'Working…' })
  })
})
