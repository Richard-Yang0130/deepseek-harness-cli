# Troubleshooting

## `dsh was not found`

Install the official runtime and verify it is on `PATH`:

```bash
npm install -g @deepseek-ai/dsh
dsh --version
```

## `pnpm not found on PATH`

The official `dsh plugin` command uses pnpm to manage isolated profiles:

```bash
npm install -g pnpm
pnpm --version
```

## Unsupported dsh version

Update dsh:

```bash
npm install -g @deepseek-ai/dsh@latest
```

This release supports `>=0.1.0-rc.6 <0.2.0`.

## Profile setup failed

Run:

```bash
dsh-cli doctor
dsh plugin --profile dsh-cli install
```

If the profile was manually edited and is no longer recoverable, move `$DSH_HOME/profiles/dsh-cli` aside and launch `dsh-cli` again to create a clean profile. Moving it preserves the old files for inspection.

## Session search is unavailable

The official base profile keeps ranked SQLite full-text search disabled unless the deployment opts in. `dsh-cli` automatically falls back to `SessionQueryEngine.filterEvents`, which performs a case-insensitive literal scan. Enable the SQLite backend only when ranking and indexed search are required.

## Terminal is too narrow

At 72 columns and wider, `dsh-cli` shows the bordered two-column welcome box. Below 72 columns it switches to a compact `🐳 DeepSeek Harness` header so the command menu and decisions remain usable.

## Resetting a credential

Use `/credentials unset <ref>`. The terminal never reveals the previous value. A read-only environment source can shadow the writable store; `status` reports its source and writability.
