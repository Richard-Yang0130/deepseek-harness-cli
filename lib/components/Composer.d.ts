import React from 'react';
import type { AppIntent } from '../app.js';
import type { TuiCommand } from '../controller-types.js';
export declare function ctrlCIntent(disabled: boolean): AppIntent;
export declare function Composer({ commands, disabled, dispatch }: {
    readonly commands: readonly TuiCommand[];
    readonly disabled: boolean;
    readonly dispatch: (intent: AppIntent) => void;
}): React.JSX.Element;
//# sourceMappingURL=Composer.d.ts.map