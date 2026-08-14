import type { TuiControllerPort } from './controller.js';
import type { TuiStartupValues } from './startup.js';
interface ResizeOutput {
    prependListener(event: 'resize', listener: () => void): unknown;
    off(event: 'resize', listener: () => void): unknown;
    write(value: string): unknown;
}
export declare function installResizeCleanup(output: ResizeOutput, clearInkOutput: () => void): () => void;
/** Mount the interactive Ink surface over the shared Harness controller. */
export declare function runInkMode(controller: TuiControllerPort, startup: TuiStartupValues): Promise<void>;
export {};
//# sourceMappingURL=ink-mode.d.ts.map