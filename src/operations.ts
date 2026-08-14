export interface LlmCatalogLike {
  listProviders(): readonly { readonly id: string; readonly name: string }[]
  listModels(provider: string): Promise<readonly { readonly provider: string; readonly id: string; readonly name: string }[]>
}

export interface SettingsLike {
  describe(options?: { redactSecrets?: boolean }): Array<{
    readonly ns: string
    readonly revision: number
    readonly value: unknown
    readonly applies: string
  }>
  mutate(ns: never, operations: readonly unknown[], expectedRevision?: number): Promise<void>
}

export interface CredentialsLike {
  describe(ref: never): Promise<{ readonly configured: boolean; readonly source?: string; readonly writable: boolean }>
  set(ref: never, value: string): Promise<void>
  unset(ref: never): Promise<void>
}

interface FeedbackItem {
  readonly messageId: string
  readonly rating?: string
  readonly note?: string
  readonly version: string
}

type FeedbackResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: unknown }

export interface MessageFeedbackLike {
  list(request: { readonly sessionId: never }): Promise<FeedbackResult<{ readonly items: readonly FeedbackItem[] }>>
  put(request: {
    readonly sessionId: never
    readonly messageId: never
    readonly rating: 'positive' | 'negative'
    readonly note?: string
    readonly ifVersion: never | null
  }): Promise<FeedbackResult<unknown>>
  delete(request: {
    readonly sessionId: never
    readonly messageId: never
    readonly ifVersion: never
  }): Promise<FeedbackResult<unknown>>
}

export async function modelsOperation(llm: LlmCatalogLike): Promise<string> {
  const providers = llm.listProviders()
  if (providers.length === 0) return 'No model providers are active.'
  const rows: string[] = []
  for (const provider of providers) {
    const models = await llm.listModels(provider.id)
    if (models.length === 0) rows.push(`${provider.id}  ${provider.name}  (custom model ids accepted)`)
    else for (const model of models) rows.push(`${provider.id}/${model.id}  ${model.name}`)
  }
  return rows.join('\n')
}

function descriptorText(settings: SettingsLike, ns?: string): string {
  const descriptors = settings.describe({ redactSecrets: true })
    .filter(descriptor => ns === undefined || descriptor.ns === ns)
  return descriptors.length === 0 ? `Unknown settings namespace: ${ns ?? '(none)'}` : JSON.stringify(descriptors, null, 2)
}

export async function settingsOperation(settings: SettingsLike, input: string): Promise<string> {
  const args = input.trim()
  if (args === '') return descriptorText(settings)
  const read = /^show(?:\s+([a-z][a-z0-9-]*))?$/.exec(args)
  if (read !== null) return descriptorText(settings, read[1])
  const mutation = /^(set|unset)\s+([a-z][a-z0-9-]*)\s+([^\s]+)(?:\s+([\s\S]+))?$/.exec(args)
  if (mutation === null) return 'Usage: /settings [show [namespace] | set <namespace> <path> <json> | unset <namespace> <path>]'
  const [, action, ns, rawPath, rawValue] = mutation
  if (action === undefined || ns === undefined || rawPath === undefined) throw new Error('invalid settings operation')
  const descriptor = settings.describe({ redactSecrets: true }).find(candidate => candidate.ns === ns)
  if (descriptor === undefined) return `Unknown settings namespace: ${ns}`
  const path = rawPath.split('.').filter(Boolean)
  if (path.length === 0) return 'Settings path must not be empty.'
  if (action === 'set' && rawValue === undefined) return 'Usage: /settings set <namespace> <path> <json>'
  const operation = action === 'set'
    ? { op: 'set', path, value: JSON.parse(rawValue as string) }
    : { op: 'unset', path }
  await settings.mutate(ns as never, [operation], descriptor.revision)
  return descriptorText(settings, ns)
}

export async function credentialsOperation(
  credentials: CredentialsLike,
  input: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const match = /^(status|set|unset)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+([A-Za-z_][A-Za-z0-9_]*))?$/.exec(input.trim())
  if (match === null) return 'Usage: /credentials status <ref> | set <ref> <source-env> | unset <ref>'
  const [, action, ref, source] = match
  if (action === 'status') return JSON.stringify({ ref, ...await credentials.describe(ref as never) }, null, 2)
  if (action === 'unset') {
    await credentials.unset(ref as never)
    return `Credential ${ref} removed from the writable store.`
  }
  if (source === undefined) return 'Usage: /credentials set <ref> <source-env>'
  const value = env[source]
  if (value === undefined || value === '') return `Source environment variable ${source} is empty or unset.`
  await credentials.set(ref as never, value)
  return `Credential ${ref} saved from ${source}; the value was not displayed.`
}

function feedbackFailure(result: { readonly ok: false; readonly error: unknown }): string {
  return `Feedback rejected: ${JSON.stringify(result.error)}`
}

export async function messageFeedbackOperation(
  feedback: MessageFeedbackLike,
  sessionId: string,
  input: string,
): Promise<string> {
  const args = input.trim()
  const current = await feedback.list({ sessionId: sessionId as never })
  if (!current.ok) return feedbackFailure(current)
  if (args === '' || args === 'list') {
    return current.value.items.length === 0 ? 'No message feedback.' : JSON.stringify(current.value.items, null, 2)
  }
  const put = /^put\s+(\S+)\s+(positive|negative)(?:\s+([\s\S]+))?$/.exec(args)
  if (put !== null) {
    const [, messageId, rating, note] = put
    const existing = current.value.items.find(item => item.messageId === messageId)
    const result = await feedback.put({
      sessionId: sessionId as never,
      messageId: messageId as never,
      rating: rating as 'positive' | 'negative',
      ...(note === undefined ? {} : { note }),
      ifVersion: (existing?.version ?? null) as never,
    })
    return result.ok ? `Saved ${rating} feedback for ${messageId}.` : feedbackFailure(result)
  }
  const remove = /^delete\s+(\S+)$/.exec(args)
  if (remove !== null) {
    const messageId = remove[1] as string
    const existing = current.value.items.find(item => item.messageId === messageId)
    if (existing === undefined) return `No feedback exists for ${messageId}.`
    const result = await feedback.delete({
      sessionId: sessionId as never,
      messageId: messageId as never,
      ifVersion: existing.version as never,
    })
    return result.ok ? `Deleted feedback for ${messageId}.` : feedbackFailure(result)
  }
  return 'Usage: /message-feedback [list | put <message-id> <positive|negative> [note] | delete <message-id>]'
}

export async function sessionSearchOperation(
  query: { searchSessions(request: unknown): Promise<{ readonly items: readonly { readonly header: { readonly id: string }; readonly bestMatch: { readonly snippet: string } }[] }> },
  text: string,
): Promise<string> {
  const page = await query.searchSessions({
    query: text,
    eventFilters: [
      { kind: 'type', values: ['user/message', 'assistant/message'] },
      { kind: 'surface', values: ['current'] },
    ],
    limit: 20,
  })
  return page.items.length === 0 ? 'No matching sessions.' : page.items
    .map(hit => `${hit.header.id}  ${hit.bestMatch.snippet.replace(/\s+/g, ' ').trim()}`)
    .join('\n')
}
