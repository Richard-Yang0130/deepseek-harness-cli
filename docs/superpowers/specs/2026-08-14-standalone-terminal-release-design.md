# Standalone DeepSeek Harness CLI design

## Objective

`deepseek-harness-cli` is a community-maintained terminal presentation layer for an existing DeepSeek Harness installation. It does not copy or fork the Harness monorepo. The package supplies an Ink interface, a Harness bundle patch, an installer/launcher, tests, documentation, and sanitized screenshots.

The terminal must preserve operational parity with the Web surface: when Web can perform a persistent read, write, or execution through a Harness service, the terminal must expose an equivalent keyboard or command interaction over the same service. Graphical layout, browser transport, and inline bitmap rendering are presentation differences rather than missing operations.

## Distribution boundary

The public repository contains only terminal-owned code and assets:

- the `dsh-cli` launcher and first-run profile bootstrap;
- the TUI bundle and startup provider;
- renderer-neutral controller and capability adapters;
- Ink components and line-mode fallback;
- tests, documentation, screenshots, license, and release metadata.

The package requires a compatible global `dsh` executable. It does not bundle the official CLI or vendor Harness implementation packages. Runtime imports are resolved by the profile installation managed by `dsh plugin`.

The project is an unofficial community integration, published under MIT with upstream attribution. No private identity, local path, session identifier, credential, token, email address, or terminal history may appear in committed files, screenshots, examples, release notes, or package metadata.

## Installation and launch

Users install the official Harness first, then install this repository globally from GitHub. The global package exposes `dsh-cli`.

On launch, the wrapper:

1. locates `dsh` and reports an actionable error if it is absent;
2. reads and validates the installed dsh version against the supported range;
3. checks whether the `tui` profile contains this bundle;
4. when missing or stale, invokes `dsh plugin --profile tui add <installed-package-root>` without shell interpolation;
5. launches `dsh --profile tui` and forwards all remaining arguments and signals;
6. returns the child exit code without swallowing terminal restoration.

`dsh-cli doctor` performs the checks without starting Ink. Repeated launches are idempotent. Upgrade and uninstall commands are documented, and failed profile setup never leaves a partially reported success.

## Terminal design

The header uses a DeepSeek-blue Unicode whale with an 8-row by approximately 34-column footprint. It preserves the official icon's circular body, light belly, raised tail, and facial mark while appearing wider and flatter than the prior 10-row rendering. Product, model, and sanitized working-directory information sit to its right. Narrow layouts hide secondary fields before truncating primary state.

The conversation transcript occupies the growing region. The composer and status line remain at the bottom. `/` opens a downward dynamic menu of live Harness commands, terminal commands, and user-invocable skills. `@` opens a downward list of running child Agents. Menus show at most eight rows and scroll around the selected item.

Approvals, questions, model selection, settings, presets, plugins, jobs, sessions, and other structured operations use keyboard panels. Rich Web cards become expandable terminal text with the same identifiers, status, arguments, outputs, and failure state. Images are attached and persisted through Harness; the terminal shows metadata and paths rather than displaying bitmap pixels.

## Operational capability parity

Every mapped row records its Web source, terminal entry, Harness adapter, read/write/execute effect, verification test, and status. A menu label without a real adapter and passing test is not complete.

The required surface includes:

- prompts, streaming, steering, cancellation, and durable transcript replay;
- dynamic commands and user-invocable skills;
- model selection, provider configuration, and managed credential references;
- permission presets, plan mode, goals, and Agent presets;
- session creation, listing, search, resume, rename, statistics, trajectory, lineage, and export;
- attachments and media persistence;
- tools, approvals, user questions, jobs, workflows, subagents, and produced files;
- session feedback and per-message feedback;
- workspace selection;
- general settings, plugin inventory, plugin configuration, installation, removal, and update.

The Web server and browser UI remain external capabilities launched with `dsh web`; the terminal project neither replaces nor modifies them.

## Architecture

The package is divided into narrow units:

- `launcher`: dsh discovery, version gate, profile bootstrap, argument forwarding, signals, and doctor output;
- `controller`: active Agent lifecycle, immutable view snapshots, cancellation, persistence, and decision providers;
- `catalog`: live command, skill, and subagent discovery with collision rules;
- `adapters`: one module per operational domain, calling public Harness services;
- `presenter`: durable session events to stable terminal transcript nodes;
- `ink`: presentation-only components that dispatch typed intents;
- `line-mode`: non-TTY driver over the same controller;
- `privacy`: sanitization helpers used by fixtures, screenshots, logs, and release checks.

The controller and adapters never import browser components or depend on HTTP transport. Ink components never mutate Harness state directly.

## Error and lifecycle behavior

Unknown slash commands fail locally and never reach the model. Failed model or settings changes retain the previous value. A command removed from the live registry disappears from the open menu on the next update. Approval and question panels remain active until settled or cancelled.

Ctrl+C cancels a running turn and exits while idle. Ctrl+D exits an empty composer. Exit flushes the session, disposes the Agent and registered providers, restores terminal modes, and forwards the appropriate process status. Non-TTY input uses line mode and preserves the same command dispatch and persistence semantics.

## Documentation

English and Simplified Chinese READMEs carry equal detail. They cover:

- project scope, non-official status, and a sanitized screenshot;
- prerequisites, supported platforms, installation, first launch, upgrade, and uninstall;
- quick start, startup arguments, commands, keyboard shortcuts, and examples;
- models, credentials, permissions, workspaces, plugins, skills, sessions, jobs, subagents, workflows, attachments, and export;
- the tested Web-to-terminal capability matrix;
- doctor output, troubleshooting, privacy, security, development, contribution, license, and upstream attribution.

All examples use synthetic identities and paths such as `/workspace/example-project`.

## Verification and release

Tests cover pure state, adapters, controller dispatch, decision panels, launcher bootstrap, idempotent profile setup, version rejection, line mode, and PTY behavior. Contract tests prove each capability reaches its real service. A clean-prefix acceptance test installs the package as a user would and launches it against the current public dsh release.

The screenshot is generated from an actual rendered frame with synthetic cwd, model, session, and transcript data. A repository privacy scan rejects home-directory paths, account names, emails, common credential patterns, and captured session IDs.

Release gates include tests, typecheck, lint, build, package-content inspection, installation acceptance, PTY acceptance, documentation link checks, privacy scan, and a clean Git status. Only then is the public GitHub repository created, `main` pushed, and `v0.1.0` released with sanitized notes and artifacts.
