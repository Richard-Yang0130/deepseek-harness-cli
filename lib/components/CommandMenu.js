import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from 'ink';
function sourceLabel(source) {
    if (source === 'harness')
        return 'dsh';
    return source;
}
export function CommandMenu({ commands, selected }) {
    const start = Math.min(Math.max(0, selected - 7), Math.max(0, commands.length - 8));
    return (_jsxs(Box, { flexDirection: "column", paddingLeft: 2, children: [commands.slice(start, start + 8).map((command, index) => (_jsxs(Text, { wrap: "truncate-end", ...index + start === selected ? { color: '#4D6BFE' } : {}, children: [index + start === selected ? '❯' : ' ', " /", command.name, command.hint === undefined ? '' : ` ${command.hint}`, _jsxs(Text, { dimColor: true, children: ["  ", command.description, "  [", sourceLabel(command.source), "]"] })] }, `${command.source}:${command.name}`))), commands.length === 0 ? _jsx(Text, { dimColor: true, children: "  No matching commands" }) : null] }));
}
//# sourceMappingURL=CommandMenu.js.map