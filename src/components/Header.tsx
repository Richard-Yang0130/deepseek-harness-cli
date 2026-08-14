import React from 'react'
import { Box, Text } from 'ink'
import type { TuiControllerSnapshot } from '../controller.js'
import { Whale } from './Whale.js'

export function Header({ snapshot }: { readonly snapshot: TuiControllerSnapshot }): React.JSX.Element {
  const model = snapshot.model === undefined ? 'model loading…' : snapshot.model
  return (
    <Box gap={2} marginBottom={1}>
      <Box width={27} flexShrink={0}><Whale /></Box>
      <Box flexDirection="column" justifyContent="center" flexGrow={1}>
        <Text bold color="#4D6BFE">DeepSeek Harness</Text>
        <Text>{model}</Text>
        <Text dimColor>{snapshot.cwd}</Text>
      </Box>
    </Box>
  )
}
