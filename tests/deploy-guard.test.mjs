import assert from 'node:assert/strict';
import { copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from '../scripts/build.mjs';
import { assertPublishDirectory, verifyDeployment } from '../scripts/verify-deploy.mjs';

const require = createRequire(import.meta.url);
const pluginSource = fileURLToPath(new URL('../netlify/plugins/public-deploy/index.js', import.meta.url));
const verifierUrl = new URL('../scripts/verify-deploy.mjs', import.meta.url).href;

test('Netlify configuration connects the local deploy guard and publishes only dist', async () => {
    const config = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
    const publishValues = [...config.matchAll(/^\s*publish\s*=\s*"([^"]+)"\s*$/gm)].map((match) => match[1]);
    assert.deepEqual(publishValues, ['dist', 'dist'], 'build and dev must not publish repository source');
    assert.match(config, /^\s*base\s*=\s*"\."\s*$/m);
    assert.match(config, /^\s*command\s*=\s*"npm run build"\s*$/m);
    assert.match(config, /^\[\[plugins\]\]\s*\n\s*package\s*=\s*"\.\/netlify\/plugins\/public-deploy"\s*$/m);
    const manifest = await readFile(new URL('../netlify/plugins/public-deploy/manifest.yml', import.meta.url), 'utf8');
    assert.match(manifest, /^name: netlify-plugin-nero-public-deploy\s*$/);
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(pkg.scripts['deploy:check'], 'node scripts/verify-deploy.mjs');
});

// These fixtures never read .env, mutate repository dist, invoke Netlify or send mail.
async function fixture(t, { withOutput = false } = {}) {
    const root = await realpath(await mkdtemp(join(tmpdir(), 'nero-deploy-guard-')));
    t.after(() => rm(root, { recursive: true, force: true }));
    const directory = join(root, 'dist');
    const pluginPath = join(root, 'netlify/plugins/public-deploy/index.js');
    await mkdir(dirname(pluginPath), { recursive: true });
    await copyFile(pluginSource, pluginPath);
    await mkdir(join(root, 'scripts'));
    // Run the unchanged plugin from a temporary repository against the real verifier.
    await writeFile(join(root, 'scripts/verify-deploy.mjs'), `export { assertPublishDirectory, verifyDeployment } from ${JSON.stringify(verifierUrl)};\n`);
    const failures = [];
    const args = {
        constants: { PUBLISH_DIR: directory },
        utils: { build: { failBuild: (...values) => { failures.push(values); } } },
    };
    const plugin = require(pluginPath);
    const result = withOutput ? await build({ outDir: directory, env: {}, envFile: join(root, 'missing.env') }) : undefined;
    return { root, directory, plugin, args, failures, result };
}

test('publish guard accepts only the repository dist and allows it to be absent before build', async (t) => {
    const data = await fixture(t);
    assert.equal(await assertPublishDirectory(data.directory, { root: data.root, allowMissing: true }), data.directory);
    await assert.rejects(assertPublishDirectory(data.directory, { root: data.root }), /missing or unavailable/);
    await data.plugin.onPreBuild(data.args);
    assert.deepEqual(data.failures, []);
    await assert.rejects(lstat(data.directory), { code: 'ENOENT' }, 'pre-build verification must not create output');
});

test('publish guard rejects root, other directories, relative and missing resolved paths', async (t) => {
    const data = await fixture(t);
    for (const path of [data.root, join(data.root, 'public'), join(data.root, 'dist/child'), 'dist', '.', '', undefined]) {
        await assert.rejects(assertPublishDirectory(path, { root: data.root, allowMissing: true }), /publish directory/);
        await data.plugin.onPreBuild({ ...data.args, constants: { PUBLISH_DIR: path } });
    }
    assert.equal(data.failures.length, 7);
    for (const failure of data.failures) {
        assert.equal(failure.length, 1, 'do not attach the original error or environment');
        assert.match(failure[0], /^Public deployment blocked:/);
        assert.equal(failure[0].includes(data.root), false);
    }
});

test('publish guard rejects symlinked dist, including dangling links and files', async (t) => {
    const data = await fixture(t);
    const outside = join(data.root, 'private-target');
    await mkdir(outside);
    for (const target of [outside, join(data.root, 'missing-target')]) {
        await symlink(target, data.directory);
        await assert.rejects(assertPublishDirectory(data.directory, { root: data.root, allowMissing: true }), /without symlinks/);
        await data.plugin.onPreBuild(data.args);
        await rm(data.directory);
    }
    await writeFile(data.directory, 'not a public directory');
    await assert.rejects(assertPublishDirectory(data.directory, { root: data.root }), /regular directory/);
    assert.equal(data.failures.length, 2);
});

test('post-build guard accepts a complete generated public fixture', async (t) => {
    const data = await fixture(t, { withOutput: true });
    assert.equal(await verifyDeployment({ publishDirectory: data.directory, root: data.root, env: {} }), data.result.publicFileCount);
    await data.plugin.onPostBuild(data.args);
    assert.deepEqual(data.failures, []);
});

test('post-build guard stops deployment if a document is inserted after build', async (t) => {
    const data = await fixture(t, { withOutput: true });
    const content = 'DUMMY_INTERNAL_DOCUMENT_CONTENT_DO_NOT_LOG';
    await mkdir(join(data.directory, 'seo-kit'));
    await writeFile(join(data.directory, 'seo-kit/README.md'), content);
    await assert.rejects(verifyDeployment({ publishDirectory: data.directory, root: data.root, env: {} }), /Unexpected public output(?: directory)?:/);
    await data.plugin.onPostBuild(data.args);
    assert.equal(data.failures.length, 1);
    assert.equal(data.failures[0].length, 1);
    assert.doesNotMatch(data.failures[0][0], /DUMMY_|README|nero-deploy-guard-/);
});

test('post-build guard rechecks the resolved directory instead of trusting pre-build validation', async (t) => {
    const data = await fixture(t, { withOutput: true });
    await data.plugin.onPreBuild(data.args);
    assert.deepEqual(data.failures, []);
    await data.plugin.onPostBuild({ ...data.args, constants: { PUBLISH_DIR: data.root } });
    assert.equal(data.failures.length, 1);
    assert.match(data.failures[0][0], /^Public deployment blocked:/);
});

test('post-build guard detects a dummy secret without returning it in the failure', async (t) => {
    const data = await fixture(t, { withOutput: true });
    const secret = 'DUMMY_PRIVATE_DEPLOY_SECRET_DO_NOT_LOG';
    const stylesheet = join(data.directory, 'css/landing.css');
    await writeFile(stylesheet, `${await readFile(stylesheet, 'utf8')}\n/* ${secret} */\n`);
    await assert.rejects(verifyDeployment({ publishDirectory: data.directory, root: data.root, env: { SMTP_PASS: secret } }), (error) => {
        assert.match(error.message, /Sensitive content detected/);
        assert.equal(error.stack.includes(secret), false);
        return true;
    });
    // Pattern-based detection also verifies the plugin's error boundary without
    // adding credentials to the shared test process environment.
    await writeFile(stylesheet, '/* -----BEGIN PRIVATE KEY-----\nDUMMY_KEY_MATERIAL\n-----END PRIVATE KEY----- */');
    await data.plugin.onPostBuild(data.args);
    assert.equal(data.failures.length, 1);
    assert.doesNotMatch(JSON.stringify(data.failures), /DUMMY|PRIVATE KEY|SMTP_PASS/);
});

test('post-build guard refuses an output that has not been built', async (t) => {
    const data = await fixture(t);
    await data.plugin.onPostBuild(data.args);
    assert.equal(data.failures.length, 1);
    assert.match(data.failures[0][0], /^Public deployment blocked:/);
});
