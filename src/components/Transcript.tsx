import React from 'react'
import { Box, Text } from 'ink'
import type { TranscriptNode } from '../controller-types.js'

function TranscriptRow({ node }: { readonly node: TranscriptNode }): React.JSX.Element {
  if (node.kind === 'user') return <Text><Text color="#4D6BFE">❯ </Text>{node.text}</Text>
  if (node.kind === 'assistant') return <Text>{node.text}</Text>
  if (node.kind === 'notice') return <Text dimColor>{node.text}</Text>
  if (node.kind === 'error') return <Text color="red">✗ {node.text}</Text>
  if (node.kind === 'deliverables') return <Text color="green">{node.paths.join('  ')}</Text>
  if (node.kind === 'todos') {
    return (
      <Box flexDirection="column">
        {node.items.map((item, index) => {
          const marker = item.status === 'pending' ? '○' : item.status === 'in_progress' ? '●' : '✓'
          const color = item.status === 'in_progress' ? '#4D6BFE' : 'green'
          return (
            <Text
              key={`${index}-${item.content}`}
              {...item.status === 'pending' ? {} : { color }}
              dimColor={item.status === 'completed'}
            >
              {marker} {item.content}
            </Text>
          )
        })}
      </Box>
    )
  }
  const marker = node.status === 'running' ? '●' : node.status === 'success' ? '✓' : '✗'
  const color = node.status === 'error' ? 'red' : node.status === 'success' ? 'green' : '#4D6BFE'
  return <Text><Text color={color}>{marker} {node.title}</Text>{node.detail === '' ? '' : `  ${node.detail}`}</Text>
}

export function Transcript({ nodes }: { readonly nodes: readonly TranscriptNode[] }): React.JSX.Element {
  return (
    <Box flexDirection="column">
      {nodes.map(node => <TranscriptRow key={node.id} node={node} />)}
    </Box>
  )
}
