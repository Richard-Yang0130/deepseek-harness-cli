import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import * as inkMode from '../src/ink-mode.tsx'

class ResizeOutput extends EventEmitter {
  constructor(private readonly order: string[]) {
    super()
  }

  write(value: string): boolean {
    this.order.push(`write:${value}`)
    return true
  }
}

describe('Ink resize cleanup', () => {
  it('resets Ink and clears the visible screen before its resize renderer runs', () => {
    const installResizeCleanup = (inkMode as {
      installResizeCleanup?: (output: ResizeOutput, clear: () => void) => () => void
    }).installResizeCleanup
    expect(installResizeCleanup).toBeTypeOf('function')
    if (installResizeCleanup === undefined) return

    const order: string[] = []
    const output = new ResizeOutput(order)
    output.on('resize', () => { order.push('ink-render') })
    const remove = installResizeCleanup(output, () => { order.push('ink-clear') })

    output.emit('resize')
    expect(order).toEqual(['ink-clear', 'write:\u001B[2J\u001B[H', 'ink-render'])

    order.length = 0
    remove()
    output.emit('resize')
    expect(order).toEqual(['ink-render'])
  })
})
