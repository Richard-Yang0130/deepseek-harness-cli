import type { Context } from '@deepseek-ai/cordis';
import { TuiController } from './controller.js';
import { type TerminalIo } from './line-mode.js';
import type { TuiStartupValues } from './startup.js';
export declare const name = "tui-runner";
export declare const inject: string[];
export declare const internals: {
    createIo(): TerminalIo;
    isInteractive(): boolean;
    runInk(controller: TuiController, startup: TuiStartupValues): Promise<void>;
};
export declare function apply(ctx: Context, config: TuiStartupValues): void;
//# sourceMappingURL=index.d.ts.map