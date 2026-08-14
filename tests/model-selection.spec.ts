import { describe, expect, it } from 'vitest'
import { restoredModelSelection } from '../src/index.js'

describe('session model selection restoration', () => {
  it('prefers the latest durable request header over the current default', () => {
    const selection = restoredModelSelection({
      requestHeader: () => ({
        config: { provider: 'deepseek-official', model: 'deepseek-v4-pro' },
      }) as never,
    }, { provider: 'deepseek-official', model: 'deepseek-v4-flash' })
    expect(selection).toEqual({ provider: 'deepseek-official', model: 'deepseek-v4-pro' })
  })

  it('uses the live default before a session has a request header', () => {
    const fallback = { provider: 'deepseek-official', model: 'deepseek-v4-flash' }
    expect(restoredModelSelection({ requestHeader: () => undefined }, fallback)).toEqual(fallback)
  })
})
