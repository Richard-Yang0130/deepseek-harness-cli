<p align="center">
  <img src="docs/assets/terminal.png" alt="deepseek-harness-cli terminal interface" width="920">
</p>

<h1 align="center">deepseek-harness-cli</h1>

<p align="center">
  A full-featured terminal interface for DeepSeek Harness.<br>
  Keep the official <code>dsh</code> runtime and work through a focused, keyboard-first agent experience.
</p>

<p align="center">
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/deepseek--harness--cli-0.7.2-4D6BFE?style=flat-square" alt="deepseek-harness-cli 0.7.2"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/Node.js-22.19_%7C_24%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 22.19 or 24+"></a>
  <a href="https://github.com/deepseek-ai/deepseek-harness"><img src="https://img.shields.io/badge/dsh-0.1.0--rc.6%2B-1F6FEB?style=flat-square" alt="dsh 0.1.0-rc.6+"></a>
  <img src="https://img.shields.io/badge/interface-terminal_TUI-111827?style=flat-square" alt="Terminal TUI">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0F766E?style=flat-square" alt="MIT License"></a>
</p>

<p align="center">
  <a href="#five-minute-install"><strong>Install</strong></a>
  ·
  <a href="#core-capabilities"><strong>Capabilities</strong></a>
  ·
  <a href="#everyday-workflow"><strong>Workflow</strong></a>
  ·
  <a href="#documentation"><strong>Docs</strong></a>
  ·
  <a href="README.zh.md"><strong>中文</strong></a>
</p>

> [!NOTE]
> The screenshot uses a synthetic demo workspace and contains no personal paths, credentials, or real session data.

> [!IMPORTANT]
> This is an independent community terminal surface, not an official DeepSeek release. It requires the official [`dsh`](https://github.com/deepseek-ai/deepseek-harness) runtime and does not replace or modify `dsh web`.

## What is deepseek-harness-cli?

`deepseek-harness-cli` is a terminal front door for DeepSeek Harness. It maps prompts, sessions, tools, approvals, questions, models, presets, commands, skills, workspaces, and durable events to the official DSH services instead of creating a parallel agent runtime.

The project combines a responsive React terminal renderer with a small DSH adapter and an isolated `dsh-cli` profile. You get a focused Claude Code-style workflow while Harness remains the source of truth for execution and persistence.

## Why a terminal surface?

| Need | Web surface | `deepseek-harness-cli` |
| --- | --- | --- |
| Work inside a repository | Switch between browser and shell | Start directly in the target directory |
| Discover commands | Browser navigation | Type `/` for the live command and skill catalog |
| Reference files | Browser selection | Type `@` for workspace file completion |
| Guide a running turn | Use the Web interaction | Submit another message to steer at the next supported boundary |
| Handle approvals | Click-driven panels | Keyboard-first approval and question panels |
| Inspect long tasks | Web activity views | Streaming reasoning, tool cards, todos, agents, trace, cost, and context status |

The Web interface remains available. The terminal changes presentation, not domain ownership.

## Core capabilities

| Area | Current support |
| --- | --- |
| Terminal experience | Animated whale header, responsive inline/fullscreen layouts, streaming Markdown, reasoning, tool cards, selection, themes, and clean shutdown |
| Input and completion | `/` command completion, `@` file completion, history search, external editor, clipboard images, word movement, multiline input, and in-turn steering |
| Sessions | New, resume, search, rename, rewind, compact, export, persistent titles, and legacy-session compatibility |
| Models and presets | Provider routing, model picker, effort and thinking controls, agent presets, and the bundled `liangshen` preset |
| Tools and agents | Live tool output, approvals, structured questions, todos, child agents, jobs, MCP tools, and dynamic DSH commands and skills |
| Workspaces | Workspace picker, relative attachments, file suggestions, session-aware working directories, and graceful degradation when services are unavailable |
| Observability | Activity line, token cost, context pressure, TPS, trace trajectory, model route, permission mode, and status panels |
| Portability | macOS, Linux, Windows/ConPTY handling, non-TTY plain reporter, CJK width handling, and configurable language and theme |
| Data ownership | Official Harness agent, session, tool, approval, question, command, skill, and workspace services remain authoritative |

## Five-minute install

### Requirements

- Node.js `22.19.x` or Node.js `24+`
- Git, npm, and pnpm available on `PATH`
- Official `@deepseek-ai/dsh` `0.1.0-rc.6` or a compatible `0.1.x` release

Install the currently published npm packages:

```bash
npm install -g @deepseek-ai/dsh deepseek-harness-cli
```

The repository can move ahead of the npm release. To run the current GitHub version shown in this README, build and link the source checkout:

```bash
npm install -g @deepseek-ai/dsh
git clone https://github.com/Richard-Yang0130/deepseek-harness-cli.git
cd deepseek-harness-cli
corepack enable pnpm
pnpm install --frozen-lockfile
npm run build
npm link
```

Enter the workspace you want DeepSeek to work in and launch:

```bash
cd /path/to/project
dsh-cli
```

The launcher checks `dsh`, creates or migrates the isolated `dsh-cli` profile, and preserves managed profile files in a migration backup before bootstrap. Existing sessions, terminal preferences, and the original Web profile are not deleted.

Start with a task, resume the most recent session, resume a specific session, or inspect the installation:

```bash
dsh-cli "run the tests and explain failures"
dsh-cli --resume
dsh-cli --resume <session-id>
dsh-cli doctor
```

## Everyday workflow

1. Start `dsh-cli` inside a repository or pass a workspace path.
2. Enter a task. While DeepSeek is working, submit another message to steer the active turn.
3. Type `/` to browse local actions, Harness commands, workflows, and user-invocable skills.
4. Type `@` to complete a workspace file and attach images from the clipboard or filesystem when needed.
5. Answer approvals and structured questions without leaving the terminal.
6. Use `/resume`, `/rewind`, `/rename`, and `/compact` to manage durable sessions.
7. Inspect `/cost`, `/status`, `/trace`, agents, todos, tool cards, and context pressure during longer work.

### Keyboard essentials

| Key | Action |
| --- | --- |
| Enter | Submit input; while running, steer the active turn |
| `/` | Open the downward command menu |
| `@` | Open workspace file completion |
| Up / Down | Navigate completion and picker rows |
| Esc | Close the active picker or panel |
| Ctrl+C | Cancel the current turn; press again while idle to exit |
| Shift+Tab | Cycle the configured session modes |
| Ctrl+O | Toggle detailed reasoning and tool output |
| Ctrl+T | Open the event trajectory |

## Commands

The live `/` menu is authoritative. Local commands win name collisions; everything else is discovered from the active DSH command and skill registries.

| Purpose | Commands |
| --- | --- |
| Conversation | `/new`, `/resume`, `/rewind`, `/rename`, `/compact`, `/export` |
| Runtime | `/model`, `/effort`, `/thinking`, `/preset`, `/provider` |
| Workspace | `/workspace`, `/permissions`, `/config`, `/doctor` |
| Extensions | `/mcp`, `/hooks`, `/memory`, `/agents` |
| Presentation | `/theme`, `/lang`, `/activity`, `/status`, `/cost`, `/trace` |
| Provider access | `/login`, `/logout` |

Compatibility aliases `/sessions`, `/models`, `/presets`, `/stats`, and `/subagents` route to their canonical implementations. Harness-native commands such as `/permission`, `/plan`, `/goal`, and plugin workflows are passed through dynamically.

See the [complete command reference](docs/commands.md) for arguments and behavior.

## Harness and Web parity

| Capability | Terminal presentation | Source of truth |
| --- | --- | --- |
| Prompt, steer, cancel | Composer, Enter, Ctrl+C | Harness Agent |
| Streaming text and reasoning | Transcript | Durable session events |
| Tools | Live cards and expanded output | Tool registry and session events |
| Sessions | `/new`, `/resume`, `/rewind`, `/rename` | DSH persistence |
| Models and presets | `/model`, `/preset`, `/effort` | Scoped DSH services |
| Commands and skills | `/` completion | Command and skill registries |
| Approvals and questions | Keyboard panels | Official approval and question services |
| Workspace and files | `/workspace`, `@` completion | Workspace registry and filesystem policy |
| Goals, plans, permissions | Dynamic commands and status panels | Durable events and registry handlers |

There is no copied Web business logic or shadow session store. The CLI owns terminal presentation; official Harness services own the work.

## Configuration, plugins, and MCP

| Contract | Value |
| --- | --- |
| Package | `deepseek-harness-cli` |
| Command and profile | `dsh-cli` |
| Terminal preferences | `~/.dsh-cli` |
| DSH profile | `$DSH_HOME/profiles/dsh-cli` or `~/.dsh/profiles/dsh-cli` |
| Environment prefix | `DSH_CLI_` |

The profile is a Cordis composition. Compatible DSH plugins automatically contribute commands to `/`; MCP tools use the official Harness tool registry. Keep MCP credentials in environment variables and never commit plaintext secrets to `cordis.patch.yml`.

Read [configuration](docs/configuration.md), [plugins and MCP](docs/plugins.md), and [themes](docs/themes.md) before changing the profile.

## Security and data boundaries

- The terminal executes tools with the permission mode selected in DSH. Review approval prompts and use the least-permissive preset appropriate for the workspace.
- Provider credentials are managed through the official services and are not echoed by the terminal UI.
- Session logs remain in DSH persistence; terminal-only preferences live under `~/.dsh-cli`.
- Profile migration creates a managed backup before bootstrap and does not delete user sessions or preferences.
- A local or stdio MCP server is a trusted process outside the agent sandbox. Review it before enabling it.
- Do not post credentials, private session logs, or local filesystem details in public issues. Use a private GitHub security advisory for vulnerabilities.

## Architecture

```text
dsh-cli launcher
  -> isolated dsh profile (Cordis composition)
    -> official Harness services and durable session events
      -> DSH adapter / Channel
        -> React terminal screens and components
          -> terminal renderer, input, selection, layout, and cleanup
```

The adapter boundary keeps terminal mechanics replaceable without forking Harness domain services. Read the [architecture notes](docs/architecture.md) and [interaction model](docs/interaction.md) for details.

## Documentation

| Guide | Contents |
| --- | --- |
| [Getting started](docs/getting-started.md) | Launch, profile bootstrap, resume, and paths |
| [Command reference](docs/commands.md) | Canonical commands, aliases, and dynamic entries |
| [Capability mapping](docs/capability-matrix.md) | Terminal presentation mapped to Harness ownership |
| [Configuration](docs/configuration.md) | Preferences, environment variables, and profile contracts |
| [Plugins and MCP](docs/plugins.md) | Cordis plugins, MCP setup, and credential guidance |
| [Themes](docs/themes.md) | Built-in and custom terminal themes |
| [Troubleshooting](docs/troubleshooting.md) | Installation, rendering, profile, and runtime problems |
| [Changelog](CHANGELOG.md) | Release history and current version |

## Update and uninstall

For a source installation, update the clone and rebuild:

```bash
git pull --ff-only
pnpm install --frozen-lockfile
npm run build
npm link
```

Uninstall the global command:

```bash
npm uninstall -g deepseek-harness-cli
```

The isolated DSH profile and `~/.dsh-cli` preferences remain available for a future reinstall unless you remove them yourself.

## Project status

This repository is an independent community terminal interface. It follows public DSH service contracts and keeps the original Web interface intact.

Focused contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), report defects through [GitHub Issues](https://github.com/Richard-Yang0130/deepseek-harness-cli/issues), and report security problems privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
