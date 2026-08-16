# Capability mapping

| Capability | Terminal surface | Source of truth |
|---|---|---|
| Prompt, steer, cancel | composer, Enter, Ctrl+C | Harness Agent |
| Streaming text and reasoning | transcript | session events |
| Tools | live cards and expanded output | tool registry and session events |
| Sessions | `/new`, `/resume`, `/rewind`, `/rename` | DSH persistence |
| Models and presets | `/model`, `/preset`, `/effort` | scoped DSH services |
| Commands and skills | `/` completion | command and skill registries |
| Approvals and questions | keyboard panels | official approval/question services |
| Workspace and files | `/workspace`, `@` completion | workspace registry and filesystem policy |
| Goal, plan, permissions | dynamic commands and status panels | durable events and registry handlers |
| Terminal preferences | `/theme`, `/lang`, `/activity` | `~/.dsh-cli` |

The terminal changes presentation, not domain ownership. Session logs remain authoritative and the Web surface is not modified.
