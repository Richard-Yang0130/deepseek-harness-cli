#!/usr/bin/env node
/**
 * verify-legacy-rename.mjs — issue #120 换名迁移回归（CC_TUI_*、DSH_CC_*
 * 前缀 → DSH_CLI_*，数据目录 ~/.dsh-cc → ~/.dsh-cli）。全程临时目录/注入
 * env，不碰真实 home。覆盖三件事：
 *   1. migrateLegacyDataDir：旧存新不存才复制（复制而非移动，旧目录保留），
 *      target 已存在时幂等返回 false；
 *   2. resume.txt 只写 ~/.dsh-cli，缺少新 marker 时仍可只读旧 marker；
 *   3. detectLegacyEnv / applyLegacyEnv：旧名会提示并复制到 DSH_CLI_*，
 *      但不会覆盖显式的新值。
 *
 * 运行：pnpm build && node scripts/verify-legacy-rename.mjs
 */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

let failures = 0
function check(name, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`)
  if (!ok) failures++
}

// paths.js 模块级常量（DATA_DIR 等）解析真实 home，但下面全部通过参数注入
// 目录/env，真实 home 只被读取路径字符串、绝不落盘。
const { applyLegacyEnv, migrateLegacyDataDir, detectLegacyEnv, RENAMED_ENV } = await import('../lib/types/utils/paths.js')

// --- 1. migrateLegacyDataDir：首启复制迁移 ----------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'verify-legacy-rename-'))
const legacy = join(tmp, '.dsh-cc')
const target = join(tmp, '.dsh-cli')
mkdirSync(join(legacy, 'themes'), { recursive: true })
writeFileSync(join(legacy, 'theme.json'), '{"theme":"dark"}')
writeFileSync(join(legacy, 'themes', 'sakura.json'), '{"base":"dark","colors":{}}')

check('migrate: first call copies legacy → target', migrateLegacyDataDir(legacy, target) === true)
check(
  'migrate: target content matches legacy',
  readFileSync(join(target, 'theme.json'), 'utf8') === '{"theme":"dark"}'
    && readFileSync(join(target, 'themes', 'sakura.json'), 'utf8') === '{"base":"dark","colors":{}}',
)
check('migrate: legacy dir preserved (copy, not move)', existsSync(join(legacy, 'theme.json')))
check('migrate: second call is a no-op (target exists)', migrateLegacyDataDir(legacy, target) === false)
check('migrate: missing legacy is a no-op', migrateLegacyDataDir(join(tmp, 'no-such-dir'), join(tmp, 'other')) === false)

// --- 2. resume.txt 读取兼容、写入新路径（编译产物文本断言） -------------------
const history = readFileSync(join(root, 'lib', 'types', 'sessionHistory.js'), 'utf8')
check('resume: new marker is written', history.includes('writeFileSync(RESUME_FILE, sessionId)'))
check('resume: legacy marker list is read', history.includes('LEGACY_RESUME_FILES'))
check('resume: legacy marker is not written', !history.includes('writeFileSync(LEGACY_RESUME'))

// --- 3. detectLegacyEnv / RENAMED_ENV ---------------------------------------
const found = detectLegacyEnv({
  CC_TUI_THEME: 'dark',
  DSH_CC_SESSION_ROOT: join(tmp, 'sessions'),
  DSH_CC_RESUME_SESSION: '00000000-1111-2222-3333-444444444444',
  DSH_TUI_THEME: 'light',
  DSH_CLI_THEME: 'dark', // 新名，不是废弃名
})
check('detectLegacyEnv: reports CC_TUI_THEME', found.includes('CC_TUI_THEME'))
check('detectLegacyEnv: reports DSH_CC_SESSION_ROOT', found.includes('DSH_CC_SESSION_ROOT'))
check('detectLegacyEnv: reports DSH_CC_RESUME_SESSION', found.includes('DSH_CC_RESUME_SESSION'))
check('detectLegacyEnv: reports DSH_TUI_THEME', found.includes('DSH_TUI_THEME'))
check('detectLegacyEnv: new names not reported', !found.includes('DSH_CLI_THEME'))
check('RENAMED_ENV: CC_TUI_THEME → DSH_CLI_THEME', RENAMED_ENV.CC_TUI_THEME === 'DSH_CLI_THEME')
check('RENAMED_ENV: DSH_TUI_THEME → DSH_CLI_THEME', RENAMED_ENV.DSH_TUI_THEME === 'DSH_CLI_THEME')
check('RENAMED_ENV: DSH_CC_SESSION_ROOT → DSH_CLI_SESSION_ROOT', RENAMED_ENV.DSH_CC_SESSION_ROOT === 'DSH_CLI_SESSION_ROOT')
check('RENAMED_ENV: every new name starts with DSH_CLI_', Object.values(RENAMED_ENV).every(name => name.startsWith('DSH_CLI_')))

const migratedEnv = {
  DSH_TUI_LANG: 'en',
  DSH_CLI_THEME: 'dark',
  DSH_TUI_THEME: 'light',
}
applyLegacyEnv(migratedEnv)
check('applyLegacyEnv: copies an old value', migratedEnv.DSH_CLI_LANG === 'en')
check('applyLegacyEnv: preserves an explicit new value', migratedEnv.DSH_CLI_THEME === 'dark')

rmSync(tmp, { recursive: true, force: true })
if (failures > 0) {
  console.error(`verify-legacy-rename: ${failures} check(s) failed`)
  process.exit(1)
}
console.log('verify-legacy-rename: OK ✅')
