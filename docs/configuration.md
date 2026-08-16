# Configuration

DeepSeek Harness CLI uses these stable contracts:

| Contract | Value |
|---|---|
| Package | `deepseek-harness-cli` |
| Command and profile | `dsh-cli` |
| Preferences | `~/.dsh-cli` |
| Environment prefix | `DSH_CLI_` |

Useful environment variables include `DSH_CLI_LANG`, `DSH_CLI_THEME`, `DSH_CLI_MODEL`, `DSH_CLI_PROVIDER`, `DSH_CLI_PRESET`, `DSH_CLI_ACTIVITY_FRAMES`, `DSH_CLI_WORKSPACE_TARGET`, and `DSH_CLI_RESUME_SESSION`. Explicit profile configuration wins where the relevant schema defines a static deployment choice.

Interactive changes made by `/theme`, `/lang`, `/model`, `/preset`, and `/activity` are stored beneath `~/.dsh-cli`. New code writes only the current names. Renamed variables and preference locations are read as migration fallbacks so an upgrade does not strand existing sessions.

The profile patch is `$DSH_HOME/profiles/dsh-cli/cordis.patch.yml`. Keep user plugin rows there; the migration backup protects the file before managed changes.
