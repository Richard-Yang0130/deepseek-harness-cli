import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type { TranscriptNode } from './controller-types.js';
export interface ToolCallPresentation {
    readonly title?: string;
    readonly detail?: string;
    readonly producedPaths?: readonly string[];
}
/** Fold one durable Harness event into renderer-stable transcript nodes. */
export declare function presentSessionEvent(nodes: readonly TranscriptNode[], event: SessionEvent, presentToolCall?: (name: string, argumentsJson: string) => ToolCallPresentation | undefined): readonly TranscriptNode[];
//# sourceMappingURL=event-presenter.d.ts.map