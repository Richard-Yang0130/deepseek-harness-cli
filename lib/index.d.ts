import type { Context } from '@deepseek-ai/cordis';
import { type Agent, type ModelSelectionRef } from '@deepseek-ai/dsh-agent';
import { TuiController } from './controller.js';
import { type TerminalIo } from './line-mode.js';
import type { TuiStartupValues } from './startup.js';
export declare const name = "tui-runner";
export declare const inject: string[];
export declare const TERMINAL_COMMANDS: readonly [{
    readonly name: "attach";
    readonly description: "Attach an image to the next prompt";
    readonly source: "terminal";
    readonly hint: "<path>";
}, {
    readonly name: "credentials";
    readonly description: "Inspect or update credential references";
    readonly source: "terminal";
    readonly hint: "<status|set|unset> …";
}, {
    readonly name: "exit";
    readonly description: "Quit the terminal session";
    readonly source: "terminal";
}, {
    readonly name: "export";
    readonly description: "Export this session and descendants as ZIP";
    readonly source: "terminal";
    readonly hint: "[path]";
}, {
    readonly name: "help";
    readonly description: "Show terminal commands";
    readonly source: "terminal";
}, {
    readonly name: "job-kill";
    readonly description: "Stop a background job";
    readonly source: "terminal";
    readonly hint: "<job-id>";
}, {
    readonly name: "job-read";
    readonly description: "Read background job output";
    readonly source: "terminal";
    readonly hint: "<job-id>";
}, {
    readonly name: "jobs";
    readonly description: "List background jobs";
    readonly source: "terminal";
}, {
    readonly name: "model";
    readonly description: "Show or switch this session model";
    readonly source: "terminal";
    readonly hint: "[provider model]";
}, {
    readonly name: "models";
    readonly description: "List active model providers and models";
    readonly source: "terminal";
}, {
    readonly name: "message-feedback";
    readonly description: "List or change assistant-message feedback";
    readonly source: "terminal";
    readonly hint: "[list|put|delete] …";
}, {
    readonly name: "new";
    readonly description: "Start a new persisted session";
    readonly source: "terminal";
}, {
    readonly name: "plugins";
    readonly description: "List loaded Harness plugins";
    readonly source: "terminal";
}, {
    readonly name: "preset";
    readonly description: "Start a new session with an agent preset";
    readonly source: "terminal";
    readonly hint: "<preset-id>";
}, {
    readonly name: "presets";
    readonly description: "List available agent presets";
    readonly source: "terminal";
}, {
    readonly name: "rename";
    readonly description: "Rename the active session";
    readonly source: "terminal";
    readonly hint: "<title>";
}, {
    readonly name: "resume";
    readonly description: "Resume a persisted session";
    readonly source: "terminal";
    readonly hint: "<session-id>";
}, {
    readonly name: "sessions";
    readonly description: "List or full-text search persisted sessions";
    readonly source: "terminal";
    readonly hint: "[query]";
}, {
    readonly name: "settings";
    readonly description: "Inspect or edit redacted Harness settings";
    readonly source: "terminal";
    readonly hint: "[show|set|unset] …";
}, {
    readonly name: "skills";
    readonly description: "List user-invocable skills";
    readonly source: "terminal";
}, {
    readonly name: "subagents";
    readonly description: "List subagent providers";
    readonly source: "terminal";
}, {
    readonly name: "stats";
    readonly description: "Show whole-session usage and timing statistics";
    readonly source: "terminal";
}, {
    readonly name: "trajectory";
    readonly description: "Show the durable session event trajectory";
    readonly source: "terminal";
}, {
    readonly name: "workspace";
    readonly description: "Start a session in another workspace";
    readonly source: "terminal";
    readonly hint: "<path>";
}];
export declare const internals: {
    createIo(): TerminalIo;
    isInteractive(): boolean;
    runInk(controller: TuiController, startup: TuiStartupValues): Promise<void>;
};
export declare function restoredModelSelection(session: Pick<Agent['session'], 'requestHeader'>, fallback: NonNullable<ModelSelectionRef['current']>): NonNullable<ModelSelectionRef['current']>;
export declare function apply(ctx: Context, config: TuiStartupValues): void;
//# sourceMappingURL=index.d.ts.map