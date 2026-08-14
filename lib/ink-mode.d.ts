import React from 'react';
import { render } from 'ink';
import { type BannerFacts } from './banner-facts.js';
import type { TuiControllerPort } from './controller.js';
import type { TuiStartupValues } from './startup.js';
interface ResizeOutput {
    prependListener(event: 'resize', listener: () => void): unknown;
    off(event: 'resize', listener: () => void): unknown;
    write(value: string): unknown;
}
export declare const inkInternals: {
    render: typeof render;
    stdout: ResizeOutput;
};
export declare function installResizeCleanup(output: ResizeOutput, clearInkOutput: () => void): () => void;
export declare function ConnectedApp({ controller, requestExit, bannerFacts }: {
    readonly controller: TuiControllerPort;
    readonly requestExit: () => void;
    readonly bannerFacts: BannerFacts;
}): React.JSX.Element;
/** Mount the interactive Ink surface over the shared Harness controller. */
export declare function runInkMode(controller: TuiControllerPort, startup: TuiStartupValues): Promise<void>;
export {};
//# sourceMappingURL=ink-mode.d.ts.map