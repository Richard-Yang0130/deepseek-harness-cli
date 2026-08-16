# dsh-cli Compatibility Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve existing `dsh-cli` profiles, sessions, launch arguments, and command workflows on the imported TUI foundation without destructive migration.

**Architecture:** A small versioned profile migrator runs before bootstrap and backs up project-managed profile files. Pure command and argument adapters translate legacy entry points into the new Channel and screen actions; official DSH services remain the data source.

**Tech Stack:** TypeScript, Node.js filesystem APIs, dsh launcher, DSH command registry, Channel, Vitest or standalone Node verification scripts already selected by the foundation plan.

---

## File map

- Create: `src/utils/profileMigration.ts`
- Create: `src/legacyCommands.ts`
- Create: `scripts/verify-profile-migration.mjs`
- Create: `scripts/verify-legacy-commands.mjs`
- Modify: `bin/dsh-cli.js`
- Modify: `src/screens/Chat.tsx`
- Modify: `src/commands.ts`
- Modify: `src/dsh-adapter/channel.ts`
- Modify: `src/dsh-adapter/plugin.ts`
- Modify: `src/utils/paths.ts`
- Modify: `package.json`

### Task 1: Add idempotent profile backup and migration

**Files:**
- Create: `src/utils/profileMigration.ts`
- Create: `scripts/verify-profile-migration.mjs`
- Modify: `bin/dsh-cli.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing migration verifier**

Create `scripts/verify-profile-migration.mjs` that constructs a temporary profile containing:

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "deepseek-harness-cli",
        "user-mcp-bundle"
      ]
    }
  }
}
```

Import `migrateManagedProfile` from `../lib/types/utils/profileMigration.js`, run it twice with `now: () => new Date('2026-08-16T00:00:00.000Z')`, and assert:

```js
assert.equal(first.migrated, true)
assert.equal(second.migrated, false)
assert.deepEqual(updated.dsh.profile.bundles, [
  '@deepseek-ai/dsh-base',
  'deepseek-harness-cli',
  'user-mcp-bundle',
])
assert.equal(await access(backupManifest).then(() => true), true)
```

- [ ] **Step 2: Confirm the verifier fails because the module is absent**

Run:

```bash
pnpm build && node scripts/verify-profile-migration.mjs
```

Expected: FAIL resolving `profileMigration.js`.

- [ ] **Step 3: Implement the migration contract**

Create `src/utils/profileMigration.ts` with this public API:

```ts
export const PROFILE_MIGRATION_VERSION = 1

export interface ProfileMigrationResult {
  readonly migrated: boolean
  readonly backupDir?: string
}

export interface ProfileMigrationOptions {
  readonly profileDir: string
  readonly now?: () => Date
}

export async function migrateManagedProfile(
  options: ProfileMigrationOptions,
): Promise<ProfileMigrationResult>
```

The function reads `.deepseek-harness-cli-migration.json`. When its version is at least 1, return `{ migrated: false }`. Otherwise create `.deepseek-harness-cli-backups/migration-v1/`, copy existing `package.json` and `cordis.patch.yml` into it when present, then atomically write:

```json
{
  "version": 1,
  "migratedAt": "2026-08-16T00:00:00.000Z"
}
```

Do not rewrite the profile manifest and do not delete any file. The subsequent `dsh plugin add` remains responsible for project-managed package entries.

- [ ] **Step 4: Call migration before launcher bootstrap**

In `bin/dsh-cli.js`, resolve `$DSH_HOME/profiles/dsh-cli`, call `migrateManagedProfile({ profileDir })`, print one concise line only when `migrated` is true, and then continue with version/bootstrap logic.

- [ ] **Step 5: Verify migration and build**

```bash
pnpm build
node scripts/verify-profile-migration.mjs
```

Expected: PASS, one backup directory, unchanged user bundle, and no second migration.

- [ ] **Step 6: Commit profile migration**

```bash
git add src/utils/profileMigration.ts bin/dsh-cli.js scripts/verify-profile-migration.mjs package.json
git commit -m "feat: back up dsh-cli profile before migration"
```

### Task 2: Preserve resume and launch argument behavior

**Files:**
- Create: `scripts/verify-launcher-compat.mjs`
- Modify: `bin/dsh-cli.js`
- Modify: `src/sessionHistory.ts`
- Modify: `src/dsh-adapter/plugin.ts`

- [ ] **Step 1: Write launcher compatibility cases**

The verifier launches `bin/dsh-cli.js` with a temporary fake `dsh` executable and asserts these transformations:

```text
dsh-cli --resume session-1 -> DSH_CLI_RESUME_SESSION=session-1
dsh-cli --continue         -> reads ~/.dsh-cli/resume.txt
dsh-cli -c                 -> reads ~/.dsh-cli/resume.txt
dsh-cli "run tests"        -> positional prompt reaches cmdlineArgs
dsh-cli /absolute/path     -> DSH_CLI_WORKSPACE_TARGET=/absolute/path
```

The fake executable records argv and the selected environment variables as JSON.

- [ ] **Step 2: Run and observe failures for any renamed contract not yet handled**

Run `node scripts/verify-launcher-compat.mjs`.

Expected: at least one FAIL until all `DSH_CLI_*` contracts and `.dsh-cli/resume.txt` are wired.

- [ ] **Step 3: Implement exact launcher precedence**

Use this order:

```text
explicit --resume=<id> or --resume <id>
  > .dsh-cli/resume.txt
  > .dsh-tui/resume.txt
  > .dsh-cc/resume.txt
```

Write only `DSH_CLI_RESUME_SESSION` for the new runtime. Legacy environment values remain read-only fallbacks inside the plugin for one migration cycle.

- [ ] **Step 4: Verify launcher behavior**

```bash
pnpm build
node scripts/verify-launcher-compat.mjs
node scripts/verify-launcher.mjs
```

Expected: all launcher cases pass.

- [ ] **Step 5: Commit launcher compatibility**

```bash
git add bin/dsh-cli.js src/sessionHistory.ts src/dsh-adapter/plugin.ts scripts/verify-launcher-compat.mjs
git commit -m "feat: preserve dsh-cli resume and launch arguments"
```

### Task 3: Add legacy command aliases without fake capabilities

**Files:**
- Create: `src/legacyCommands.ts`
- Create: `scripts/verify-legacy-commands.mjs`
- Modify: `src/screens/Chat.tsx`
- Modify: `src/commands.ts`

- [ ] **Step 1: Write the failing pure alias verifier**

Assert this exact table:

```ts
const LEGACY_COMMAND_ALIASES = {
  sessions: 'resume',
  models: 'model',
  presets: 'preset',
  stats: 'cost',
  subagents: 'agents',
} as const
```

Also assert `rewriteLegacyCommand('/sessions bug fix') === '/resume bug fix'`, unknown commands remain unchanged, and commands originating from the DSH registry are not rewritten unless their name appears in the table.

- [ ] **Step 2: Confirm the verifier fails because the alias module is absent**

Run:

```bash
pnpm build && node scripts/verify-legacy-commands.mjs
```

Expected: FAIL resolving `legacyCommands.js`.

- [ ] **Step 3: Implement the pure alias module**

Create `src/legacyCommands.ts`:

```ts
export const LEGACY_COMMAND_ALIASES = {
  sessions: 'resume',
  models: 'model',
  presets: 'preset',
  stats: 'cost',
  subagents: 'agents',
} as const

export function rewriteLegacyCommand(input: string): string {
  const match = /^\/([^\s]+)(.*)$/u.exec(input)
  if (match === null) return input
  const replacement = LEGACY_COMMAND_ALIASES[
    match[1] as keyof typeof LEGACY_COMMAND_ALIASES
  ]
  return replacement === undefined ? input : `/${replacement}${match[2]}`
}
```

- [ ] **Step 4: Apply aliases at the single command-dispatch boundary**

In `Chat.tsx`, call `rewriteLegacyCommand` immediately before parsing and dispatching slash commands. Do not add duplicate menu implementations. Add alias menu entries whose descriptions explicitly name the canonical command.

- [ ] **Step 5: Verify aliases and existing command scripts**

```bash
pnpm build
node scripts/verify-legacy-commands.mjs
pnpm smoke
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit command compatibility**

```bash
git add src/legacyCommands.ts src/screens/Chat.tsx src/commands.ts scripts/verify-legacy-commands.mjs
git commit -m "feat: preserve legacy dsh-cli command names"
```

### Task 4: Reconnect existing DSH-backed dynamic commands

**Files:**
- Modify: `src/dsh-adapter/command-trees.ts`
- Modify: `src/dsh-adapter/channel.ts`
- Modify: `src/screens/Chat.tsx`
- Create: `scripts/verify-dynamic-command-pass-through.mjs`

- [ ] **Step 1: Write a fake-registry pass-through verifier**

Provide commands named `settings`, `credentials`, `jobs`, `plugins`, `trajectory`, `message-feedback`, `permission`, `plan`, and `goal`. Assert the TUI menu exposes every registry entry and dispatches the original raw input and arguments to the registry executor.

- [ ] **Step 2: Confirm missing commands or altered arguments fail**

Run `pnpm build && node scripts/verify-dynamic-command-pass-through.mjs`.

Expected: FAIL identifying any command not surfaced or any rewritten registry input.

- [ ] **Step 3: Keep registry commands data-driven**

At the adapter boundary, normalize registry records into the existing command option type while retaining:

```ts
{
  name,
  description,
  source: 'registry',
  acceptsArguments,
  execute: rawInput => registry.execute(rawInput),
}
```

Do not create local success output for a registry execution that returned an error or unavailable result.

- [ ] **Step 4: Verify pass-through and smoke behavior**

```bash
pnpm build
node scripts/verify-dynamic-command-pass-through.mjs
pnpm smoke
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit dynamic command support**

```bash
git add src/dsh-adapter/command-trees.ts src/dsh-adapter/channel.ts src/screens/Chat.tsx scripts/verify-dynamic-command-pass-through.mjs
git commit -m "feat: expose dsh registry commands in the tui"
```

### Task 5: Add a non-TTY plain reporter

**Files:**
- Create: `src/dsh-adapter/plainReporter.ts`
- Create: `scripts/verify-plain-reporter.mjs`
- Modify: `src/dsh-adapter/plugin.ts`

- [ ] **Step 1: Write the failing reporter verifier**

Feed a fake Channel these rows in sequence: user text, reasoning, assistant token chunks, tool start, tool result, assistant completion. Assert stdout contains user, assistant, and tool result text exactly once, excludes reasoning by default, and contains no ANSI escape sequences.

- [ ] **Step 2: Confirm the reporter module is absent**

Run `pnpm build && node scripts/verify-plain-reporter.mjs`.

Expected: FAIL resolving `plainReporter.js`.

- [ ] **Step 3: Implement the reporter boundary**

Expose:

```ts
export interface PlainReporterOptions {
  readonly write: (text: string) => void
  readonly showReasoning?: boolean
}

export function attachPlainReporter(
  channel: Channel,
  options: PlainReporterOptions,
): () => void
```

Track the last emitted text length per row id and write only appended content. Render tool completion as `Tool <name>: <summary>`. Return an unsubscribe function.

- [ ] **Step 4: Select reporter only when stdin or stdout is not a TTY**

In the plugin startup path:

```ts
const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY)
if (!interactive) {
  const detach = attachPlainReporter(channel, { write: text => process.stdout.write(text) })
  ctx.effect(() => detach)
  return
}
```

Do not mount React or enable terminal modes on this branch.

- [ ] **Step 5: Verify plain and interactive startup paths**

```bash
pnpm build
node scripts/verify-plain-reporter.mjs
pnpm smoke
```

Expected: reporter verification and interactive smoke both pass.

- [ ] **Step 6: Commit non-TTY support**

```bash
git add src/dsh-adapter/plainReporter.ts src/dsh-adapter/plugin.ts scripts/verify-plain-reporter.mjs
git commit -m "feat: preserve non-tty dsh-cli output"
```

### Task 6: Verify compatibility completion

**Files:**
- Modify only for defects exposed by this gate.

- [ ] **Step 1: Run compatibility verification**

```bash
pnpm build
node scripts/verify-profile-migration.mjs
node scripts/verify-launcher-compat.mjs
node scripts/verify-legacy-commands.mjs
node scripts/verify-dynamic-command-pass-through.mjs
node scripts/verify-plain-reporter.mjs
pnpm smoke
```

Expected: all commands exit 0.

- [ ] **Step 2: Check the migration safety invariants**

Inspect verifier fixtures and confirm no command deletes a profile, session, preference directory, or backup. Run:

```bash
rg -n 'rmSync|rm\(|unlink|rmdir' src/utils/profileMigration.ts bin/dsh-cli.js
```

Expected: no matches in migration code.

- [ ] **Step 3: Confirm a clean stage**

```bash
git status --short
git log --oneline --max-count=6
```

Expected: clean worktree with five focused compatibility commits.
