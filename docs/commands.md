# Command reference

Type `/` to open the live menu. The menu merges three sources with deterministic precedence: Harness commands, terminal commands, then user-invocable skills. This ensures an official or plugin-provided Harness command cannot be shadowed by a local alias.

## Session and workspace

- `/new` — flush the current session and create a persisted session in the same directory.
- `/sessions` — list live and persisted sessions with their durable titles, newest first.
- `/sessions <query>` — search current user and assistant messages through `SessionQueryEngine`. It uses ranked full-text search when enabled and automatically falls back to the provider-independent literal scan in the default `openAt: never` deployment.
- `/resume <session-id>` — resume a persisted session and replay its visible history.
- `/rename <title>` — append a durable user title through `SessionTitleService`.
- `/workspace <path>` — resolve an existing directory as a workspace, start a session there, and attach the session.
- `/trajectory` — list durable event sequence numbers and types.
- `/stats` — show the `sessionStats` projection: turns, steps, model/tool time, TTFT, and decode figures.
- `/export [path]` — write a ZIP containing this session, descendants, and referenced images.

## Models, credentials, and presets

- `/models` — list active providers and each adapter's advertised model catalog.
- `/model` — show the current model.
- `/model <provider> <model>` — validate exact model metadata and update this session's selection.
- `/credentials status <ref>` — show configured/source/writable facts, never the value.
- `/credentials set <ref> <source-env>` — store the non-empty value read from an environment variable.
- `/credentials unset <ref>` — remove the writable credential value.
- `/presets` or `/presets list` — list system and user presets.
- `/presets read <id>` — print a preset composition.
- `/presets copy <from> <id> [name]` — copy a preset to the user-authorable root.
- `/presets remove <id>` — remove a user preset; system presets reject.
- `/preset <id>` — start a new session mounted on that preset.

## Settings and plugins

- `/settings` — show every registered namespace with secrets redacted.
- `/settings show <namespace>` — show one namespace.
- `/settings set <namespace> <dot.path> <json>` — set one path using revision-checked `mutate`.
- `/settings unset <namespace> <dot.path>` — remove one user-layer override.
- `/plugins` — show Loader entry id, module name, enabled state, and fiber phase.

Plugin configuration is represented by its registered settings namespace, so `/settings` is also the terminal editing surface for plugin configuration.

### MCP client instances

There is no `/mcp` command. Add one `@deepseek-ai/dsh-mcp-client` instance per server to `$DSH_HOME/profiles/dsh-cli/cordis.patch.yml`, then restart `dsh-cli`. The profile disables hot reload. A minimal patch has this shape:

```yaml
- insert:
    - id: mcp-example
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: example
        transport: stdio
        command: npx
        args: ['-y', 'your-mcp-server-package']
```

The client also supports `transport: streamable-http` with `url` and optional `headers`. Put credentials in environment variables and reference them with `!!js process.env.NAME`; do not store plaintext secrets in the patch. Every server needs a unique `serverName` matching `[A-Za-z0-9_-]{1,32}`. Its discovered tools are registered as `mcp__<serverName>__<tool>`.

`/plugins` shows whether the MCP client instance loaded, but it does not report connection health or discovered tools. Calls without a specialized presenter render the raw MCP tool name and JSON arguments. Initial connection failure does not block startup by default (`failOnStartupError: false`).

## Interaction and execution

Plain text submitted while a turn is running steers the active agent at its next step boundary. Slash commands are intentionally unavailable until the turn becomes idle; Ctrl+C still cancels the active turn.

Durable `todo/write` updates render as one in-place list: `○` pending, `●` in progress, and `✓` completed.

- `/attach <path>` — stage a PNG, JPEG, WebP, or GIF for the next prompt.
- `/skills` — list user-invocable skills; discovered skill commands also appear in `/`.
- `/subagents` — list subagent providers and durable child sessions with mode and activity.
- `/jobs`, `/job-read <id>`, `/job-kill <id>` — operate on background jobs.
- `/message-feedback list` — list message feedback for the active session.
- `/message-feedback put <message-id> <positive|negative> [note]` — compare-and-set feedback.
- `/message-feedback delete <message-id>` — compare-and-delete feedback.
- `/help` — show the compact built-in reference.
- `/exit` — flush and exit.

Commands such as `/permission`, `/plan`, `/goal`, `/feedback`, `/compact`, and workflow commands are discovered from the active Harness command registry. Their precise availability follows the selected agent preset and installed plugins.
