import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type { SessionLineageNode } from '@deepseek-ai/dsh-session-query'
import type {} from '@deepseek-ai/dsh-session-query'
import { strToU8, zipSync } from 'fflate'

const MEDIA_EXTENSION: Record<ImageAttachmentRef['mediaType'], string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function safeSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '_')
}

function collectImages(value: unknown, output: Map<string, ImageAttachmentRef>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectImages(item, output)
    return
  }
  if (typeof value !== 'object' || value === null) return
  const item = value as { type?: unknown; attachment?: unknown }
  if (item.type === 'image' && typeof item.attachment === 'object' && item.attachment !== null) {
    const ref = item.attachment as ImageAttachmentRef
    output.set(String(ref.attachmentId), ref)
  }
  for (const child of Object.values(value)) collectImages(child, output)
}

function imagesInArtifact(content: string, output: Map<string, ImageAttachmentRef>): void {
  for (const line of content.split('\n')) {
    if (line === '') continue
    try {
      collectImages(JSON.parse(line), output)
    } catch {
      // The raw artifact itself remains byte-identical; malformed lines carry no trusted reference.
    }
  }
}

/** Export the active session, descendants, and referenced images as one ZIP. */
export async function exportSessionArchive(
  ctx: Context,
  agent: Agent,
  destination?: string,
): Promise<string> {
  await ctx.sessions.flush(agent.session)
  const root = await ctx.sessionPersistence.readRaw(agent.id)
  if (root === undefined) throw new Error(`session "${agent.id}" has no stored log artifact`)

  const files: Record<string, Uint8Array> = {}
  const images = new Map<string, ImageAttachmentRef>()
  files[root.filename] = strToU8(root.content)
  imagesInArtifact(root.content, images)

  const lineage = await ctx.sessionQuery.traceSession(agent.id)
  const collectDescendants = async (nodes: readonly SessionLineageNode[]): Promise<void> => {
    for (const node of nodes) {
      const id = node.session.header.id
      const live = ctx.sessions.get(id)
      if (live !== undefined) await ctx.sessions.flush(live)
      const raw = await ctx.sessionPersistence.readRaw(id)
      if (raw === undefined) throw new Error(`subagent "${id}" has no stored log artifact`)
      files[`subagents/${safeSegment(id)}/${raw.filename}`] = strToU8(raw.content)
      imagesInArtifact(raw.content, images)
      await collectDescendants(node.descendants)
    }
  }
  await collectDescendants(lineage.descendants)

  for (const ref of images.values()) {
    const stored = await ctx.attachments.readImage(ref)
    files[`media/${String(ref.attachmentId)}.${MEDIA_EXTENSION[ref.mediaType]}`] = stored.data
  }

  const path = resolve(
    agent.session.header.cwd ?? process.cwd(),
    destination === undefined || destination.trim() === ''
      ? `dsh-session-${safeSegment(agent.id)}.zip`
      : destination,
  )
  await writeFile(path, zipSync(files, { level: 6 }))
  return path
}
