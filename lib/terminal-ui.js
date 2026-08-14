function textOf(blocks) {
    const output = [];
    for (const block of blocks) {
        if (block.type === 'text')
            output.push(block.text);
        if (block.type === 'tool-result')
            output.push(textOf(block.content));
    }
    return output.join('');
}
/** Map durable Harness events to a compact terminal representation. */
export function renderSessionEvent(event, options = {}) {
    if (event.type === 'assistant/chunk' && event.data.chunk.type === 'text-delta') {
        return { channel: 'stream', text: event.data.chunk.text };
    }
    if (event.type === 'assistant/message' && options.replay === true) {
        const text = textOf(event.data.message.content);
        return text === '' ? undefined : { channel: 'line', text: `assistant> ${text}` };
    }
    if (event.type === 'user/message' && options.replay === true && event.data.source.kind === 'user') {
        const text = textOf(event.data.content);
        return text === '' ? undefined : { channel: 'line', text: `you> ${text}` };
    }
    if (event.type === 'tool/call') {
        return { channel: 'line', text: `● ${event.data.name} ${event.data.arguments}` };
    }
    if (event.type === 'tool/result' && event.data.error !== undefined) {
        return {
            channel: 'line',
            text: `✗ ${event.data.error.code}: ${textOf(event.data.message.content)}`,
        };
    }
    return undefined;
}
/** Separate terminal-owned lifecycle commands from commands handled by dsh. */
export function parseTerminalInput(input) {
    const text = input.trim();
    if (text === '/help')
        return { kind: 'help' };
    if (text === '/new')
        return { kind: 'new' };
    if (text === '/sessions')
        return { kind: 'sessions' };
    if (text === '/exit' || text === '/quit')
        return { kind: 'exit' };
    if (text === '/resume')
        return { kind: 'resume', sessionId: '' };
    if (text.startsWith('/resume '))
        return { kind: 'resume', sessionId: text.slice('/resume '.length).trim() };
    if (text === '/model')
        return { kind: 'model' };
    if (text.startsWith('/model ')) {
        const [provider, model] = text.slice('/model '.length).trim().split(/\s+/, 2);
        return { kind: 'model', ...(provider === undefined ? {} : { provider }), ...(model === undefined ? {} : { model }) };
    }
    if (text === '/rename')
        return { kind: 'rename', title: '' };
    if (text.startsWith('/rename '))
        return { kind: 'rename', title: text.slice('/rename '.length).trim() };
    if (text === '/workspace')
        return { kind: 'workspace', path: '' };
    if (text.startsWith('/workspace '))
        return { kind: 'workspace', path: text.slice('/workspace '.length).trim() };
    return { kind: 'prompt', text };
}
function questionPrompt(question) {
    const heading = question.header === undefined ? question.question : `${question.header}: ${question.question}`;
    const detail = question.detail === undefined ? '' : `\n${question.detail}`;
    const options = (question.options ?? [])
        .map((option, index) => `\n  ${index + 1}. ${option.label}${option.description === undefined ? '' : ` — ${option.description}`}`)
        .join('');
    const suffix = question.multiSelect === true ? '\nSelect numbers separated by commas: ' : '\n> ';
    return `${heading}${detail}${options}${suffix}`;
}
/** Collect terminal answers in the structured user-questions protocol. */
export async function answerQuestions(questions, ask) {
    const answers = [];
    for (const question of questions) {
        const raw = (await ask(questionPrompt(question)))?.trim() ?? '';
        const options = question.options ?? [];
        if (options.length === 0) {
            answers.push({ id: question.id, selected: [], ...(raw === '' ? {} : { custom: raw }) });
            continue;
        }
        const indexes = raw.split(',')
            .map(value => Number.parseInt(value.trim(), 10) - 1)
            .filter(index => Number.isInteger(index) && index >= 0 && index < options.length);
        const selected = [...new Set(indexes)].map(index => options[index].label);
        if (selected.length > 0) {
            answers.push({ id: question.id, selected: question.multiSelect === true ? selected : selected.slice(0, 1) });
        }
        else {
            answers.push({ id: question.id, selected: [], ...(raw === '' ? {} : { custom: raw }) });
        }
    }
    return { answers };
}
//# sourceMappingURL=terminal-ui.js.map