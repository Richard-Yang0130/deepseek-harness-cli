export type CommandSource = 'harness' | 'terminal' | 'skill'

export interface TuiCommand {
  readonly name: string
  readonly description: string
  readonly hint?: string
  readonly source: CommandSource
}

export interface LocalCommandDefinition {
  readonly name: string
  readonly description: string
  readonly source: 'terminal' | 'skill'
  readonly hint?: string
}

export type TranscriptNode =
  | { readonly id: string; readonly kind: 'user'; readonly text: string }
  | { readonly id: string; readonly kind: 'assistant'; readonly text: string }
  | { readonly id: string; readonly kind: 'notice'; readonly text: string }
  | { readonly id: string; readonly kind: 'error'; readonly text: string }
  | {
    readonly id: string
    readonly kind: 'tool'
    readonly title: string
    readonly detail: string
    readonly status: 'running' | 'success' | 'error'
    readonly turn?: number
    readonly producedPaths?: readonly string[]
  }
  | {
    readonly id: string
    readonly kind: 'command'
    readonly title: string
    readonly detail: string
    readonly status: 'running' | 'success' | 'error'
  }
  | {
    readonly id: string
    readonly kind: 'workflow' | 'subagent'
    readonly title: string
    readonly detail: string
    readonly status: 'running' | 'success' | 'error'
  }
  | { readonly id: string; readonly kind: 'deliverables'; readonly paths: readonly string[] }

export interface ApprovalPanelState {
  readonly kind: 'approval'
  readonly toolName: string
  readonly reason?: string
  readonly selected: number
  readonly options: readonly { readonly label: string; readonly outcome: 'rejected' | 'allowed-once' }[]
}

export interface QuestionPanelState {
  readonly kind: 'single-question' | 'multi-question' | 'custom-question'
  readonly id: string
  readonly prompt: string
  readonly selected: number
  readonly options: readonly { readonly label: string; readonly checked: boolean }[]
  readonly custom?: string
}

export type DecisionPanelState = ApprovalPanelState | QuestionPanelState

export type DecisionIntent =
  | { readonly type: 'answer-approval'; readonly outcome: 'rejected' | 'allowed-once' }
  | { readonly type: 'answer-question'; readonly selected: readonly string[]; readonly custom?: string }
  | { readonly type: 'cancel-decision' }
