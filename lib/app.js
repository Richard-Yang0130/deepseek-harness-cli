import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { DecisionPanel } from './components/DecisionPanel.js';
import { Header } from './components/Header.js';
import { Composer } from './components/Composer.js';
import { StatusLine } from './components/StatusLine.js';
import { Transcript } from './components/Transcript.js';
export function App({ snapshot, dispatch, columns: columnsOverride }) {
    const { stdout } = useStdout();
    const columns = columnsOverride ?? stdout.columns;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Header, { snapshot: snapshot, columns: columns }), _jsx(Transcript, { nodes: snapshot.transcript }), snapshot.notice === undefined ? null : _jsx(Text, { color: "yellow", children: snapshot.notice }), snapshot.panel === null
                ? _jsx(Composer, { commands: snapshot.commands, disabled: snapshot.phase !== 'idle', dispatch: dispatch })
                : _jsx(DecisionPanel, { panel: snapshot.panel, dispatch: dispatch }), _jsx(StatusLine, { snapshot: snapshot, columns: columns })] }));
}
//# sourceMappingURL=app.js.map