import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import { DecisionPanel } from './components/DecisionPanel.js';
import { Header } from './components/Header.js';
import { Composer } from './components/Composer.js';
import { StatusLine } from './components/StatusLine.js';
import { Transcript } from './components/Transcript.js';
function useTerminalColumns(columnsOverride) {
    const { stdout } = useStdout();
    const [terminalColumns, setTerminalColumns] = useState(stdout.columns);
    useEffect(() => {
        if (columnsOverride !== undefined)
            return;
        const updateColumns = () => { setTerminalColumns(stdout.columns); };
        updateColumns();
        stdout.prependListener('resize', updateColumns);
        return () => { stdout.off('resize', updateColumns); };
    }, [columnsOverride, stdout]);
    return columnsOverride ?? terminalColumns;
}
export function App({ snapshot, dispatch, columns: columnsOverride, bannerFacts }) {
    const columns = useTerminalColumns(columnsOverride);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Header, { snapshot: snapshot, columns: columns, ...bannerFacts === undefined ? {} : { bannerFacts } }), _jsx(Transcript, { nodes: snapshot.transcript }), snapshot.notice === undefined ? null : _jsx(Text, { color: "yellow", children: snapshot.notice }), snapshot.panel === null
                ? _jsx(Composer, { commands: snapshot.commands, disabled: snapshot.phase !== 'idle', dispatch: dispatch })
                : _jsx(DecisionPanel, { panel: snapshot.panel, dispatch: dispatch }), _jsx(StatusLine, { snapshot: snapshot, columns: columns })] }));
}
//# sourceMappingURL=app.js.map