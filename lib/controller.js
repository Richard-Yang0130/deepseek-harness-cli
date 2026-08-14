import { commandCatalog } from './command-catalog.js';
import { presentSessionEvent } from './event-presenter.js';
const SLASH_COMMAND = /^\/([a-z][a-z0-9_-]*)(?=$|\s)/;
export class TuiController {
    services;
    phase = 'idle';
    notice;
    active;
    transcript = [];
    eventSequences = new Set();
    listeners = new Set();
    disposeEvents;
    disposeCatalog;
    disposeDecisions;
    panel = null;
    pendingDecision;
    constructor(services) {
        this.services = services;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }
    async start(resume) {
        this.phase = 'starting';
        this.notify();
        this.transcript = [];
        this.eventSequences.clear();
        this.disposeEvents?.();
        this.disposeEvents = this.services.subscribeEvents?.((event) => { this.present(event); });
        this.disposeCatalog?.();
        this.disposeCatalog = this.services.subscribeCatalog?.(() => { this.notify(); });
        this.disposeDecisions?.();
        this.disposeDecisions = this.services.connectDecisions?.({
            approval: request => this.requestApproval(request),
            questions: items => this.requestQuestions(items),
        });
        try {
            await this.services.start?.(resume);
            for (const event of this.services.events?.() ?? [])
                this.present(event);
        }
        finally {
            this.phase = 'idle';
            this.notify();
        }
    }
    snapshot() {
        const details = this.services.details?.() ?? { cwd: process.cwd() };
        return {
            phase: this.phase,
            ...details,
            commands: commandCatalog(this.services.listCommands(), this.services.listTerminalCommands(), this.services.listSkills()),
            subagents: this.services.listSubagents?.() ?? [],
            transcript: this.transcript,
            panel: this.panel,
            ...(this.notice === undefined ? {} : { notice: this.notice }),
        };
    }
    async submit(text) {
        try {
            await this.submitInput(text);
        }
        catch (error) {
            this.notice = error instanceof Error ? error.message : String(error);
            this.phase = 'idle';
            this.notify();
        }
    }
    async submitInput(text) {
        const input = text.trim();
        if (input === '')
            return;
        this.notice = undefined;
        const match = SLASH_COMMAND.exec(input);
        if (match !== null) {
            const name = match[1];
            if (name === undefined)
                return;
            const command = this.snapshot().commands.find(item => item.name === name);
            if (command === undefined) {
                this.notice = `Unknown command: /${name}`;
                this.notify();
                return;
            }
            if (command.source === 'harness') {
                await this.executeHarnessCommand(input);
                return;
            }
            if (command.source === 'terminal') {
                this.phase = 'running';
                this.notify();
                try {
                    const notice = await this.services.executeTerminalCommand(input);
                    if (notice !== undefined)
                        this.notice = notice;
                }
                finally {
                    this.phase = 'idle';
                    this.notify();
                }
                return;
            }
        }
        this.phase = 'running';
        this.notify();
        try {
            await this.services.prompt(input);
        }
        finally {
            this.phase = 'idle';
            this.notify();
        }
    }
    cancel() {
        this.active?.abort();
        this.services.cancel();
        this.cancelDecision();
    }
    answerDecision(intent) {
        const pending = this.pendingDecision;
        if (pending === undefined)
            return;
        if (intent.type === 'cancel-decision') {
            this.cancelDecision();
            return;
        }
        if (pending.kind === 'approval' && intent.type === 'answer-approval') {
            this.clearDecision();
            pending.resolve(intent.outcome);
            return;
        }
        if (pending.kind === 'question' && intent.type === 'answer-question') {
            this.clearDecision();
            pending.resolve({
                id: pending.id,
                selected: [...intent.selected],
                ...(intent.custom === undefined ? {} : { custom: intent.custom }),
            });
        }
    }
    async stop() {
        this.phase = 'stopping';
        this.notify();
        this.cancel();
        await this.services.flush();
        await this.services.dispose();
        this.disposeEvents?.();
        this.disposeEvents = undefined;
        this.disposeCatalog?.();
        this.disposeCatalog = undefined;
        this.disposeDecisions?.();
        this.disposeDecisions = undefined;
    }
    async executeHarnessCommand(line) {
        this.phase = 'running';
        this.notify();
        const active = new AbortController();
        this.active = active;
        try {
            const result = await this.services.executeCommand(line, active.signal);
            if (result?.text !== undefined)
                this.notice = result.text;
        }
        finally {
            this.active = undefined;
            this.phase = 'idle';
            this.notify();
        }
    }
    present(event) {
        if (this.eventSequences.has(event.seq))
            return;
        this.eventSequences.add(event.seq);
        this.transcript = presentSessionEvent(this.transcript, event);
        this.notify();
    }
    notify() {
        for (const listener of this.listeners)
            listener();
    }
    requestApproval(request) {
        if (this.pendingDecision !== undefined)
            return Promise.reject(new Error('terminal decision provider is busy'));
        const pending = Promise.withResolvers();
        this.pendingDecision = { kind: 'approval', resolve: pending.resolve };
        this.panel = {
            kind: 'approval',
            toolName: request.toolName,
            ...(request.reason === undefined ? {} : { reason: request.reason }),
            selected: 0,
            options: [
                { label: 'Reject', outcome: 'rejected' },
                { label: 'Allow once', outcome: 'allowed-once' },
            ],
        };
        this.notify();
        return pending.promise;
    }
    async requestQuestions(items) {
        const answers = [];
        for (const item of items)
            answers.push(await this.requestQuestion(item));
        return { answers };
    }
    requestQuestion(item) {
        if (this.pendingDecision !== undefined)
            return Promise.reject(new Error('terminal decision provider is busy'));
        const pending = Promise.withResolvers();
        this.pendingDecision = { kind: 'question', id: item.id, resolve: pending.resolve };
        const options = (item.options ?? []).map(option => ({ label: option.label, checked: false }));
        this.panel = {
            kind: options.length === 0 ? 'custom-question' : item.multiSelect === true ? 'multi-question' : 'single-question',
            id: item.id,
            prompt: item.question,
            selected: 0,
            options,
        };
        this.notify();
        return pending.promise;
    }
    cancelDecision() {
        const pending = this.pendingDecision;
        if (pending === undefined)
            return;
        this.clearDecision();
        if (pending.kind === 'approval')
            pending.resolve('rejected');
        else
            pending.resolve({ id: pending.id, selected: [] });
    }
    clearDecision() {
        this.pendingDecision = undefined;
        this.panel = null;
        this.notify();
    }
}
//# sourceMappingURL=controller.js.map