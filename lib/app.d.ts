import React from 'react';
import type { BannerFacts } from './banner-facts.js';
import type { TuiControllerSnapshot } from './controller.js';
import type { DecisionIntent } from './controller-types.js';
export type AppIntent = {
    readonly type: 'submit';
    readonly value: string;
} | {
    readonly type: 'complete-command';
    readonly value: string;
} | {
    readonly type: 'cancel' | 'exit';
} | DecisionIntent;
export interface AppProps {
    readonly snapshot: TuiControllerSnapshot;
    readonly dispatch: (intent: AppIntent) => void;
    readonly columns?: number;
    readonly bannerFacts?: BannerFacts;
}
export declare function App({ snapshot, dispatch, columns: columnsOverride, bannerFacts }: AppProps): React.JSX.Element;
//# sourceMappingURL=app.d.ts.map