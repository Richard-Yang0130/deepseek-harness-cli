export interface InputState {
  readonly value: string
  readonly menuOpen: boolean
  readonly selected: number
  readonly history: readonly string[]
  readonly historyIndex: number
}

export type InputAction =
  | { readonly type: 'change'; readonly value: string }
  | { readonly type: 'move'; readonly delta: -1 | 1 }
  | { readonly type: 'close-menu' }
  | { readonly type: 'remember'; readonly value: string }

export function initialInputState(history: readonly string[] = []): InputState {
  return { value: '', menuOpen: false, selected: 0, history: [...history], historyIndex: history.length }
}

export function reduceInput(state: InputState, action: InputAction, choices: number): InputState {
  if (action.type === 'change') {
    const menuOpen = action.value.startsWith('/') && !/\s/.test(action.value)
    return { ...state, value: action.value, menuOpen, selected: 0 }
  }
  if (action.type === 'close-menu') return { ...state, menuOpen: false, selected: 0 }
  if (action.type === 'remember') {
    const history = action.value.trim() === '' ? state.history : [...state.history, action.value]
    return { ...state, value: '', menuOpen: false, selected: 0, history, historyIndex: history.length }
  }
  if (choices === 0) return { ...state, selected: 0 }
  return { ...state, selected: (state.selected + action.delta + choices) % choices }
}
