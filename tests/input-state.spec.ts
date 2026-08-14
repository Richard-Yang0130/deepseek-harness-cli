import { describe, expect, it } from 'vitest'
import { initialInputState, reduceInput } from '../src/input-state.ts'

describe('input reducer', () => {
  it('opens slash discovery and wraps selection', () => {
    const opened = reduceInput(initialInputState(), { type: 'change', value: '/' }, 3)
    expect(opened.menuOpen).toBe(true)
    expect(reduceInput(opened, { type: 'move', delta: -1 }, 3).selected).toBe(2)
  })

  it('opens subagent discovery for an at reference', () => {
    const opened = reduceInput(initialInputState(), { type: 'change', value: '@wor' }, 2)
    expect(opened.menuOpen).toBe(true)
    expect(reduceInput(opened, { type: 'change', value: '@worker ' }, 2).menuOpen).toBe(false)
  })

  it('closes discovery for ordinary text and remembers submitted input', () => {
    const opened = reduceInput(initialInputState(), { type: 'change', value: '/' }, 2)
    const changed = reduceInput(opened, { type: 'change', value: 'hello' }, 2)
    expect(changed.menuOpen).toBe(false)
    expect(reduceInput(changed, { type: 'remember', value: 'hello' }, 2).history).toEqual(['hello'])
  })
})
