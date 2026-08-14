export interface LlmCatalogLike {
    listProviders(): readonly {
        readonly id: string;
        readonly name: string;
    }[];
    listModels(provider: string): Promise<readonly {
        readonly provider: string;
        readonly id: string;
        readonly name: string;
    }[]>;
}
export interface SettingsLike {
    describe(options?: {
        redactSecrets?: boolean;
    }): Array<{
        readonly ns: string;
        readonly revision: number;
        readonly value: unknown;
        readonly applies: string;
    }>;
    mutate(ns: never, operations: readonly unknown[], expectedRevision?: number): Promise<void>;
}
export interface CredentialsLike {
    describe(ref: never): Promise<{
        readonly configured: boolean;
        readonly source?: string;
        readonly writable: boolean;
    }>;
    set(ref: never, value: string): Promise<void>;
    unset(ref: never): Promise<void>;
}
interface FeedbackItem {
    readonly messageId: string;
    readonly rating?: string;
    readonly note?: string;
    readonly version: string;
}
type FeedbackResult<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly error: unknown;
};
export interface MessageFeedbackLike {
    list(request: {
        readonly sessionId: never;
    }): Promise<FeedbackResult<{
        readonly items: readonly FeedbackItem[];
    }>>;
    put(request: {
        readonly sessionId: never;
        readonly messageId: never;
        readonly rating: 'positive' | 'negative';
        readonly note?: string;
        readonly ifVersion: never | null;
    }): Promise<FeedbackResult<unknown>>;
    delete(request: {
        readonly sessionId: never;
        readonly messageId: never;
        readonly ifVersion: never;
    }): Promise<FeedbackResult<unknown>>;
}
export declare function modelsOperation(llm: LlmCatalogLike): Promise<string>;
export declare function settingsOperation(settings: SettingsLike, input: string): Promise<string>;
export declare function credentialsOperation(credentials: CredentialsLike, input: string, env?: NodeJS.ProcessEnv): Promise<string>;
export declare function messageFeedbackOperation(feedback: MessageFeedbackLike, sessionId: string, input: string): Promise<string>;
export declare function sessionSearchOperation(query: {
    searchSessions(request: unknown): Promise<{
        readonly items: readonly {
            readonly header: {
                readonly id: string;
            };
            readonly bestMatch: {
                readonly snippet: string;
            };
        }[];
    }>;
}, text: string): Promise<string>;
export {};
//# sourceMappingURL=operations.d.ts.map