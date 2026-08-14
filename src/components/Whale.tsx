import React from 'react'
import { Text } from 'ink'

export const DEEPSEEK_WHALE = '🐳'

export function Whale(): React.JSX.Element {
  return <Text>{process.env.DSH_CLI_NO_EMOJI === '1' ? '◆' : DEEPSEEK_WHALE}</Text>
}
