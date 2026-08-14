import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from 'ink';
import { WELCOME_BOX_MIN } from '../layout.js';
import { WelcomeBox, HorizontalRule } from './WelcomeBox.js';
import { Whale } from './Whale.js';
const BRAND_COLOR = '#4D6BFE';
function LeftColumn({ model, cwd }) {
    return (_jsxs(Box, { flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, children: [_jsx(Whale, {}), _jsx(Text, { bold: true, children: "Welcome back!" }), _jsx(Text, { dimColor: true, wrap: "truncate-end", children: model }), _jsx(Text, { dimColor: true, wrap: "truncate-start", children: cwd })] }));
}
function RightColumn({ bannerFacts }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: BRAND_COLOR, children: "\u5FEB\u901F\u4E0A\u624B" }), _jsx(Text, { wrap: "truncate-end", children: "\u8F93\u5165 / \u6253\u5F00\u547D\u4EE4\u83DC\u5355\uFF0CEnter \u53D1\u9001" }), _jsx(Text, { wrap: "truncate-end", children: "\u8F93\u5165 /help \u67E5\u770B\u5168\u90E8\u547D\u4EE4" }), bannerFacts?.latest === undefined ? null : (_jsxs(_Fragment, { children: [_jsx(HorizontalRule, {}), _jsxs(Text, { color: BRAND_COLOR, wrap: "truncate-end", children: ["\u672C\u6B21\u66F4\u65B0 v", bannerFacts.latest.version] }), bannerFacts.latest.bullets.map(bullet => (_jsxs(Text, { wrap: "truncate-end", children: ["\u2022 ", bullet] }, bullet)))] }))] }));
}
export function Header({ snapshot, columns, bannerFacts }) {
    const model = snapshot.model === undefined ? 'model loading…' : snapshot.model;
    if (columns < WELCOME_BOX_MIN) {
        return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsx(Whale, {}), _jsx(Text, { bold: true, color: BRAND_COLOR, children: " DeepSeek Harness" })] }), _jsx(Text, { children: model })] }));
    }
    const title = `DeepSeek Harness${bannerFacts?.version === undefined ? '' : ` v${bannerFacts.version}`}`;
    return (_jsx(Box, { marginBottom: 1, children: _jsx(WelcomeBox, { title: title, width: columns - 2, left: _jsx(LeftColumn, { model: model, cwd: snapshot.cwd }), right: _jsx(RightColumn, { ...bannerFacts === undefined ? {} : { bannerFacts } }) }) }));
}
//# sourceMappingURL=Header.js.map