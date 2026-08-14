import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from 'ink';
import stringWidth from 'string-width';
const BRAND_COLOR = '#4D6BFE';
const LEFT_COLUMN_WIDTH = 22;
function truncateToWidth(value, width) {
    let result = '';
    for (const character of value) {
        if (stringWidth(result + character) > width)
            break;
        result += character;
    }
    return result;
}
export function HorizontalRule() {
    return (_jsx(Box, { borderStyle: "single", borderTop: true, borderBottom: false, borderLeft: false, borderRight: false }));
}
export function buildWelcomeRail(title, width) {
    const fixedRailWidth = stringWidth('╭─  ╮');
    const visibleTitle = truncateToWidth(title, Math.max(0, width - fixedRailWidth));
    const fill = Math.max(0, width - stringWidth(`╭─ ${visibleTitle} ╮`));
    return `╭─ ${visibleTitle} ${'─'.repeat(fill)}╮`;
}
export function WelcomeBox({ title, width, left, right }) {
    const rail = buildWelcomeRail(title, width);
    const leftWidth = Math.min(LEFT_COLUMN_WIDTH, Math.floor(width / 2));
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: BRAND_COLOR, children: rail }), _jsxs(Box, { width: width, borderStyle: "round", borderTop: false, borderColor: BRAND_COLOR, children: [_jsx(Box, { width: leftWidth, flexShrink: 0, flexDirection: "column", children: left }), _jsx(Box, { borderStyle: "round", borderTop: false, borderBottom: false, borderRight: false, borderColor: BRAND_COLOR, flexDirection: "column", flexGrow: 1, paddingLeft: 1, children: right })] })] }));
}
//# sourceMappingURL=WelcomeBox.js.map