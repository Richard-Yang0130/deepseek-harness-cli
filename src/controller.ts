import type { CommandDescriptor, CommandResult } from '@deepseek-ai/dsh-commands'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import type { ApprovalOutcome } from '@deepseek-ai/dsh-user-approval'
import type {
  AskUserQuestionAnswer, AskUserQuestionAnswerItem, AskUserQuestionItem,
} from '@deepseek-ai/dsh-user-questions'
import { commandCatalog } from './command-catalog.js'
import type {
  AppPhase, DecisionIntent, DecisionPanelState, LocalCommandDefinition, TranscriptNode, TuiCommand,
} from './controller-types.js'
import { presentSessionEvent } from './event-presenter.js'

export interface TuiServices {
  start?(resume?: string): Promise<void>
  listCommands(): readonly CommandDescriptor[]
  listSkills(): readonly LocalCommandDefinition[]
  listTerminalCommands(): readonly LocalCommandDefinition[]
  executeCommand(line: string, signal: AbortSignal): Promise<CommandResult | undefined>
  executeTerminalCommand(line: string): Promise<string | undefined>
  prompt(text: string): Promise<void>
  steer?(text: string): void
  cancel(): void
  flush(): Promise<void>
  dispose(): Promise<void>
  events?(): readonly SessionEvent[]
  subscribeEvents?(listener: (event: SessionEvent) => void): () => void
  subscribeCatalog?(listener: () => void): () => void
  connectDecisions?(handlers: TuiDecisionHandlers): () => void
  presentEvent?(nodes: readonly TranscriptNode[], event: SessionEvent): readonly TranscriptNode[]
  details?(): {
    readonly cwd: string
    readonly sessionId?: string
    readonly provider?: string
    readonly model?: string
    readonly permission?: string
  }
}

export interface TuiDecisionHandlers {
  approval(request: { readonly toolName: string; readonly reason?: string }): Promise<ApprovalOutcome>
  questions(items: readonly AskUserQuestionItem[]): Promise<AskUserQuestionAnswer>
}

export interface TuiControllerSnapshot {
  readonly phase: AppPhase
  readonly cwd: string
  readonly sessionId?: string
  readonly provider?: string
  readonly model?: string
  readonly permission?: string
  readonly commands: readonly TuiCommand[]
  readonly transcript: readonly TranscriptNode[]
  readonly panel: DecisionPanelState | null
  readonly exitRequested?: boolean
  readonly notice?: string
}

export interface TuiControllerPort {
  snapshot(): TuiControllerSnapshot
  subscribe(listener: () => void): () => void
  start(resume?: string): Promise<void>
  submit(text: string): Promise<void>
  cancel(): void
  answerDecision(intent: DecisionIntent): void
  stop(): Promise<void>
}

const SLASH_COMMAND = /^\/([a-z][a-z0-9_-]*)(?=$|\s)/

type PendingDecision =
  | { readonly kind: 'approval'; readonly resolve: (outcome: ApprovalOutcome) => void }
  | { readonly kind: 'question'; readonly id: string; readonly resolve: (answer: AskUserQuestionAnswerItem) => void }

export class TuiController {
  private phase: AppPhase = 'idle'
  private notice: string | undefined
  private active: AbortController | undefined
  private transcript: readonly TranscriptNode[] = []
  private readonly eventSequences = new Set<number>()
  private readonly listeners = new Set<() => void>()
  private disposeEvents: (() => void) | undefined
  private disposeCatalog: (() => void) | undefined
  private disposeDecisions: (() => void) | undefined
  private panel: DecisionPanelState | null = null
  private pendingDecision: PendingDecision | undefined
  private exitRequested = false

  constructor(private readonly services: TuiServices) {}

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  async start(resume?: string): Promise<void> {
    this.phase = 'starting'
    this.notify()
    this.transcript = []
    this.eventSequences.clear()
    this.disposeEvents?.()
    this.disposeEvents = this.services.subscribeEvents?.((event) => { this.present(event) })
    this.disposeCatalog?.()
    this.disposeCatalog = this.services.subscribeCatalog?.(() => { this.notify() })
    this.disposeDecisions?.()
    this.disposeDecisions = this.services.connectDecisions?.({
      approval: request => this.requestApproval(request),
      questions: items => this.requestQuestions(items),
    })
    try {
      await this.services.start?.(resume)
      for (const event of this.services.events?.() ?? []) this.present(event)
    } finally {
      this.phase = 'idle'
      this.notify()
    }
  }

  snapshot(): TuiControllerSnapshot {
    const details = this.services.details?.() ?? { cwd: process.cwd() }
    return {
      phase: this.phase,
      ...details,
      commands: commandCatalog(
        this.services.listCommands(),
        this.services.listTerminalCommands(),
        this.services.listSkills(),
      ),
      transcript: this.transcript,
      panel: this.panel,
      exitRequested: this.exitRequested,
      ...(this.notice === undefined ? {} : { notice: this.notice }),
    }
  }

  async submit(text: string): Promise<void> {
    try {
      await this.submitInput(text)
    } catch (error: unknown) {
      this.notice = error instanceof Error ? error.message : String(error)
      this.phase = 'idle'
      this.notify()
    }
  }

  private async submitInput(text: string): Promise<void> {
    const input = text.trim()
    if (input === '') return

    this.notice = undefined
    // Mid-turn input steers the running driver; commands that swap sessions or
    // shells would pull agents out from under it, so they wait for idle.
    if (this.phase === 'running') {
      if (SLASH_COMMAND.test(input)) {
        this.notice = 'Slash commands are unavailable while DeepSeek is working.'
        this.notify()
        return
      }
      this.services.steer?.(input)
      return
    }
    const match = SLASH_COMMAND.exec(input)
    if (match !== null) {
      const name = match[1]
      if (name === undefined) return
      const command = this.snapshot().commands.find(item => item.name === name)
      if (command === undefined) {
        this.notice = `Unknown command: /${name}`
        this.notify()
        return
      }
      if (command.source === 'harness') {
        await this.executeHarnessCommand(input)
        return
      }
      if (command.source === 'terminal') {
        if (command.name === 'exit') {
          this.exitRequested = true
          this.notify()
          return
        }
        this.phase = 'running'
        this.notify()
        try {
          const previousSessionId = this.services.details?.().sessionId
          const notice = await this.services.executeTerminalCommand(input)
          const currentSessionId = this.services.details?.().sessionId
          if (previousSessionId !== currentSessionId) this.reloadTranscript()
          if (notice !== undefined) this.notice = notice
        } finally {
          this.phase = 'idle'
          this.notify()
        }
        return
      }
    }

    this.phase = 'running'
    this.notify()
    try {
      await this.services.prompt(input)
    } finally {
      this.phase = 'idle'
      this.notify()
    }
  }

  cancel(): void {
    this.active?.abort()
    this.services.cancel()
    this.cancelDecision()
  }

  answerDecision(intent: DecisionIntent): void {
    const pending = this.pendingDecision
    if (pending === undefined) return
    if (intent.type === 'cancel-decision') {
      this.cancelDecision()
      return
    }
    if (pending.kind === 'approval' && intent.type === 'answer-approval') {
      this.clearDecision()
      pending.resolve(intent.outcome)
      return
    }
    if (pending.kind === 'question' && intent.type === 'answer-question') {
      this.clearDecision()
      pending.resolve({
        id: pending.id,
        selected: [...intent.selected],
        ...(intent.custom === undefined ? {} : { custom: intent.custom }),
      })
    }
  }

  async stop(): Promise<void> {
    this.phase = 'stopping'
    this.notify()
    this.cancel()
    await this.services.flush()
    await this.services.dispose()
    this.disposeEvents?.()
    this.disposeEvents = undefined
    this.disposeCatalog?.()
    this.disposeCatalog = undefined
    this.disposeDecisions?.()
    this.disposeDecisions = undefined
  }

  private async executeHarnessCommand(line: string): Promise<void> {
    this.phase = 'running'
    this.notify()
    const active = new AbortController()
    this.active = active
    try {
      const result = await this.services.executeCommand(line, active.signal)
      const shownByLifecycle = result?.text !== undefined && this.transcript.some(node => (
        node.kind === 'command' && node.detail === result.text
      ))
      if (result?.text !== undefined && !shownByLifecycle) this.notice = result.text
    } finally {
      this.active = undefined
      this.phase = 'idle'
      this.notify()
    }
  }

  private present(event: SessionEvent): void {
    if (this.eventSequences.has(event.seq)) return
    this.eventSequences.add(event.seq)
    this.transcript = this.services.presentEvent?.(this.transcript, event)
      ?? presentSessionEvent(this.transcript, event)
    this.notify()
  }

  private reloadTranscript(): void {
    this.transcript = []
    this.eventSequences.clear()
    for (const event of this.services.events?.() ?? []) this.present(event)
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }

  private requestApproval(request: { readonly toolName: string; readonly reason?: string }): Promise<ApprovalOutcome> {
    if (this.pendingDecision !== undefined) return Promise.reject(new Error('terminal decision provider is busy'))
    const pending = Promise.withResolvers<ApprovalOutcome>()
    this.pendingDecision = { kind: 'approval', resolve: pending.resolve }
    this.panel = {
      kind: 'approval',
      toolName: request.toolName,
      ...(request.reason === undefined ? {} : { reason: request.reason }),
      selected: 0,
      options: [
        { label: 'Reject', outcome: 'rejected' },
        { label: 'Allow once', outcome: 'allowed-once' },
      ],
    }
    this.notify()
    return pending.promise
  }

  private async requestQuestions(items: readonly AskUserQuestionItem[]): Promise<AskUserQuestionAnswer> {
    const answers: AskUserQuestionAnswerItem[] = []
    for (const item of items) answers.push(await this.requestQuestion(item))
    return { answers }
  }

  private requestQuestion(item: AskUserQuestionItem): Promise<AskUserQuestionAnswerItem> {
    if (this.pendingDecision !== undefined) return Promise.reject(new Error('terminal decision provider is busy'))
    const pending = Promise.withResolvers<AskUserQuestionAnswerItem>()
    this.pendingDecision = { kind: 'question', id: item.id, resolve: pending.resolve }
    const options = (item.options ?? []).map(option => ({ label: option.label, checked: false }))
    this.panel = {
      kind: options.length === 0 ? 'custom-question' : item.multiSelect === true ? 'multi-question' : 'single-question',
      id: item.id,
      prompt: item.question,
      selected: 0,
      options,
    }
    this.notify()
    return pending.promise
  }

  private cancelDecision(): void {
    const pending = this.pendingDecision
    if (pending === undefined) return
    this.clearDecision()
    if (pending.kind === 'approval') pending.resolve('rejected')
    else pending.resolve({ id: pending.id, selected: [] })
  }

  private clearDecision(): void {
    this.pendingDecision = undefined
    this.panel = null
    this.notify()
  }
}
