# Wider Terminal Whale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the installed eight-row whale with a visibly longer 46-column silhouette in real monospace terminals.

**Architecture:** Keep `Whale.tsx` as the single visual source, widen the fixed whale cell in `Header.tsx`, and tighten renderer tests around the approved geometry and non-wrapping layout. Rebuild committed output, regenerate the sanitized screenshot, release a patch, and refresh both the global package and isolated dsh profile.

**Tech Stack:** React 18, Ink 5, TypeScript, Vitest, string-width, npm, dsh

---

### Task 1: Lock the new terminal geometry

**Files:**
- Modify: `tests/shell.spec.tsx`

- [ ] **Step 1: Tighten the width assertions**

Replace the current 32–36 range with:

```ts
expect(Math.max(...rows.map(row => stringWidth(row.trimEnd())))).toBeGreaterThanOrEqual(46)
expect(Math.max(...rows.map(row => stringWidth(row)))).toBeLessThanOrEqual(50)
```

- [ ] **Step 2: Verify the old whale fails**

Run: `npm test -- tests/shell.spec.tsx`

Expected: FAIL because the current maximum width is 36.

- [ ] **Step 3: Commit the failing test together with the implementation in Task 2**

No standalone commit is made while main is red.

### Task 2: Redraw the whale at 46 columns

**Files:**
- Modify: `src/components/Whale.tsx`
- Modify: `src/components/Header.tsx`
- Test: `tests/shell.spec.tsx`

- [ ] **Step 1: Replace the eight-row literal**

Use the following silhouette:

```ts
export const DEEPSEEK_WHALE = [
  '      ⢀⣠⣤⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣤⣀                 ⢀⣠⣤⡆',
  '   ⢀⢾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣀       ⣠⣿⣿⣿⠃',
  ' ⢀⢾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣤⢾⣿⣿⣿⠏',
  '⢾⣿⠟⠉⠉⠉⠉⠉⠉⠉⠉⠙⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡯⠁',
  '⣿⣿⡀                 ⠈⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡋⢉⢽⣿⣿⣿⠃',
  '⢻⣿⣷⣄                    ⠙⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⣿⡟',
  ' ⠹⣿⣿⣿⣷⣄        ⣠⣶⣶⣄      ⠻⣿⣿⣿⣿⣿⣿⣿⣧⣀',
  '    ⠙⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠋          ⠈⠻⠿⠿⠿⠟⠁',
].join('\n')
```

- [ ] **Step 2: Verify the focused test passes**

Change the full-header breakpoint from `62` to `82` and the whale cell width from `36` to `50` in `Header.tsx`:

```tsx
if (columns < 82) {
  // existing compact header
}

<Box width={50} flexShrink={0}><Whale /></Box>
```

- [ ] **Step 3: Verify the focused test passes**

Run: `npm test -- tests/shell.spec.tsx`

Expected: 2 tests pass; the whale has eight rows and a maximum width from 46 through 50.

- [ ] **Step 4: Commit the visual and test**

```bash
git add src/components/Whale.tsx src/components/Header.tsx tests/shell.spec.tsx docs/superpowers
git commit -m "feat: widen terminal whale"
```

### Task 3: Regenerate and verify presentation assets

**Files:**
- Modify: `scripts/render-screenshot.tsx`
- Modify: `docs/assets/terminal.svg`
- Modify: `docs/assets/terminal.png`

- [ ] **Step 1: Remove the obsolete snapshot field**

Remove `subagents: ['reviewer']` from the screenshot fixture so it matches `TuiControllerSnapshot`.

- [ ] **Step 2: Regenerate the screenshot**

Run:

```bash
npm run screenshot
mkdir -p /tmp/dsh-cli-whale-preview
qlmanage -t -s 1600 -o /tmp/dsh-cli-whale-preview docs/assets/terminal.svg
cp /tmp/dsh-cli-whale-preview/terminal.svg.png docs/assets/terminal.png
```

Expected: the generated terminal asset contains the new 46-column whale and only synthetic workspace data.

- [ ] **Step 3: Run visual and privacy checks**

Run: `npm run privacy && npm test -- tests/shell.spec.tsx`

Expected: privacy passes and the focused tests remain green.

### Task 4: Release and install the patch

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `lib/**`

- [ ] **Step 1: Bump the patch version**

Change `package.json` from `0.1.3` to `0.1.4` and add a changelog entry stating that the whale was redrawn for real terminal cell proportions.

- [ ] **Step 2: Run the complete release gate**

Run:

```bash
npm run build
npm test
npm run typecheck
npm run lint
npm run privacy
git diff --check
```

Expected: 19 test files and 56 tests pass, with no lint, type, privacy, or whitespace errors.

- [ ] **Step 3: Commit and publish**

```bash
git add CHANGELOG.md package.json lib scripts docs/assets
git commit -m "chore: release v0.1.4"
git push origin main
gh release create v0.1.4 --target main --title "deepseek-harness-cli v0.1.4" --notes "Redraw the terminal whale at 46 columns for a visibly longer shape in real monospace terminals."
```

- [ ] **Step 4: Update the global package and profile**

Run:

```bash
npm install -g https://github.com/Richard-Yang0130/deepseek-harness-cli/archive/refs/tags/v0.1.4.tar.gz
dsh plugin --profile dsh-cli add file:/opt/homebrew/lib/node_modules/deepseek-harness-cli
dsh-cli doctor
```

Expected: `dsh-cli doctor` reports dsh `0.1.0-rc.6`, profile `ready`, and the global package path.

- [ ] **Step 5: Verify installed bytes**

Compare `lib/components/Whale.js` across the repository, global package, and profile dependency. Their hashes must match, and a fresh interactive launch must show the wider whale.
