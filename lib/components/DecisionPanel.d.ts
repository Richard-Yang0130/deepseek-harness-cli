import React from 'react';
import type { DecisionIntent, DecisionPanelState } from '../controller-types.js';
export type { DecisionIntent } from '../controller-types.js';
export declare function DecisionPanel({ panel, dispatch }: {
    readonly panel: DecisionPanelState;
    readonly dispatch: (intent: DecisionIntent) => void;
}): React.JSX.Element;
//# sourceMappingURL=DecisionPanel.d.ts.map