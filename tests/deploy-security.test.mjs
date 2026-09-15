import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';
import { build } from '../scripts/build.mjs';
import { createPreviewServer } from '../scripts/preview.mjs';
import { publicAnnouncements, verifyPublicOutput } from '../scripts/public-output.mjs';

// All environment values and dotenv files in this suite are synthetic. These
// isolated builds never read the repository .env or execute a mail function.
const canonicalOrigin = 'https://www.nero.ai.kr';
const routes = ['/', '/landing', '/about', '/overview', '/services', '/announcement'];
const tokens = {
    'google-site-verification': 'test_google_verification_token',
    'naver-site-verification': 'test_naver_verification_token',
    'msvalidate.01': 'test_bing_verification_token',
};
const dummyEnv = Object.freeze({
    NERO_GOOGLE_SITE_VERIFICATION: tokens['google-site-verification'],
    SMTP_PASS: 'test_only_smtp_password_not_a_credential',
    NETLIFY_AUTH_TOKEN: 'test_only_netlify_token_not_a_credential',
    URL: 'https://test-only-site.netlify.app',
    DEPLOY_URL: 'https://test-only-hash--site.netlify.app',
    DEPLOY_PRIME_URL: 'https://test-only-branch--site.netlify.app',
    NON_PUBLIC_BUILD_VALUE: 'test_only_unallowlisted_build_value',
});
const fileOnlySecret = 'test_only_file_password_not_a_credential';
const artifacts = new Map();
let temporaryRoot;
let envFile;
let fixtureNumber = 0;

function attributes(tag) {
    return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
        .map((match) => [match[1].toLowerCase(), match[2] ?? match[3]]));
}
function metaValues(html, attribute, name) {
    return [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => attributes(match[0]))
        .filter((tag) => tag[attribute] === name).map((tag) => tag.content);
}
function assertFixedCanonical(html, path) {
    const expected = `${canonicalOrigin}${path}`;
    const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => attributes(match[0]))
        .filter((tag) => tag.rel === 'canonical').map((tag) => tag.href);
    assert.deepEqual(canonicals, [expected]);
    assert.deepEqual(metaValues(html, 'property', 'og:url'), [expected]);
    const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    assert.equal(scripts.length, 1);
    const graph = JSON.parse(scripts[0][1])['@graph'];
    assert.equal(graph.find((node) => node['@type'] === 'WebPage')?.url, expected);
    for (const node of graph) {
        if (node.url) assert.equal(new URL(node.url).origin, canonicalOrigin);
        if (node['@id']) assert.equal(new URL(node['@id']).origin, canonicalOrigin);
    }
    for (const deploymentUrl of [dummyEnv.URL, dummyEnv.DEPLOY_URL, dummyEnv.DEPLOY_PRIME_URL]) {
        assert.equal(html.includes(deploymentUrl), false, 'deployment URLs must not enter page metadata');
    }
}
function sitemapUrls(xml) {
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">\s*(?:<url><loc>https:\/\/[^<]+<\/loc><\/url>\s*)*<\/urlset>\s*$/);
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}
async function get(artifact, path) {
    const response = await fetch(`${artifact.origin}${path}`, { redirect: 'manual' });
    return { status: response.status, headers: response.headers, body: await response.text() };
}
async function publicFiles(directory) {
    const files = [];
    async function visit(relative = '') {
        for (const entry of await readdir(join(directory, relative), { withFileTypes: true })) {
            const path = join(relative, entry.name);
            if (entry.isDirectory()) await visit(path);
            else files.push(path);
        }
    }
    await visit();
    return files;
}
async function rejectionFixture(path, content) {
    const directory = join(temporaryRoot, `rejection-${fixtureNumber++}`);
    await mkdir(dirname(join(directory, path)), { recursive: true });
    await writeFile(join(directory, path), content);
    return directory;
}
function sanitizedError(pattern, forbidden = []) {
    return (error) => {
        assert.match(error.message, pattern);
        for (const value of forbidden) {
            assert.equal(String(error.stack).includes(value), false, 'error output must omit sensitive fixture contents');
        }
        return true;
    };
}

before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'nero-deploy-security-'));
    envFile = join(temporaryRoot, 'fixture.env');
    await writeFile(envFile, [
        'NERO_GOOGLE_SITE_VERIFICATION=file_google_value_overridden_by_env',
        `NERO_NAVER_SITE_VERIFICATION=${tokens['naver-site-verification']}`,
        `NERO_BING_SITE_VERIFICATION=${tokens['msvalidate.01']}`,
        `SMTP_PASS=${fileOnlySecret}`,
        'CONTEXT=production',
        'URL=https://test-only-dotenv.netlify.app',
        '',
    ].join('\n'));
    // Bind actual servers before building so a missing localhost permission
    // fails immediately. No fabricated response substitutes for HTTP coverage.
    for (const context of ['production', 'branch-deploy', 'deploy-preview']) {
        const directory = join(temporaryRoot, context);
        const server = createPreviewServer({ directory });
        const artifact = { directory, server };
        artifacts.set(context, artifact);
        server.listen(0, '127.0.0.1');
        await once(server, 'listening');
        artifact.origin = `http://127.0.0.1:${server.address().port}`;
    }
    for (const [context, artifact] of artifacts) {
        artifact.result = await build({ outDir: artifact.directory, env: { ...dummyEnv, CONTEXT: context }, envFile });
    }
});

after(async () => {
    for (const { server } of artifacts.values()) {
        server.closeAllConnections();
        if (server.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
});

test('production build publishes three verification tokens and six fixed canonical URLs without environment leakage', async () => {
    const artifact = artifacts.get('production');
    assert.deepEqual(Object.keys(artifact.result).sort(), ['indexable', 'outputDir', 'publicFileCount']);
    assert.equal(artifact.result.outputDir, artifact.directory);
    assert.equal(artifact.result.indexable, true);
    for (const path of routes) {
        const response = await get(artifact, path);
        assert.equal(response.status, 200, path);
        assert.match(response.headers.get('content-type'), /^text\/html\b/);
        assert.equal(response.headers.get('x-robots-tag'), null);
        assert.deepEqual(metaValues(response.body, 'name', 'robots'), ['index, follow, max-image-preview:large']);
        for (const [name, value] of Object.entries(tokens)) assert.deepEqual(metaValues(response.body, 'name', name), [value]);
        assertFixedCanonical(response.body, path);
    }
    const sitemap = await get(artifact, '/sitemap.xml');
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get('content-type'), /^application\/xml\b/);
    assert.deepEqual(sitemapUrls(sitemap.body).sort(), routes.map((path) => `${canonicalOrigin}${path}`).sort());
    const files = await publicFiles(artifact.directory);
    assert.equal(files.length, artifact.result.publicFileCount);
    const forbiddenValues = [
        ...Object.entries(dummyEnv).filter(([key]) => !key.startsWith('NERO_')).map(([, value]) => value),
        fileOnlySecret, 'file_google_value_overridden_by_env', 'https://test-only-dotenv.netlify.app',
    ];
    for (const file of files) {
        const bytes = await readFile(join(artifact.directory, file));
        for (const value of forbiddenValues) assert.equal(bytes.includes(Buffer.from(value)), false, `${file} excludes non-public build values`);
    }
    assert.equal(await verifyPublicOutput(artifact.directory, dummyEnv), files.length);
});

for (const context of ['branch-deploy', 'deploy-preview']) {
    test(`${context} build serves noindex HTML and HTTP headers with an empty sitemap and unchanged robots policy`, async () => {
        const artifact = artifacts.get(context);
        assert.equal(artifact.result.indexable, false);
        const headers = await readFile(join(artifact.directory, '_headers'), 'utf8');
        assert.match(headers, /^\/\*\n  X-Robots-Tag: noindex, follow\n/);
        for (const path of routes) {
            const response = await get(artifact, path);
            assert.equal(response.status, 200, path);
            assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
            assert.deepEqual(metaValues(response.body, 'name', 'robots'), ['noindex, follow']);
            for (const name of Object.keys(tokens)) assert.deepEqual(metaValues(response.body, 'name', name), []);
            assertFixedCanonical(response.body, path);
        }
        const sitemap = await get(artifact, '/sitemap.xml');
        assert.equal(sitemap.status, 200);
        assert.match(sitemap.headers.get('content-type'), /^application\/xml\b/);
        assert.equal(sitemap.headers.get('x-robots-tag'), 'noindex, follow');
        assert.deepEqual(sitemapUrls(sitemap.body), []);
        const robots = await get(artifact, '/robots.txt');
        const productionRobots = await get(artifacts.get('production'), '/robots.txt');
        assert.equal(robots.status, 200);
        assert.match(robots.headers.get('content-type'), /^text\/plain\b/);
        assert.equal(robots.headers.get('x-robots-tag'), 'noindex, follow');
        assert.equal(robots.body, productionRobots.body);
        for (const [path, status] of [['/scripts/home.js', 200], ['/unpublished-test-path', 404]]) {
            const response = await get(artifact, path);
            assert.equal(response.status, status);
            assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
        }
    });
}

test('custom build output refuses an existing directory without deleting its contents', async () => {
    const directory = await rejectionFixture('keep.txt', 'Existing directory must remain intact.');
    await assert.rejects(build({ outDir: directory, env: dummyEnv, envFile }), { code: 'EEXIST' });
    assert.equal(await readFile(join(directory, 'keep.txt'), 'utf8'), 'Existing directory must remain intact.');
    assert.deepEqual(await readdir(directory), ['keep.txt']);
});

test('public announcement projection removes drafts and private root, post, link, and settings fields', () => {
    const input = {
        internalNotes: 'private-root-fixture',
        announcements: [
            {
                id: 'public', title: 'Published fixture', type: 'news', date: '2026-01-01',
                content: 'Existing public content.', isImportant: false, status: 'active',
                privateNotes: 'private-post-fixture',
                externalLink: { url: 'https://example.com/public', openInNewTab: true, auth: { token: 'private-link-fixture' } },
            },
            { id: 'draft', title: 'private-draft-fixture', status: 'draft', content: 'Unpublished content.' },
            { id: 'inactive', title: 'private-inactive-fixture', status: 'inactive' },
        ],
        settings: { postsPerPage: 6, admin: { email: 'private-settings-fixture' } },
    };
    const original = structuredClone(input);
    const result = publicAnnouncements(input);
    assert.deepEqual(result, {
        announcements: [{
            id: 'public', title: 'Published fixture', type: 'news', date: '2026-01-01',
            content: 'Existing public content.', isImportant: false, status: 'active',
            externalLink: { url: 'https://example.com/public', openInNewTab: true },
        }],
        settings: { postsPerPage: 6 },
    });
    assert.doesNotMatch(JSON.stringify(result), /private-|Unpublished/);
    assert.deepEqual(input, original, 'projection must not mutate source data');
});

test('public output verifier rejects internal files even when their contents are harmless', async () => {
    for (const path of ['.env', 'CLAUDE.md', 'GOOGLE_ANALYTICS_4.md', 'docs/notes.md', 'seo-kit/README.md', 'tests/private.test.mjs', 'netlify/functions/contact.js', 'scripts/build.mjs', 'assets/img/landing/README.md', 'assets/internal-notes.svg', 'css/private.css']) {
        const directory = await rejectionFixture(path, 'harmless internal fixture');
        await assert.rejects(verifyPublicOutput(directory, {}), sanitizedError(/Unexpected public output(?: directory)?:/));
    }
});

test('public output verifier rejects symlinks without reading the linked target', async () => {
    const directory = join(temporaryRoot, `rejection-${fixtureNumber++}`);
    await mkdir(join(directory, 'assets'), { recursive: true });
    const targetContents = 'test_only_private_symlink_target_contents';
    const target = join(temporaryRoot, 'private-target.svg');
    await writeFile(target, targetContents);
    await symlink(target, join(directory, 'assets', 'linked.svg'));
    await assert.rejects(verifyPublicOutput(directory, {}), sanitizedError(/Public output contains a symlink:/, [targetContents]));
});

test('public output verifier rejects a dummy SMTP password without exposing the value in its error', async () => {
    const secret = dummyEnv.SMTP_PASS;
    const directory = await rejectionFixture('css/styles.css', `/* ${secret} */`);
    await assert.rejects(verifyPublicOutput(directory, { SMTP_PASS: secret }), sanitizedError(/Sensitive content detected/, [secret]));
});

test('public output verifier detects private key blocks without needing environment credentials', async () => {
    for (const label of ['PRIVATE KEY', 'RSA PRIVATE KEY', 'OPENSSH PRIVATE KEY']) {
        const body = `-----BEGIN ${label}-----\nTEST_ONLY_NOT_ACTUAL_KEY_MATERIAL\n-----END ${label}-----`;
        const directory = await rejectionFixture('css/styles.css', body);
        await assert.rejects(verifyPublicOutput(directory, {}), sanitizedError(/Sensitive content detected/, [body, 'TEST_ONLY_NOT_ACTUAL_KEY_MATERIAL']));
    }
});
