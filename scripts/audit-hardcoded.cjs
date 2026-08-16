// Audit: user-facing hardcoded string literals outside the i18n dictionary.
// Targets: state.notify('...'), console.error/warn, process.stderr.write,
// <Text>literal</Text> — anywhere in src/ and bin/.
const fs = require('fs')
const path = require('path')

const roots = ['src', 'bin']
const files = []
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(ts|tsx|js)$/.test(e.name) && !e.name.endsWith('.d.ts')) files.push(p)
  }
}
roots.forEach(walk)

const results = []
for (const f of files) {
  if (f.endsWith('i18n.ts')) continue
  const lines = fs.readFileSync(f, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return
    // state.notify / notify( with a string literal first arg (not t()/variable)
    const m = line.match(/(?:state\.)?notify\(\s*([`'"])/)
    if (m) {
      // check the literal isn't a t() call right after
      const after = line.slice(line.indexOf(m[1]))
      if (!/^\s*[`'"]\s*$/.test(after)) results.push({ f, l: i + 1, kind: 'notify', text: t.slice(0, 120) })
    }
    // <Text ...>hardcoded</Text> with ASCII words
    const m2 = line.match(/<Text[^>]*>([^<{}]*[A-Za-z][a-z]+[^<{}]*)<\/Text>/)
    if (m2 && m2[1].trim().length > 2) results.push({ f, l: i + 1, kind: 'Text', text: m2[1].trim().slice(0, 80) })
    // console.error/process.stderr.write with literal containing spaces (sentence)
    if (/console\.(error|warn)\(|process\.stderr\.write\(/.test(line) && /[`'"][^`'"]{15,}[`'"]/.test(line) && !/msg\(|MSG\./.test(line)) {
      results.push({ f, l: i + 1, kind: 'console', text: t.slice(0, 120) })
    }
  })
}
const byFile = {}
for (const r of results) (byFile[r.f] ??= []).push(r)
for (const [f, rs] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${f} (${rs.length})`)
  rs.slice(0, 12).forEach(r => console.log(`  ${r.l} [${r.kind}] ${r.text}`))
  if (rs.length > 12) console.log(`  …还有 ${rs.length - 12} 处`)
}
console.log(`\n总计 ${results.length} 处 / ${Object.keys(byFile).length} 个文件`)
