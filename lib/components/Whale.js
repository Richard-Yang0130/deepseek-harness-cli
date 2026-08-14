import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Text } from 'ink';
export const DEEPSEEK_WHALE = '🐳';
export function Whale() {
    return _jsx(Text, { children: process.env.DSH_CLI_NO_EMOJI === '1' ? '◆' : DEEPSEEK_WHALE });
}
//# sourceMappingURL=Whale.js.map