import React, { useMemo, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import type { AppIntent } from '../app.js'
import { filterCommands } from '../command-catalog.js'
import type { TuiCommand } from '../controller-types.js'
import { initialInputState, reduceInput } from '../input-state.js'
import { CommandMenu } from './CommandMenu.js'

export function ctrlCIntent(running: boolean): AppIntent {
  return { type: running ? 'cancel' : 'exit' }
}

export function Composer({ commands, disabled, running, dispatch }: {
  readonly commands: readonly TuiCommand[]
  readonly disabled: boolean
  readonly running: boolean
  readonly dispatch: (intent: AppIntent) => void
}): React.JSX.Element {
  const [state, setState] = useState(initialInputState)
  const filtered = useMemo(() => filterCommands(commands, state.value), [commands, state.value])
  const update = (action: Parameters<typeof reduceInput>[1]): void => {
    setState(current => reduceInput(current, action, filterCommands(commands, current.value).length))
  }

  const complete = (command: TuiCommand): void => {
    const value = `/${command.name} `
    update({ type: 'change', value })
    update({ type: 'close-menu' })
    dispatch({ type: 'complete-command', value })
  }

  const submit = (value: string): void => {
    const selected = filtered[state.selected]
    if (!running && state.menuOpen && selected !== undefined) {
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
      dispatch(ctrlCIntent(running))
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
          placeholder={disabled ? 'Starting…' : running ? 'Steer DeepSeek…' : 'Ask DeepSeek or type / for commands'}
          focus={!disabled}
        />
      </Box>
      {state.menuOpen && !running ? <CommandMenu commands={filtered} selected={state.selected} /> : null}
    </Box>
  )
}
