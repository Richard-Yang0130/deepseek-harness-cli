import assert from 'node:assert/strict'
import { attachPlainReporter } from '../lib/types/dsh-adapter/plainReporter.js'

const rows = []
const listeners = new Set()
const channel = {
  rows,
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
const emit = () => { for (const listener of listeners) listener() }
let output = ''
const detach = attachPlainReporter(channel, { write: text => { output += text } })

rows.push({ id: 1, kind: 'user', text: 'hello' })
emit()
rows.push({ id: 2, kind: 'reasoning', text: 'secret chain' })
emit()
rows.push({ id: 3, kind: 'assistant', text: 'hel', streaming: true })
emit()
rows[2].text = 'hello world'
emit()
rows.push({
  id: 4,
  kind: 'tool',
  text: '',
  tool: { callId: 'call-1', name: 'Read', argsText: '{}', status: 'running', startedAt: 0 },
})
emit()
rows[3].tool.status = 'ok'
rows[3].tool.resultText = 'file contents'
emit()
rows[2].streaming = false
emit()
emit()
detach()

assert.equal(output.match(/hello/g)?.length, 2, output)
assert.equal(output.match(/file contents/g)?.length, 1, output)
assert.equal(output.includes('secret chain'), false, output)
assert.equal(output.includes('\u001b['), false, output)
assert.equal(output, 'User: hello\nAssistant: hello world\nTool Read: file contents\n')

console.log('plain reporter OK (streaming deltas, tools, no reasoning or ANSI)')
