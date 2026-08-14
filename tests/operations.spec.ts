import { describe, expect, it, vi } from 'vitest'
import {
  credentialsOperation, messageFeedbackOperation, modelsOperation, settingsOperation,
} from '../src/operations.js'

describe('terminal operations', () => {
  it('lists providers and their advertised models through the LLM service', async () => {
    const text = await modelsOperation({
      listProviders: () => [{ id: 'deepseek-official', name: 'DeepSeek' }],
      listModels: async () => [{ provider: 'deepseek-official', id: 'deepseek-chat', name: 'DeepSeek Chat' }],
    })
    expect(text).toContain('deepseek-official/deepseek-chat')
  })

  it('mutates settings through the registered provider with JSON values', async () => {
    const mutate = vi.fn(async () => {})
    const settings = {
      describe: () => [{ ns: 'example', revision: 4, value: {}, applies: 'live' }],
      mutate,
    }
    const text = await settingsOperation(settings, 'set example nested.enabled true')
    expect(mutate).toHaveBeenCalledWith('example', [{ op: 'set', path: ['nested', 'enabled'], value: true }], 4)
    expect(text).toContain('example')
  })

  it('stores a credential from an environment reference without echoing its value', async () => {
    const set = vi.fn(async () => {})
    const text = await credentialsOperation({
      describe: async () => ({ configured: false, writable: true }),
      set,
      unset: async () => {},
    }, 'set DEEPSEEK_API_KEY SOURCE_KEY', { SOURCE_KEY: 'private-value' })
    expect(set).toHaveBeenCalledWith('DEEPSEEK_API_KEY', 'private-value')
    expect(text).not.toContain('private-value')
  })

  it('uses compare-and-set message feedback from the same feedback service', async () => {
    const put = vi.fn(async () => ({ ok: true, value: { version: 'next' } }))
    const service = {
      list: async () => ({ ok: true as const, value: { items: [{ messageId: 'message-1', version: 'current' }] } }),
      put,
      delete: async () => ({ ok: true as const, value: { absent: true as const } }),
    }
    const text = await messageFeedbackOperation(service, 'example-session', 'put message-1 positive helpful')
    expect(put).toHaveBeenCalledWith({
      sessionId: 'example-session', messageId: 'message-1', rating: 'positive', note: 'helpful', ifVersion: 'current',
    })
    expect(text).toContain('Saved')
  })
})
