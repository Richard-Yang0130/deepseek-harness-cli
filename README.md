# deepseek-harness-cli

A Claude Code-style terminal interface for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It keeps the official `dsh` installation as the runtime and maps terminal actions to the same Harness services used by the Web surface.

![Terminal interface](docs/assets/terminal.png)

中文文档： [README.zh.md](README.zh.md)

## What it provides

- An Ink-based interactive interface with a Claude Code-style welcome box, compact 🐳 mark, quick-start tips, and release notes.
- Type `/` to open a downward command menu; use arrow keys and Enter to select.
- Type another message while DeepSeek is working to steer the active turn at its next step boundary.
- Live Todo updates are rendered in place with pending, active, and completed states.
- Use `/subagents` to inspect available providers and child sessions.
- Persisted sessions, resume, rename, search, export, workspace switching, image attachments, jobs, skills, subagents, approvals, questions, models, credentials, presets, settings, plugins, MCP tools, statistics, and feedback.
- The official Harness command registry remains authoritative for `/permission`, `/plan`, `/goal`, `/feedback`, workflows, and commands contributed by plugins.
- The original Web interface is untouched. This package creates a separate `dsh-cli` profile.

## Requirements

- macOS, Linux, or Windows terminal
- Node.js 22 or newer
- npm and pnpm available on `PATH`
- `@deepseek-ai/dsh` 0.1.0-rc.6 or a later compatible 0.1 release

## Install

Install the official runtime first, then this terminal package:

```bash
npm install -g @deepseek-ai/dsh
npm install -g https://github.com/Richard-Yang0130/deepseek-harness-cli/archive/refs/heads/main.tar.gz
```

Start it from the project directory you want the agent to work in:

```bash
dsh-cli
```

The first launch creates an isolated `dsh-cli` profile and installs this bundle into it. Later launches reuse that profile. Your existing Web profile and `dsh web` continue to work normally.

Start with a prompt or resume a session:

```bash
dsh-cli "inspect this repository"
dsh-cli --resume <session-id>
dsh-cli doctor
```

`doctor` checks the `dsh` version and profile state without opening the interface.

## Everyday use

- Enter sends a prompt.
- Enter during a running turn steers that turn instead of starting a second turn.
- `/` opens the command menu below the composer.
- Up/Down selects a command; Enter completes it; Esc closes the menu.
- `/subagents` lists providers and child-session state.
- Ctrl+C cancels the running turn. Press Ctrl+C while idle to exit.

Common commands:

```text
/new
/sessions [query]
/resume <session-id>
/models
/model <provider> <model>
/presets [list|read|copy|remove]
/preset <preset-id>
/settings [show|set|unset]
/credentials <status|set|unset> ...
/workspace <path>
/attach <image-path>
/jobs
/stats
/message-feedback ...
/trajectory
/export [path]
/plugins
```

Credential values are never printed. To store one, first place it in an environment variable and reference that variable:

```bash
export SOURCE_DEEPSEEK_KEY='your-key'
dsh-cli
```

Then run:

```text
/credentials set DEEPSEEK_API_KEY SOURCE_DEEPSEEK_KEY
```

See [the complete command reference](docs/commands.md), [capability mapping](docs/capability-matrix.md), and [troubleshooting](docs/troubleshooting.md).

## MCP servers

`dsh-cli` can load the official `@deepseek-ai/dsh-mcp-client` shipped with `dsh`. No server is enabled by default because a stdio MCP server is a trusted process that runs outside the agent sandbox.

Launch `dsh-cli` once so the isolated profile exists, exit, then edit:

```text
$DSH_HOME/profiles/dsh-cli/cordis.patch.yml
```

When `DSH_HOME` is unset, the default is `$HOME/.dsh`. The file is a Cordis patch array. For a stdio server, add one instance like this:

```yaml
- insert:
    - id: mcp-example
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: example
        transport: stdio
        command: npx
        args: ['-y', 'your-mcp-server-package']
        env:
          MCP_TOKEN: !!js process.env.MCP_TOKEN
```

For a Streamable HTTP server:

```yaml
- insert:
    - id: mcp-example-http
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: example_http
        transport: streamable-http
        url: http://127.0.0.1:3000/mcp
        headers:
          Authorization: !!js '`Bearer ${process.env.MCP_TOKEN}`'
```

Use a unique `serverName` matching `[A-Za-z0-9_-]{1,32}` for every live server. Restart `dsh-cli` after editing the patch; this profile disables hot reload. Discovered tools become native Harness tools named `mcp__<serverName>__<tool>`. `/plugins` confirms that the client instance loaded, but there is currently no `/mcp` command or terminal server-health view. MCP calls without a specialized presenter appear with their raw tool name and JSON arguments.

Keep credentials in environment variables as shown above—do not write secret values directly into the YAML file. If initial connection fails, the default `failOnStartupError: false` allows the CLI to start without that server's tools.

## How it works

`dsh-cli` is a small launcher plus a terminal-only Cordis bundle. On first use it runs the equivalent of:

```bash
dsh plugin --profile dsh-cli add file:<installed-package>
dsh --profile dsh-cli
```

The `file:` install is important: it places the bundle inside the profile so its Harness peer imports resolve to the running `dsh` installation. The package does not copy the Web application or fork the Harness runtime.

## Update and uninstall

```bash
npm update -g deepseek-harness-cli
npm uninstall -g deepseek-harness-cli
```

For a GitHub installation, reinstall the archive to update:

```bash
npm install -g https://github.com/Richard-Yang0130/deepseek-harness-cli/archive/refs/heads/main.tar.gz
```

The isolated profile remains under `$DSH_HOME/profiles/dsh-cli` (default `$HOME/.dsh/profiles/dsh-cli`) until you remove it yourself.

## Status

This is an independent community terminal surface, not an official DeepSeek release. It requires the official `dsh` package and follows its public service contracts. See [CHANGELOG.md](CHANGELOG.md) for release details.

## License

MIT
