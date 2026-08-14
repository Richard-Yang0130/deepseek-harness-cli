import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type { TranscriptNode } from './controller-types.js';
/** Fold one durable Harness event into renderer-stable transcript nodes. */
export declare function presentSessionEvent(nodes: readonly TranscriptNode[], event: SessionEvent): readonly TranscriptNode[];
//# sourceMappingURL=event-presenter.d.ts.map