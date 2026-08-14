import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { strFromU8, unzipSync } from 'fflate'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportSessionArchive } from '../src/export-session.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

describe('session export', () => {
  it('archives the raw root, descendants, and referenced image bytes', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dsh-tui-export-'))
    temporaryDirectories.push(cwd)
    const root = '{"event":"root","content":[{"type":"image","attachment":{"attachmentId":"image-1","mediaType":"image/png"}}]}\n'
    const child = '{"event":"child"}\n'
    const flush = vi.fn(() => Promise.resolve())
    const ctx = {
      sessions: { flush, get: () => undefined },
      sessionPersistence: {
        readRaw: (id: string) => Promise.resolve(id === 'session-root'
          ? { filename: 'session-root.jsonl', content: root }
          : { filename: 'session-child.jsonl', content: child }),
      },
      sessionQuery: {
        traceSession: () => Promise.resolve({
          descendants: [{ kind: 'child', session: { header: { id: 'session-child' } }, descendants: [] }],
        }),
      },
      attachments: { readImage: () => Promise.resolve({ data: new Uint8Array([1, 2, 3]) }) },
    } as unknown as Context
    const agent = {
      id: 'session-root',
      session: { header: { cwd } },
    } as unknown as Agent

    const destination = await exportSessionArchive(ctx, agent, 'archive.zip')
    const archive = unzipSync(await readFile(destination))

    expect(strFromU8(archive['session-root.jsonl'] ?? new Uint8Array())).toBe(root)
    expect(strFromU8(archive['subagents/session-child/session-child.jsonl'] ?? new Uint8Array())).toBe(child)
    expect([...archive['media/image-1.png'] ?? []]).toEqual([1, 2, 3])
    expect(flush).toHaveBeenCalledWith(agent.session)
  })
})
