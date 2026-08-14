import type { CommandDescriptor, CommandResult } from '@deepseek-ai/dsh-commands';
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type { ApprovalOutcome } from '@deepseek-ai/dsh-user-approval';
import type { AskUserQuestionAnswer, AskUserQuestionItem } from '@deepseek-ai/dsh-user-questions';
import type { DecisionIntent, DecisionPanelState, LocalCommandDefinition, TranscriptNode, TuiCommand } from './controller-types.js';
export interface TuiServices {
    start?(resume?: string): Promise<void>;
    listCommands(): readonly CommandDescriptor[];
    listSkills(): readonly LocalCommandDefinition[];
    listTerminalCommands(): readonly LocalCommandDefinition[];
    executeCommand(line: string, signal: AbortSignal): Promise<CommandResult | undefined>;
    executeTerminalCommand(line: string): Promise<string | undefined>;
    prompt(text: string): Promise<void>;
    steer?(text: string): void;
    cancel(): void;
    flush(): Promise<void>;
    dispose(): Promise<void>;
    events?(): readonly SessionEvent[];
    subscribeEvents?(listener: (event: SessionEvent) => void): () => void;
    subscribeCatalog?(listener: () => void): () => void;
    connectDecisions?(handlers: TuiDecisionHandlers): () => void;
    presentEvent?(nodes: readonly TranscriptNode[], event: SessionEvent): readonly TranscriptNode[];
    details?(): {
        readonly cwd: string;
        readonly sessionId?: string;
        readonly provider?: string;
        readonly model?: string;
        readonly permission?: string;
    };
}
export interface TuiDecisionHandlers {
    approval(request: {
        readonly toolName: string;
        readonly reason?: string;
    }): Promise<ApprovalOutcome>;
    questions(items: readonly AskUserQuestionItem[]): Promise<AskUserQuestionAnswer>;
}
export interface TuiControllerSnapshot {
    readonly phase: 'starting' | 'idle' | 'running' | 'stopping';
    readonly cwd: string;
    readonly sessionId?: string;
    readonly provider?: string;
    readonly model?: string;
    readonly permission?: string;
    readonly commands: readonly TuiCommand[];
    readonly transcript: readonly TranscriptNode[];
    readonly panel: DecisionPanelState | null;
    readonly exitRequested?: boolean;
    readonly notice?: string;
}
export interface TuiControllerPort {
    snapshot(): TuiControllerSnapshot;
    subscribe(listener: () => void): () => void;
    start(resume?: string): Promise<void>;
    submit(text: string): Promise<void>;
    cancel(): void;
    answerDecision(intent: DecisionIntent): void;
    stop(): Promise<void>;
}
export declare class TuiController {
    private readonly services;
    private phase;
    private notice;
    private active;
    private transcript;
    private readonly eventSequences;
    private readonly listeners;
    private disposeEvents;
    private disposeCatalog;
    private disposeDecisions;
    private panel;
    private pendingDecision;
    private exitRequested;
    constructor(services: TuiServices);
    subscribe(listener: () => void): () => void;
    start(resume?: string): Promise<void>;
    snapshot(): TuiControllerSnapshot;
    submit(text: string): Promise<void>;
    private submitInput;
    cancel(): void;
    answerDecision(intent: DecisionIntent): void;
    stop(): Promise<void>;
    private executeHarnessCommand;
    private present;
    private reloadTranscript;
    private notify;
    private requestApproval;
    private requestQuestions;
    private requestQuestion;
    private cancelDecision;
    private clearDecision;
}
//# sourceMappingURL=controller.d.ts.map