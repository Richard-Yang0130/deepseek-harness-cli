import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from 'ink';
import { Whale } from './Whale.js';
export function Header({ snapshot, columns }) {
    const model = snapshot.model === undefined ? 'model loading…' : snapshot.model;
    if (columns < 82) {
        return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: "#4D6BFE", children: "DeepSeek Harness" }), _jsx(Text, { children: model })] }));
    }
    return (_jsxs(Box, { gap: 2, marginBottom: 1, children: [_jsx(Box, { width: 50, flexShrink: 0, children: _jsx(Whale, {}) }), _jsxs(Box, { flexDirection: "column", justifyContent: "center", flexGrow: 1, children: [_jsx(Text, { bold: true, color: "#4D6BFE", children: "DeepSeek Harness" }), _jsx(Text, { children: model }), _jsx(Text, { dimColor: true, children: snapshot.cwd })] })] }));
}
//# sourceMappingURL=Header.js.map