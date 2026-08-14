import { mkdir, writeFile } from 'node:fs/promises'
import React from 'react'
import { render } from 'ink-testing-library'
import { Box, Text } from 'ink'
import { CommandMenu } from '../src/components/CommandMenu.js'
import { Header } from '../src/components/Header.js'
import { StatusLine } from '../src/components/StatusLine.js'
import type { TuiControllerSnapshot } from '../src/controller.js'

const commands = [
  ['help', 'Show terminal commands'], ['models', 'List model providers and models'],
  ['model', 'Switch the session model'], ['sessions', 'List or search sessions'],
  ['presets', 'Manage agent presets'], ['settings', 'Inspect or edit settings'],
  ['plugins', 'List loaded Harness plugins'], ['jobs', 'List background jobs'],
  ['export', 'Export this session as ZIP'], ['trajectory', 'Show durable events'],
].map(([name, description]) => ({ name: name as string, description: description as string, source: 'terminal' as const }))

const snapshot: TuiControllerSnapshot = {
  phase: 'idle', cwd: '/workspace/example-project', commands, transcript: [], panel: null,
  provider: 'deepseek-official', model: 'deepseek-v4-pro',
  permission: 'workspace-write',
}
function ScreenshotApp(): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Header snapshot={snapshot} columns={104} />
      <Box borderStyle="single" borderLeft={false} borderRight={false} paddingX={1}>
        <Text color="#4D6BFE">❯ /</Text>
      </Box>
      <CommandMenu commands={commands} selected={0} />
      <StatusLine snapshot={snapshot} columns={104} />
    </Box>
  )
}

const view = render(<ScreenshotApp />)
const frame = view.lastFrame() ?? ''
view.unmount()

const escape = (text: string): string => text
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const lines = frame.split('\n')
const width = 1320
const lineHeight = 22
const height = 76 + lines.length * lineHeight + 34
const body = lines.map((value, index) => {
  const color = index < 8 ? '#6685ff' : value.includes('❯') ? '#f2f4ff' : '#c9cce0'
  return `<text x="42" y="${70 + index * lineHeight}" fill="${color}">${escape(value)}</text>`
}).join('\n')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" rx="22" fill="#181825"/>
<circle cx="28" cy="26" r="7" fill="#ff5f57"/><circle cx="51" cy="26" r="7" fill="#febc2e"/><circle cx="74" cy="26" r="7" fill="#28c840"/>
<text x="${width / 2}" y="31" text-anchor="middle" fill="#8f93aa" font-family="SFMono-Regular, Menlo, monospace" font-size="14">deepseek-harness-cli</text>
<g font-family="SFMono-Regular, Menlo, Consolas, monospace" font-size="16" xml:space="preserve">${body}</g>
</svg>\n`
const output = new URL('../docs/assets/', import.meta.url)
await mkdir(output, { recursive: true })
await writeFile(new URL('terminal.svg', output), svg)
process.stdout.write(`Rendered ${lines.length} terminal rows.\n`)
