# Wider Terminal Whale Design

## Goal

Make the DeepSeek whale visibly longer in real monospace terminals such as Ghostty. Keep the existing eight-row height while expanding the drawn silhouette from roughly 36 to roughly 48 terminal columns.

## Design

- Redraw the whale itself; do not simulate width with surrounding spaces or screenshot scaling.
- Keep exactly eight non-empty rows so the header height and surrounding layout remain stable.
- Target a maximum rendered width between 46 and 50 terminal columns.
- Preserve the recognizable DeepSeek silhouette: broad rounded body, white lower opening, small eye/fin detail, raised tail, and pointed lower snout.
- Keep the existing DeepSeek blue and Braille/block-character rendering style.
- Leave the header, status line, command menu, and narrow-terminal fallback unchanged.

## Verification

- Update the whale unit test to require eight rows and the new width range.
- Regenerate the privacy-safe terminal screenshot.
- Render the installed CLI in a real PTY and confirm the active global/profile copies contain the new whale.
- Run build, tests, typecheck, lint, and privacy checks before release.

## Release

Publish the change as the next patch release, reinstall it globally, refresh the isolated `dsh-cli` profile, and verify `dsh-cli doctor` plus an interactive launch.
