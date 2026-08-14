export interface TuiCapability {
    readonly id: string;
    readonly entry: string;
    readonly service: string;
    readonly effect: 'read' | 'write' | 'execute';
    readonly testId: string;
    readonly status: 'mapped';
}
/** Executable traceability map from Web operations to their terminal equivalent. */
export declare const TUI_CAPABILITIES: readonly TuiCapability[];
//# sourceMappingURL=capability-matrix.d.ts.map