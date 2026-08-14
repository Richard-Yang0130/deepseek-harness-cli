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
export function presentSessionEvent(nodes, event) {
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
    if (event.type === 'tool/call') {
        return [...nodes, {
                id: `tool-${event.data.callId}`,
                kind: 'tool',
                title: event.data.name,
                detail: event.data.arguments,
                status: 'running',
            }];
    }
    if (event.type === 'tool/result') {
        const id = `tool-${event.data.message.content[0].toolCallId}`;
        return replaceNode(nodes, id, existing => ({
            id,
            kind: 'tool',
            title: existing?.kind === 'tool' ? existing.title : 'tool',
            detail: textOf(event.data.message.content),
            status: event.data.error === undefined ? 'success' : 'error',
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
    return nodes;
}
//# sourceMappingURL=event-presenter.js.map