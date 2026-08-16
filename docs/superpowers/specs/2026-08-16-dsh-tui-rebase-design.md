# Rebase deepseek-harness-cli on dsh-TUI

Date: 2026-08-16
Status: approved design, pending implementation plan

## Objective

Replace the current interactive terminal implementation with the dsh-TUI codebase as the new foundation, then rebrand and adapt it as `deepseek-harness-cli` with the `dsh-cli` executable. Preserve existing users' profiles, sessions, settings, launch commands, and valuable DSH-backed capabilities.

This is a foundation replacement, not a visual refresh. The result must use one interactive TUI architecture rather than layering the new interface over the current controller and renderer.

## Product identity

- npm package: `deepseek-harness-cli`
- executable: `dsh-cli`
- profile: `dsh-cli`
- visible product name: `DeepSeek Harness CLI` or the compact `DSH CLI`
- preferences directory: `~/.dsh-cli`
- environment variable prefix: `DSH_CLI_`
- brand color: DeepSeek mist blue, retaining the whale as the primary terminal mark

User-facing product text, paths, update instructions, package metadata, and documentation must use this identity. The imported MIT copyright and permission notice remains in the distributed license notices.

## Chosen approach

Import dsh-TUI as the new source foundation and adapt it in place. Do not keep dsh-TUI as a nested runtime dependency or maintain two interactive renderers.

Rejected alternatives:

1. Importing only UI components would leave the current controller coupled to a renderer designed around dsh-TUI's Channel and event projection.
2. Maintaining dsh-TUI as a permanent subtree or vendored package would make routine branding and adapter changes conflict with upstream synchronization.

The implementation may retain upstream history through an explicit import commit, but the working tree after migration has one product and one build.

## Target architecture

```text
dsh-cli launcher
  -> dsh-cli Cordis profile
  -> official DSH services and Agent
  -> dsh-adapter
  -> Channel event projection and actions
  -> React TUI screens and components
  -> ported Ink/Yoga renderer
  -> ANSI terminal
```

### Module ownership

| Area | Responsibility |
| --- | --- |
| launcher and profile | Package discovery, profile installation or migration, startup arguments, doctor command, and process restart |
| `dsh-adapter` | The only layer that imports and translates official `@deepseek-ai/*` services |
| Channel | Session log projection, streaming rows, tool association, usage state, and user actions such as submit, steer, resume, rewind, and model selection |
| screens | Keyboard-mode orchestration, dialogs, search, scrolling, and screen-level composition |
| components | Branded presentation of messages, tools, input, status, questions, approvals, goals, and selectors |
| UI facade and renderer | Theme-aware primitives, terminal input, selection, layout, differential output, and terminal cleanup |
| DSH session service | Persistent source of truth for conversation history |

Components must not duplicate DSH session, model, tool, approval, or settings state. New capabilities enter through an existing DSH service or a narrowly defined adapter seam.

## Source migration boundary

The following dsh-TUI areas become the main implementation:

- `src/ink/` and `src/native-ts/` terminal renderer and layout engine
- `src/components/` and `src/screens/` interaction and presentation
- `src/dsh-adapter/` official-service boundary
- themes, i18n, preferences, clipboard, update, workspace, session, and trajectory utilities
- relevant scripts, presets, skills, package verification, and terminal regression tooling

The current interactive controller, current Ink component tree, and current line-mode implementation are not retained as a parallel architecture. Current code is inventoried before replacement. A current capability is reimplemented through the target architecture only when it is still useful and not already covered by the imported foundation.

Generated `lib/` output is rebuilt from clean sources and is never the source of manual edits.

## Interface and interaction design

### Layout

- Pixel whale, product version, model, working directory, and welcome information at the top.
- Virtualized transcript containing user messages, streaming answers, reasoning, tool cards, file diffs, local output, goals, and todos.
- Prompt input below the transcript with multiline editing and completion overlays.
- Responsive status area showing permission mode, model, Git state, session state, context consumption, tokens, and TPS.
- Full information on wide terminals and deliberate progressive reduction on narrow terminals.

### Input and navigation

- `/` command completion and `@` file completion.
- Input history and `Ctrl+R` history search.
- Conversation search with next and previous navigation.
- `Ctrl+O` expands reasoning, tool parameters, and tool output.
- Double `Esc` initiates conversation rewind or fork when the input is empty.
- `Ctrl+C` interrupts an active turn and uses a guarded second press to exit while idle.
- Text, file-path, and image clipboard input where supported.
- Inline mode by default; configurable fullscreen mode with managed scrolling, selection, copy, and terminal restoration.

### Panels and selectors

- Session browser with search, preview, and resume.
- Model, preset, theme, activity, and effort selectors.
- DSH `ask_user_question` panel.
- Tool approval panel.
- Message selection and expansion.
- Markdown, table, code highlighting, tool status, and file diff presentation.

### Theme and language

- DeepSeek mist blue is reserved for brand, focus, selection, and active states.
- Built-in dark, light, ANSI-safe, and automatic themes remain available.
- Custom JSON themes remain supported under the renamed preferences directory.
- Existing Chinese and English interface support is retained and rebranded.

## Compatibility design

### Existing commands and entry points

The following entry points remain valid:

```text
dsh-cli
dsh-cli "task"
dsh-cli --resume <session-id>
dsh-cli doctor
```

Current command names remain as aliases when the new foundation uses a different interaction. Examples include `/sessions` opening or routing to `/resume`, and `/models` opening or routing to `/model`.

DSH-backed commands such as settings, credentials, jobs, plugins, trajectory, message feedback, workflow commands, and registry-contributed commands continue to call real services. The interface must not introduce commands that only pretend an unavailable backend capability exists.

### Profiles and sessions

- Continue using `$DSH_HOME/profiles/dsh-cli`.
- Detect the currently installed managed profile and migrate only project-owned bundle or patch entries.
- Preserve user-added Cordis entries, including MCP servers and other plugins.
- Back up a profile before the first structural migration.
- Record a migration version so migration is idempotent.
- Keep DSH session logs as the conversation source of truth; do not copy them into a private database.
- Do not delete an old profile, session, preference file, or backup automatically.

### Preferences

New TUI-only preferences use `~/.dsh-cli`. Missing preferences use defaults. Invalid preferences produce a concise warning and fall back without preventing startup.

Migration follows read-compatible/write-new behavior. Original data remains recoverable.

### Non-TTY execution

Non-TTY execution keeps a small plain-text reporting path for scripted use and diagnostics. It shares the launcher and official-service adapter but is not a second interactive UI or controller architecture.

## Error handling and terminal safety

- Startup failures identify whether the failing layer is package discovery, profile loading, DSH service construction, session recovery, or renderer startup.
- Profile migration validates the target and backup before changing managed entries.
- Preference corruption falls back to defaults.
- Optional clipboard helpers, terminal capabilities, MCP services, and update checks degrade without crashing the conversation.
- All exit paths restore raw mode, cursor visibility, mouse tracking, synchronized output, focus reporting, and alternate-screen state that the process enabled.
- Active TUI diagnostics go to a controlled stderr/debug path rather than corrupting stdout rendering.
- Security policy remains owned by the active DSH profile. The TUI reports the effective mode but does not imply a sandbox that is not present.

## Implementation stages and gates

### Stage 1: foundation import and identity

Import the source foundation, dependency graph, renderer, screens, adapters, scripts, and required assets. Re-establish the package, executable, profile, visible brand, preferences path, and environment names.

Gate: the package builds and `dsh-cli` starts the new branded interface without a user-visible dsh-TUI product identity.

### Stage 2: compatibility and capability recovery

Add the versioned profile migration, command aliases, launch argument compatibility, DSH-backed current capabilities, and the non-TTY reporting path.

Gate: existing profiles, sessions, launch commands, and supported commands work without destructive migration.

### Stage 3: release hardening

Complete docs, packaging, license notices, terminal regression coverage, screenshot baselines, and published-package checks.

Gate: all automated verification passes and remaining credential-dependent manual checks are explicitly listed.

## Test strategy

Imported behavior brings its existing verification scripts. New or changed branding, paths, migration rules, command aliases, and launcher behavior follow test-first development: add a focused failing test, confirm the expected failure, implement the smallest change, and run the focused test plus the relevant suite.

Required automated coverage includes:

- package metadata, executable, exports, and package contents
- profile detection, backup, idempotent migration, and preservation of user additions
- old command aliases and launch arguments
- preference paths, environment variables, corruption fallback, and theme selection
- wide and narrow layout, resize reflow, inline and fullscreen output
- prompt submission, steering, interruption, rewind, history, and completion
- streaming reasoning, tool cards, long output, message virtualization, goals, and todos
- questions, approvals, session browser, restore, terminal cleanup, and child-process stderr
- branding and stale-path scans with license-notice exemptions

The final verification sequence must include fresh runs of type checking, the full automated suite, production build, smoke checks, package dry-run inspection, screenshot regression, and relevant PTY scripts. A real-model session is run only when usable credentials are already available; otherwise it remains a named manual verification item.

## Success criteria

1. Users continue to install `deepseek-harness-cli` and run `dsh-cli`.
2. The application presents the full imported TUI experience under the DeepSeek Harness CLI identity.
3. Existing DSH profiles, sessions, settings, and supported command workflows remain usable.
4. Migration is idempotent, preserves user changes, creates a recoverable backup, and deletes no user data.
5. There is one interactive Channel/React/renderer architecture.
6. Long conversations use event projection, bounded state, virtualization, and differential terminal output.
7. Distributed files contain the required MIT notice while user-facing product material uses the new identity.
8. The complete verification matrix passes, with credential-dependent gaps reported rather than assumed.

## Scope exclusions

- Rewriting official DSH services or session persistence.
- Maintaining feature parity with the DSH web interface where the terminal has no equivalent interaction.
- Introducing a new sandbox or permission system.
- Automatically deleting legacy data.
- Publishing, pushing, or opening a pull request as part of the implementation unless separately requested.

