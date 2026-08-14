# Web-to-terminal capability mapping

Both surfaces call the same underlying service; only presentation changes.

| Capability | Terminal entry | Harness service | Effect |
|---|---|---|---|
| Prompt / cancel | composer / Ctrl+C | `Agent.followup` / `Agent.cancel` | execute |
| Slash commands | `/` menu | `CommandRuntime.list/execute` | execute |
| Models | `/models`, `/model` | `LlmRuntime`, `ModelSelectionRef` | read/write |
| Credentials | `/credentials` | `CredentialProvider` | read/write |
| Permission | `/permission`, decision panel | `PermissionPresetService`, approval events | write |
| Plan / goal | dynamic commands | `CommandRuntime` | write |
| Agent presets | `/presets`, `/preset` | `AgentPresets` | read/write |
| Sessions | `/new`, `/sessions`, `/resume` | `AgentFactory`, `SessionPersistence` | read/write |
| Session search | `/sessions <query>` | `SessionQueryEngine.searchSessions` | read |
| Session statistics | `/stats` | `SessionProjectionRegistry` | read |
| Rename / export | `/rename`, `/export` | `SessionTitleService`, query + attachment storage | read/write |
| Attachments | `/attach` | `AttachmentStore` | write |
| Skills / subagents | `/skills`, `@`, `/subagents` | scoped registries | execute |
| Tools / workflow / deliverables | transcript cards + dynamic commands | agent runtime and durable events | execute/read |
| Approvals / questions | keyboard decision panels | approval and user-question providers | write |
| Jobs | `/jobs`, `/job-read`, `/job-kill` | `JobsService` | read/write |
| Trajectory | `/trajectory` | `Session.events` | read |
| Workspace | `/workspace` | `WorkspaceRegistry` | write |
| Settings / plugins | `/settings`, `/plugins` | `SettingsProvider`, `PluginInventoryGateway` | read/write |
| Session feedback | `/feedback` | Harness command registry | write |
| Message feedback | `/message-feedback` | `MessageFeedbackService` | read/write |

Browser-only visual mechanics—mouse navigation, modal placement, and download dialogs—are replaced by terminal navigation, text panels, and filesystem paths. They do not introduce separate domain operations.

The executable source of truth is `src/capability-matrix.ts`; tests require every row to name an entry, service, effect, and verification id.
