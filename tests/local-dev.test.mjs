import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, symlink, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createStaticResolver } from '../scripts/local-dev-server.mjs';

// All files are synthetic. Importing the server does not load the real .env,
// bind a port, invoke the contact Function or send any HTTP/SMTP requests.
async function fixture(t) {
    const root = await realpath(await mkdtemp(join(tmpdir(), 'nero-local-static-test-')));
    t.after(() => rm(root, { recursive: true, force: true }));
    async function put(path, text = 'test fixture') {
        const file = join(root, path);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, text);
        return file;
    }
    return { root, put, resolve: createStaticResolver(root) };
}

test('local resolver preserves all six existing pages and direct page HTML paths', async (t) => {
    const fixtureData = await fixture(t);
    const routes = new Map([['/', 'home'], ['/landing', 'landing'], ['/overview', 'overview'], ['/about', 'about'], ['/services', 'services'], ['/announcement', 'announcement']]);
    for (const [path, name] of routes) {
        const file = await fixtureData.put(`pages/${name}.html`);
        assert.equal(fixtureData.resolve(path), file);
        assert.equal(fixtureData.resolve(`/pages/${name}.html`), file);
        assert.equal(fixtureData.resolve(`/pages/${name}`), file);
    }
    assert.equal(fixtureData.resolve('/missing'), undefined);
});

test('local resolver serves only the eight browser scripts and two shared components', async (t) => {
    const fixtureData = await fixture(t);
    for (const name of ['analytics', 'home', 'landing', 'about', 'overview', 'announcement', 'components', 'scripts']) {
        const file = await fixtureData.put(`scripts/${name}.js`);
        assert.equal(fixtureData.resolve(`/scripts/${name}.js`), file);
    }
    for (const name of ['navbar', 'footer']) {
        const file = await fixtureData.put(`components/${name}.html`);
        assert.equal(fixtureData.resolve(`/components/${name}.html`), file);
    }
    for (const path of ['scripts/build.mjs', 'scripts/local-dev-server.mjs', 'scripts/templates/home.mjs', 'scripts/private.js', 'components/private.html', 'pages/draft.html']) {
        await fixtureData.put(path);
        assert.equal(fixtureData.resolve(`/${path}`), undefined, path);
    }
});

test('local resolver keeps browser CSS, image/font assets and public announcement data available', async (t) => {
    const fixtureData = await fixture(t);
    for (const path of ['css/landing.css', 'assets/img/landing/nero_logo.svg', 'assets/example.png', 'assets/font.woff2', 'data/announcements.json']) {
        const file = await fixtureData.put(path);
        assert.equal(fixtureData.resolve(`/${path}`), file);
    }
});

test('local resolver denies private files even when they exist in the fixture', async (t) => {
    const fixtureData = await fixture(t);
    for (const path of ['.env', '.env.example', '.env.production', '.git/config', 'package.json', 'netlify.toml', 'netlify/functions/contact.js', 'firebase/service-account.json', 'docs/notes.md', 'seo-kit/README.md', 'tests/contact.test.cjs', 'data/private.json', 'assets/README.md', 'assets/credentials.json', 'assets/private.key', 'css/private.json']) {
        await fixtureData.put(path);
        assert.equal(fixtureData.resolve(`/${path}`), undefined, path);
    }
});

test('local resolver rejects hidden, traversal, malformed and encoded private paths', async (t) => {
    const fixtureData = await fixture(t);
    await fixtureData.put('.env');
    await fixtureData.put('assets/.private/secret.png');
    await fixtureData.put('css/.hidden.css');
    for (const path of ['/.env', '/%2eenv', '/%2egit/config', '/assets/../.env', '/assets/%2e%2e/.env', '/assets/.private/secret.png', '/assets/%2eprivate/secret.png', '/css/.hidden.css', '/assets/..\\.env', '/assets/%00.png', '/assets/%broken', 'assets/example.png']) {
        assert.equal(fixtureData.resolve(path), undefined, path);
    }
});

test('local resolver rejects public-looking symlinks to private or outside files', async (t) => {
    const fixtureData = await fixture(t);
    const privateFile = await fixtureData.put('.env');
    await fixtureData.put('assets/placeholder.png');
    const link = join(fixtureData.root, 'assets/private.png');
    await symlink(privateFile, link);
    assert.equal(fixtureData.resolve('/assets/private.png'), undefined);

    const outside = await mkdtemp(join(tmpdir(), 'nero-outside-static-test-'));
    t.after(() => rm(outside, { recursive: true, force: true }));
    const outsideFile = join(outside, 'outside.png');
    await writeFile(outsideFile, 'outside fixture');
    await symlink(outsideFile, join(fixtureData.root, 'assets/outside.png'));
    assert.equal(fixtureData.resolve('/assets/outside.png'), undefined);
});

test('a safe public symlink stays usable and missing targets return 404 resolution', async (t) => {
    const fixtureData = await fixture(t);
    const image = await fixtureData.put('assets/original.png');
    await symlink(image, join(fixtureData.root, 'assets/alias.png'));
    assert.equal(fixtureData.resolve('/assets/alias.png'), image);
    await symlink(join(fixtureData.root, 'assets/missing.png'), join(fixtureData.root, 'assets/broken.png'));
    assert.equal(fixtureData.resolve('/assets/broken.png'), undefined);
});
