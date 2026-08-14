import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from 'ink';
export function StatusLine({ snapshot, columns }) {
    const permission = snapshot.permission ?? 'approval';
    return (_jsxs(Box, { borderStyle: "single", borderLeft: false, borderRight: false, borderBottom: false, children: [_jsx(Text, { color: "#4D6BFE", children: snapshot.phase === 'running' ? '● working' : '◆ ready' }), _jsxs(Text, { children: [" \u00B7 ", permission] }), columns >= 64 && snapshot.model !== undefined ? _jsxs(Text, { children: [" \u00B7 ", snapshot.model] }) : null, columns >= 110 && snapshot.sessionId !== undefined ? _jsxs(Text, { dimColor: true, children: [" \u00B7 ", snapshot.sessionId] }) : null] }));
}
//# sourceMappingURL=StatusLine.js.map