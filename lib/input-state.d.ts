export interface InputState {
    readonly value: string;
    readonly menuOpen: boolean;
    readonly selected: number;
    readonly history: readonly string[];
    readonly historyIndex: number;
}
export type InputAction = {
    readonly type: 'change';
    readonly value: string;
} | {
    readonly type: 'move';
    readonly delta: -1 | 1;
} | {
    readonly type: 'close-menu';
} | {
    readonly type: 'remember';
    readonly value: string;
};
export declare function initialInputState(history?: readonly string[]): InputState;
export declare function reduceInput(state: InputState, action: InputAction, choices: number): InputState;
//# sourceMappingURL=input-state.d.ts.map