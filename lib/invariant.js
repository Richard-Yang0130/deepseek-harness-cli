export const name = 'tui-invariant';
export const inject = ['invariants'];
export const apply = (ctx) => {
    const invariants = ctx.get('invariants');
    return Promise.resolve(invariants.register('deepseek-harness-cli', () => { }));
};
//# sourceMappingURL=invariant.js.map