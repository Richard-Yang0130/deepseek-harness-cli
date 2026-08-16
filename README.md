# DeepSeek Harness CLI

`deepseek-harness-cli` is a full terminal interface for DeepSeek Harness. It combines the official Harness agent runtime with a responsive Ink UI: an animated whale header, streaming answers and tool cards, durable sessions, approvals, questions, command completion, themes, and both inline and fullscreen layouts.

![DeepSeek Harness CLI terminal](docs/assets/terminal.png)

中文说明：[README.zh.md](README.zh.md)

## Install

Requirements: Node.js 22.19 or newer, npm, and pnpm (`corepack enable pnpm` is sufficient).

```bash
npm install -g @deepseek-ai/dsh deepseek-harness-cli
```

Run it in a project directory:

```bash
dsh-cli
dsh-cli "inspect this repository"
dsh-cli --resume
dsh-cli doctor
```

The first launch creates the isolated `dsh-cli` profile and installs the matching package version. Existing profiles are backed up before a managed migration; source profiles, sessions, and preferences are never deleted automatically.

## Terminal experience

- Animated DeepSeek whale and compact `DSH CLI` wordmark with narrow-terminal fallback.
- Streaming assistant text, optional reasoning, live tool cards, elapsed activity, token/context pressure, and TPS status.
- `/` command menu plus command-tree completion; `@` file completion and pasted image support.
- Durable resume, rename, rewind, export, transcript search, and workspace switching.
- Keyboard approval and structured-question panels with fail-closed Harness semantics.
- Clipboard copy, mouse selection in fullscreen mode, inline mode for ordinary scrollback, and CJK-aware layout.
- Built-in light, dark, ANSI, and user-defined themes.
- Plain, ANSI-free output when stdin or stdout is not a TTY.

The DSH command registry remains authoritative. Commands contributed by the active profile, including `/permission`, `/plan`, and `/goal`, appear dynamically and receive the original arguments unchanged.

## Everyday controls

| Input | Action |
|---|---|
| Enter | Submit a prompt; while a turn runs, steer it at the next step boundary |
| Ctrl+C | Cancel the active turn; press again while idle to exit |
| `/` | Open command completion |
| `@` | Complete workspace files |
| Shift+Tab | Cycle the configured session modes |
| Ctrl+O | Toggle detailed reasoning/tool output |
| Ctrl+T | Toggle the trajectory panel |
| Esc | Close the active picker or decision panel |

Useful commands include `/new`, `/resume`, `/rewind`, `/rename`, `/export`, `/workspace`, `/model`, `/preset`, `/theme`, `/lang`, `/provider`, `/permissions`, `/mcp`, `/agents`, `/cost`, `/doctor`, and `/help`.

Compatibility aliases are preserved at the dispatch boundary:

| Previous command | Current command |
|---|---|
| `/sessions` | `/resume` |
| `/models` | `/model` |
| `/presets` | `/preset` |
| `/stats` | `/cost` |
| `/subagents` | `/agents` |

## Runtime contracts

- npm package: `deepseek-harness-cli`
- executable: `dsh-cli`
- DSH profile: `dsh-cli`
- preferences: `~/.dsh-cli`
- environment prefix: `DSH_CLI_`
- profile patch: `~/.dsh/profiles/dsh-cli/cordis.patch.yml` (or `$DSH_HOME/profiles/dsh-cli/cordis.patch.yml`)

Common settings:

```bash
export DSH_CLI_LANG=en
export DSH_CLI_THEME=dark
export DSH_CLI_WORKSPACE_TARGET=/path/to/project
```

The launcher reads older preference locations and renamed environment variables as migration fallbacks, but all new writes use the contracts above.

## Configuration and extensions

The profile is a Cordis composition over official DSH services. Add MCP clients or other compatible plugins to the profile patch, then restart `dsh-cli`. Secrets should be referenced through environment variables, never embedded in YAML.

See:

- [Getting started](docs/getting-started.md)
- [Configuration](docs/configuration.md)
- [Interaction model](docs/interaction.md)
- [Command reference](docs/commands.md)
- [Themes](docs/themes.md)
- [Plugins and MCP](docs/plugins.md)
- [Architecture](docs/architecture.md)
- [Troubleshooting](docs/troubleshooting.md)

## Update and uninstall

Use `/update` from an installed profile, or update both global packages:

```bash
npm install -g @deepseek-ai/dsh@latest deepseek-harness-cli@latest
npm uninstall -g deepseek-harness-cli
```

Uninstalling the package does not delete `~/.dsh-cli` or `$DSH_HOME/profiles/dsh-cli`.

## Project status

This is an independent community terminal interface, not an official DeepSeek release. It uses the public DeepSeek Harness service contracts and is distributed under the MIT License.
