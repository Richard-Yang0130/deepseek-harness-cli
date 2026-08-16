# Architecture

DeepSeek Harness CLI is a terminal front door over official DSH services.

```text
dsh-cli launcher
  -> dsh profile (Cordis composition)
    -> Harness agent, session, LLM, tools, approvals, questions, commands
      -> adapter / Channel
        -> React screens and components
          -> ported Ink renderer and terminal protocols
```

The adapter resolves or creates the active agent and converts durable events into `ChatRow` projections. Channel owns UI-facing actions and subscriptions. React owns transient presentation state such as pickers and expanded cards. The renderer owns layout, input, selection, terminal queries, and cleanup.

DSH session logs remain the source of truth. Resume, rewind, model changes, tool activity, goals, todos, and dynamic commands flow through official services or durable events rather than a shadow store. Preferences under `~/.dsh-cli` hold only terminal choices.

The imported renderer foundation is maintained behind the adapter boundary so upstream UI mechanics can evolve without replacing Harness domain services. Package-owned Cordis rows use `dsh-cli-*` identifiers and `deepseek-harness-cli` module exports.
