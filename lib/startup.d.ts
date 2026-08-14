import type { Context } from '@deepseek-ai/cordis';
export declare const name = "tui-startup";
export declare const inject: string[];
export declare const TUI_STARTUP_SERVICE = "tuiStartup";
export interface TuiStartupValues {
    resume?: string;
    prompt?: string;
}
/** Pure parser used by tests and by the Cordis command provider. */
export declare function parseTuiStartup(args: readonly string[]): TuiStartupValues;
export declare function apply(ctx: Context): void;
//# sourceMappingURL=startup.d.ts.map