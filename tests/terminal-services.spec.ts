import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { describe, expect, it, vi } from 'vitest'
import type { TuiServices } from '../src/controller.js'
import { internals } from '../src/index.js'

function servicesWithPendingImage(method: 'followup' | 'steer'): {
  readonly services: TuiServices
  readonly sent: ContentBlock[][]
  fail(value: boolean): void
} {
  const attachment = { id: 'image-1' } as unknown as ImageAttachmentRef
  const sent: ContentBlock[][] = []
  let failing = true
  const send = (message: { readonly content: ContentBlock[] }): void => {
    if (failing) throw new Error('send failed')
    sent.push(message.content)
  }
  const agent = {
    session: { header: {} },
    followup: method === 'followup' ? vi.fn(send) : vi.fn(),
    steer: method === 'steer' ? vi.fn(send) : vi.fn(),
    whenIdle: vi.fn(async () => {}),
  }
  const services = internals.createServices(
    { sessions: { flush: vi.fn(async () => {}) } } as never,
    { write: vi.fn(), error: vi.fn(), read: vi.fn(), onInterrupt: vi.fn(), close: vi.fn() },
    false,
  )
  const state = services as unknown as {
    handle: { agent: typeof agent }
    pendingImages: ImageAttachmentRef[]
  }
  state.handle = { agent }
  state.pendingImages = [attachment]
  return { services, sent, fail: value => { failing = value } }
}

describe('terminal message attachments', () => {
  it('keeps attachments when followup throws synchronously', async () => {
    const harness = servicesWithPendingImage('followup')

    await expect(harness.services.prompt('first')).rejects.toThrow('send failed')
    harness.fail(false)
    await harness.services.prompt('retry')

    expect(harness.sent[0]).toEqual([
      { type: 'image', attachment: { id: 'image-1' } },
      { type: 'text', text: 'retry' },
    ])
  })

  it('keeps attachments when steer throws synchronously', () => {
    const harness = servicesWithPendingImage('steer')

    expect(() => harness.services.steer?.('first')).toThrow('send failed')
    harness.fail(false)
    harness.services.steer?.('retry')

    expect(harness.sent[0]).toEqual([
      { type: 'image', attachment: { id: 'image-1' } },
      { type: 'text', text: 'retry' },
    ])
  })
})
