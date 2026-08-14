import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { filterCommands } from '../command-catalog.js';
import { initialInputState, reduceInput } from '../input-state.js';
import { CommandMenu } from './CommandMenu.js';
export function ctrlCIntent(disabled) {
    return { type: disabled ? 'cancel' : 'exit' };
}
export function Composer({ commands, subagents = [], disabled, dispatch }) {
    const [state, setState] = useState(initialInputState);
    const filtered = useMemo(() => filterCommands(commands, state.value), [commands, state.value]);
    const filteredSubagents = useMemo(() => {
        const query = state.value.startsWith('@') ? state.value.slice(1).toLocaleLowerCase() : '';
        return subagents.filter(name => name.toLocaleLowerCase().includes(query));
    }, [state.value, subagents]);
    const subagentStart = Math.min(Math.max(0, state.selected - 7), Math.max(0, filteredSubagents.length - 8));
    const update = (action) => {
        setState(current => reduceInput(current, action, current.value.startsWith('@')
            ? subagents.filter(name => name.toLocaleLowerCase().includes(current.value.slice(1).toLocaleLowerCase())).length
            : filterCommands(commands, current.value).length));
    };
    const complete = (command) => {
        const value = `/${command.name} `;
        update({ type: 'change', value });
        update({ type: 'close-menu' });
        dispatch({ type: 'complete-command', value });
    };
    const completeReference = (name) => {
        const value = `@${name} `;
        update({ type: 'change', value });
        update({ type: 'close-menu' });
        dispatch({ type: 'complete-command', value });
    };
    const submit = (value) => {
        if (state.menuOpen && state.value.startsWith('@')) {
            const name = filteredSubagents[state.selected];
            if (name !== undefined)
                completeReference(name);
            return;
        }
        const selected = filtered[state.selected];
        if (state.menuOpen && selected !== undefined) {
            if (selected.source === 'terminal' && selected.name === 'exit') {
                dispatch({ type: 'exit' });
                return;
            }
            if (selected.hint !== undefined) {
                complete(selected);
                return;
            }
            const command = `/${selected.name}`;
            update({ type: 'remember', value: command });
            dispatch({ type: 'submit', value: command });
            return;
        }
        if (value.trim() === '')
            return;
        update({ type: 'remember', value });
        dispatch({ type: 'submit', value });
    };
    useInput((input, key) => {
        if (key.ctrl && input === 'c') {
            dispatch(ctrlCIntent(disabled));
            return;
        }
        if (key.ctrl && input === 'd') {
            dispatch({ type: 'exit' });
            return;
        }
        if (!state.menuOpen)
            return;
        if (key.upArrow)
            update({ type: 'move', delta: -1 });
        if (key.downArrow)
            update({ type: 'move', delta: 1 });
        if (key.escape)
            update({ type: 'close-menu' });
        if (key.tab) {
            if (state.value.startsWith('@')) {
                const name = filteredSubagents[state.selected];
                if (name !== undefined)
                    completeReference(name);
                return;
            }
            const selected = filtered[state.selected];
            if (selected !== undefined)
                complete(selected);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "single", borderLeft: false, borderRight: false, paddingX: 1, children: [_jsx(Text, { color: "#4D6BFE", children: "\u276F " }), _jsx(TextInput, { value: state.value, onChange: (value) => { update({ type: 'change', value }); }, onSubmit: submit, placeholder: disabled ? 'Working…' : 'Ask DeepSeek or type / for commands', focus: !disabled })] }), state.menuOpen && state.value.startsWith('@')
                ? (_jsxs(Box, { flexDirection: "column", paddingLeft: 2, children: [filteredSubagents.slice(subagentStart, subagentStart + 8).map((name, index) => (_jsxs(Text, { color: index + subagentStart === state.selected ? '#4D6BFE' : 'white', children: [index + subagentStart === state.selected ? '❯' : ' ', " @", name, " ", _jsx(Text, { dimColor: true, children: "[subagent]" })] }, name))), filteredSubagents.length === 0 ? _jsx(Text, { dimColor: true, children: "  No running subagents" }) : null] }))
                : state.menuOpen ? _jsx(CommandMenu, { commands: filtered, selected: state.selected }) : null] }));
}
//# sourceMappingURL=Composer.js.map