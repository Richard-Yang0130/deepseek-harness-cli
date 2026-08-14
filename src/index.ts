/** Interactive terminal driver over the same core Agent composition as Web. */
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { createInterface } from 'node:readline/promises'
import type { Context } from '@deepseek-ai/cordis'
import { installModelSelection, type Agent, type AgentHandle, type ModelSelectionRef } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-agent-default-model'
import type { ImageAttachmentRef, ImageMediaType } from '@deepseek-ai/dsh-attachment'
import type { CommandDescriptor, CommandResult } from '@deepseek-ai/dsh-commands'
import type PluginInventoryGateway from '@deepseek-ai/dsh-host-plugin-inventory'
import { JobId, type JobSnapshot } from '@deepseek-ai/dsh-jobs'
import { createUserMessage, type ContentBlock } from '@deepseek-ai/dsh-llm'
import { scopeOf } from '@deepseek-ai/dsh-scope'
import { SessionId, type SessionEvent } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type {} from '@deepseek-ai/dsh-session-title'
import { isUserInvocable } from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-subagent'
import type {} from '@deepseek-ai/dsh-workspace'
import type { ApprovalOutcome } from '@deepseek-ai/dsh-user-approval'
import { UserQuestionError, type AskUserQuestionRequest } from '@deepseek-ai/dsh-user-questions'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import type {} from '@deepseek-ai/dsh-cmdline'
import { TuiController, type TuiDecisionHandlers, type TuiServices } from './controller.js'
import type { LocalCommandDefinition } from './controller-types.js'
import { runInkMode } from './ink-mode.js'
import { runLineMode, type TerminalIo } from './line-mode.js'
import { exportSessionArchive } from './export-session.js'
import type { TuiStartupValues } from './startup.js'
import { answerQuestions, parseTerminalInput, renderSessionEvent } from './terminal-ui.js'

export const name = 'tui-runner'
export const inject = [
  'agentDefaultModel',
  'agents',
  'attachments',
  'jobs',
  'llm',
  'sessions',
  'sessionPersistence',
  'sessionQuery',
  'sessionTitle',
  'settings',
  'subagents',
  'userQuestions',
  'workspaceRegistry',
]

const TERMINAL_COMMANDS: readonly LocalCommandDefinition[] = [
  { name: 'attach', description: 'Attach an image to the next prompt', source: 'terminal', hint: '<path>' },
  { name: 'exit', description: 'Quit the terminal session', source: 'terminal' },
  { name: 'export', description: 'Export this session and descendants as ZIP', source: 'terminal', hint: '[path]' },
  { name: 'help', description: 'Show terminal commands', source: 'terminal' },
  { name: 'job-kill', description: 'Stop a background job', source: 'terminal', hint: '<job-id>' },
  { name: 'job-read', description: 'Read background job output', source: 'terminal', hint: '<job-id>' },
  { name: 'jobs', description: 'List background jobs', source: 'terminal' },
  { name: 'model', description: 'Show or switch this session model', source: 'terminal', hint: '[provider model]' },
  { name: 'new', description: 'Start a new persisted session', source: 'terminal' },
  { name: 'plugins', description: 'List loaded Harness plugins', source: 'terminal' },
  { name: 'rename', description: 'Rename the active session', source: 'terminal', hint: '<title>' },
  { name: 'resume', description: 'Resume a persisted session', source: 'terminal', hint: '<session-id>' },
  { name: 'sessions', description: 'List persisted sessions', source: 'terminal' },
  { name: 'settings', description: 'Show redacted Harness settings', source: 'terminal' },
  { name: 'skills', description: 'List user-invocable skills', source: 'terminal' },
  { name: 'subagents', description: 'List subagent providers', source: 'terminal' },
  { name: 'trajectory', description: 'Show the durable session event trajectory', source: 'terminal' },
  { name: 'workspace', description: 'Start a session in another workspace', source: 'terminal', hint: '<path>' },
]

const HELP = [
  'Terminal commands:',
  '  /new                 start a new persisted session',
  '  /sessions            list persisted sessions',
  '  /resume <id>          resume a persisted session',
  '  /rename <title>       rename the active session',
  '  /model [provider id]  show or switch the model for this session',
  '  /workspace <path>     start a session in another workspace',
  '  /attach <image>       attach an image to the next prompt',
  '  /jobs                 list background jobs',
  '  /settings             show redacted settings',
  '  /plugins              list loaded plugins',
  '  /export [path]        export the session tree and images as ZIP',
  '  /exit                 quit',
  'Harness commands and user-invocable skills are discovered dynamically with /.',
  'Ctrl-C cancels a running turn; press it while idle to quit.',
].join('\n')

function processIo(): TerminalIo {
  let readline: ReturnType<typeof createInterface> | undefined
  const terminal = (): ReturnType<typeof createInterface> => {
    readline ??= createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdout.isTTY })
    return readline
  }
  return {
    write: text => void process.stdout.write(text),
    error: text => void process.stderr.write(text),
    read: async (prompt) => {
      try {
        return await terminal().question(prompt)
      } catch {
        return undefined
      }
    },
    onInterrupt: listener => void terminal().on('SIGINT', listener),
    close: () => { readline?.close() },
  }
}

export const internals: {
  createIo(): TerminalIo
  isInteractive(): boolean
  runInk(controller: TuiController, startup: TuiStartupValues): Promise<void>
} = {
  createIo: processIo,
  isInteractive: () => process.stdin.isTTY && process.stdout.isTTY,
  runInk: runInkMode,
}

function modelSetup(ctx: Context): { ref: ModelSelectionRef; setup(agentCtx: Context): void } {
  const ref: ModelSelectionRef = { current: ctx.agentDefaultModel.currentSelection(), assembled: undefined }
  return { ref, setup: agentCtx => installModelSelection(agentCtx, ref) }
}

function line(io: TerminalIo, text = ''): void {
  io.write(text + '\n')
}

class HarnessTerminalServices implements TuiServices {
  private handle: AgentHandle | undefined
  private streaming = false
  private selection: ModelSelectionRef | undefined
  private skillCommands: readonly LocalCommandDefinition[] = []
  private hooksInstalled = false
  private readonly eventListeners = new Set<(event: SessionEvent) => void>()
  private decisions: TuiDecisionHandlers | undefined
  private pendingImages: ImageAttachmentRef[] = []
  private subagentRefs: readonly string[] = []

  constructor(
    private readonly ctx: Context,
    private readonly io: TerminalIo,
    private readonly lineOutput: boolean,
  ) {}

  private get agent(): Agent {
    if (this.handle === undefined) throw new Error('terminal session is not open')
    return this.handle.agent
  }

  async start(resume?: string): Promise<void> {
    await this.ctx.get('loader')?.await()
    this.installRuntimeHooks()
    await this.open(resume)
    if (this.lineOutput) line(this.io, 'DeepSeek Harness terminal. Type /help for commands.')
  }

  listCommands(): readonly CommandDescriptor[] {
    if (this.handle === undefined) return []
    const runtime = this.agent.ctx.get('commands') ?? this.ctx.get('commands')
    return runtime?.list(this.agent) ?? []
  }

  listSkills(): readonly LocalCommandDefinition[] {
    return this.skillCommands
  }

  listTerminalCommands(): readonly LocalCommandDefinition[] {
    return TERMINAL_COMMANDS
  }

  listSubagents(): readonly string[] {
    return this.subagentRefs
  }

  events(): readonly SessionEvent[] {
    return this.handle === undefined ? [] : this.agent.session.events
  }

  subscribeEvents(listener: (event: SessionEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => { this.eventListeners.delete(listener) }
  }

  subscribeCatalog(listener: () => void): () => void {
    const dispose = this.ctx.on('commands/change', listener)
    return () => { dispose() }
  }

  connectDecisions(handlers: TuiDecisionHandlers): () => void {
    if (!this.lineOutput) this.decisions = handlers
    return () => { this.decisions = undefined }
  }

  details(): {
    cwd: string
    sessionId?: string
    provider?: string
    model?: string
    permission: string
  } {
    const selected = this.selection?.current
    return {
      cwd: this.handle?.agent.session.header.cwd ?? process.cwd(),
      ...(this.handle === undefined ? {} : { sessionId: this.agent.id }),
      ...(selected === undefined ? {} : { provider: selected.provider, model: selected.model }),
      permission: 'approval',
    }
  }

  async executeCommand(command: string, signal: AbortSignal): Promise<CommandResult | undefined> {
    const runtime = this.agent.ctx.get('commands') ?? this.ctx.get('commands')
    if (runtime === undefined) return undefined
    const execution = await runtime.execute(this.agent, command, signal)
    await this.ctx.sessions.flush(this.agent.session)
    return execution?.result
  }

  async executeTerminalCommand(line: string): Promise<string | undefined> {
    const invocation = /^\/[^\s]+(?:\s+([\s\S]*))?$/.exec(line)
    const args = invocation?.[1]?.trim() ?? ''
    if (line === '/skills') {
      return this.skillCommands.length === 0
        ? 'No user-invocable skills.'
        : this.skillCommands.map(skill => `/${skill.name}  ${skill.description}`).join('\n')
    }
    if (line === '/subagents') {
      const providers = this.ctx.subagents.list()
      return providers.length === 0 ? 'No subagent providers.' : providers.join('\n')
    }
    if (line === '/jobs') return this.jobsText()
    if (line.startsWith('/job-read')) {
      if (args === '') return 'Usage: /job-read <job-id>'
      const result = this.ctx.jobs.read(JobId(args), this.agent)
      return `${result.text}\n${this.formatJob(result.snapshot)}`.trim()
    }
    if (line.startsWith('/job-kill')) {
      if (args === '') return 'Usage: /job-kill <job-id>'
      return `Job ${args}: ${this.ctx.jobs.kill(JobId(args), this.agent, 'stopped from dsh-cli')}`
    }
    if (line === '/settings') return JSON.stringify(this.ctx.settings.describe({ redactSecrets: true }), null, 2)
    if (line === '/plugins') {
      const inventory = this.ctx.get('pluginInventory') as PluginInventoryGateway | undefined
      return inventory === undefined ? 'Plugin inventory is not mounted.' : JSON.stringify(inventory.list(), null, 2)
    }
    if (line === '/trajectory') {
      return this.agent.session.events.map(event => `${event.seq}\t${event.type}`).join('\n') || 'No session events.'
    }
    if (line === '/export' || line.startsWith('/export ')) {
      return `Exported ${await exportSessionArchive(this.ctx, this.agent, args)}`
    }
    if (line.startsWith('/attach')) return await this.attachImage(args)
    const command = parseTerminalInput(line)
    if (command.kind === 'help') return HELP
    if (command.kind === 'new') {
      await this.open(undefined, this.agent.session.header.cwd ?? process.cwd())
      return undefined
    }
    if (command.kind === 'sessions') return await this.sessionsText()
    if (command.kind === 'resume') {
      if (command.sessionId === '') return 'Usage: /resume <session-id>'
      await this.open(command.sessionId)
      return undefined
    }
    if (command.kind === 'model') return await this.modelCommand(command.provider, command.model)
    if (command.kind === 'rename') {
      if (command.title === '') return 'Usage: /rename <title>'
      const renamed = this.ctx.sessionTitle.rename(this.agent.session, command.title)
      await this.ctx.sessions.flush(this.agent.session)
      return `Session title: ${renamed.title}`
    }
    if (command.kind === 'workspace') {
      if (command.path === '') return 'Usage: /workspace <path>'
      const workspace = await this.ctx.workspaceRegistry.create(command.path)
      await this.open(undefined, workspace.path)
      await workspace.attachSession(this.agent.id)
      return `Workspace: ${workspace.path}`
    }
    return undefined
  }

  async prompt(text: string): Promise<void> {
    if (text === '') return
    const content: ContentBlock[] = [
      ...this.pendingImages.map(attachment => ({ type: 'image' as const, attachment })),
      { type: 'text', text },
    ]
    this.agent.followup(createUserMessage({
      content,
      source: { kind: 'user' },
    }))
    this.pendingImages = []
    await this.agent.whenIdle()
    await this.refreshSubagents()
    await this.ctx.sessions.flush(this.agent.session)
  }

  cancel(): void {
    if (this.handle?.agent.status === 'running') {
      this.handle.agent.cancel({ kind: 'user' })
      if (this.lineOutput) line(this.io, '\nTurn cancelled.')
    }
  }

  async flush(): Promise<void> {
    if (this.handle !== undefined) await this.ctx.sessions.flush(this.agent.session)
  }

  async dispose(): Promise<void> {
    await this.handle?.dispose()
    this.handle = undefined
  }

  private installRuntimeHooks(): void {
    if (this.hooksInstalled) return
    this.hooksInstalled = true
    this.ctx.on('session/event', (session, event) => {
      if (session.id !== this.handle?.agent.id) return
      if (this.lineOutput) this.render(event)
      for (const listener of this.eventListeners) listener(event)
    })
    this.ctx.on('approval/request', async (request, next): Promise<ApprovalOutcome> => {
      if (request.agent !== this.handle?.agent) return next()
      if (this.decisions !== undefined) {
        return await this.decisions.approval({
          toolName: request.toolName,
          ...(request.reason === undefined ? {} : { reason: request.reason }),
        })
      }
      const reason = request.reason === undefined ? '' : `\n${request.reason}`
      const answer = await this.io.read(`\nAllow ${request.toolName}?${reason}\n[y/N] `)
      return answer?.trim().toLowerCase() === 'y' ? 'allowed-once' : 'rejected'
    })
    const disposeQuestions = this.ctx.userQuestions.registerProvider({
      ask: async (request: AskUserQuestionRequest) => {
        if (request.agent !== this.handle?.agent) {
          throw new UserQuestionError('terminal can answer only its active session', 'SESSION_NOT_ACTIVE')
        }
        if (this.decisions !== undefined) return await this.decisions.questions(request.questions)
        return answerQuestions(request.questions, prompt => this.io.read(`\n${prompt}`))
      },
    })
    this.ctx.effect(() => disposeQuestions, 'tui: user-questions provider')
  }

  private async open(resume?: string, cwd = process.cwd()): Promise<void> {
    await this.handle?.dispose()
    const model = modelSetup(this.ctx)
    this.selection = model.ref
    this.handle = resume === undefined
      ? await this.ctx.agents.create({
        sessionId: SessionId(`session-${randomUUID()}`),
        meta: { cwd },
        agentOptions: this.ctx.agentDefaultModel.currentSelection(),
        setup: (agentCtx) => { model.setup(agentCtx) },
      })
      : await this.ctx.agents.resume({
        resumeSessionId: SessionId(resume),
        agentOptions: this.ctx.agentDefaultModel.currentSelection(),
        setup: (agentCtx) => { model.setup(agentCtx) },
      })
    await this.agent.whenIdle()
    await this.refreshSkills()
    await this.refreshSubagents()
    if (resume !== undefined) {
      if (this.lineOutput) {
        line(this.io, `Resumed ${this.agent.id}`)
        for (const event of this.agent.session.events) this.render(event, true)
      }
    } else if (this.lineOutput) {
      line(this.io, `Session ${this.agent.id}`)
    }
  }

  private async refreshSkills(): Promise<void> {
    const registry = this.agent.ctx.get('skills') ?? this.ctx.get('skills')
    if (registry === undefined) {
      this.skillCommands = []
      return
    }
    const skills = await registry.list({ cwd: process.cwd(), scope: scopeOf(this.agent.ctx) })
    this.skillCommands = skills.filter(isUserInvocable).map(skill => ({
      name: skill.name,
      description: skill.description,
      source: 'skill',
    }))
  }

  private async refreshSubagents(): Promise<void> {
    const children = await this.ctx.subagents.listChildren(this.agent.id)
    this.subagentRefs = children.flatMap((child) => {
      if (child.kind !== 'child' || child.activity !== 'running') return []
      return [child.label ?? String(child.id)]
    })
  }

  private render(event: SessionEvent, replay = false): void {
    const rendered = renderSessionEvent(event, { replay })
    if (rendered === undefined) {
      if (!replay && event.type === 'turn/end' && this.streaming) {
        line(this.io)
        this.streaming = false
      }
      return
    }
    if (rendered.channel === 'stream') {
      if (!this.streaming) {
        this.io.write('assistant> ')
        this.streaming = true
      }
      this.io.write(rendered.text)
      return
    }
    if (this.streaming) line(this.io)
    this.streaming = false
    line(this.io, rendered.text)
  }

  private async sessionsText(): Promise<string> {
    const sessions = await this.ctx.sessionPersistence.list()
    if (sessions.length === 0) return 'No persisted sessions.'
    return sessions.sort((left, right) => right.createdAt - left.createdAt).map((session) => {
      const active = session.id === this.agent.id ? '*' : ' '
      return `${active} ${session.id}  ${new Date(session.createdAt).toLocaleString()}  ${session.cwd ?? ''}`.trimEnd()
    }).join('\n')
  }

  private async modelCommand(provider?: string, model?: string): Promise<string> {
    if (provider === undefined && model === undefined) {
      const selected = this.selection?.current
      return selected === undefined ? 'No model selected.' : `${selected.provider} ${selected.model}`
    }
    if (provider === undefined || model === undefined) return 'Usage: /model <provider> <model>'
    await this.ctx.llm.resolveModelInfo(provider, model)
    if (this.selection !== undefined) this.selection.current = { provider, model }
    return `Model: ${provider} ${model}`
  }

  private jobsText(): string {
    const jobs = this.ctx.jobs.list(this.agent)
    return jobs.length === 0 ? 'No background jobs.' : jobs.map(job => this.formatJob(job)).join('\n')
  }

  private formatJob(job: JobSnapshot): string {
    return `${job.id}  ${job.status}  ${job.label}${job.detail === undefined ? '' : `  ${job.detail}`}`
  }

  private async attachImage(path: string): Promise<string> {
    if (path === '') return 'Usage: /attach <image-path>'
    const mediaTypes: Readonly<Record<string, ImageMediaType>> = {
      '.gif': 'image/gif',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }
    const mediaType = mediaTypes[extname(path).toLowerCase()]
    if (mediaType === undefined) return 'Supported image types: png, jpg, jpeg, webp, gif.'
    const attachment = await this.ctx.attachments.saveImage({
      data: await readFile(path),
      mediaType,
      name: basename(path),
    })
    this.pendingImages.push(attachment)
    return `Attached ${basename(path)} to the next prompt.`
  }
}

export function apply(ctx: Context, config: TuiStartupValues): void {
  const exit = ctx.get('appExit')
  if (exit === undefined) throw new Error('tui-runner: the launcher must provide ctx.appExit')
  const io = internals.createIo()
  const interactive = internals.isInteractive()
  const controller = new TuiController(new HarnessTerminalServices(ctx, io, !interactive))
  const running = interactive ? internals.runInk(controller, config) : runLineMode(controller, io, config)
  void running.then(
    () => { io.close(); exit(0) },
    (error: unknown) => {
      io.error(`dsh tui: ${error instanceof Error ? error.message : String(error)}\n`)
      io.close()
      exit(1)
    },
  )
}
