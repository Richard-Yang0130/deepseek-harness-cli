import React from 'react'
import { Box, Text } from 'ink'
import type { TuiControllerSnapshot } from '../controller.js'

export function StatusLine({ snapshot, columns }: {
  readonly snapshot: TuiControllerSnapshot
  readonly columns: number
}): React.JSX.Element {
  const permission = snapshot.permission ?? 'approval'
  return (
    <Box borderStyle="single" borderLeft={false} borderRight={false} borderBottom={false}>
      <Text color="#4D6BFE">{snapshot.phase === 'running' ? '● working' : '◆ ready'}</Text>
      <Text> · {permission}</Text>
      {columns >= 64 && snapshot.model !== undefined ? <Text> · {snapshot.model}</Text> : null}
      {columns >= 110 && snapshot.sessionId !== undefined ? <Text dimColor> · {snapshot.sessionId}</Text> : null}
    </Box>
  )
}
