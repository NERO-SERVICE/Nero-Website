import { createServer } from 'node:http';
import { readFile, lstat, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedPages, outputFile } from '../content/site.mjs';
import { redirectRules } from './build.mjs';
import { isPublicOutput } from './public-output.mjs';

const rootDir = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
export function createPreviewServer({ directory = rootDir } = {}) {
    const publicDir = resolve(directory);
    const published = publishedPages();
    const aliases = new Map(redirectRules(published).filter(([, , status]) => status === 301).map(([from, to]) => [from, to]));
    const routes = new Map(published.map((page) => [page.path, outputFile(page)]));
    return createServer(async (request, response) => {
        try {
            const url = new URL(request.url, 'http://localhost');
            let path;
            try { path = decodeURIComponent(url.pathname); } catch { response.writeHead(400); response.end('Bad request'); return; }
            const normalized = path.replace(/\/+$/, '') || '/';
            if (normalized.startsWith('/.netlify/functions/')) {
                response.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
                response.end(JSON.stringify({ ok: false, message: 'Production preview does not send mail. Use mocked tests.' }));
                return;
            }
            if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
            if (aliases.has(normalized)) { response.writeHead(301, { Location: `${aliases.get(normalized)}${url.search}` }); response.end(); return; }
            const relative = routes.get(normalized) || normalized.slice(1);
            const file = resolve(publicDir, relative);
            // Serve only generated public files; never expose _redirects/_headers or source roots.
            let available = isPublicOutput(relative) && file.startsWith(`${publicDir}${sep}`) && !relative.split('/').some((part) => part.startsWith('.') || part.startsWith('_')) && normalized !== '/404.html';
            if (available) {
                try {
                    available = (await lstat(file)).isFile() && (await realpath(file)).startsWith(`${await realpath(publicDir)}${sep}`);
                } catch { available = false; }
            }
            const generatedHeaders = await readFile(resolve(publicDir, '_headers'), 'utf8');
            const previewNoindex = /^\/\*\r?\n[ \t]+X-Robots-Tag:[^\n]*noindex/m.test(generatedHeaders);
            const status = available ? 200 : 404;
            const bytes = available ? await readFile(file) : 'Not found';
            response.writeHead(status, { 'Content-Type': available ? (types[extname(file)] || 'application/octet-stream') : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...(status === 404 || previewNoindex ? { 'X-Robots-Tag': 'noindex, follow' } : {}) });
            response.end(request.method === 'HEAD' ? undefined : bytes);
        } catch (error) {
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end('Build the site before starting preview.');
        }
    });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const port = Number(process.env.PORT || 4173);
    createPreviewServer().listen(port, '127.0.0.1', () => console.log(`NERO production preview: http://127.0.0.1:${port} (mail disabled)`));
}
