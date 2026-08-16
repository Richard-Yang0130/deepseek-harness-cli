# Interaction model

The Channel is the UI's live view of the active Harness agent. Durable session events are folded into user, assistant, reasoning, tool, notice, compact, and local rows. The React tree renders those rows; it does not invent a parallel conversation state.

Submitting while idle creates a follow-up. Submitting while the agent works steers the running turn at the next supported boundary. Ctrl+C cancels the turn. Pending steer and follow-up messages remain visible until the agent claims them.

Slash commands are split between local presentation actions and commands discovered from the DSH registry. Registry commands are listed dynamically and receive the original command line. Approvals and questions use the official services and block the prompt until answered or cancelled.

Inline mode preserves normal terminal scrollback. Fullscreen mode uses the alternate screen and enables app-owned mouse selection. Both modes restore cursor, keyboard protocol, mouse tracking, title, and progress state during shutdown.

When stdin or stdout is not a TTY, React and terminal modes are not mounted. A plain reporter writes user, assistant, and completed tool text without ANSI escapes; reasoning stays hidden unless explicitly enabled by an embedding caller.
