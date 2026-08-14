function textOf(blocks) {
    return blocks.map((block) => {
        if (block.type === 'text')
            return block.text;
        if (block.type === 'tool-result')
            return textOf(block.content);
        return '';
    }).join('');
}
function replaceNode(nodes, id, create) {
    const index = nodes.findIndex(node => node.id === id);
    if (index < 0)
        return [...nodes, create(undefined)];
    const output = [...nodes];
    output[index] = create(output[index]);
    return output;
}
/** Fold one durable Harness event into renderer-stable transcript nodes. */
export function presentSessionEvent(nodes, event, presentToolCall) {
    if (event.type === 'assistant/chunk') {
        const chunk = event.data.chunk;
        if (chunk.type !== 'text-delta')
            return nodes;
        const id = `assistant-${event.data.turn}-${event.data.step}`;
        return replaceNode(nodes, id, existing => ({
            id,
            kind: 'assistant',
            text: `${existing?.kind === 'assistant' ? existing.text : ''}${chunk.text}`,
        }));
    }
    if (event.type === 'user/message' && event.data.source.kind === 'user') {
        const text = textOf(event.data.content);
        return text === '' ? nodes : [...nodes, { id: `event-${event.seq}`, kind: 'user', text }];
    }
    if (event.type === 'assistant/message') {
        const text = textOf(event.data.message.content);
        if (text === '')
            return nodes;
        const id = `assistant-${event.data.turn}-${event.data.step}`;
        return replaceNode(nodes, id, () => ({ id, kind: 'assistant', text }));
    }
    if (event.type === 'todo/write') {
        // Keep the last whole-list snapshot in place; see audit §P0-0.
        return replaceNode(nodes, 'todos', () => ({ id: 'todos', kind: 'todos', items: event.data.todos }));
    }
    if (event.type === 'tool/call') {
        const presentation = presentToolCall?.(event.data.name, event.data.arguments);
        return [...nodes, {
                id: `tool-${event.data.callId}`,
                kind: 'tool',
                title: presentation?.title ?? event.data.name,
                detail: presentation?.detail ?? event.data.arguments,
                status: 'running',
                turn: event.data.turn,
                ...(presentation?.producedPaths === undefined ? {} : { producedPaths: presentation.producedPaths }),
            }];
    }
    if (event.type === 'tool/result') {
        const id = `tool-${event.data.message.content[0].toolCallId}`;
        const existing = nodes.find(node => node.id === id);
        const updated = replaceNode(nodes, id, current => ({
            id,
            kind: 'tool',
            title: current?.kind === 'tool' ? current.title : 'tool',
            detail: textOf(event.data.message.content),
            status: event.data.error === undefined ? 'success' : 'error',
            ...(current?.kind !== 'tool' || current.turn === undefined ? {} : { turn: current.turn }),
            ...(current?.kind !== 'tool' || current.producedPaths === undefined ? {} : { producedPaths: current.producedPaths }),
        }));
        if (event.data.error !== undefined || existing?.kind !== 'tool' || existing.producedPaths === undefined || existing.turn === undefined) {
            return updated;
        }
        const deliverableId = `deliverables-${existing.turn}`;
        return replaceNode(updated, deliverableId, current => ({
            id: deliverableId,
            kind: 'deliverables',
            paths: [...new Set([
                    ...(current?.kind === 'deliverables' ? current.paths : []),
                    ...existing.producedPaths ?? [],
                ])],
        }));
    }
    if (event.type === 'command/run') {
        return [...nodes, {
                id: `command-${event.data.commandId}`,
                kind: 'command',
                title: `/${event.data.name}`,
                detail: event.data.args ?? '',
                status: 'running',
            }];
    }
    if (event.type === 'command/done') {
        const id = `command-${event.data.commandId}`;
        return replaceNode(nodes, id, existing => ({
            id,
            kind: 'command',
            title: existing?.kind === 'command' ? existing.title : 'command',
            detail: event.data.text ?? (existing?.kind === 'command' ? existing.detail : ''),
            status: event.data.kind,
        }));
    }
    const eventType = String(event.type);
    const data = event.data;
    if (eventType === 'tool-workflow/run-start') {
        return [...nodes, {
                id: `workflow-${String(data.runId)}`,
                kind: 'workflow',
                title: String(data.name),
                detail: '',
                status: 'running',
            }];
    }
    if (eventType === 'tool-workflow/agent-start') {
        const id = `workflow-${String(data.runId)}`;
        const label = `${String(data.label)}${data.phase === undefined ? '' : ` (${String(data.phase)})`}`;
        return replaceNode(nodes, id, current => ({
            id,
            kind: 'workflow',
            title: current?.kind === 'workflow' ? current.title : 'Workflow',
            detail: [current?.kind === 'workflow' ? current.detail : '', `● ${label}`].filter(Boolean).join('\n'),
            status: 'running',
        }));
    }
    if (eventType === 'tool-workflow/agent-end') {
        const id = `workflow-${String(data.runId)}`;
        return replaceNode(nodes, id, current => ({
            id,
            kind: 'workflow',
            title: current?.kind === 'workflow' ? current.title : 'Workflow',
            detail: [current?.kind === 'workflow' ? current.detail : '', `agent ${String(data.seq)}: ${String(data.outcome)}`].filter(Boolean).join('\n'),
            status: 'running',
        }));
    }
    if (eventType === 'tool-workflow/run-end') {
        const id = `workflow-${String(data.runId)}`;
        const stopReason = String(data.stopReason);
        return replaceNode(nodes, id, current => ({
            id,
            kind: 'workflow',
            title: current?.kind === 'workflow' ? current.title : 'Workflow',
            detail: current?.kind === 'workflow' ? current.detail : '',
            status: stopReason === 'completed' ? 'success' : 'error',
        }));
    }
    return nodes;
}
//# sourceMappingURL=event-presenter.js.map