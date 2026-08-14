import { describe, expect, it } from 'vitest'
import { CallId, createAssistantMessage, createToolResultMessage } from '@deepseek-ai/dsh-llm'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { answerQuestions, parseTerminalInput, renderSessionEvent } from '../src/terminal-ui.ts'

const event = <T extends SessionEvent['type']>(
  type: T,
  data: Extract<SessionEvent, { type: T }>['data'],
): Extract<SessionEvent, { type: T }> => ({ type, seq: 1, time: 1, data } as Extract<SessionEvent, { type: T }>)

describe('terminal event mapping', () => {
  it('streams visible assistant text without exposing reasoning', () => {
    expect(renderSessionEvent(event('assistant/chunk', {
      turn: 1, step: 1, chunk: { type: 'text-delta', index: 0, text: '你好' },
    }))).toEqual({ channel: 'stream', text: '你好' })
    expect(renderSessionEvent(event('assistant/chunk', {
      turn: 1, step: 1, chunk: { type: 'reasoning-delta', index: 0, text: 'secret' },
    }))).toBeUndefined()
  })

  it('maps tool calls and failures to compact terminal status lines', () => {
    const callId = CallId('call-1')
    expect(renderSessionEvent(event('tool/call', {
      turn: 1, step: 1, callId, name: 'bash', arguments: '{"cmd":"pwd"}',
    }))).toEqual({ channel: 'line', text: '● bash {"cmd":"pwd"}' })
    expect(renderSessionEvent(event('tool/result', {
      turn: 1,
      step: 1,
      message: createToolResultMessage({
        callId,
        content: [{ type: 'text', text: 'denied' }],
        isError: true,
      }),
      error: { name: 'Error', code: 'DENIED' },
    }))).toEqual({ channel: 'line', text: '✗ DENIED: denied' })
  })

  it('renders completed assistant messages when replaying history', () => {
    expect(renderSessionEvent(event('assistant/message', {
      turn: 1,
      step: 1,
      message: createAssistantMessage({
        content: [{ type: 'text', text: 'done' }],
        source: { provider: 'test', model: 'test' },
      }),
    }), { replay: true })).toEqual({ channel: 'line', text: 'assistant> done' })
  })
})

describe('terminal user-question mapping', () => {
  it('maps numeric choices and free text into the harness answer protocol', async () => {
    const replies = ['2', 'custom answer']
    const answer = await answerQuestions([
      { id: 'choice', question: 'Pick', options: [{ label: 'A' }, { label: 'B' }] },
      { id: 'free', question: 'Explain' },
    ], async () => replies.shift())
    expect(answer).toEqual({ answers: [
      { id: 'choice', selected: ['B'] },
      { id: 'free', selected: [], custom: 'custom answer' },
    ] })
  })

  it('accepts comma-separated choices for multi-select questions', async () => {
    const answer = await answerQuestions([
      { id: 'many', question: 'Pick', multiSelect: true, options: [{ label: 'A' }, { label: 'B' }] },
    ], async () => '1,2')
    expect(answer.answers[0]).toEqual({ id: 'many', selected: ['A', 'B'] })
  })
})

describe('terminal local commands', () => {
  it('keeps session lifecycle commands in the terminal and forwards harness commands', () => {
    expect(parseTerminalInput('/new')).toEqual({ kind: 'new' })
    expect(parseTerminalInput('/help')).toEqual({ kind: 'help' })
    expect(parseTerminalInput('/sessions')).toEqual({ kind: 'sessions' })
    expect(parseTerminalInput('/resume')).toEqual({ kind: 'resume', sessionId: '' })
    expect(parseTerminalInput('/resume session-2')).toEqual({ kind: 'resume', sessionId: 'session-2' })
    expect(parseTerminalInput('/model')).toEqual({ kind: 'model' })
    expect(parseTerminalInput('/model deepseek deepseek-chat'))
      .toEqual({ kind: 'model', provider: 'deepseek', model: 'deepseek-chat' })
    expect(parseTerminalInput('/rename New title')).toEqual({ kind: 'rename', title: 'New title' })
    expect(parseTerminalInput('/workspace /other')).toEqual({ kind: 'workspace', path: '/other' })
    expect(parseTerminalInput('/exit')).toEqual({ kind: 'exit' })
    expect(parseTerminalInput('/compact')).toEqual({ kind: 'prompt', text: '/compact' })
    expect(parseTerminalInput('hello')).toEqual({ kind: 'prompt', text: 'hello' })
  })
})
