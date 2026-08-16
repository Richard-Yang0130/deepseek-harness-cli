# Themes

Use `/theme` to select `auto`, `light`, `dark`, or `dark-ansi`. Set a startup override with:

```bash
export DSH_CLI_THEME=dark
```

The selected preference is stored in `~/.dsh-cli/theme.json`. User themes live in `~/.dsh-cli/themes/<name>.json` and can inherit from a built-in base. Invalid names fall back to automatic detection with a warning.

Theme colors drive the whale, wordmark, Markdown, tool cards, selections, approval states, and context warnings. `dark-ansi` avoids true-color assumptions for constrained terminals.
