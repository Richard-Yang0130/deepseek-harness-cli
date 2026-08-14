import React from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import stringWidth from 'string-width'
import { describe, expect, it } from 'vitest'
import { buildWelcomeRail, HorizontalRule, WelcomeBox } from '../src/components/WelcomeBox.tsx'

describe('WelcomeBox', () => {
  it.each([70, 98])('renders a top rail exactly %i cells wide', width => {
    const view = render(
      <WelcomeBox title="DeepSeek Harness v0.1.4" width={width} left={<Text>left</Text>} right={<Text>right</Text>} />,
    )
    const rail = (view.lastFrame() ?? '').split('\n')[0] ?? ''
    expect(stringWidth(rail)).toBe(width)
  })

  it('builds a 158-cell rail without relying on the test terminal width', () => {
    expect(stringWidth(buildWelcomeRail('DeepSeek Harness v0.1.4', 158))).toBe(158)
  })

  it('truncates an oversized title without corrupting the rail', () => {
    const width = 70
    const view = render(
      <WelcomeBox title={'DeepSeek Harness 欢迎回来 '.repeat(8)} width={width} left={<Text>left</Text>} right={<Text>right</Text>} />,
    )
    const rail = (view.lastFrame() ?? '').split('\n')[0] ?? ''
    expect(stringWidth(rail)).toBe(width)
    expect(rail.startsWith('╭─ ')).toBe(true)
    expect(rail.endsWith(' ╮')).toBe(true)
  })

  it('renders the two columns, vertical divider, and bottom rail', () => {
    const frame = render(
      <WelcomeBox title="DeepSeek Harness" width={72} left={<Text>left</Text>} right={<Text>right</Text>} />,
    ).lastFrame() ?? ''
    expect(frame).toContain('│left')
    expect(frame).toMatch(/left.*│ right/)
    expect(frame.split('\n').at(-1)).toMatch(/^╰─+╯$/)
  })
})

describe('HorizontalRule', () => {
  it('renders a visible horizontal separator', () => {
    const frame = render(<HorizontalRule />).lastFrame() ?? ''
    expect(frame).toContain('─')
  })
})
