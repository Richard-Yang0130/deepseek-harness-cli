/** Interactive terminal driver over the same core Agent composition as Web. */
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, extname, isAbsolute, resolve as resolvePath } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { installModelSelection } from '@deepseek-ai/dsh-agent';
import { JobId } from '@deepseek-ai/dsh-jobs';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { scopeOf } from '@deepseek-ai/dsh-scope';
import { SessionId } from '@deepseek-ai/dsh-session';
import { isUserInvocable } from '@deepseek-ai/dsh-skill';
import { UserQuestionError } from '@deepseek-ai/dsh-user-questions';
import { TuiController } from './controller.js';
import { runInkMode } from './ink-mode.js';
import { runLineMode } from './line-mode.js';
import { exportSessionArchive } from './export-session.js';
import { presentSessionEvent } from './event-presenter.js';
import { answerQuestions, parseTerminalInput, renderSessionEvent } from './terminal-ui.js';
import { credentialsOperation, messageFeedbackOperation, modelsOperation, sessionSearchOperation, settingsOperation, } from './operations.js';
export const name = 'tui-runner';
export const inject = [
    'agentDefaultModel',
    'agents',
    'attachments',
    'agentPresets',
    'credentials',
    'jobs',
    'llm',
    'messageFeedback',
    'permissionPresets',
    'pluginInventory',
    'sessions',
    'sessionPersistence',
    'sessionQuery',
    'sessionProjections',
    'sessionTitle',
    'settings',
    'subagents',
    'userQuestions',
    'workspaceRegistry',
];
export const TERMINAL_COMMANDS = [
    { name: 'attach', description: 'Attach an image to the next prompt', source: 'terminal', hint: '<path>' },
    { name: 'credentials', description: 'Inspect or update credential references', source: 'terminal', hint: '<status|set|unset> …' },
    { name: 'exit', description: 'Quit the terminal session', source: 'terminal' },
    { name: 'export', description: 'Export this session and descendants as ZIP', source: 'terminal', hint: '[path]' },
    { name: 'help', description: 'Show terminal commands', source: 'terminal' },
    { name: 'job-kill', description: 'Stop a background job', source: 'terminal', hint: '<job-id>' },
    { name: 'job-read', description: 'Read background job output', source: 'terminal', hint: '<job-id>' },
    { name: 'jobs', description: 'List background jobs', source: 'terminal' },
    { name: 'model', description: 'Show or switch this session model', source: 'terminal', hint: '[provider model]' },
    { name: 'models', description: 'List active model providers and models', source: 'terminal' },
    { name: 'message-feedback', description: 'List or change assistant-message feedback', source: 'terminal', hint: '[list|put|delete] …' },
    { name: 'new', description: 'Start a new persisted session', source: 'terminal' },
    { name: 'plugins', description: 'List loaded Harness plugins', source: 'terminal' },
    { name: 'preset', description: 'Start a new session with an agent preset', source: 'terminal', hint: '<preset-id>' },
    { name: 'presets', description: 'List available agent presets', source: 'terminal' },
    { name: 'rename', description: 'Rename the active session', source: 'terminal', hint: '<title>' },
    { name: 'resume', description: 'Resume a persisted session', source: 'terminal', hint: '<session-id>' },
    { name: 'sessions', description: 'List or full-text search persisted sessions', source: 'terminal', hint: '[query]' },
    { name: 'settings', description: 'Inspect or edit redacted Harness settings', source: 'terminal', hint: '[show|set|unset] …' },
    { name: 'skills', description: 'List user-invocable skills', source: 'terminal' },
    { name: 'subagents', description: 'List subagent providers', source: 'terminal' },
    { name: 'stats', description: 'Show whole-session usage and timing statistics', source: 'terminal' },
    { name: 'trajectory', description: 'Show the durable session event trajectory', source: 'terminal' },
    { name: 'workspace', description: 'Start a session in another workspace', source: 'terminal', hint: '<path>' },
];
const HELP = [
    'Terminal commands:',
    '  /new                 start a new persisted session',
    '  /sessions            list persisted sessions',
    '  /resume <id>          resume a persisted session',
    '  /rename <title>       rename the active session',
    '  /model [provider id]  show or switch the model for this session',
    '  /models               list model providers and advertised models',
    '  /credentials …        inspect, set, or unset a credential reference',
    '  /presets              list available agent presets',
    '  /preset <id>          start a new session with a preset',
    '  /workspace <path>     start a session in another workspace',
    '  /attach <image>       attach an image to the next prompt',
    '  /jobs                 list background jobs',
    '  /job-read <id>        read background job output',
    '  /job-kill <id>        stop a background job',
    '  /skills               list user-invocable skills',
    '  /subagents            list subagent providers',
    '  /stats                show session usage and timing statistics',
    '  /trajectory           show durable session event types',
    '  /settings …           show or mutate settings through the settings service',
    '  /message-feedback …  list or change feedback for assistant messages',
    '  /plugins              list loaded plugins',
    '  /export [path]        export the session tree and images as ZIP',
    '  /exit                 quit',
    'Harness commands and user-invocable skills are discovered dynamically with /.',
    'Ctrl-C cancels a running turn; press it while idle to quit.',
].join('\n');
function processIo() {
    let readline;
    const terminal = () => {
        readline ??= createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdout.isTTY });
        return readline;
    };
    return {
        write: text => void process.stdout.write(text),
        error: text => void process.stderr.write(text),
        read: async (prompt) => {
            try {
                return await terminal().question(prompt);
            }
            catch {
                return undefined;
            }
        },
        onInterrupt: listener => void terminal().on('SIGINT', listener),
        close: () => { readline?.close(); },
    };
}
export const internals = {
    createIo: processIo,
    createServices: (ctx, io, lineOutput) => new HarnessTerminalServices(ctx, io, lineOutput),
    isInteractive: () => process.stdin.isTTY && process.stdout.isTTY,
    runInk: runInkMode,
};
export function restoredModelSelection(session, fallback) {
    const logged = session.requestHeader()?.config;
    return logged === undefined ? fallback : {
        provider: logged.provider,
        model: logged.model,
        ...(logged.reasoningEffort === undefined ? {} : { reasoningEffort: logged.reasoningEffort }),
    };
}
function modelSetup(ctx) {
    let agent;
    let picked;
    const ref = {
        get current() {
            if (picked !== undefined)
                return picked;
            const fallback = ctx.agentDefaultModel.currentSelection();
            return agent === undefined ? fallback : restoredModelSelection(agent.session, fallback);
        },
        set current(next) { picked = next; },
        assembled: undefined,
    };
    return {
        ref,
        setup: (agentCtx) => {
            if (agentCtx.agent === undefined)
                throw new Error('tui-runner: agent setup has no scoped agent');
            agent = agentCtx.agent;
            installModelSelection(agentCtx, ref);
        },
    };
}
function line(io, text = '') {
    io.write(text + '\n');
}
class HarnessTerminalServices {
    ctx;
    io;
    lineOutput;
    handle;
    streaming = false;
    selection;
    skillCommands = [];
    hooksInstalled = false;
    eventListeners = new Set();
    decisions;
    pendingImages = [];
    presetId;
    constructor(ctx, io, lineOutput) {
        this.ctx = ctx;
        this.io = io;
        this.lineOutput = lineOutput;
    }
    get agent() {
        if (this.handle === undefined)
            throw new Error('terminal session is not open');
        return this.handle.agent;
    }
    async start(resume) {
        await this.ctx.get('loader')?.await();
        this.installRuntimeHooks();
        await this.open(resume);
        if (this.lineOutput)
            line(this.io, 'DeepSeek Harness terminal. Type /help for commands.');
    }
    listCommands() {
        if (this.handle === undefined)
            return [];
        const runtime = this.agent.ctx.get('commands') ?? this.ctx.get('commands');
        return runtime?.list(this.agent) ?? [];
    }
    listSkills() {
        return this.skillCommands;
    }
    listTerminalCommands() {
        return TERMINAL_COMMANDS;
    }
    events() {
        return this.handle === undefined ? [] : this.agent.session.events;
    }
    subscribeEvents(listener) {
        this.eventListeners.add(listener);
        return () => { this.eventListeners.delete(listener); };
    }
    subscribeCatalog(listener) {
        const dispose = this.ctx.on('commands/change', listener);
        return () => { dispose(); };
    }
    connectDecisions(handlers) {
        if (!this.lineOutput)
            this.decisions = handlers;
        return () => { this.decisions = undefined; };
    }
    presentEvent(nodes, event) {
        return presentSessionEvent(nodes, event, (name, argumentsJson) => this.presentToolCall(name, argumentsJson));
    }
    details() {
        const selected = this.selection?.current;
        const permissionPresets = this.ctx.get('permissionPresets');
        return {
            cwd: this.handle?.agent.session.header.cwd ?? process.cwd(),
            ...(this.handle === undefined ? {} : { sessionId: this.agent.id }),
            ...(selected === undefined ? {} : { provider: selected.provider, model: selected.model }),
            permission: this.handle === undefined ? 'loading' : permissionPresets.current(this.agent.session.events),
        };
    }
    async executeCommand(command, signal) {
        const runtime = this.agent.ctx.get('commands') ?? this.ctx.get('commands');
        if (runtime === undefined)
            return undefined;
        const execution = await runtime.execute(this.agent, command, signal);
        await this.ctx.sessions.flush(this.agent.session);
        return execution?.result;
    }
    async executeTerminalCommand(line) {
        const invocation = /^\/([^\s]+)(?:\s+([\s\S]*))?$/.exec(line);
        const command = TERMINAL_COMMANDS.find(candidate => candidate.name === invocation?.[1]);
        if (command === undefined)
            return undefined;
        const args = invocation?.[2]?.trim() ?? '';
        const parsed = parseTerminalInput(line);
        const name = command.name;
        switch (name) {
            case 'attach': return await this.attachImage(args);
            case 'credentials': return await credentialsOperation(this.ctx.get('credentials'), args);
            case 'exit': return undefined;
            case 'export': return `Exported ${await exportSessionArchive(this.ctx, this.agent, args)}`;
            case 'help': return HELP;
            case 'job-kill': {
                if (args === '')
                    return 'Usage: /job-kill <job-id>';
                return `Job ${args}: ${this.ctx.jobs.kill(JobId(args), this.agent, 'stopped from dsh-cli')}`;
            }
            case 'job-read': {
                if (args === '')
                    return 'Usage: /job-read <job-id>';
                const result = this.ctx.jobs.read(JobId(args), this.agent);
                return `${result.text}\n${this.formatJob(result.snapshot)}`.trim();
            }
            case 'jobs': return this.jobsText();
            case 'model': {
                if (parsed.kind !== 'model')
                    throw new Error('invalid /model invocation');
                return await this.modelCommand(parsed.provider, parsed.model);
            }
            case 'models': return await modelsOperation(this.ctx.llm);
            case 'message-feedback': return await messageFeedbackOperation(this.ctx.get('messageFeedback'), this.agent.id, args, this.agent.session.events.flatMap(event => event.type === 'assistant/message' ? [String(event.data.message.id)] : []));
            case 'new': {
                await this.open(undefined, this.agent.session.header.cwd ?? process.cwd());
                return undefined;
            }
            case 'plugins': {
                const inventory = this.ctx.get('pluginInventory');
                return inventory === undefined ? 'Plugin inventory is not mounted.' : JSON.stringify(inventory.list(), null, 2);
            }
            case 'preset': {
                if (args === '')
                    return 'Usage: /preset <preset-id>';
                await this.open(undefined, this.agent.session.header.cwd ?? process.cwd(), args);
                return `Agent preset: ${this.presetId}`;
            }
            case 'presets': return await this.presetsCommand(args);
            case 'rename': {
                if (parsed.kind !== 'rename' || parsed.title === '')
                    return 'Usage: /rename <title>';
                const renamed = this.ctx.sessionTitle.rename(this.agent.session, parsed.title);
                await this.ctx.sessions.flush(this.agent.session);
                return `Session title: ${renamed.title}`;
            }
            case 'resume': {
                if (parsed.kind !== 'resume' || parsed.sessionId === '')
                    return 'Usage: /resume <session-id>';
                await this.open(parsed.sessionId);
                return undefined;
            }
            case 'sessions': return args === '' ? await this.sessionsText() : await sessionSearchOperation(this.ctx.sessionQuery, args);
            case 'settings': return await settingsOperation(this.ctx.settings, args);
            case 'skills': return this.skillCommands.length === 0
                ? 'No user-invocable skills.'
                : this.skillCommands.map(skill => `/${skill.name}  ${skill.description}`).join('\n');
            case 'subagents': {
                const providers = this.ctx.subagents.list();
                const children = await this.ctx.subagents.listChildren(this.agent.id);
                const providerText = providers.length === 0 ? 'Providers: none' : `Providers: ${providers.join(', ')}`;
                const childText = children.length === 0
                    ? 'Children: none'
                    : ['Children:', ...children.map((child) => child.kind === 'diagnostic'
                            ? `- ${child.id}  diagnostic/${child.reason}`
                            : `- ${child.label ?? child.id}  ${child.mode}/${child.activity}  ${child.id}`)].join('\n');
                return `${providerText}\n${childText}`;
            }
            case 'stats': {
                const projections = this.ctx.get('sessionProjections');
                const stats = projections.snapshot(this.agent.session).values.sessionStats;
                return stats === undefined ? 'Session statistics are not mounted.' : JSON.stringify(stats, null, 2);
            }
            case 'trajectory': return this.agent.session.events.map(event => `${event.seq}\t${event.type}`).join('\n') || 'No session events.';
            case 'workspace': {
                if (parsed.kind !== 'workspace' || parsed.path === '')
                    return 'Usage: /workspace <path>';
                const workspace = await this.ctx.workspaceRegistry.create(parsed.path);
                await this.open(undefined, workspace.path);
                await workspace.attachSession(this.agent.id);
                return `Workspace: ${workspace.path}`;
            }
            default: {
                const exhaustive = name;
                return exhaustive;
            }
        }
    }
    async prompt(text) {
        if (text === '')
            return;
        this.agent.followup(createUserMessage({
            content: this.takeContent(text),
            source: { kind: 'user' },
        }));
        this.pendingImages = [];
        await this.agent.whenIdle();
        await this.ctx.sessions.flush(this.agent.session);
    }
    steer(text) {
        if (text === '')
            return;
        this.agent.steer(createUserMessage({
            content: this.takeContent(text),
            source: { kind: 'user' },
        }));
        this.pendingImages = [];
    }
    /** Build one outgoing message's content with any attached images. */
    takeContent(text) {
        return [
            ...this.pendingImages.map(attachment => ({ type: 'image', attachment })),
            { type: 'text', text },
        ];
    }
    cancel() {
        if (this.handle?.agent.status === 'running') {
            this.handle.agent.cancel({ kind: 'user' });
            if (this.lineOutput)
                line(this.io, '\nTurn cancelled.');
        }
    }
    async flush() {
        if (this.handle !== undefined)
            await this.ctx.sessions.flush(this.agent.session);
    }
    async dispose() {
        await this.handle?.dispose();
        this.handle = undefined;
    }
    installRuntimeHooks() {
        if (this.hooksInstalled)
            return;
        this.hooksInstalled = true;
        this.ctx.on('session/event', (session, event) => {
            if (session.id !== this.handle?.agent.id)
                return;
            if (this.lineOutput)
                this.render(event);
            for (const listener of this.eventListeners)
                listener(event);
        });
        this.ctx.on('approval/request', async (request, next) => {
            if (request.agent !== this.handle?.agent)
                return next();
            if (this.decisions !== undefined) {
                return await this.decisions.approval({
                    toolName: request.toolName,
                    ...(request.reason === undefined ? {} : { reason: request.reason }),
                });
            }
            const reason = request.reason === undefined ? '' : `\n${request.reason}`;
            const answer = await this.io.read(`\nAllow ${request.toolName}?${reason}\n[y/N] `);
            return answer?.trim().toLowerCase() === 'y' ? 'allowed-once' : 'rejected';
        });
        const disposeQuestions = this.ctx.userQuestions.registerProvider({
            ask: async (request) => {
                if (request.agent !== this.handle?.agent) {
                    throw new UserQuestionError('terminal can answer only its active session', 'SESSION_NOT_ACTIVE');
                }
                if (this.decisions !== undefined)
                    return await this.decisions.questions(request.questions);
                return answerQuestions(request.questions, prompt => this.io.read(`\n${prompt}`));
            },
        });
        this.ctx.effect(() => disposeQuestions, 'tui: user-questions provider');
    }
    async open(resume, cwd = process.cwd(), requestedPreset) {
        const model = modelSetup(this.ctx);
        const presets = this.ctx.get('agentPresets');
        const resumeMeta = resume === undefined
            ? undefined
            : (await this.ctx.sessionPersistence.inspect(SessionId(resume))).meta;
        const resolvedPreset = await presets.resolve(requestedPreset ?? resumeMeta?.agentPreset);
        const setup = async (agentCtx) => {
            model.setup(agentCtx);
            await presets.mount(agentCtx, resolvedPreset.id);
        };
        const nextHandle = resume === undefined
            ? await this.ctx.agents.create({
                sessionId: SessionId(`session-${randomUUID()}`),
                meta: { cwd, agentPreset: resolvedPreset.id },
                agentOptions: this.ctx.agentDefaultModel.currentSelection(),
                setup,
            })
            : await this.ctx.agents.resume({
                resumeSessionId: SessionId(resume),
                agentOptions: this.ctx.agentDefaultModel.currentSelection(),
                setup,
            });
        await nextHandle.agent.whenIdle();
        await this.handle?.dispose();
        this.handle = nextHandle;
        this.selection = model.ref;
        this.presetId = resolvedPreset.id;
        this.pendingImages = [];
        await this.refreshSkills();
        if (resume !== undefined) {
            if (this.lineOutput) {
                line(this.io, `Resumed ${this.agent.id}`);
                for (const event of this.agent.session.events)
                    this.render(event, true);
            }
        }
        else if (this.lineOutput) {
            line(this.io, `Session ${this.agent.id}`);
        }
    }
    async refreshSkills() {
        const registry = this.agent.ctx.get('skills') ?? this.ctx.get('skills');
        if (registry === undefined) {
            this.skillCommands = [];
            return;
        }
        const skills = await registry.list({
            cwd: this.agent.session.header.cwd ?? process.cwd(),
            scope: scopeOf(this.agent.ctx),
        });
        this.skillCommands = skills.filter(isUserInvocable).map(skill => ({
            name: skill.name,
            description: skill.description,
            source: 'skill',
        }));
    }
    presentToolCall(name, argumentsJson) {
        try {
            const runtime = this.agent.ctx.get('tools');
            const view = runtime?.get(name, scopeOf(this.agent.ctx))?.presentCall?.(JSON.parse(argumentsJson));
            if (view === undefined)
                return undefined;
            const locations = view.locations?.map(location => location.path) ?? [];
            const mutatesFiles = view.card === 'diff' || (view.card === 'generic' && view.kind === 'edit');
            const detail = view.rawInput === undefined
                ? undefined
                : typeof view.rawInput === 'string' ? view.rawInput : JSON.stringify(view.rawInput);
            return {
                ...(view.title === undefined ? {} : { title: view.title }),
                ...(detail === undefined ? {} : { detail }),
                ...(mutatesFiles && locations.length > 0 ? { producedPaths: locations } : {}),
            };
        }
        catch {
            return undefined;
        }
    }
    render(event, replay = false) {
        const rendered = renderSessionEvent(event, { replay });
        if (rendered === undefined) {
            if (!replay && event.type === 'turn/end' && this.streaming) {
                line(this.io);
                this.streaming = false;
            }
            return;
        }
        if (rendered.channel === 'stream') {
            if (!this.streaming) {
                this.io.write('assistant> ');
                this.streaming = true;
            }
            this.io.write(rendered.text);
            return;
        }
        if (this.streaming)
            line(this.io);
        this.streaming = false;
        line(this.io, rendered.text);
    }
    async sessionsText() {
        const sessions = await this.ctx.sessionQuery.listSessions();
        if (sessions.length === 0)
            return 'No sessions.';
        const titles = await this.ctx.sessionQuery.readTitleSnapshots(sessions.map(session => session.header.id));
        const titleById = new Map(titles.flatMap((result) => {
            if (result.status !== 'fulfilled' || result.value.title === undefined)
                return [];
            return [[String(result.sessionId), result.value.title.title]];
        }));
        return sessions.map(({ header }) => {
            const active = header.id === this.agent.id ? '*' : ' ';
            const title = titleById.get(String(header.id));
            return `${active} ${header.id}  ${new Date(header.createdAt).toLocaleString()}${title === undefined ? '' : `  ${title}`}  ${header.cwd ?? ''}`.trimEnd();
        }).join('\n');
    }
    async presetsText() {
        const presets = this.ctx.get('agentPresets');
        const rows = await presets.list();
        return rows.length === 0 ? 'No agent presets.' : rows.map(preset => {
            const active = preset.id === this.presetId ? '*' : ' ';
            const state = preset.broken === undefined ? preset.trust : `broken: ${preset.broken}`;
            return `${active} ${preset.id}  ${state}`;
        }).join('\n');
    }
    async presetsCommand(args) {
        const presets = this.ctx.get('agentPresets');
        if (args === '' || args === 'list')
            return await this.presetsText();
        const read = /^read\s+(\S+)$/.exec(args);
        if (read !== null)
            return await presets.read(read[1]);
        const copy = /^copy\s+(\S+)\s+(\S+)(?:\s+([\s\S]+))?$/.exec(args);
        if (copy !== null) {
            await presets.copy(copy[1], copy[2], copy[3]);
            return `Copied preset ${copy[1]} to ${copy[2]}.`;
        }
        const remove = /^remove\s+(\S+)$/.exec(args);
        if (remove !== null) {
            await presets.remove(remove[1]);
            return `Removed preset ${remove[1]}.`;
        }
        return 'Usage: /presets [list | read <id> | copy <from> <id> [name] | remove <id>]';
    }
    async modelCommand(provider, model) {
        if (provider === undefined && model === undefined) {
            const selected = this.selection?.current;
            return selected === undefined ? 'No model selected.' : `${selected.provider} ${selected.model}`;
        }
        if (provider === undefined || model === undefined)
            return 'Usage: /model <provider> <model>';
        await this.ctx.llm.resolveModelInfo(provider, model);
        if (this.selection !== undefined)
            this.selection.current = { provider, model };
        return `Model: ${provider} ${model}`;
    }
    jobsText() {
        const jobs = this.ctx.jobs.list(this.agent);
        return jobs.length === 0 ? 'No background jobs.' : jobs.map(job => this.formatJob(job)).join('\n');
    }
    formatJob(job) {
        return `${job.id}  ${job.status}  ${job.label}${job.detail === undefined ? '' : `  ${job.detail}`}`;
    }
    async attachImage(path) {
        if (path === '')
            return 'Usage: /attach <image-path>';
        const mediaTypes = {
            '.gif': 'image/gif',
            '.jpeg': 'image/jpeg',
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
        };
        const mediaType = mediaTypes[extname(path).toLowerCase()];
        if (mediaType === undefined)
            return 'Supported image types: png, jpg, jpeg, webp, gif.';
        const sourcePath = isAbsolute(path) ? path : resolvePath(this.agent.session.header.cwd ?? process.cwd(), path);
        const attachment = await this.ctx.attachments.saveImage({
            data: await readFile(sourcePath),
            mediaType,
            name: basename(sourcePath),
        });
        this.pendingImages.push(attachment);
        return `Attached ${basename(sourcePath)} to the next prompt.`;
    }
}
export function apply(ctx, config) {
    const exit = ctx.get('appExit');
    if (exit === undefined)
        throw new Error('tui-runner: the launcher must provide ctx.appExit');
    const io = internals.createIo();
    const interactive = internals.isInteractive();
    const controller = new TuiController(internals.createServices(ctx, io, !interactive));
    const running = interactive ? internals.runInk(controller, config) : runLineMode(controller, io, config);
    void running.then(() => { io.close(); exit(0); }, (error) => {
        io.error(`dsh tui: ${error instanceof Error ? error.message : String(error)}\n`);
        io.close();
        exit(1);
    });
}
//# sourceMappingURL=index.js.map