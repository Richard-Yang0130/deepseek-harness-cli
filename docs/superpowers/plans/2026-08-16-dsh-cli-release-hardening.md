# dsh-cli Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish documentation, licensing, package checks, terminal regressions, and release evidence for the rebased `deepseek-harness-cli`.

**Architecture:** Treat build, package contents, visible branding, terminal cleanup, responsive rendering, and compatibility checks as release gates. Documentation describes the new product while the distributed license retains required imported notices.

**Tech Stack:** pnpm, TypeScript, Node.js verification scripts, headless terminal renderer, PTY probes, npm package dry-run, Markdown documentation.

---

## File map

- Modify: `README.md`, `README.zh.md`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`
- Modify/import: `docs/architecture.md`, `docs/configuration.md`, `docs/getting-started.md`, `docs/interaction.md`, `docs/themes.md`, `docs/plugins.md`, `docs/troubleshooting.md`
- Preserve: `docs/superpowers/`
- Modify: `scripts/verify-package.mjs`, `scripts/verify-brand-identity.mjs`, `package.json`
- Create: `scripts/verify-release-gate.mjs`
- Create/update: `docs/assets/terminal.png`, `docs/assets/terminal.svg`

### Task 1: Preserve license notices and set project metadata

**Files:**
- Modify: `LICENSE`
- Modify: `package.json`
- Create: `scripts/verify-license-notice.mjs`

- [ ] **Step 1: Write the failing license verifier**

Create a script that asserts `LICENSE` contains both:

```text
MIT License
Copyright (c) 2026, chimney (ccch1mneyyy)
```

and this project's existing copyright line. It must also assert `package.json.license === 'MIT'`.

- [ ] **Step 2: Run it and observe the missing imported notice**

Run `node scripts/verify-license-notice.mjs`.

Expected: FAIL until the imported MIT notice is included.

- [ ] **Step 3: Compose the distributed license**

Keep a single MIT permission and warranty body, preceded by separate copyright lines for the imported foundation and this project's changes. Do not remove the upstream copyright line.

- [ ] **Step 4: Verify and commit**

```bash
node scripts/verify-license-notice.mjs
git add LICENSE package.json scripts/verify-license-notice.mjs
git commit -m "docs: preserve mit notices for rebased source"
```

### Task 2: Rewrite user documentation for the new product

**Files:**
- Modify: `README.md`
- Modify: `README.zh.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/configuration.md`
- Modify: `docs/interaction.md`
- Modify: `docs/themes.md`
- Modify: `docs/architecture.md`
- Modify: `docs/plugins.md`
- Modify: `docs/troubleshooting.md`

- [ ] **Step 1: Extend visible-brand verification to documentation**

Scan the listed documents for upstream install, package, profile, command, data directory, and environment contracts. Allow `dsh-TUI` only in a short architecture provenance sentence if the repository owner chooses to retain one; do not allow upstream install commands or old runtime paths.

- [ ] **Step 2: Confirm imported documentation fails the scan**

Run `pnpm verify:brand`.

Expected: FAIL listing upstream product instructions.

- [ ] **Step 3: Rewrite README entry points**

Both READMEs must state:

```text
npm install -g @deepseek-ai/dsh deepseek-harness-cli
dsh-cli
dsh-cli "检查这个仓库"
dsh-cli --resume
dsh-cli doctor
```

Document the whale header, streaming reasoning, tools, context/TPS status, command and file completion, resume/rewind, themes, approvals, questions, clipboard support, inline/fullscreen modes, and compatibility aliases.

- [ ] **Step 4: Rewrite reference docs**

Use only these runtime contracts:

```text
profile: dsh-cli
preferences: ~/.dsh-cli
environment prefix: DSH_CLI_
package: deepseek-harness-cli
command: dsh-cli
```

Architecture documentation must preserve the adapter/Channel/React/renderer boundary and state that DSH session logs remain the source of truth.

- [ ] **Step 5: Verify documentation and commit**

```bash
pnpm verify:brand
git diff --check -- README.md README.zh.md docs
git add README.md README.zh.md docs
git commit -m "docs: document the rebuilt dsh-cli experience"
```

### Task 3: Harden package contents and brand scanning

**Files:**
- Modify: `scripts/verify-package.mjs`
- Modify: `scripts/verify-brand-identity.mjs`
- Create: `scripts/verify-release-gate.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write release-package assertions**

Assert the dry-run tarball contains:

```text
bin/dsh-cli.js
lib/types/index.js
cordis.patch.yml
cordis.yml
presets/
skills/
LICENSE
README.md
README.zh.md
```

Assert it excludes source maps containing absolute workstation paths, `docs/superpowers`, test fixtures, screenshots unrelated to the package, and any `bin/dsh-tui.js` entry.

- [ ] **Step 2: Run the package verifier and capture current mismatches**

```bash
pnpm build
npm pack --dry-run --json --ignore-scripts | node scripts/verify-package.mjs
```

Expected: FAIL until the `files` list and verifier expectations match the new product.

- [ ] **Step 3: Set exact package files**

Use:

```json
"files": [
  "bin",
  "lib",
  "cordis.patch.yml",
  "cordis.yml",
  "presets",
  "skills",
  "README.md",
  "README.zh.md",
  "LICENSE",
  "CHANGELOG.md"
]
```

- [ ] **Step 4: Create the aggregate release gate**

`scripts/verify-release-gate.mjs` runs each pure verifier with `spawnSync`, exits on the first nonzero result, and prints the command that failed. Register:

```json
"verify:release": "node scripts/verify-release-gate.mjs"
```

- [ ] **Step 5: Verify and commit packaging**

```bash
pnpm build
pnpm verify:package
pnpm verify:release
git add package.json scripts
git commit -m "build: harden dsh-cli package verification"
```

### Task 4: Run renderer and terminal regressions

**Files:**
- Modify only for defects reproduced by an existing verification script.

- [ ] **Step 1: Run responsive and render checks**

```bash
node --import tsx/esm scripts/verify-resize-reflow.tsx
node --import tsx/esm scripts/verify-loaded-context-width.tsx
node --import tsx/esm scripts/verify-cjk-truncate.tsx
node --import tsx/esm scripts/verify-text-background.tsx
node --import tsx/esm scripts/verify-themes.mjs
```

Expected: every command exits 0.

- [ ] **Step 2: Run input and lifecycle checks**

```bash
node --import tsx/esm scripts/verify-submit.mjs
node --import tsx/esm scripts/verify-keys.tsx
node --import tsx/esm scripts/verify-plain-enter-guard.mjs
node --import tsx/esm scripts/verify-shutdown-stderr.tsx
node --import tsx/esm scripts/verify-teardown-exit.tsx
node --import tsx/esm scripts/verify-terminal-queries.tsx
```

Expected: every command exits 0 and terminal restoration assertions pass.

- [ ] **Step 3: Run interaction and long-session checks**

```bash
node --import tsx/esm scripts/verify-scroll.mjs
node --import tsx/esm scripts/verify-shrink.mjs
node --import tsx/esm scripts/verify-resticky.mjs
node --import tsx/esm scripts/verify-queue.mjs
node --import tsx/esm scripts/verify-tps.mjs
node --import tsx/esm scripts/verify-askpanel-layout.tsx
node --import tsx/esm scripts/verify-copy-on-select.mjs
```

Expected: every command exits 0.

- [ ] **Step 4: Commit only reproducible fixes**

If a verifier fails, reproduce it unchanged, add or tighten the focused verifier first, apply the smallest fix, rerun that verifier, then rerun the group. Commit each independent fix with `fix:` and the affected behavior in the message.

### Task 5: Refresh screenshots and changelog

**Files:**
- Modify: `docs/assets/terminal.png`
- Modify: `docs/assets/terminal.svg`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Generate a deterministic branded preview**

Use the headless renderer with a fixed terminal size, fixed clock, fixture session, and `DSH_CLI_THEME=dark`. The output must show the DeepSeek Harness CLI header, whale, transcript, tool card, prompt, and context/TPS footer.

- [ ] **Step 2: Inspect the generated PNG**

Open `docs/assets/terminal.png` and verify no clipping, stale product name, malformed wide characters, exposed local absolute path, token, session id, or credential appears.

- [ ] **Step 3: Update changelog**

Add a release section describing the new renderer, full TUI interactions, compatibility migration, profile backup, command aliases, renamed preference path, and Node engine change. State that original data is not deleted.

- [ ] **Step 4: Commit visual and release notes**

```bash
git add docs/assets/terminal.png docs/assets/terminal.svg CHANGELOG.md
git commit -m "docs: add rebuilt terminal preview and release notes"
```

### Task 6: Execute the final release gate

**Files:**
- Modify only for a defect demonstrated by a failing gate.

- [ ] **Step 1: Run all automated checks fresh**

```bash
pnpm install --frozen-lockfile
pnpm verify:brand
pnpm build
pnpm smoke
pnpm verify:release
pnpm verify:package
git diff --check main...HEAD
```

Expected: every command exits 0.

- [ ] **Step 2: Run the aggregate terminal groups from Task 4 again**

Expected: all responsive, lifecycle, interaction, and long-session scripts exit 0 in the current final tree.

- [ ] **Step 3: Inspect repository state and packaged identity**

```bash
git status --short
git log --oneline main..HEAD
npm pack --dry-run --json --ignore-scripts
```

Expected: clean worktree; focused commits; package name `deepseek-harness-cli`; executable `dsh-cli`; no upstream executable or old runtime path in package contents.

- [ ] **Step 4: Record manual credential-dependent verification separately**

If `DEEPSEEK_API_KEY` is already available, run `dsh-cli "回复 READY"`, confirm streaming output and clean exit, then run `dsh-cli --resume`. If no usable credential is available, report these two checks as unexecuted instead of inferring success.
