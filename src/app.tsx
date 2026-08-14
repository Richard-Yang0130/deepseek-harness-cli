import React from 'react'
import { Box, Text, useStdout } from 'ink'
import type { TuiControllerSnapshot } from './controller.js'
import type { DecisionIntent } from './controller-types.js'
import { DecisionPanel } from './components/DecisionPanel.js'
import { Header } from './components/Header.js'
import { Composer } from './components/Composer.js'
import { StatusLine } from './components/StatusLine.js'
import { Transcript } from './components/Transcript.js'

export type AppIntent =
  | { readonly type: 'submit'; readonly value: string }
  | { readonly type: 'complete-command'; readonly value: string }
  | { readonly type: 'cancel' | 'exit' }
  | DecisionIntent

export interface AppProps {
  readonly snapshot: TuiControllerSnapshot
  readonly dispatch: (intent: AppIntent) => void
  readonly columns?: number
}

export function App({ snapshot, dispatch, columns: columnsOverride }: AppProps): React.JSX.Element {
  const { stdout } = useStdout()
  const columns = columnsOverride ?? stdout.columns
  return (
    <Box flexDirection="column">
      <Header snapshot={snapshot} columns={columns} />
      <Transcript nodes={snapshot.transcript} />
      {snapshot.notice === undefined ? null : <Text color="yellow">{snapshot.notice}</Text>}
      {snapshot.panel === null
        ? <Composer commands={snapshot.commands} subagents={snapshot.subagents} disabled={snapshot.phase !== 'idle'} dispatch={dispatch} />
        : <DecisionPanel panel={snapshot.panel} dispatch={dispatch} />}
      <StatusLine snapshot={snapshot} columns={columns} />
    </Box>
  )
}
