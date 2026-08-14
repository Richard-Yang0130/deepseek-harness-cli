export function initialInputState(history = []) {
    return { value: '', menuOpen: false, selected: 0, history: [...history], historyIndex: history.length };
}
export function reduceInput(state, action, choices) {
    if (action.type === 'change') {
        const menuOpen = action.value.startsWith('/') && !/\s/.test(action.value);
        return { ...state, value: action.value, menuOpen, selected: 0 };
    }
    if (action.type === 'close-menu')
        return { ...state, menuOpen: false, selected: 0 };
    if (action.type === 'remember') {
        const history = action.value.trim() === '' ? state.history : [...state.history, action.value];
        return { ...state, value: '', menuOpen: false, selected: 0, history, historyIndex: history.length };
    }
    if (choices === 0)
        return { ...state, selected: 0 };
    return { ...state, selected: (state.selected + action.delta + choices) % choices };
}
//# sourceMappingURL=input-state.js.map