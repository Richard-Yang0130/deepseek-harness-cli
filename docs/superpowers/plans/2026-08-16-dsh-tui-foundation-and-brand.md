# dsh-TUI Foundation and Brand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current interactive implementation with dsh-TUI revision `7a009e6de4df8e0f6d7b1b17d8a4a9a95432f1a3` and make it build and launch as `deepseek-harness-cli` / `dsh-cli`.

**Architecture:** Import the renderer, Channel, DSH adapter, screens, components, utilities, presets, skills, and verification scripts as one foundation. Rebrand at package, profile, filesystem, environment, launcher, and UI boundaries without retaining the old interactive controller.

**Tech Stack:** Node.js 22.19+/24, TypeScript 6, React 19, ported Ink/Yoga renderer, Cordis, DeepSeek Harness packages, pnpm 11.

---

## File map

- Replace: `src/`, `scripts/`, `bin/`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `cordis.patch.yml`, `.npmrc`, `.npmignore`
- Create from upstream: `presets/`, `skills/`, `patch-surface.snapshot.json`, `cordis.yml`, `install.sh`, `dsh-cli.cmd`
- Preserve: `.gitignore`, `docs/superpowers/`, repository history
- Remove after import: old tracked `lib/` output and old Vitest tests tied to the removed controller
- Modify for identity: `package.json`, `bin/dsh-cli.js`, `install.sh`, `dsh-cli.cmd`, `src/utils/paths.ts`, `src/i18n.ts`, `src/dsh-adapter/index.ts`, `src/dsh-adapter/plugin.ts`, `src/update.ts`, `cordis.patch.yml`, `cordis.yml`
- Create verification: `scripts/verify-brand-identity.mjs`

### Task 1: Import the pinned upstream foundation

**Files:**
- Replace: `src/`
- Replace: `scripts/`
- Replace: `bin/`
- Replace: `package.json`
- Replace: `pnpm-lock.yaml`
- Replace: `pnpm-workspace.yaml`
- Replace: `tsconfig.json`
- Replace: `cordis.patch.yml`
- Replace: `.npmrc`
- Replace: `.npmignore`
- Create: `cordis.yml`
- Create: `presets/`
- Create: `skills/`
- Create: `patch-surface.snapshot.json`
- Create: `install.sh`

- [ ] **Step 1: Confirm the worktree and pinned source revision**

Run:

```bash
test "$(git branch --show-current)" = "feature/dsh-tui-rebase"
git -C /tmp/dsh-tui-analysis.Vh6a1q rev-parse HEAD
```

Expected: the branch check exits 0 and the revision is `7a009e6de4df8e0f6d7b1b17d8a4a9a95432f1a3`. If the temporary checkout is absent, clone `https://github.com/ccch1mneyyy/dsh-TUI.git` into a new `mktemp -d` directory and detach at that exact revision.

- [ ] **Step 2: Remove only the superseded tracked implementation**

Run:

```bash
git rm -r src scripts bin tests lib
git rm package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json cordis.patch.yml
git rm --ignore-unmatch .npmrc .npmignore
```

Expected: `docs/superpowers/`, `.gitignore`, `README*`, `LICENSE`, and repository metadata remain present.

- [ ] **Step 3: Copy the exact upstream implementation surface**

Run from the worktree root, with `upstream_dir` set to the detached checkout:

```bash
cp -R "$upstream_dir/src" "$upstream_dir/scripts" "$upstream_dir/bin" .
cp -R "$upstream_dir/presets" "$upstream_dir/skills" .
cp "$upstream_dir/package.json" "$upstream_dir/pnpm-lock.yaml" "$upstream_dir/pnpm-workspace.yaml" "$upstream_dir/tsconfig.json" .
cp "$upstream_dir/.npmrc" "$upstream_dir/.npmignore" .
cp "$upstream_dir/cordis.patch.yml" "$upstream_dir/cordis.yml" .
cp "$upstream_dir/patch-surface.snapshot.json" "$upstream_dir/install.sh" .
cp "$upstream_dir/dsh-tui.cmd" ./dsh-cli.cmd
```

Expected: `src/screens/Chat.tsx`, `src/dsh-adapter/channel.ts`, `src/ink/ink.tsx`, and `src/native-ts/yoga-layout/index.ts` exist.

- [ ] **Step 4: Install the imported dependency graph**

Run:

```bash
pnpm install --frozen-lockfile
```

Expected: exit 0 with no lockfile mutation.

- [ ] **Step 5: Verify the imported upstream baseline**

Run:

```bash
pnpm build
pnpm smoke
```

Expected: both commands exit 0 before branding changes.

- [ ] **Step 6: Commit the pinned import**

```bash
git add src scripts bin presets skills package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json .npmrc .npmignore cordis.patch.yml cordis.yml patch-surface.snapshot.json install.sh dsh-cli.cmd
git commit -m "refactor: import dsh-tui foundation at 7a009e6"
```

### Task 2: Establish package and launcher identity

**Files:**
- Create: `scripts/verify-brand-identity.mjs`
- Modify: `package.json`
- Rename: `bin/dsh-tui.js` to `bin/dsh-cli.js`
- Modify: `bin/dsh-cli.js`
- Modify: `install.sh`
- Modify: `dsh-cli.cmd`

- [ ] **Step 1: Write the failing identity verifier**

Create `scripts/verify-brand-identity.mjs`:

```js
import { readFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const failures = []
if (manifest.name !== 'deepseek-harness-cli') failures.push(`package name: ${manifest.name}`)
if (JSON.stringify(manifest.bin) !== JSON.stringify({ 'dsh-cli': './bin/dsh-cli.js' })) {
  failures.push(`bin: ${JSON.stringify(manifest.bin)}`)
}
if (manifest.dsh?.bundle?.patch !== './cordis.patch.yml') failures.push('bundle patch export')
if (failures.length > 0) throw new Error(`brand identity mismatch:\n${failures.join('\n')}`)
```

- [ ] **Step 2: Run it and confirm the imported identity fails**

Run:

```bash
node scripts/verify-brand-identity.mjs
```

Expected: FAIL reporting the scoped upstream package name and `dsh-tui` bin.

- [ ] **Step 3: Apply the package identity**

Set these exact `package.json` fields while retaining the imported dependency and script graph:

```json
{
  "name": "deepseek-harness-cli",
  "description": "A full-featured DeepSeek Harness terminal interface",
  "bin": { "dsh-cli": "./bin/dsh-cli.js" },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Richard-Yang0130/deepseek-harness-cli.git"
  },
  "bugs": { "url": "https://github.com/Richard-Yang0130/deepseek-harness-cli/issues" },
  "homepage": "https://github.com/Richard-Yang0130/deepseek-harness-cli#readme"
}
```

Also add:

```json
"verify:brand": "node scripts/verify-brand-identity.mjs"
```

to `scripts` and retain `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`.

- [ ] **Step 4: Rename and rebrand the launchers**

Run:

```bash
git mv bin/dsh-tui.js bin/dsh-cli.js
```

In `bin/dsh-cli.js`, use these constants:

```js
const PACKAGE = 'deepseek-harness-cli'
const PROFILE = 'dsh-cli'
const BRAND = 'dsh-cli'
```

Change launcher prefixes to `[dsh-cli]`, profile commands to `--profile dsh-cli`, installed package lookup to `node_modules/deepseek-harness-cli/package.json`, and update examples to `dsh-cli`.

In `install.sh` and `dsh-cli.cmd`, use `dsh-cli`, profile `dsh-cli`, and package `deepseek-harness-cli` exclusively.

- [ ] **Step 5: Verify identity and launcher syntax**

Run:

```bash
pnpm verify:brand
node --check bin/dsh-cli.js
node --check scripts/verify-brand-identity.mjs
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit package identity**

```bash
git add package.json bin/dsh-cli.js install.sh dsh-cli.cmd scripts/verify-brand-identity.mjs
git commit -m "feat: establish deepseek harness cli identity"
```

### Task 3: Rename preferences and environment contracts

**Files:**
- Modify: `src/utils/paths.ts`
- Modify: `src/sessionHistory.ts`
- Modify: `src/i18n.ts`
- Modify: `src/theme.ts`
- Modify: `src/update.ts`
- Modify: `bin/dsh-cli.js`
- Modify: `scripts/verify-brand-identity.mjs`

- [ ] **Step 1: Extend the verifier with path and environment assertions**

Add to `scripts/verify-brand-identity.mjs`:

```js
const pathsSource = await readFile(new URL('../src/utils/paths.ts', import.meta.url), 'utf8')
if (!pathsSource.includes("'.dsh-cli'")) failures.push('DATA_DIR is not ~/.dsh-cli')
if (!pathsSource.includes('DSH_CLI_THEME')) failures.push('DSH_CLI environment map is absent')
for (const stale of ['.dsh-tui', 'DSH_TUI_THEME', 'DSH_TUI_LANG']) {
  if (pathsSource.includes(stale)) failures.push(`stale path contract: ${stale}`)
}
```

- [ ] **Step 2: Confirm the new assertions fail**

Run `pnpm verify:brand`.

Expected: FAIL for `.dsh-tui` and `DSH_TUI_*`.

- [ ] **Step 3: Define the new path contract**

In `src/utils/paths.ts`, set:

```ts
export const DATA_DIR = join(homeDir(), '.dsh-cli')
export const LEGACY_DATA_DIRS = [
  join(homeDir(), '.dsh-tui'),
  join(homeDir(), '.dsh-cc'),
] as const

export const RENAMED_ENV: Readonly<Record<string, string>> = {
  DSH_TUI_THEME: 'DSH_CLI_THEME',
  DSH_TUI_LANG: 'DSH_CLI_LANG',
  DSH_TUI_PERSONA: 'DSH_CLI_PERSONA',
  DSH_TUI_PRESET: 'DSH_CLI_PRESET',
  DSH_TUI_DISABLE_MOUSE: 'DSH_CLI_DISABLE_MOUSE',
  DSH_TUI_DEBUG: 'DSH_CLI_DEBUG',
  DSH_TUI_COMPACT_RATIO: 'DSH_CLI_COMPACT_RATIO',
  DSH_TUI_COMPACT_RETAIN: 'DSH_CLI_COMPACT_RETAIN',
  DSH_TUI_UPDATED_FROM: 'DSH_CLI_UPDATED_FROM',
  DSH_TUI_RENDER_LOG: 'DSH_CLI_RENDER_LOG',
  DSH_TUI_SESSION_ROOT: 'DSH_CLI_SESSION_ROOT',
  DSH_TUI_WORKSPACE: 'DSH_CLI_WORKSPACE',
}
```

Update `migrateLegacyDataDir` to inspect `LEGACY_DATA_DIRS` in order, copy the first existing directory only when `DATA_DIR` is absent, and never remove the source.

- [ ] **Step 4: Rename runtime environment reads and writes**

Replace runtime contracts consistently:

```text
DSH_TUI_* -> DSH_CLI_*
~/.dsh-tui -> ~/.dsh-cli
dsh-tui profile -> dsh-cli profile
```

Keep old environment names only in `RENAMED_ENV` and compatibility reads. `sessionHistory.ts` writes `~/.dsh-cli/resume.txt`; the launcher reads `.dsh-cli` first and legacy directories second.

- [ ] **Step 5: Rebuild and verify**

Run:

```bash
pnpm verify:brand
pnpm build
pnpm smoke
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit runtime identity**

```bash
git add src bin scripts package.json pnpm-lock.yaml
git commit -m "feat: rename tui runtime contracts to dsh-cli"
```

### Task 4: Rebrand the Cordis bundle and visible interface

**Files:**
- Create: `src/brand.ts`
- Modify: `cordis.patch.yml`
- Modify: `cordis.yml`
- Modify: `patch-surface.snapshot.json`
- Modify: `src/i18n.ts`
- Modify: `src/components/LogoV2.tsx`
- Modify: `src/screens/Chat.tsx`
- Modify: `src/dsh-adapter/plugin.ts`
- Modify: `src/dsh-adapter/index.ts`
- Modify: `scripts/verify-brand-identity.mjs`

- [ ] **Step 1: Add a stale visible-brand scan**

Extend `scripts/verify-brand-identity.mjs` to recursively scan `src`, `bin`, `cordis.patch.yml`, and `cordis.yml`, failing on user-visible forms:

```js
const forbidden = [
  '@deepseek-harness-tui/dsh-tui',
  '[dsh-tui]',
  'dsh --profile dsh-tui',
  '~/.dsh-tui',
]
```

Diagnostic-only compatibility constants in `src/utils/paths.ts` are exempt from the scan.

- [ ] **Step 2: Confirm the scan fails on imported sources**

Run `pnpm verify:brand`.

Expected: FAIL listing Cordis and UI files that still expose dsh-TUI.

- [ ] **Step 3: Apply visible identity**

Use these exact visible names:

```ts
export const PRODUCT_NAME = 'DeepSeek Harness CLI'
export const PRODUCT_NAME_COMPACT = 'DSH CLI'
export const COMMAND_NAME = 'dsh-cli'
```

Place them in `src/brand.ts` and import them where TypeScript UI or adapter messages need product identity. Update the welcome header, help, resume hints, errors, debug namespace, Cordis plugin name, package module paths, and profile instructions.

In YAML, replace scoped package subpaths with `deepseek-harness-cli/...` and use plugin ids prefixed with `dsh-cli-` where the id is project-owned.

- [ ] **Step 4: Refresh the patch snapshot**

Run the imported patch-surface generator or verifier command documented in `package.json`. If the verifier reports a mismatch, regenerate `patch-surface.snapshot.json` from the renamed `cordis.patch.yml` and immediately rerun the verifier.

- [ ] **Step 5: Verify the stage gate**

Run:

```bash
pnpm verify:brand
pnpm build
pnpm smoke
pnpm verify:package
```

Expected: all commands exit 0; the package verifier reports `deepseek-harness-cli` and `bin/dsh-cli.js`.

- [ ] **Step 6: Commit visible branding**

```bash
git add src cordis.patch.yml cordis.yml patch-surface.snapshot.json scripts package.json
git commit -m "feat: rebrand imported tui as deepseek harness cli"
```

### Task 5: Verify foundation completion

**Files:**
- Modify only when a preceding verification exposes a foundation defect.

- [ ] **Step 1: Run the full foundation verification**

```bash
pnpm install --frozen-lockfile
pnpm verify:brand
pnpm build
pnpm smoke
pnpm verify:package
git diff --check main...HEAD
```

Expected: all commands exit 0.

- [ ] **Step 2: Scan for stale product identity**

```bash
rg -n 'dsh-TUI|\[dsh-tui\]|@deepseek-harness-tui/dsh-tui|\.dsh-tui|DSH_TUI_' src bin scripts package.json cordis.patch.yml cordis.yml install.sh dsh-cli.cmd
```

Expected: matches appear only in compatibility mappings or explicit migration diagnostics; every match is reviewed manually.

- [ ] **Step 3: Record the verified stage**

```bash
git status --short
git log --oneline main..HEAD
```

Expected: no uncommitted changes and four focused migration commits after the design commit.
