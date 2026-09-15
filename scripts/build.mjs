import { writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, pages, publishedPages, outputFile, privatePaths, absoluteUrl } from '../content/site.mjs';
import { metadata, escapeHtml } from './seo-render.mjs';
import { renderLegacyPage, renderLegacyAnnouncements } from './prerender.mjs';
import { readBuildConfig } from './build-config.mjs';
import { runtimeScripts, publicAnnouncements, verifyPublicOutput, readBuildSource } from './public-output.mjs';
import { publicAssetFiles } from '../content/public-assets.mjs';

export const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const out = resolve(root, 'dist');
async function original(path, encoding) {
    return readBuildSource(root, path, encoding);
}
export function sitemapFor(registry, renderedPaths) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${registry.filter((page) => page.publicationStatus === 'published' && page.indexable && renderedPaths.has(page.path) && page.canonical === absoluteUrl(page.path)).map((page) => `  <url><loc>${escapeHtml(page.canonical)}</loc></url>`).join('\n')}\n</urlset>\n`;
}
export function redirectRules(registry) {
    const rules = [];
    for (const page of registry) {
        const file = `/${outputFile(page)}`;
        rules.push([file, page.path, 301]);
        if (page.path === '/') rules.push(['/pages/home.html', '/', 301], ['/pages/home', '/', 301]);
        else rules.push([file.replace(/\.html$/, ''), page.path, 301]);
        if (page.path === '/') rules.push(['/index', '/', 301]);
        else rules.push([`${page.path}.html`, page.path, 301], [page.path, file, 200]);
    }
    return rules;
}
function replaceHead(html, page, config) {
    // Keep the original browser title; additions only describe the existing page.
    if (!html.includes(`<title>${page.title}</title>`)) throw new Error(`Title registry differs from original page: ${page.path}`);
    return html.replace(/<title>[\s\S]*?<\/title>/gi, '')
        .replace(/<meta\s[^>]*(?:name="(?:description|robots)"|property="og:[^"]+")[^>]*>/gi, '')
        .replace(/<link\s[^>]*rel="canonical"[^>]*>/gi, '')
        .replace('</head>', `${metadata(page, config)}\n</head>`);
}
async function existingDocument(page, config, write) {
    let html = await original(`pages/${page.source}.html`, 'utf8');
    if (['home', 'landing', 'about', 'overview'].includes(page.source)) {
        const rendered = renderLegacyPage(page.source, await original(`scripts/${page.source}.js`, 'utf8'));
        // The unchanged original JS inserts its header, then replaces main. Keep
        // the static header inside main so that replacement removes it as well.
        html = html.replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/, (_, start, end) => `${start}${rendered.header}${rendered.main}${end}`);
    } else if (page.source === 'services') {
        for (const component of ['navbar', 'footer']) {
            const componentHtml = await original(`components/${component}.html`, 'utf8');
            html = html.replace(`<div id="${component}-container"></div>`, () => `<div id="${component}-container">${componentHtml}</div>`);
        }
    } else if (page.source === 'announcement') {
        const data = JSON.parse(await original('data/announcements.json', 'utf8'));
        const publicData = publicAnnouncements(data);
        const rendered = renderLegacyAnnouncements(await original('scripts/announcement.js', 'utf8'), publicData.announcements, publicData.settings);
        // Do not insert a header here: the original header guard also wires the
        // mobile drawer. Cards retain the original preview and modal buttons.
        html = html.replace(/(<div id="announcements-list"[^>]*>)[\s\S]*?(?=\s*<ul class="pagination")/, (_, start) => `${start}${rendered.main}</div>`);
        await write('data/announcements.json', JSON.stringify(publicData, null, 2));
    }
    return replaceHead(html, page, config);
}
export async function build({ outDir = out, env = process.env, envFile = resolve(root, '.env') } = {}) {
    const config = await readBuildConfig({ env, envFile });
    const outputDir = resolve(outDir);
    const write = async (path, content) => {
        await mkdir(dirname(resolve(outputDir, path)), { recursive: true });
        await writeFile(resolve(outputDir, path), content);
    };
    const published = publishedPages();
    const paths = new Set();
    const outputs = new Set();
    for (const page of pages) {
        if (!/^\/(?:[a-z0-9-]+)?$/.test(page.path) || paths.has(page.path)) throw new Error(`Invalid/duplicate existing route: ${page.path}`);
        if (!page.title || !page.description || page.canonical !== absoluteUrl(page.path)) throw new Error(`Invalid metadata: ${page.path}`);
        if (outputs.has(outputFile(page))) throw new Error(`Duplicate output: ${outputFile(page)}`);
        outputs.add(outputFile(page));
        paths.add(page.path);
    }
    // Only this generated directory is cleaned, never the original website.
    if (outputDir === out) {
        await rm(out, { recursive: true, force: true });
        await mkdir(out, { recursive: true });
    } else {
        // Test outputs must be new directories: never erase an arbitrary path.
        await mkdir(outputDir);
    }
    for (const path of publicAssetFiles) await write(path, await original(path));
    for (const file of runtimeScripts) await write(`scripts/${file}`, await original(`scripts/${file}`));
    for (const component of ['navbar', 'footer']) {
        await write(`components/${component}.html`, await original(`components/${component}.html`));
    }
    const renderedPaths = new Set();
    for (const page of published) {
        await write(outputFile(page), await existingDocument(page, config, write));
        renderedPaths.add(page.path);
    }
    await write('sitemap.xml', sitemapFor(config.indexable ? pages : [], renderedPaths));
    await write('robots.txt', `User-agent: *\n${privatePaths.map((path) => `Disallow: ${path}`).join('\n')}\n\nSitemap: ${site.origin}/sitemap.xml\n`);
    await write('_redirects', `# Generated from existing routes in content/site.mjs.\n${redirectRules(published).map(([from, to, status]) => `${from} ${to} ${status}!`).join('\n')}\n`);
    await write('_headers', (config.indexable ? '' : '/*\n  X-Robots-Tag: noindex, follow\n') + '/robots.txt\n  Content-Type: text/plain; charset=utf-8\n/sitemap.xml\n  Content-Type: application/xml; charset=utf-8\n');
    // Netlify keeps its existing default 404; no additional page is generated.
    const publicFileCount = await verifyPublicOutput(outputDir, env);
    console.log(`Built ${renderedPaths.size} existing pages; sitemap has ${config.indexable ? published.filter((p) => p.indexable).length : 0} URLs; ${publicFileCount} public files verified.`);
    return { outputDir, indexable: config.indexable, publicFileCount };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
