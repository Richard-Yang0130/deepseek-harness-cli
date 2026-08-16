import type { Channel, ChatRow } from './channel.js'

export interface PlainReporterOptions {
  readonly write: (text: string) => void
  readonly showReasoning?: boolean
}

type PlainChannel = Pick<Channel, 'rows' | 'subscribe'>

export function attachPlainReporter(
  channel: PlainChannel,
  options: PlainReporterOptions,
): () => void {
  const lengths = new Map<number, number>()
  const completed = new Set<number>()
  let openLine: number | undefined

  const closeOpenLine = (): void => {
    if (openLine === undefined) return
    options.write('\n')
    completed.add(openLine)
    openLine = undefined
  }

  const emitGrowingRow = (row: ChatRow, label: string): void => {
    const previous = lengths.get(row.id) ?? 0
    if (row.text.length > previous) {
      if (openLine !== undefined && openLine !== row.id) closeOpenLine()
      const restarting = completed.delete(row.id)
      options.write(`${previous === 0 || restarting ? `${label}: ` : ''}${row.text.slice(previous)}`)
      lengths.set(row.id, row.text.length)
      openLine = row.id
    }
    if (row.streaming !== true && openLine === row.id) closeOpenLine()
  }

  const flush = (): void => {
    for (const row of channel.rows) {
      if (row.kind === 'user') {
        if (!completed.has(row.id)) {
          closeOpenLine()
          options.write(`User: ${row.text}\n`)
          completed.add(row.id)
        }
      } else if (row.kind === 'assistant') {
        emitGrowingRow(row, 'Assistant')
      } else if (row.kind === 'reasoning' && options.showReasoning === true) {
        emitGrowingRow(row, 'Reasoning')
      } else if (row.kind === 'tool' && !completed.has(row.id)) {
        const tool = row.tool
        if (tool !== undefined && tool.status !== 'running') {
          closeOpenLine()
          const summary = tool.resultText ?? tool.errorText ?? row.text
          options.write(`Tool ${tool.name}: ${summary}\n`)
          completed.add(row.id)
        }
      }
    }
  }

  flush()
  return channel.subscribe(flush)
}
