import React from 'react'
import { Text } from 'ink'

export const DEEPSEEK_WHALE = [
  '   ⢀⣀⣤⣄⣠⣴⣶⠆  ⢸⣆    ⢀',
  ' ⢀⣾⣿⣿⣿⣿⣿⣿⣿⣄  ⢸⣿⣷⣠⣤⣴⣿',
  '⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠘⢿⣿⣿⣿⠃',
  '⣾⡿⠛⠿⢿⣿⣿⣿⣿⣿⣿⣿⣦⣀⣿⣿⠋⠁',
  '⣿⡇   ⠈⠻⣿⣿⣿⡧⡌⢻⣿⣿⣿⡏',
  '⣿⣷     ⠈⢿⣿⣿⣧⣀⣿⣿⣿⠇',
  '⢸⣿⣆     ⠈⢿⣿⣿⣿⣿⣿⡟',
  ' ⢻⣿⣦  ⢰⣦⡀⠈⢿⣿⣿⣿⠟',
  '  ⠻⣿⣷⣦⣤⣿⣿⣦⣀⣻⣿⣿⣷⣤',
  '   ⠈⠛⠿⣿⣿⣿⣿⠿⠋ ⠉⠉⠁',
].join('\n')

export function Whale(): React.JSX.Element {
  return <Text color="#4D6BFE">{DEEPSEEK_WHALE}</Text>
}
