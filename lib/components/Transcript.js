import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from 'ink';
function TranscriptRow({ node }) {
    if (node.kind === 'user')
        return _jsxs(Text, { children: [_jsx(Text, { color: "#4D6BFE", children: "\u276F " }), node.text] });
    if (node.kind === 'assistant')
        return _jsx(Text, { children: node.text });
    if (node.kind === 'notice')
        return _jsx(Text, { dimColor: true, children: node.text });
    if (node.kind === 'error')
        return _jsxs(Text, { color: "red", children: ["\u2717 ", node.text] });
    if (node.kind === 'deliverables')
        return _jsx(Text, { color: "green", children: node.paths.join('  ') });
    const marker = node.status === 'running' ? '●' : node.status === 'success' ? '✓' : '✗';
    const color = node.status === 'error' ? 'red' : node.status === 'success' ? 'green' : '#4D6BFE';
    return _jsxs(Text, { children: [_jsxs(Text, { color: color, children: [marker, " ", node.title] }), node.detail === '' ? '' : `  ${node.detail}`] });
}
export function Transcript({ nodes }) {
    return (_jsx(Box, { flexDirection: "column", children: nodes.map(node => _jsx(TranscriptRow, { node: node }, node.id)) }));
}
//# sourceMappingURL=Transcript.js.map