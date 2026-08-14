# Wider Terminal Whale Design

## Goal

Make the DeepSeek whale visibly longer in real monospace terminals such as Ghostty. Keep the existing eight-row height while expanding the drawn silhouette from roughly 36 to roughly 48 terminal columns.

## Design

- Redraw the whale itself; do not simulate width with surrounding spaces or screenshot scaling.
- Keep exactly eight non-empty rows so the header height and surrounding layout remain stable.
- Target a maximum rendered width between 46 and 50 terminal columns.
- Preserve the recognizable DeepSeek silhouette: broad rounded body, white lower opening, small eye/fin detail, raised tail, and pointed lower snout.
- Keep the existing DeepSeek blue and Braille/block-character rendering style.
- Expand the whale's fixed header cell from 36 to 50 columns so Ink never wraps the new drawing.
- Raise the compact-header breakpoint from 62 to 82 columns; narrow terminals keep the existing text-only fallback.
- Leave the status line and command menu unchanged.

## Verification

- Update the whale unit test to require eight rows, the new width range, and no wrapping at 100 columns.
- Regenerate the privacy-safe terminal screenshot.
- Render the installed CLI in a real PTY and confirm the active global/profile copies contain the new whale.
- Run build, tests, typecheck, lint, and privacy checks before release.

## Release

Publish the change as the next patch release, reinstall it globally, refresh the isolated `dsh-cli` profile, and verify `dsh-cli doctor` plus an interactive launch.
