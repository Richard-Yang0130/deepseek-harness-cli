# Command reference

Type `/` to open the live catalog. Local commands win name collisions; all other entries come from the active DSH command and skill registries.

## Conversation and session

- `/new` starts a durable conversation.
- `/resume` opens the session browser; `/resume <id>` selects a session.
- `/rewind` branches from an earlier message.
- `/rename <title>` stores a durable title.
- `/export` writes a Markdown transcript in the workspace.
- `/compact` requests Harness compaction.
- `/cost` shows token usage; `/status` shows the active session and route.

## Workspace and runtime

- `/workspace` resumes, renames, or opens a workspace target.
- `/model`, `/effort`, and `/thinking` control model presentation and reasoning choices supported by the route.
- `/preset` selects an agent preset; `/activity`, `/theme`, and `/lang` change terminal preferences.
- `/provider`, `/login`, and `/logout` manage provider configuration without echoing secrets.
- `/permissions`, `/mcp`, `/hooks`, `/memory`, `/doctor`, and `/config` show the mounted environment.
- `/agents` shows child agents. `/trace` and Ctrl+T expose the event trajectory.
- `/update` updates the package mounted by the current profile and resumes the session.

## Compatibility aliases

`/sessions`, `/models`, `/presets`, `/stats`, and `/subagents` map to `/resume`, `/model`, `/preset`, `/cost`, and `/agents`. They invoke the canonical implementation and keep their arguments.

## Dynamic commands and skills

Commands such as `/permission`, `/plan`, `/goal`, and any plugin-contributed workflow are discovered at runtime. Their availability follows the selected profile and preset. User-invocable skills also appear in completion and are submitted through the Harness skill path.
