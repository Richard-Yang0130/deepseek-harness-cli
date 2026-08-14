export function commandCatalog(harness, terminal, skills = []) {
    const byName = new Map();
    for (const item of skills)
        byName.set(item.name, item);
    for (const item of terminal)
        byName.set(item.name, item);
    for (const item of harness) {
        byName.set(item.name, {
            name: item.name,
            description: item.description,
            ...(item.input === undefined ? {} : { hint: item.input.hint }),
            source: 'harness',
        });
    }
    const rank = { harness: 0, terminal: 1, skill: 2 };
    return [...byName.values()].sort((left, right) => rank[left.source] - rank[right.source] || left.name.localeCompare(right.name));
}
export function filterCommands(commands, input) {
    const query = input.startsWith('/') ? input.slice(1).trim().toLocaleLowerCase() : '';
    if (query === '')
        return [...commands];
    const names = commands.filter(command => command.name.toLocaleLowerCase().startsWith(query));
    if (names.length > 0)
        return names;
    return commands.filter(command => command.description.toLocaleLowerCase().includes(query));
}
//# sourceMappingURL=command-catalog.js.map