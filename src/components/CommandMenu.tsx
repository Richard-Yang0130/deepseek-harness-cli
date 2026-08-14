import React from 'react'
import { Box, Text } from 'ink'
import type { TuiCommand } from '../controller-types.js'

function sourceLabel(source: TuiCommand['source']): string {
  if (source === 'harness') return 'dsh'
  return source
}

export function CommandMenu({ commands, selected }: {
  readonly commands: readonly TuiCommand[]
  readonly selected: number
}): React.JSX.Element {
  const start = Math.min(Math.max(0, selected - 7), Math.max(0, commands.length - 8))
  return (
    <Box flexDirection="column" paddingLeft={2}>
      {commands.slice(start, start + 8).map((command, index) => (
        <Text key={`${command.source}:${command.name}`} wrap="truncate-end" {...index + start === selected ? { color: '#4D6BFE' as const } : {}}>
          {index + start === selected ? '❯' : ' '} /{command.name}{command.hint === undefined ? '' : ` ${command.hint}`}
          <Text dimColor>  {command.description}  [{sourceLabel(command.source)}]</Text>
        </Text>
      ))}
      {commands.length === 0 ? <Text dimColor>  No matching commands</Text> : null}
    </Box>
  )
}
