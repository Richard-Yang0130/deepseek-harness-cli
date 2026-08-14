import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export function parseLatestChangelogEntry(markdown) {
    const lines = markdown.split(/\r?\n/);
    const headingIndex = lines.findIndex(line => /^##\s+\S+\s+—\s+\S+/.test(line));
    if (headingIndex < 0)
        return undefined;
    const match = /^##\s+(\S+)\s+—\s+\S+/.exec(lines[headingIndex]);
    if (match === null)
        return undefined;
    const bullets = [];
    for (const line of lines.slice(headingIndex + 1)) {
        if (line.startsWith('## '))
            break;
        if (line.startsWith('- ')) {
            bullets.push(line.slice(2));
            if (bullets.length === 3)
                break;
            continue;
        }
        if (line.trim() !== '' || bullets.length > 0)
            break;
    }
    if (bullets.length === 0)
        return undefined;
    return { version: match[1], bullets };
}
function defaultPackageRoot() {
    return dirname(dirname(fileURLToPath(import.meta.url)));
}
export async function readBannerFacts(packageRoot = defaultPackageRoot()) {
    let version;
    try {
        const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
        if (typeof manifest.version === 'string')
            version = manifest.version;
    }
    catch {
        // Startup facts are optional; a missing or malformed manifest must not block the UI.
    }
    let latest;
    try {
        latest = parseLatestChangelogEntry(await readFile(join(packageRoot, 'CHANGELOG.md'), 'utf8'));
    }
    catch {
        // The welcome box still renders without release notes.
    }
    return {
        ...(version === undefined ? {} : { version }),
        ...(latest === undefined ? {} : { latest }),
    };
}
//# sourceMappingURL=banner-facts.js.map