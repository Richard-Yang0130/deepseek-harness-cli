import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from 'ink';
import { STATUS_MODEL_MIN, STATUS_SESSION_MIN } from '../layout.js';
export function StatusLine({ snapshot, columns }) {
    const permission = snapshot.permission ?? 'approval';
    return (_jsxs(Box, { borderStyle: "single", borderLeft: false, borderRight: false, borderBottom: false, children: [_jsx(Text, { color: "#4D6BFE", children: snapshot.phase === 'running' ? '● working' : '◆ ready' }), _jsxs(Text, { children: [" \u00B7 ", permission] }), columns >= STATUS_MODEL_MIN && snapshot.model !== undefined ? _jsxs(Text, { children: [" \u00B7 ", snapshot.model] }) : null, columns >= STATUS_SESSION_MIN && snapshot.sessionId !== undefined ? _jsxs(Text, { dimColor: true, children: [" \u00B7 ", snapshot.sessionId] }) : null] }));
}
//# sourceMappingURL=StatusLine.js.map