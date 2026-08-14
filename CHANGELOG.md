# Changelog

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
