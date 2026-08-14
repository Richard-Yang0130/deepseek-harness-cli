# Changelog

## 0.1.7 — 2026-08-14

- Reset Ink's tracked output and clear the visible terminal before resize redraws so terminal reflow cannot leave old welcome rails behind.

## 0.1.6 — 2026-08-14

- Subscribe to terminal resize events so the welcome box, composer, and status line redraw with one current column width instead of leaving stale border fragments.

## 0.1.5 — 2026-08-14

- Add a Claude Code-style bordered welcome panel with an embedded title rail and two-column layout.
- Show quick-start guidance and up to three items from the latest changelog section without risking startup failures.
- Replace the terminal whale drawing with a compact whale mark and preserve a narrow-terminal fallback below 72 columns.

## 0.1.4 — 2026-08-14

- Redraw the DeepSeek whale from 34 to 46 terminal columns so it appears visibly longer with real monospace cell proportions.
- Expand the whale header cell to prevent wrapping and use the compact text header below 82 columns.
- Regenerate the public screenshot with synthetic workspace data only.

## 0.1.3 — 2026-08-14

- Audit all 24 terminal commands against the public dsh services and make the dispatch table compile-time exhaustive.
- Preserve and replay the correct transcript when creating, resuming, preset-switching, or workspace-switching sessions.
- Restore durable model selection, session titles, provider-independent session search, real assistant message IDs, and tool-produced file paths.
- Present workflow lifecycle events and generated deliverables in the terminal transcript.
- Make typed `/exit` terminate the Ink interface and prevent duplicate dynamic-command output.
- Resolve relative attachments against the active session workspace and keep failed session switches atomic.
- List real subagent providers and child sessions without advertising an unsupported host-user continuation action.

## 0.1.2 — 2026-08-14

- Ship the compiled runtime and document the GitHub archive installation URL, avoiding npm's dangling global Git-link behavior.

## 0.1.1 — 2026-08-14

- Ship compiled runtime files in Git so archive installations do not depend on development tools.

## 0.1.0 — 2026-08-14

- Initial standalone terminal release.
- Automatic isolated dsh profile bootstrap.
- Claude Code-style Ink shell with a downward `/` menu.
- Eight-row wide DeepSeek whale header and narrow-terminal fallback.
- Operational mapping for sessions, models, credentials, presets, settings, plugins, jobs, attachments, exports, statistics, and feedback.
- Harness-native approvals, questions, commands, skills, tools, subagent catalogs, goals, plans, and workflows.
- Privacy scan and sanitized screenshot asset.
