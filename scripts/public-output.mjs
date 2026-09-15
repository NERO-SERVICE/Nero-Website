import { readdir, readFile, lstat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { publishedPages, outputFile } from '../content/site.mjs';
import { publicAssetFiles } from '../content/public-assets.mjs';

export const runtimeScripts = Object.freeze(['analytics.js', 'home.js', 'landing.js', 'about.js', 'overview.js', 'announcement.js', 'components.js', 'scripts.js']);
const fixed = new Set([
    ...publicAssetFiles,
    ...publishedPages().map(outputFile), ...runtimeScripts.map((file) => `scripts/${file}`),
    'components/navbar.html', 'components/footer.html', 'data/announcements.json',
    'robots.txt', 'sitemap.xml', '_redirects', '_headers',
]);
const folders = new Set([...fixed].flatMap((path) => {
    const parts = path.split('/');
    return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'));
}));
export function isPublicOutput(path) {
    return fixed.has(path);
}
export async function readBuildSource(directory, path, encoding) {
    const parts = path.split('/');
    if (path.includes('\\') || parts.some((part) => !part || part.startsWith('.'))) throw new Error('Invalid build source path');
    // lstat each parent too: checking the leaf alone can follow a symlinked
    // assets/ or an intermediate directory outside the reviewed source tree.
    for (let index = 0; index <= parts.length; index += 1) {
        const relative = parts.slice(0, index).join('/');
        const stat = await lstat(resolve(directory, relative));
        if (stat.isSymbolicLink()) throw new Error(`Build source contains a symlink: ${relative || 'source root'}`);
        if (index === parts.length ? !stat.isFile() : !stat.isDirectory()) throw new Error(`Unexpected build source type: ${relative || 'source root'}`);
    }
    return readFile(resolve(directory, path), encoding);
}
const pick = (source, keys) => Object.fromEntries(keys.filter((key) => Object.hasOwn(source, key)).map((key) => [key, source[key]]));
export function publicAnnouncements(data) {
    return {
        announcements: data.announcements.filter((item) => item.status === 'active').map((item) => ({
            ...pick(item, ['id', 'title', 'type', 'date', 'content', 'isImportant', 'status']),
            ...(item.externalLink ? { externalLink: pick(item.externalLink, ['url', 'openInNewTab']) } : {}),
        })),
        settings: pick(data.settings || {}, ['postsPerPage']),
    };
}
export async function verifyPublicOutput(directory, env = {}) {
    const rootStat = await lstat(directory);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) throw new Error('Public output root must be a regular directory');
    // Never include a matching value in the error. Public verification tokens and
    // public IDs are not secrets. SMTP and CLI credentials must stay server-side.
    const secrets = Object.entries(env).filter(([key, value]) =>
        /(?:SECRET|PASSWORD|SMTP_PASS|PRIVATE_KEY|AUTH_TOKEN|SERVICE_ACCOUNT|API_KEY)/i.test(key)
        && typeof value === 'string' && value.length >= 4,
    ).map(([, value]) => Buffer.from(value));
    let count = 0;
    async function walk(folder = '') {
        for (const entry of await readdir(resolve(directory, folder), { withFileTypes: true })) {
            const path = folder ? `${folder}/${entry.name}` : entry.name;
            if (entry.isSymbolicLink()) throw new Error(`Public output contains a symlink: ${path}`);
            if (entry.isDirectory()) {
                if (!folders.has(path)) throw new Error(`Unexpected public output directory: ${path}`);
                await walk(path);
                continue;
            }
            if (!entry.isFile() || !isPublicOutput(path)) throw new Error(`Unexpected public output: ${path}`);
            const bytes = await readFile(resolve(directory, path));
            if (secrets.some((secret) => bytes.includes(secret)) || /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b/.test(bytes.toString('utf8'))) {
                throw new Error(`Sensitive content detected in public output: ${path}`);
            }
            count += 1;
        }
    }
    await walk();
    for (const path of fixed) {
        if (!(await lstat(resolve(directory, path))).isFile()) throw new Error(`Missing public output: ${path}`);
    }
    return count;
}
