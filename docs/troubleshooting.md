# Troubleshooting

## `dsh CLI not found`

```bash
npm install -g @deepseek-ai/dsh
dsh --version
```

## `pnpm` is unavailable

The official profile manager delegates installs to pnpm:

```bash
corepack enable pnpm
pnpm --version
```

## Profile version mismatch

Align the installed profile with the global launcher:

```bash
dsh plugin --profile dsh-cli add deepseek-harness-cli@latest
```

The launcher refuses a profile whose minor version is older because its patch may reference exports that the installed package lacks. A newer profile prints a warning but can continue.

## Inspect the installation

```bash
dsh-cli doctor
```

The active package is `deepseek-harness-cli`, preferences are `~/.dsh-cli`, and configuration variables use `DSH_CLI_`.

## Theme or layout problems

Try `DSH_CLI_THEME=dark-ansi dsh-cli` for terminals without true-color support. The whale hides automatically in narrow layouts; command and decision panels remain available.

## Piped output contains terminal escapes

Non-TTY startup selects the plain reporter and should emit no ANSI. Run `pnpm verify:plain-reporter` from a source checkout if this regresses.

## Recovering profile configuration

Before the managed migration, existing profile files are copied under `$DSH_HOME/profiles/dsh-cli/.deepseek-harness-cli-backups/migration-v1/`. Restore by copying the required file back while `dsh-cli` is stopped. No migration path deletes the backup or original session data.
