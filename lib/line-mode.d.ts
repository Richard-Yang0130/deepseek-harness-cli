import type { TuiControllerPort } from './controller.js';
import type { TuiStartupValues } from './startup.js';
export interface TerminalIo {
    write(text: string): void;
    error(text: string): void;
    read(prompt: string): Promise<string | undefined>;
    onInterrupt(listener: () => void): void;
    close(): void;
}
/** Drive the shared controller with newline-delimited input for pipes and basic terminals. */
export declare function runLineMode(controller: TuiControllerPort, io: TerminalIo, startup: TuiStartupValues): Promise<void>;
//# sourceMappingURL=line-mode.d.ts.map