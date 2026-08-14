import type { Context } from '@deepseek-ai/cordis'

export const name = 'tui-invariant'
export const inject = ['invariants']

export const apply = (ctx: Context): Promise<() => void> => {
  const invariants = ctx.get('invariants') as { register(name: string, install: () => void): () => void }
  return Promise.resolve(invariants.register('deepseek-harness-cli', () => {}))
}
