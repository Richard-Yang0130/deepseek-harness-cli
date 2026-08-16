# Getting started

Install the official runtime and terminal package, then start in a workspace:

```bash
corepack enable pnpm
npm install -g @deepseek-ai/dsh deepseek-harness-cli
cd /path/to/project
dsh-cli
```

The launcher probes `dsh`, creates the `dsh-cli` profile when needed, and pins its plugin to the launcher's package version. On an existing profile it first copies `package.json` and `cordis.patch.yml` to `.deepseek-harness-cli-backups/migration-v1/`; it does not rewrite or delete user files.

Start with a task, choose the most recent session, or inspect the installation:

```bash
dsh-cli "run the tests and explain failures"
dsh-cli --resume
dsh-cli doctor
```

An explicit `--resume <session-id>` wins over resume markers. A path argument selects the initial workspace; other positional text becomes the initial prompt.

Preferences are written to `~/.dsh-cli`. The DSH profile lives at `$DSH_HOME/profiles/dsh-cli` or `~/.dsh/profiles/dsh-cli`.
