import React, { useMemo, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import type { AppIntent } from '../app.js'
import { filterCommands } from '../command-catalog.js'
import type { TuiCommand } from '../controller-types.js'
import { initialInputState, reduceInput } from '../input-state.js'
import { CommandMenu } from './CommandMenu.js'

export function ctrlCIntent(disabled: boolean): AppIntent {
  return { type: disabled ? 'cancel' : 'exit' }
}

export function Composer({ commands, subagents = [], disabled, dispatch }: {
  readonly commands: readonly TuiCommand[]
  readonly subagents?: readonly string[]
  readonly disabled: boolean
  readonly dispatch: (intent: AppIntent) => void
}): React.JSX.Element {
  const [state, setState] = useState(initialInputState)
  const filtered = useMemo(() => filterCommands(commands, state.value), [commands, state.value])
  const filteredSubagents = useMemo(() => {
    const query = state.value.startsWith('@') ? state.value.slice(1).toLocaleLowerCase() : ''
    return subagents.filter(name => name.toLocaleLowerCase().includes(query))
  }, [state.value, subagents])
  const subagentStart = Math.min(Math.max(0, state.selected - 7), Math.max(0, filteredSubagents.length - 8))
  const update = (action: Parameters<typeof reduceInput>[1]): void => {
    setState(current => reduceInput(current, action, current.value.startsWith('@')
      ? subagents.filter(name => name.toLocaleLowerCase().includes(current.value.slice(1).toLocaleLowerCase())).length
      : filterCommands(commands, current.value).length))
  }

  const complete = (command: TuiCommand): void => {
    const value = `/${command.name} `
    update({ type: 'change', value })
    update({ type: 'close-menu' })
    dispatch({ type: 'complete-command', value })
  }

  const completeReference = (name: string): void => {
    const value = `@${name} `
    update({ type: 'change', value })
    update({ type: 'close-menu' })
    dispatch({ type: 'complete-command', value })
  }

  const submit = (value: string): void => {
    if (state.menuOpen && state.value.startsWith('@')) {
      const name = filteredSubagents[state.selected]
      if (name !== undefined) completeReference(name)
      return
    }
    const selected = filtered[state.selected]
    if (state.menuOpen && selected !== undefined) {
      if (selected.source === 'terminal' && selected.name === 'exit') {
        dispatch({ type: 'exit' })
        return
      }
      if (selected.hint !== undefined) {
        complete(selected)
        return
      }
      const command = `/${selected.name}`
      update({ type: 'remember', value: command })
      dispatch({ type: 'submit', value: command })
      return
    }
    if (value.trim() === '') return
    update({ type: 'remember', value })
    dispatch({ type: 'submit', value })
  }

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      dispatch(ctrlCIntent(disabled))
      return
    }
    if (key.ctrl && input === 'd') {
      dispatch({ type: 'exit' })
      return
    }
    if (!state.menuOpen) return
    if (key.upArrow) update({ type: 'move', delta: -1 })
    if (key.downArrow) update({ type: 'move', delta: 1 })
    if (key.escape) update({ type: 'close-menu' })
    if (key.tab) {
      if (state.value.startsWith('@')) {
        const name = filteredSubagents[state.selected]
        if (name !== undefined) completeReference(name)
        return
      }
      const selected = filtered[state.selected]
      if (selected !== undefined) complete(selected)
    }
  })

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderLeft={false} borderRight={false} paddingX={1}>
        <Text color="#4D6BFE">❯ </Text>
        <TextInput
          value={state.value}
          onChange={(value) => { update({ type: 'change', value }) }}
          onSubmit={submit}
          placeholder={disabled ? 'Working…' : 'Ask DeepSeek or type / for commands'}
          focus={!disabled}
        />
      </Box>
      {state.menuOpen && state.value.startsWith('@')
        ? (
          <Box flexDirection="column" paddingLeft={2}>
            {filteredSubagents.slice(subagentStart, subagentStart + 8).map((name, index) => (
              <Text key={name} color={index + subagentStart === state.selected ? '#4D6BFE' : 'white'}>
                {index + subagentStart === state.selected ? '❯' : ' '} @{name} <Text dimColor>[subagent]</Text>
              </Text>
            ))}
            {filteredSubagents.length === 0 ? <Text dimColor>  No running subagents</Text> : null}
          </Box>
        )
        : state.menuOpen ? <CommandMenu commands={filtered} selected={state.selected} /> : null}
    </Box>
  )
}
