import React from 'react'
import { Box, Text } from 'ink'
import type { TuiControllerSnapshot } from '../controller.js'
import { Whale } from './Whale.js'

export function Header({ snapshot, columns }: {
  readonly snapshot: TuiControllerSnapshot
  readonly columns: number
}): React.JSX.Element {
  const model = snapshot.model === undefined ? 'model loading…' : snapshot.model
  if (columns < 82) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="#4D6BFE">DeepSeek Harness</Text>
        <Text>{model}</Text>
      </Box>
    )
  }
  return (
    <Box gap={2} marginBottom={1}>
      <Box width={50} flexShrink={0}><Whale /></Box>
      <Box flexDirection="column" justifyContent="center" flexGrow={1}>
        <Text bold color="#4D6BFE">DeepSeek Harness</Text>
        <Text>{model}</Text>
        <Text dimColor>{snapshot.cwd}</Text>
      </Box>
    </Box>
  )
}
