# Standalone DeepSeek Harness CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a privacy-clean standalone `deepseek-harness-cli` repository that installs from GitHub, bootstraps its own dsh profile, provides an 8×34 Ink interface, and maps Web operations to the same Harness services.

**Architecture:** The repository is one ESM npm package. A small launcher discovers the separately installed `dsh`, installs the package as a `tui` profile bundle on first run, and forwards execution. The renderer-neutral controller and domain adapters call Harness services; Ink and line mode are presentation layers over the same controller.

**Tech Stack:** Node.js 22+, TypeScript 6, React 18, Ink 5, Commander 15, Vitest 4, fflate, DeepSeek Harness 0.1.0-rc.6, GitHub CLI.

---

## File structure

- `package.json`: public package metadata, GitHub installation build, `dsh-cli` bin, runtime and peer dependencies.
- `tsconfig.json`, `vitest.config.ts`: strict ESM build and tests.
- `bin/dsh-cli.js`: built launcher entry.
- `src/launcher.ts`: dsh discovery, version gate, profile bootstrap, doctor, forwarding, and signals.
- `src/index.ts`: Cordis TUI bundle entry and Harness service wiring.
- `src/startup.ts`: profile argument provider.
- `src/controller.ts`, `src/controller-types.ts`: renderer-neutral state and dispatch.
- `src/adapters/*.ts`: settings, models, sessions, feedback, plugins, jobs, workspace, attachments, and export operations.
- `src/components/*.tsx`: Ink header, whale, transcript, composer, menus, decisions, selectors, and status.
- `src/capability-matrix.ts`: executable Web-to-terminal traceability records.
- `src/privacy.ts`: synthetic display values and repository privacy scanning patterns.
- `cordis.patch.yml`: external bundle composition over `@deepseek-ai/dsh-base`.
- `tests/*.spec.ts(x)`: unit, adapter, controller, launcher, and UI tests.
- `tests/fixtures/fake-dsh.mjs`: deterministic launcher acceptance double.
- `scripts/render-screenshot.tsx`: actual Ink frame to privacy-clean SVG/PNG asset.
- `scripts/privacy-check.ts`: repository and screenshot leak gate.
- `docs/assets/terminal.png`: sanitized terminal screenshot.
- `docs/commands.md`, `docs/capability-matrix.md`, `docs/troubleshooting.md`: detailed references.
- `README.md`, `README.zh.md`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`: public project documentation.

### Task 1: Scaffold the standalone package

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `src/invariant.ts`
- Test: `tests/package.spec.ts`

- [ ] **Step 1: Write the failing package contract test**

```ts
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('public package', () => {
  it('ships one dsh bundle and one executable', async () => {
    const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
    expect(manifest.name).toBe('deepseek-harness-cli')
    expect(manifest.bin).toEqual({ 'dsh-cli': 'bin/dsh-cli.js' })
    expect(manifest.dsh.bundle.patch).toBe('./cordis.patch.yml')
    expect(manifest.files).toContain('cordis.patch.yml')
  })
})
```

- [ ] **Step 2: Run the test and verify that the manifest is missing**

Run: `pnpm dlx vitest@4.1.8 run tests/package.spec.ts`

Expected: FAIL because `package.json` does not exist.

- [ ] **Step 3: Add the package and strict build configuration**

Use package name `deepseek-harness-cli`, version `0.1.0`, MIT, ESM, `prepare: npm run build`, `test: vitest run`, `typecheck: tsc --noEmit`, and `privacy: tsx scripts/privacy-check.ts`. Declare `@deepseek-ai/dsh` `>=0.1.0-rc.6 <0.2.0` as a peer and keep Ink, React, Commander, fflate, and string-width as ordinary dependencies.

- [ ] **Step 4: Install and run the contract**

Run: `pnpm install && pnpm test -- tests/package.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json vitest.config.ts .gitignore LICENSE src/invariant.ts tests/package.spec.ts
git commit -m "chore: scaffold standalone terminal package"
```

### Task 2: Extract the renderer-neutral TUI

**Files:**
- Create: `src/app.tsx`
- Create: `src/controller.ts`
- Create: `src/controller-types.ts`
- Create: `src/command-catalog.ts`
- Create: `src/event-presenter.ts`
- Create: `src/input-state.ts`
- Create: `src/ink-mode.tsx`
- Create: `src/line-mode.ts`
- Create: `src/startup.ts`
- Create: `src/terminal-ui.ts`
- Create: `src/components/CommandMenu.tsx`
- Create: `src/components/Composer.tsx`
- Create: `src/components/DecisionPanel.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/StatusLine.tsx`
- Create: `src/components/Transcript.tsx`
- Test: `tests/controller.spec.ts`
- Test: `tests/command-catalog.spec.ts`
- Test: `tests/input-state.spec.ts`
- Test: `tests/decision-panel.spec.tsx`

- [ ] **Step 1: Add failing controller and catalog tests**

Tests must prove command collision precedence (`harness > terminal > skill`), unknown slash rejection, registered command execution, literal skill forwarding, prompt forwarding, cancellation, event replay, and decision settlement.

- [ ] **Step 2: Run the tests and verify missing modules**

Run: `pnpm test -- tests/controller.spec.ts tests/command-catalog.spec.ts tests/input-state.spec.ts tests/decision-panel.spec.tsx`

Expected: FAIL with missing source modules.

- [ ] **Step 3: Port the validated TUI core from the terminal-ui feature commit**

Preserve the renderer-neutral `TuiServices` boundary, immutable snapshots, dynamic command catalog, stable event presenter, input reducer, Ink decision panels, and startup-task line mode. Replace workspace imports only with semver package imports; do not copy any upstream browser or host source.

- [ ] **Step 4: Run typecheck, lint, and focused tests**

Run: `pnpm typecheck && pnpm test -- tests/controller.spec.ts tests/command-catalog.spec.ts tests/input-state.spec.ts tests/decision-panel.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src tests package.json pnpm-lock.yaml
git commit -m "feat: add renderer-neutral Harness terminal"
```

### Task 3: Add the one-command launcher

**Files:**
- Create: `src/launcher.ts`
- Create: `tests/launcher.spec.ts`
- Create: `tests/fixtures/fake-dsh.mjs`

- [ ] **Step 1: Write failing launcher tests**

```ts
it('bootstraps once then forwards arguments', async () => {
  const first = await runLauncher(['--resume', 'example-session'], emptyHome)
  expect(first.calls).toEqual([
    ['--version'],
    ['plugin', '--profile', 'tui', 'add', expect.stringContaining('deepseek-harness-cli')],
    ['--profile', 'tui', '--resume', 'example-session'],
  ])
  const second = await runLauncher([], emptyHome)
  expect(second.calls.at(-1)).toEqual(['--profile', 'tui'])
})
```

Cover missing dsh, incompatible version, `doctor`, child exit propagation, signals, and paths containing spaces.

- [ ] **Step 2: Run and verify failure**

Run: `pnpm test -- tests/launcher.spec.ts`

Expected: FAIL because `src/launcher.ts` is missing.

- [ ] **Step 3: Implement discovery, bootstrap, doctor, and forwarding**

Use `spawn`/`spawnSync` with argument arrays and `shell: false`. Read the profile manifest beneath `DSH_HOME` or the default home. Install only when this bundle is absent or resolves to another package root. Forward stdin/stdout/stderr and terminate with the child status.

- [ ] **Step 4: Verify idempotency and failure messages**

Run: `pnpm test -- tests/launcher.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/launcher.ts tests/launcher.spec.ts tests/fixtures/fake-dsh.mjs package.json
git commit -m "feat: add automatic dsh profile bootstrap"
```

### Task 4: Implement the 8×34 DeepSeek header

**Files:**
- Create: `src/components/Whale.tsx`
- Modify: `src/components/Header.tsx`
- Test: `tests/shell.spec.tsx`

- [ ] **Step 1: Write the failing dimensions and snapshot test**

```ts
it('renders a wide eight-row whale without private paths', () => {
  const rows = DEEPSEEK_WHALE.split('\n')
  expect(rows).toHaveLength(8)
  expect(Math.max(...rows.map(stringWidth))).toBeGreaterThanOrEqual(32)
  expect(Math.max(...rows.map(stringWidth))).toBeLessThanOrEqual(36)
  expect(rendered).toContain('/workspace/example-project')
  expect(rendered).not.toMatch(/\/Users\/|session-[0-9a-f-]{16,}/)
})
```

- [ ] **Step 2: Run and verify the old/missing whale fails**

Run: `pnpm test -- tests/shell.spec.tsx`

Expected: FAIL on row count or missing component.

- [ ] **Step 3: Draw the approved wider whale and responsive header**

Create eight Unicode rows, each at most 36 terminal cells, preserving body, belly opening, eye/spray mark, and raised tail. Allocate a fixed 36-cell art column at normal widths and collapse to a compact title below the narrow breakpoint.

- [ ] **Step 4: Run snapshots and inspect a real PTY**

Run: `pnpm test -- tests/shell.spec.tsx && node bin/dsh-cli.js`

Expected: PASS and visually wide/flat header.

- [ ] **Step 5: Commit**

```bash
git add src/components/Whale.tsx src/components/Header.tsx tests/shell.spec.tsx
git commit -m "feat: widen the DeepSeek terminal whale"
```

### Task 5: Close operational parity gaps

**Files:**
- Create: `src/adapters/models.ts`
- Create: `src/adapters/settings.ts`
- Create: `src/adapters/sessions.ts`
- Create: `src/adapters/feedback.ts`
- Create: `src/adapters/plugins.ts`
- Create: `src/adapters/jobs.ts`
- Create: `src/adapters/workspace.ts`
- Create: `src/adapters/attachments.ts`
- Create: `src/adapters/export.ts`
- Create: `src/capability-matrix.ts`
- Create: `src/components/SelectorPanel.tsx`
- Modify: `src/index.ts`
- Modify: `src/controller.ts`
- Modify: `cordis.patch.yml`
- Test: `tests/capability-matrix.spec.ts`
- Test: `tests/adapters.spec.ts`

- [ ] **Step 1: Write the failing executable matrix test**

The required IDs are `prompt`, `cancel`, `commands`, `model`, `credentials`, `permission`, `plan`, `goal`, `preset`, `sessions`, `session-search`, `session-stats`, `rename`, `export`, `attachments`, `skills`, `subagents`, `tools`, `approvals`, `questions`, `jobs`, `workflows`, `deliverables`, `trajectory`, `workspace`, `settings`, `plugins`, `session-feedback`, and `message-feedback`. Each record must name a terminal entry, Harness service, effect, test ID, and non-placeholder status.

- [ ] **Step 2: Run and verify the incomplete matrix fails**

Run: `pnpm test -- tests/capability-matrix.spec.ts tests/adapters.spec.ts`

Expected: FAIL for missing rows and adapters.

- [ ] **Step 3: Implement thin domain adapters**

Expose `/models`, `/credentials`, `/preset`, searchable `/sessions`, `/stats`, `/files`, `/message-feedback`, editable `/settings`, and `/plugins` operations. Existing dynamic Harness commands remain authoritative for permission, plan, goal, session feedback, and workflows. Every adapter calls the public service injected by the active dsh composition and returns structured text or selector data; no adapter edits Harness storage files behind a service.

- [ ] **Step 4: Mount required host services**

The bundle patch adds only generally reusable host rows missing from base: storage, workspace, plugin inventory, message feedback, session log export/stat projections, and TUI startup/runner. It never inserts the Web server, API transport, browser runtime, or client UI packages.

- [ ] **Step 5: Verify all capability contracts**

Run: `pnpm test -- tests/capability-matrix.spec.ts tests/adapters.spec.ts tests/controller.spec.ts`

Expected: PASS with every required row proved by a service-spy assertion.

- [ ] **Step 6: Commit**

```bash
git add src/adapters src/components/SelectorPanel.tsx src/capability-matrix.ts src/controller.ts src/index.ts cordis.patch.yml tests
git commit -m "feat: map Web operations to terminal adapters"
```

### Task 6: Create privacy-clean public documentation and screenshot

**Files:**
- Create: `README.md`
- Create: `README.zh.md`
- Create: `docs/commands.md`
- Create: `docs/capability-matrix.md`
- Create: `docs/troubleshooting.md`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `CHANGELOG.md`
- Create: `scripts/render-screenshot.tsx`
- Create: `scripts/privacy-check.ts`
- Create: `docs/assets/terminal.png`
- Test: `tests/privacy.spec.ts`

- [ ] **Step 1: Add the failing privacy test**

```ts
it('contains no local identity or secret material', async () => {
  const findings = await scanRepository(process.cwd())
  expect(findings).toEqual([])
})
```

The scan rejects macOS/Linux home paths, the known local account aliases, emails outside project security contacts, token/key patterns, durable session UUIDs, and credential file content.

- [ ] **Step 2: Run and verify missing docs/assets fail**

Run: `pnpm test -- tests/privacy.spec.ts`

Expected: FAIL because the scanner and screenshot are missing.

- [ ] **Step 3: Write detailed bilingual documentation**

Both READMEs include non-official status, screenshot, prerequisites, three-step installation, first-run behavior, quick start, arguments, commands, shortcuts, models, API keys, permissions, sessions, workspaces, plugins, skills, jobs, subagents, workflows, attachments, export, capability matrix, doctor, upgrade, uninstall, troubleshooting, privacy, security, development, contributing, license, and upstream attribution.

- [ ] **Step 4: Render the sanitized screenshot**

Render an actual Ink frame with `/workspace/example-project`, `deepseek-chat`, synthetic transcript content, and no session identifier. Convert the frame to `docs/assets/terminal.png`, inspect it visually, and embed it with a relative path.

- [ ] **Step 5: Run privacy and documentation checks**

Run: `pnpm privacy && pnpm test -- tests/privacy.spec.ts`

Expected: PASS with zero findings.

- [ ] **Step 6: Commit**

```bash
git add README.md README.zh.md docs CONTRIBUTING.md SECURITY.md CHANGELOG.md scripts tests/privacy.spec.ts
git commit -m "docs: add complete usage and privacy-safe assets"
```

### Task 7: Verify clean installation and terminal behavior

**Files:**
- Create: `tests/install-acceptance.mjs`
- Create: `tests/pty-acceptance.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add failing clean-prefix acceptance tests**

The install test packs the project, installs it into a temporary npm prefix, places the deterministic fake dsh on PATH, runs `dsh-cli doctor`, launches twice, and asserts one bootstrap plus two profile launches. The PTY test types `/`, confirms the menu is below the composer, sends Ctrl+C, and verifies terminal restoration.

- [ ] **Step 2: Run and verify acceptance failures**

Run: `pnpm test:install && pnpm test:pty`

Expected: FAIL until built package paths and terminal lifecycle are correct.

- [ ] **Step 3: Fix packaging and lifecycle only at observed boundaries**

Ensure the tarball contains `bin`, built `lib`, bundle patch, license, and READMEs; excludes sources that are not required at runtime, test fixtures, local artifacts, and credentials. Ensure bin mode is executable and signal forwarding restores the terminal.

- [ ] **Step 4: Run the release gate**

Run: `pnpm clean && pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:install && pnpm test:pty && pnpm privacy && npm pack --dry-run`

Expected: every command exits zero and the package listing contains only intended public files.

- [ ] **Step 5: Commit**

```bash
git add package.json tests/install-acceptance.mjs tests/pty-acceptance.mjs
git commit -m "test: verify install and PTY release paths"
```

### Task 8: Publish the public repository and v0.1.0

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Confirm release state**

Run: `git status -sb && git log --oneline --decorate -8 && gh auth status && gh api user --jq .login`

Expected: clean `main`, authenticated current account, and no existing `deepseek-harness-cli` repository unless it is this exact remote.

- [ ] **Step 2: Run the final privacy and release gates**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build && pnpm test:install && pnpm test:pty && pnpm privacy && npm pack --dry-run`

Expected: PASS.

- [ ] **Step 3: Create and push the public repository**

Run: `gh repo create deepseek-harness-cli --public --source . --remote origin --push --description "A Claude Code-style terminal interface for DeepSeek Harness"`

Expected: public origin created with `main` pushed.

- [ ] **Step 4: Tag and publish the GitHub release**

Run: `git tag -a v0.1.0 -m "deepseek-harness-cli v0.1.0" && git push origin v0.1.0 && gh release create v0.1.0 --title "deepseek-harness-cli v0.1.0" --notes-file CHANGELOG.md`

Expected: public release URL returned.

- [ ] **Step 5: Verify public installation instructions**

Run the README's GitHub installation command in a temporary prefix, then `dsh-cli doctor` and one startup-task line-mode smoke test.

Expected: installed executable resolves, doctor passes, profile boot exits zero, and no private data appears in output or repository files.
