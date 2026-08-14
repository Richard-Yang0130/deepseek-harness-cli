import React from 'react'
import { Box, Text } from 'ink'
import stringWidth from 'string-width'

const BRAND_COLOR = '#4D6BFE'
const LEFT_COLUMN_WIDTH = 22

function truncateToWidth(value: string, width: number): string {
  let result = ''
  for (const character of value) {
    if (stringWidth(result + character) > width) break
    result += character
  }
  return result
}

export function HorizontalRule(): React.JSX.Element {
  return (
    <Box
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
    />
  )
}

export function buildWelcomeRail(title: string, width: number): string {
  const fixedRailWidth = stringWidth('╭─  ╮')
  const visibleTitle = truncateToWidth(title, Math.max(0, width - fixedRailWidth))
  const fill = Math.max(0, width - stringWidth(`╭─ ${visibleTitle} ╮`))
  return `╭─ ${visibleTitle} ${'─'.repeat(fill)}╮`
}

export function WelcomeBox({ title, width, left, right }: {
  readonly title: string
  readonly width: number
  readonly left: React.ReactNode
  readonly right: React.ReactNode
}): React.JSX.Element {
  const rail = buildWelcomeRail(title, width)
  const leftWidth = Math.min(LEFT_COLUMN_WIDTH, Math.floor(width / 2))

  return (
    <Box flexDirection="column">
      <Text color={BRAND_COLOR}>{rail}</Text>
      <Box width={width} borderStyle="round" borderTop={false} borderColor={BRAND_COLOR}>
        <Box width={leftWidth} flexShrink={0} flexDirection="column">{left}</Box>
        <Box
          borderStyle="round"
          borderTop={false}
          borderBottom={false}
          borderRight={false}
          borderColor={BRAND_COLOR}
          flexDirection="column"
          flexGrow={1}
          paddingLeft={1}
        >
          {right}
        </Box>
      </Box>
    </Box>
  )
}
