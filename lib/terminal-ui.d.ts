import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type { AskUserQuestionAnswer, AskUserQuestionItem } from '@deepseek-ai/dsh-user-questions';
export interface TerminalRender {
    channel: 'line' | 'stream';
    text: string;
}
/** Map durable Harness events to a compact terminal representation. */
export declare function renderSessionEvent(event: SessionEvent, options?: {
    replay?: boolean;
}): TerminalRender | undefined;
export type TerminalAsk = (prompt: string) => Promise<string | undefined>;
export type TerminalInput = {
    kind: 'help' | 'new' | 'sessions' | 'exit';
} | {
    kind: 'resume';
    sessionId: string;
} | {
    kind: 'model';
    provider?: string;
    model?: string;
} | {
    kind: 'rename';
    title: string;
} | {
    kind: 'workspace';
    path: string;
} | {
    kind: 'prompt';
    text: string;
};
/** Separate terminal-owned lifecycle commands from commands handled by dsh. */
export declare function parseTerminalInput(input: string): TerminalInput;
/** Collect terminal answers in the structured user-questions protocol. */
export declare function answerQuestions(questions: readonly AskUserQuestionItem[], ask: TerminalAsk): Promise<AskUserQuestionAnswer>;
//# sourceMappingURL=terminal-ui.d.ts.map