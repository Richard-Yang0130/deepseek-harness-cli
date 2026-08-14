import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
export function DecisionPanel({ panel, dispatch }) {
    const [selected, setSelected] = useState(panel.selected);
    const selectedRef = useRef(panel.selected);
    const [checked, setChecked] = useState(() => panel.kind === 'approval' ? [] : panel.options.filter(option => option.checked).map(option => option.label));
    const checkedRef = useRef(checked);
    const [custom, setCustom] = useState(panel.kind === 'custom-question' ? panel.custom ?? '' : '');
    useEffect(() => {
        setSelected(panel.selected);
        selectedRef.current = panel.selected;
        const values = panel.kind === 'approval' ? [] : panel.options.filter(option => option.checked).map(option => option.label);
        setChecked(values);
        checkedRef.current = values;
        setCustom(panel.kind === 'custom-question' ? panel.custom ?? '' : '');
    }, [panel]);
    useInput((input, key) => {
        if (key.escape) {
            dispatch({ type: 'cancel-decision' });
            return;
        }
        if (panel.kind === 'custom-question')
            return;
        if (key.upArrow) {
            selectedRef.current = (selectedRef.current - 1 + panel.options.length) % panel.options.length;
            setSelected(selectedRef.current);
        }
        if (key.downArrow) {
            selectedRef.current = (selectedRef.current + 1) % panel.options.length;
            setSelected(selectedRef.current);
        }
        if (input === ' ' && panel.kind === 'multi-question') {
            const label = panel.options[selectedRef.current]?.label;
            if (label !== undefined) {
                checkedRef.current = checkedRef.current.includes(label)
                    ? checkedRef.current.filter(value => value !== label)
                    : [...checkedRef.current, label];
                setChecked(checkedRef.current);
            }
        }
        if (!key.return)
            return;
        if (panel.kind === 'approval') {
            const choice = panel.options[selectedRef.current];
            if (choice !== undefined)
                dispatch({ type: 'answer-approval', outcome: choice.outcome });
            return;
        }
        if (panel.kind === 'single-question') {
            const label = panel.options[selectedRef.current]?.label;
            dispatch({ type: 'answer-question', selected: label === undefined ? [] : [label] });
            return;
        }
        dispatch({ type: 'answer-question', selected: checkedRef.current });
    });
    if (panel.kind === 'custom-question') {
        return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "#4D6BFE", paddingX: 1, children: [_jsx(Text, { bold: true, children: panel.prompt }), _jsx(TextInput, { value: custom, onChange: setCustom, onSubmit: (value) => { dispatch({ type: 'answer-question', selected: [], ...(value === '' ? {} : { custom: value }) }); }, placeholder: "Type your answer" })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "#4D6BFE", paddingX: 1, children: [_jsx(Text, { bold: true, children: panel.kind === 'approval' ? `Allow ${panel.toolName}?` : panel.prompt }), panel.kind === 'approval' && panel.reason !== undefined ? _jsx(Text, { dimColor: true, children: panel.reason }) : null, panel.options.map((option, index) => {
                const mark = panel.kind === 'multi-question' ? (checked.includes(option.label) ? '[x]' : '[ ]') : index === selected ? '◉' : '○';
                return _jsxs(Text, { color: index === selected ? '#4D6BFE' : 'white', children: [index === selected ? '❯' : ' ', " ", mark, " ", option.label] }, option.label);
            }), _jsxs(Text, { dimColor: true, children: ["\u2191\u2193 move  ", panel.kind === 'multi-question' ? 'Space toggle  ' : '', "Enter confirm  Esc cancel"] })] }));
}
//# sourceMappingURL=DecisionPanel.js.map