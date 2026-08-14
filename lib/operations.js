export async function modelsOperation(llm) {
    const providers = llm.listProviders();
    if (providers.length === 0)
        return 'No model providers are active.';
    const rows = [];
    for (const provider of providers) {
        const models = await llm.listModels(provider.id);
        if (models.length === 0)
            rows.push(`${provider.id}  ${provider.name}  (custom model ids accepted)`);
        else
            for (const model of models)
                rows.push(`${provider.id}/${model.id}  ${model.name}`);
    }
    return rows.join('\n');
}
function descriptorText(settings, ns) {
    const descriptors = settings.describe({ redactSecrets: true })
        .filter(descriptor => ns === undefined || descriptor.ns === ns);
    return descriptors.length === 0 ? `Unknown settings namespace: ${ns ?? '(none)'}` : JSON.stringify(descriptors, null, 2);
}
export async function settingsOperation(settings, input) {
    const args = input.trim();
    if (args === '')
        return descriptorText(settings);
    const read = /^show(?:\s+([a-z][a-z0-9-]*))?$/.exec(args);
    if (read !== null)
        return descriptorText(settings, read[1]);
    const mutation = /^(set|unset)\s+([a-z][a-z0-9-]*)\s+([^\s]+)(?:\s+([\s\S]+))?$/.exec(args);
    if (mutation === null)
        return 'Usage: /settings [show [namespace] | set <namespace> <path> <json> | unset <namespace> <path>]';
    const [, action, ns, rawPath, rawValue] = mutation;
    if (action === undefined || ns === undefined || rawPath === undefined)
        throw new Error('invalid settings operation');
    const descriptor = settings.describe({ redactSecrets: true }).find(candidate => candidate.ns === ns);
    if (descriptor === undefined)
        return `Unknown settings namespace: ${ns}`;
    const path = rawPath.split('.').filter(Boolean);
    if (path.length === 0)
        return 'Settings path must not be empty.';
    if (action === 'set' && rawValue === undefined)
        return 'Usage: /settings set <namespace> <path> <json>';
    const operation = action === 'set'
        ? { op: 'set', path, value: JSON.parse(rawValue) }
        : { op: 'unset', path };
    await settings.mutate(ns, [operation], descriptor.revision);
    return descriptorText(settings, ns);
}
export async function credentialsOperation(credentials, input, env = process.env) {
    const match = /^(status|set|unset)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+([A-Za-z_][A-Za-z0-9_]*))?$/.exec(input.trim());
    if (match === null)
        return 'Usage: /credentials status <ref> | set <ref> <source-env> | unset <ref>';
    const [, action, ref, source] = match;
    if (action === 'status')
        return JSON.stringify({ ref, ...await credentials.describe(ref) }, null, 2);
    if (action === 'unset') {
        await credentials.unset(ref);
        return `Credential ${ref} removed from the writable store.`;
    }
    if (source === undefined)
        return 'Usage: /credentials set <ref> <source-env>';
    const value = env[source];
    if (value === undefined || value === '')
        return `Source environment variable ${source} is empty or unset.`;
    await credentials.set(ref, value);
    return `Credential ${ref} saved from ${source}; the value was not displayed.`;
}
function feedbackFailure(result) {
    return `Feedback rejected: ${JSON.stringify(result.error)}`;
}
export async function messageFeedbackOperation(feedback, sessionId, input) {
    const args = input.trim();
    const current = await feedback.list({ sessionId: sessionId });
    if (!current.ok)
        return feedbackFailure(current);
    if (args === '' || args === 'list') {
        return current.value.items.length === 0 ? 'No message feedback.' : JSON.stringify(current.value.items, null, 2);
    }
    const put = /^put\s+(\S+)\s+(positive|negative)(?:\s+([\s\S]+))?$/.exec(args);
    if (put !== null) {
        const [, messageId, rating, note] = put;
        const existing = current.value.items.find(item => item.messageId === messageId);
        const result = await feedback.put({
            sessionId: sessionId,
            messageId: messageId,
            rating: rating,
            ...(note === undefined ? {} : { note }),
            ifVersion: (existing?.version ?? null),
        });
        return result.ok ? `Saved ${rating} feedback for ${messageId}.` : feedbackFailure(result);
    }
    const remove = /^delete\s+(\S+)$/.exec(args);
    if (remove !== null) {
        const messageId = remove[1];
        const existing = current.value.items.find(item => item.messageId === messageId);
        if (existing === undefined)
            return `No feedback exists for ${messageId}.`;
        const result = await feedback.delete({
            sessionId: sessionId,
            messageId: messageId,
            ifVersion: existing.version,
        });
        return result.ok ? `Deleted feedback for ${messageId}.` : feedbackFailure(result);
    }
    return 'Usage: /message-feedback [list | put <message-id> <positive|negative> [note] | delete <message-id>]';
}
export async function sessionSearchOperation(query, text) {
    const page = await query.searchSessions({
        query: text,
        eventFilters: [
            { kind: 'type', values: ['user/message', 'assistant/message'] },
            { kind: 'surface', values: ['current'] },
        ],
        limit: 20,
    });
    return page.items.length === 0 ? 'No matching sessions.' : page.items
        .map(hit => `${hit.header.id}  ${hit.bestMatch.snippet.replace(/\s+/g, ' ').trim()}`)
        .join('\n');
}
//# sourceMappingURL=operations.js.map