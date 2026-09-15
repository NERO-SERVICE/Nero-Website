import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile, readdir } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { site, pages, publishedPages, outputFile, absoluteUrl, privatePaths, developmentService } from '../content/site.mjs';
import { out, redirectRules, sitemapFor } from '../scripts/build.mjs';
import { serializeJsonLd } from '../scripts/seo-render.mjs';
import { createPreviewServer } from '../scripts/preview.mjs';

// Exercise production HTTP HTML without executing browser JavaScript or sending mail.
const expectedPaths = [
    '/', '/landing', '/about', '/overview', '/services', '/announcement',
];
const published = publishedPages();
const server = createPreviewServer();
const responses = new Map();
let previewOrigin;

const decode = (value) => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, name) => {
    if (name.startsWith('#')) return String.fromCodePoint(name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1)));
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[name.toLowerCase()] ?? entity;
});
const plainText = (html) => decode(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
function tags(html, wanted) {
    const matches = [];
    for (const match of html.matchAll(/<([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)) {
        if (wanted && match[1].toLowerCase() !== wanted) continue;
        const attributes = {};
        for (const attr of match[2].matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
            attributes[attr[1].toLowerCase()] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
        }
        matches.push({ tagName: match[1].toLowerCase(), ...attributes });
    }
    return matches;
}
const meta = (html, key, value) => tags(html, 'meta').filter((tag) => tag[key] === value).map((tag) => tag.content);
const canonical = (html) => tags(html, 'link').filter((tag) => tag.rel === 'canonical').map((tag) => tag.href);

async function get(path) {
    if (!responses.has(path)) responses.set(path, (async () => {
        const response = await fetch(`${previewOrigin}${path}`, { redirect: 'manual' });
        const type = response.headers.get('content-type') ?? '';
        const bytes = await response.arrayBuffer();
        return {
            status: response.status,
            headers: response.headers,
            type,
            body: /text|javascript|json|xml/.test(type) ? new TextDecoder().decode(bytes) : '',
        };
    })());
    return responses.get(path);
}

before(async () => {
    await readFile(`${out}/sitemap.xml`); // npm test builds first; never build or mutate source in these tests.
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    previewOrigin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
    server.closeAllConnections();
    if (server.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('all 6 existing canonical routes return complete initial HTTP HTML with unique metadata', async () => {
    assert.deepEqual(published.map((page) => page.path).sort(), [...expectedPaths].sort());
    const titles = new Set();
    const descriptions = new Set();
    for (const page of published) {
        const response = await get(page.path);
        assert.equal(response.status, 200, page.path);
        assert.match(response.type, /^text\/html\b/, page.path);
        const html = response.body;
        const foundTitles = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => plainText(match[1]));
        const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => plainText(match[1]));
        assert.deepEqual(foundTitles, [page.title], `${page.path} title`);
        assert.deepEqual(meta(html, 'name', 'description'), [page.description], `${page.path} description`);
        assert.deepEqual(meta(html, 'property', 'og:description'), [page.description], `${page.path} shared description`);
        assert.deepEqual(canonical(html), [absoluteUrl(page.path)], `${page.path} canonical`);
        assert.deepEqual(meta(html, 'property', 'og:url'), [page.canonical], `${page.path} og:url`);
        const originalH1Count = ['/overview', '/services'].includes(page.path) ? 0 : 1;
        assert.equal(headings.length, originalH1Count, `${page.path} preserves original H1 count`);
        if (originalH1Count) assert.ok(headings[0].length > 0, `${page.path} H1 text`);
        if (page.h1) assert.equal(headings[0], page.h1, `${page.path} visible heading`);
        const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
        assert.ok(plainText(main).length > 50, `${page.path} initial main text`);
        assert.ok(tags(html, 'a').some((tag) => tag.href), `${page.path} initial main links`);
        const robots = meta(html, 'name', 'robots').join(',');
        assert.equal(/\bnoindex\b/i.test(robots), !page.indexable, `${page.path} index policy`);
        assert.ok(!titles.has(foundTitles[0]), `${page.path} has a unique title`);
        assert.ok(!descriptions.has(page.description), `${page.path} has a unique description`);
        titles.add(foundTitles[0]);
        descriptions.add(page.description);
        const jsonScripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
        assert.equal(jsonScripts.length, 1, `${page.path} JSON-LD`);
        const schema = JSON.parse(jsonScripts[0][1]);
        assert.equal(schema['@context'], 'https://schema.org');
        const webpage = schema['@graph'].find((node) => node['@type'] === 'WebPage');
        assert.equal(webpage?.url, page.canonical);
        assert.equal(webpage?.name, page.title);
        assert.equal(webpage?.description, page.description);
        const organization = schema['@graph'].find((node) => node['@type'] === 'Organization');
        assert.equal(organization?.email, site.email);
        assert.equal(organization?.url, absoluteUrl('/'));
        const services = schema['@graph'].filter((node) => node['@type'] === 'Service');
        assert.equal(services.length, page.developmentService ? 1 : 0);
        if (page.developmentService) {
            const service = services[0];
            assert.equal(service.name, developmentService.name);
            assert.equal(service.description, developmentService.description);
            assert.equal(service.url, absoluteUrl('/'));
            assert.equal(service.provider['@id'], organization['@id']);
            assert.equal(webpage.about['@id'], service['@id']);
            for (const fact of ['외주개발', '앱개발', 'iOS', 'Android', '서버', 'DB', 'API', '관리자', '배포']) {
                assert.ok(plainText(main).includes(fact), `${page.path} body supports ${fact}`);
            }
        }
        if (page.aboutOrganization) assert.equal(webpage.mainEntity['@id'], organization['@id']);
        assert.ok(!meta(html, 'name', 'keywords').length);
        const searchMetadata = `${meta(html, 'name', 'description')} ${meta(html, 'property', 'og:description')} ${JSON.stringify(schema)}`;
        assert.doesNotMatch(searchMetadata, /모두의\s*창업|사주\s*앱|디지털\s*노마드|AggregateRating|Review|\"(?:award|funder|sponsor|memberOf|offers|keywords|knowsAbout)\"/);
    }
});

test('search descriptions stay grounded in each page body without turning grant history into service affiliation', async () => {
    const mainText = (html) => plainText(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '');
    const home = (await get('/')).body;
    const description = meta(home, 'name', 'description')[0];
    assert.match(description, /앱외주개발/);
    assert.match(description, /iOS\s*앱/);
    assert.match(description, /Android\s*앱개발/);
    assert.match(mainText(home), /iOS·Android 앱서비스/);

    const landing = (await get('/landing')).body;
    assert.match(meta(landing, 'name', 'description')[0], /지원사업.*MVP\/PoC/);
    assert.match(mainText(landing), /지원사업과 초기 검증에 필요한 MVP/);

    const about = (await get('/about')).body;
    assert.match(meta(about, 'name', 'description')[0], /정부지원사업.*2025 예비창업패키지 수료/);
    assert.match(mainText(about), /2025 예비창업패키지 수료/);
    assert.match(mainText(about), /중소벤처기업부 창업사업화 지원사업/);
    for (const path of expectedPaths) {
        const html = (await get(path)).body;
        const schema = JSON.parse(html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)[1]);
        for (const entity of schema['@graph'].filter((node) => node['@type'] !== 'WebPage')) {
            assert.doesNotMatch(JSON.stringify(entity), /정부지원사업|예비창업패키지/, `${path} does not claim grant service affiliation`);
        }
        if (!['/', '/landing', '/about'].includes(path)) {
            assert.doesNotMatch(meta(html, 'name', 'description')[0], /앱외주개발|정부지원사업|지원사업.*MVP/, `${path} retains its original topic`);
        }
    }
});

test('sitemap is XML containing exactly the 6 public indexable canonical 200 URLs', async () => {
    const response = await get('/sitemap.xml');
    assert.equal(response.status, 200);
    assert.match(response.type, /^application\/xml\b/);
    assert.match(response.body, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(response.body, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    const urls = [...response.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
    assert.equal(urls.length, 6);
    assert.equal(new Set(urls).size, urls.length);
    assert.deepEqual([...urls].sort(), published.filter((page) => page.indexable).map((page) => page.canonical).sort());
    for (const url of urls) {
        const target = new URL(url);
        assert.equal(target.origin, site.origin);
        assert.equal(target.search, '');
        assert.equal(target.hash, '');
        const page = await get(target.pathname);
        assert.equal(page.status, 200, `${url} is not a redirect, unpublished page, or error`);
        assert.deepEqual(canonical(page.body), [url]);
        assert.ok(!meta(page.body, 'name', 'robots').some((value) => /noindex/i.test(value)));
    }
});

test('robots is plain text and retains the declared private path policy', async () => {
    const response = await get('/robots.txt');
    assert.equal(response.status, 200);
    assert.match(response.type, /^text\/plain\b/);
    assert.match(response.body, /^User-agent: \*$/m);
    assert.ok(response.body.includes(`Sitemap: ${site.origin}/sitemap.xml`));
    for (const path of privatePaths) assert.ok(response.body.includes(`Disallow: ${path}\n`), path);
    assert.doesNotMatch(response.body, /<html|User-agent:\s*(?:GPTBot|Google-Extended)|^Allow:/im);
});

test('unknown routes and internal source paths return real noindex 404 responses', async () => {
    const hidden = [
        '/services/research-platform', '/services/startup-mvp', '/services/maintenance',
        '/guides', '/guides/mvp-cost', '/guides/research-app-checklist', '/guides/software-handover', '/404.html',
        '/not-a-published-page-2049', '/services/not-published', '/guides/draft', '/contact',
        '/docs/seo/initial-audit.md', '/seo-kit/README.md', '/.env', '/.git/config',
        '/content/site.mjs', '/content/seo-pages.mjs', '/netlify/functions/contact.js',
        '/content/public-assets.mjs', '/CLAUDE.md', '/GOOGLE_ANALYTICS_4.md',
        '/assets/img/landing/README.md', '/assets/internal-notes.svg', '/css/private.css',
        '/netlify/plugins/public-deploy/index.js', '/netlify/plugins/public-deploy/manifest.yml',
        '/tests/contact.test.cjs', '/tests/seo.test.mjs', '/test-results/report.html',
        '/scripts/build.mjs', '/scripts/preview.mjs', '/scripts/local-dev-server.mjs',
        '/scripts/build-config.mjs', '/scripts/public-output.mjs', '/scripts/seo-render.mjs', '/scripts/verify-deploy.mjs', '/package.json', '/netlify.toml', '/_redirects', '/_headers',
    ];
    for (const path of hidden) {
        const response = await get(path);
        assert.equal(response.status, 404, path);
        assert.match(response.type, /^text\/plain\b/, path);
        assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/, path);
        assert.equal(response.body, 'Not found', path);
        assert.doesNotMatch(response.body, /id="contact-form"|class="hero-title"/, `${path} must not fall back to the home page`);
    }
    const files = await readdir(out, { recursive: true });
    assert.ok(files.includes('index.html'));
    assert.ok(files.includes('_redirects'));
    for (const file of files) {
        assert.doesNotMatch(file, /^(?:docs|seo-kit|tests|test-results|content|netlify|firebase|\.git)(?:\/|$)/, file);
        assert.doesNotMatch(file, /(?:^|\/)(?:\.env[^/]*|AGENTS\.md|CLAUDE\.md|package(?:-lock)?\.json)$|\.(?:md|map)$/i, file);
    }
});

test('every internal initial-HTML href, image, source and script resolves, without adding links', async () => {
    let checked = 0;
    for (const page of published) {
        const html = (await get(page.path)).body;
        for (const tag of tags(html)) {
            const references = [tag.href, tag.src, ...(tag.srcset ? tag.srcset.split(',').map((part) => part.trim().split(/\s+/)[0]) : [])].filter(Boolean);
            for (const reference of references) {
                if (/^(?:mailto|tel|data|javascript):/i.test(reference)) continue;
                const url = new URL(reference, page.canonical);
                if (url.origin !== site.origin) continue;
                const target = await get(`${url.pathname}${url.search}`);
                assert.equal(target.status, 200, `${page.path}: ${tag.tagName} references ${reference}`);
                checked += 1;
            }
        }
    }
    assert.ok(checked > 100, 'the crawl inspected actual page navigation and assets');
});

test('legacy file aliases redirect once to the canonical route and preserve query parameters', async () => {
    const aliases = redirectRules(published).filter(([, , status]) => status === 301);
    const query = '?utm_source=seo-test&campaign=review%20only';
    for (const [from, to] of aliases) {
        const response = await get(`${from}${query}`);
        assert.equal(response.status, 301, from);
        assert.equal(response.headers.get('location'), `${to}${query}`, from);
        assert.equal((await get(`${to}${query}`)).status, 200, `${from} redirects once`);
    }
    for (const page of published) {
        assert.ok(aliases.some(([from, to]) => from === `/${outputFile(page)}` && to === page.path));
        assert.ok(aliases.some(([from, to]) => from === `/${outputFile(page).replace(/\.html$/, '')}` && to === page.path));
    }
});

test('runtime module imports are public JavaScript responses', async () => {
    const scripts = (await readdir(`${out}/scripts`, { recursive: true })).filter((file) => /\.(?:m?js)$/.test(file));
    for (const script of scripts) {
        const path = `/scripts/${script}`;
        const response = await get(path);
        assert.equal(response.status, 200, path);
        assert.match(response.type, /^(?:text|application)\/javascript\b/, path);
        for (const match of response.body.matchAll(/\b(?:import|export)\s+[^;]*?\bfrom\s*["']([^"']+)["']/g)) {
            const url = new URL(match[1], `${site.origin}${path}`);
            assert.equal(url.origin, site.origin, `${path} uses existing local modules`);
            const imported = await get(url.pathname);
            assert.equal(imported.status, 200, `${path} imports ${match[1]}`);
            assert.match(imported.type, /^(?:text|application)\/javascript\b/);
        }
    }
});

test('sitemap generation excludes draft, noindex, other canonical and missing output entries', () => {
    const fixture = (path, values = {}) => ({ path, publicationStatus: 'published', indexable: true, canonical: absoluteUrl(path), ...values });
    const registry = [
        fixture('/ready', { modifiedAt: '2026-09-14' }),
        fixture('/draft', { publicationStatus: 'draft' }),
        fixture('/private', { indexable: false }),
        fixture('/duplicate', { canonical: absoluteUrl('/ready') }),
        fixture('/external', { canonical: 'https://example.org/external' }),
        fixture('/not-rendered'),
    ];
    const xml = sitemapFor(registry, new Set(registry.filter((page) => page.path !== '/not-rendered').map((page) => page.path)));
    assert.deepEqual([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1])), [absoluteUrl('/ready')]);
    assert.doesNotMatch(xml, /lastmod/);
    assert.ok(pages.every((page) => page.canonical.startsWith(`${site.origin}/`)));
});

test('JSON-LD serialization cannot close its script element and retains original values', () => {
    const input = { text: '</script><script>alert("example")</script>&\u2028\u2029', nested: ['<tag>', '한글', '"'] };
    const serialized = serializeJsonLd(input);
    assert.doesNotMatch(serialized, /[<>&\u2028\u2029]/);
    assert.deepEqual(JSON.parse(serialized), input);
    assert.match(serialized, /\\u003c\/script\\u003e/);
});


test('the public build preserves original CSS, scripts, assets and component files', async () => {
    const files = await readdir(out, { recursive: true });
    const htmlPages = files.filter((path) => path.endsWith('.html') && !path.startsWith('components/'));
    assert.deepEqual(htmlPages.sort(), published.map(outputFile).sort());
    assert.ok(!files.some((path) => path.includes('seo.css') || path.includes('templates/')));
    for (const directory of ['css', 'scripts', 'assets', 'components']) {
        for (const path of files.filter((name) => name.startsWith(`${directory}/`) && /\.[a-z0-9]+$/i.test(name))) {
            const [original, built] = await Promise.all([readFile(path), readFile(`${out}/${path}`)]);
            assert.deepEqual(built, original, path);
        }
    }
    for (const page of published) {
        const original = await readFile(`pages/${page.source}.html`, 'utf8');
        const html = (await get(page.path)).body;
        const resources = (body) => tags(body).filter((tag) => tag.tagName === 'script' && tag.src || tag.tagName === 'link' && tag.rel === 'stylesheet');
        assert.deepEqual(resources(html), resources(original), `${page.path} retains original scripts and CSS`);
        assert.doesNotMatch(html, /seo-discovery|seo-card|skip-link|no-js|\/guides(?:["/])|\/services\/(?:research-platform|startup-mvp|maintenance)/);
    }
});
