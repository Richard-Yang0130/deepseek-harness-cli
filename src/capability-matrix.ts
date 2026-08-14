export interface TuiCapability {
  readonly id: string
  readonly entry: string
  readonly adapter: string
}

/** Traceability map from the shipped Harness surface to its terminal entry. */
export const TUI_CAPABILITIES: readonly TuiCapability[] = [
  { id: 'prompt', entry: 'composer', adapter: 'Agent.followup' },
  { id: 'cancel', entry: 'Ctrl+C', adapter: 'Agent.cancel' },
  { id: 'commands', entry: '/ dynamic menu', adapter: 'CommandRuntime.list/execute' },
  { id: 'model', entry: '/model', adapter: 'installModelSelection' },
  { id: 'permission', entry: '/permission and decision panel', adapter: 'approval/request' },
  { id: 'plan', entry: '/plan', adapter: 'Harness command registry' },
  { id: 'goal', entry: '/goal', adapter: 'Harness command registry' },
  { id: 'sessions', entry: '/new /sessions /resume', adapter: 'agents and sessionPersistence' },
  { id: 'rename', entry: '/rename', adapter: 'sessionTitle.rename' },
  { id: 'export', entry: '/export', adapter: 'sessionQuery and attachment storage' },
  { id: 'attachments', entry: '/attach', adapter: 'attachments.save' },
  { id: 'skills', entry: '/skills and /<skill>', adapter: 'skill registry and Agent prompt injection' },
  { id: 'subagents', entry: '/subagents and @ menu', adapter: 'subagents.list/listChildren' },
  { id: 'tools', entry: 'model tool calls', adapter: 'Agent tool runtime' },
  { id: 'approvals', entry: 'approval panel', adapter: 'approval/request' },
  { id: 'questions', entry: 'question panel', adapter: 'userQuestions provider' },
  { id: 'jobs', entry: '/jobs /job-read /job-kill', adapter: 'jobs gateway' },
  { id: 'workflows', entry: '/ workflow commands', adapter: 'Harness command registry' },
  { id: 'deliverables', entry: 'transcript events', adapter: 'session/event presenter' },
  { id: 'trajectory', entry: '/trajectory', adapter: 'Session.events' },
  { id: 'workspace', entry: '/workspace', adapter: 'workspaceRegistry' },
  { id: 'settings', entry: '/settings', adapter: 'settings.describe' },
  { id: 'plugins', entry: '/plugins', adapter: 'pluginInventory.list' },
  { id: 'feedback', entry: '/feedback', adapter: 'Harness command registry' },
]
