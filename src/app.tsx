import React, { useEffect, useState } from 'react'
import { Box, Text, useStdout } from 'ink'
import type { BannerFacts } from './banner-facts.js'
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
  readonly bannerFacts?: BannerFacts
}

function useTerminalColumns(columnsOverride: number | undefined): number {
  const { stdout } = useStdout()
  const [terminalColumns, setTerminalColumns] = useState(stdout.columns)

  useEffect(() => {
    if (columnsOverride !== undefined) return
    const updateColumns = (): void => { setTerminalColumns(stdout.columns) }
    updateColumns()
    stdout.prependListener('resize', updateColumns)
    return () => { stdout.off('resize', updateColumns) }
  }, [columnsOverride, stdout])

  return columnsOverride ?? terminalColumns
}

export function App({ snapshot, dispatch, columns: columnsOverride, bannerFacts }: AppProps): React.JSX.Element {
  const columns = useTerminalColumns(columnsOverride)
  return (
    <Box flexDirection="column">
      <Header snapshot={snapshot} columns={columns} {...bannerFacts === undefined ? {} : { bannerFacts }} />
      <Transcript nodes={snapshot.transcript} />
      {snapshot.notice === undefined ? null : <Text color="yellow">{snapshot.notice}</Text>}
      {snapshot.panel === null
        ? <Composer
          commands={snapshot.commands}
          disabled={snapshot.phase === 'starting' || snapshot.phase === 'stopping'}
          running={snapshot.phase === 'running'}
          dispatch={dispatch}
        />
        : <DecisionPanel panel={snapshot.panel} dispatch={dispatch} />}
      <StatusLine snapshot={snapshot} columns={columns} />
    </Box>
  )
}
