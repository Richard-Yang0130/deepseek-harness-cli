import React, { useEffect, useRef, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import type { DecisionIntent, DecisionPanelState } from '../controller-types.js'

export type { DecisionIntent } from '../controller-types.js'

export function DecisionPanel({ panel, dispatch }: {
  readonly panel: DecisionPanelState
  readonly dispatch: (intent: DecisionIntent) => void
}): React.JSX.Element {
  const [selected, setSelected] = useState(panel.selected)
  const selectedRef = useRef(panel.selected)
  const [checked, setChecked] = useState<readonly string[]>(() =>
    panel.kind === 'approval' ? [] : panel.options.filter(option => option.checked).map(option => option.label),
  )
  const checkedRef = useRef(checked)
  const [custom, setCustom] = useState(panel.kind === 'custom-question' ? panel.custom ?? '' : '')

  useEffect(() => {
    setSelected(panel.selected)
    selectedRef.current = panel.selected
    const values = panel.kind === 'approval' ? [] : panel.options.filter(option => option.checked).map(option => option.label)
    setChecked(values)
    checkedRef.current = values
    setCustom(panel.kind === 'custom-question' ? panel.custom ?? '' : '')
  }, [panel])

  useInput((input, key) => {
    if (key.escape) {
      dispatch({ type: 'cancel-decision' })
      return
    }
    if (panel.kind === 'custom-question') return
    if (key.upArrow) {
      selectedRef.current = (selectedRef.current - 1 + panel.options.length) % panel.options.length
      setSelected(selectedRef.current)
    }
    if (key.downArrow) {
      selectedRef.current = (selectedRef.current + 1) % panel.options.length
      setSelected(selectedRef.current)
    }
    if (input === ' ' && panel.kind === 'multi-question') {
      const label = panel.options[selectedRef.current]?.label
      if (label !== undefined) {
        checkedRef.current = checkedRef.current.includes(label)
          ? checkedRef.current.filter(value => value !== label)
          : [...checkedRef.current, label]
        setChecked(checkedRef.current)
      }
    }
    if (!key.return) return
    if (panel.kind === 'approval') {
      const choice = panel.options[selectedRef.current]
      if (choice !== undefined) dispatch({ type: 'answer-approval', outcome: choice.outcome })
      return
    }
    if (panel.kind === 'single-question') {
      const label = panel.options[selectedRef.current]?.label
      dispatch({ type: 'answer-question', selected: label === undefined ? [] : [label] })
      return
    }
    dispatch({ type: 'answer-question', selected: checkedRef.current })
  })

  if (panel.kind === 'custom-question') {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor="#4D6BFE" paddingX={1}>
        <Text bold>{panel.prompt}</Text>
        <TextInput
          value={custom}
          onChange={setCustom}
          onSubmit={(value) => { dispatch({ type: 'answer-question', selected: [], ...(value === '' ? {} : { custom: value }) }) }}
          placeholder="Type your answer"
        />
      </Box>
    )
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="#4D6BFE" paddingX={1}>
      <Text bold>{panel.kind === 'approval' ? `Allow ${panel.toolName}?` : panel.prompt}</Text>
      {panel.kind === 'approval' && panel.reason !== undefined ? <Text dimColor>{panel.reason}</Text> : null}
      {panel.options.map((option, index) => {
        const mark = panel.kind === 'multi-question' ? (checked.includes(option.label) ? '[x]' : '[ ]') : index === selected ? '◉' : '○'
        return <Text key={option.label} color={index === selected ? '#4D6BFE' : 'white'}>{index === selected ? '❯' : ' '} {mark} {option.label}</Text>
      })}
      <Text dimColor>↑↓ move  {panel.kind === 'multi-question' ? 'Space toggle  ' : ''}Enter confirm  Esc cancel</Text>
    </Box>
  )
}
