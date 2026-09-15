import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { publicAssetFiles } from '../content/public-assets.mjs';
import { isPublicOutput, readBuildSource, verifyPublicOutput } from '../scripts/public-output.mjs';

const repo = fileURLToPath(new URL('..', import.meta.url));
async function fixture(t) {
    const root = await mkdtemp(join(tmpdir(), 'nero-public-assets-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    return root;
}

test('a real isolated build omits unreviewed images, CSS, Markdown, environment files and reports', async (t) => {
    const root = await fixture(t);
    // Copy source to an isolated fixture; never add test material to this repo.
    for (const directory of ['scripts', 'content', 'pages', 'components', 'data', 'css', 'assets']) {
        await cp(join(repo, directory), join(root, directory), { recursive: true });
    }
    const privatePaths = ['assets/internal-notes.svg', 'assets/img/internal.png', 'css/private.css',
        'assets/img/landing/internal.md', 'assets/img/landing/README.md', 'seo-kit/README.md',
        'docs/notes.md', '.env', 'CLAUDE.md', 'GOOGLE_ANALYTICS_4.md', 'test-results/report.html'];
    const privateMarker = 'TEST_ONLY_PRIVATE_CONTENT_DO_NOT_PUBLISH';
    for (const path of privatePaths) {
        await mkdir(dirname(join(root, path)), { recursive: true });
        await writeFile(join(root, path), privateMarker);
    }
    execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, env: { CONTEXT: 'production' }, stdio: 'pipe' });
    const out = join(root, 'dist');
    assert.equal(await verifyPublicOutput(out), 50);
    const built = await readdir(out, { recursive: true, withFileTypes: true });
    const files = built.filter((item) => item.isFile());
    for (const file of files) {
        assert.equal((await readFile(join(file.parentPath, file.name))).includes(Buffer.from(privateMarker)), false);
    }
    for (const path of privatePaths) {
        assert.equal(isPublicOutput(path), false, path);
        await assert.rejects(readFile(join(out, path)), { code: 'ENOENT' });
    }
    for (const path of publicAssetFiles) {
        assert.deepEqual(await readFile(join(out, path)), await readFile(join(repo, path)), `${path} retains original bytes`);
    }
});

test('source file reads reject symlinked roots, top-level folders, nested folders and files', async (t) => {
    const root = await fixture(t);
    const original = join(root, 'original');
    await mkdir(join(original, 'assets', 'img'), { recursive: true });
    await writeFile(join(original, 'assets', 'img', 'reviewed.svg'), '<svg>TEST_ONLY_PRIVATE_TARGET</svg>');
    const sourcePath = 'assets/img/reviewed.svg';
    assert.match(await readBuildSource(original, sourcePath, 'utf8'), /<svg>/);

    for (const kind of ['root', 'top-level', 'nested', 'file']) {
        const source = join(root, kind);
        if (kind === 'root') await symlink(original, source);
        else if (kind === 'top-level') {
            await mkdir(source);
            await symlink(join(original, 'assets'), join(source, 'assets'));
        } else if (kind === 'nested') {
            await mkdir(join(source, 'assets'), { recursive: true });
            await symlink(join(original, 'assets', 'img'), join(source, 'assets', 'img'));
        } else {
            await mkdir(join(source, 'assets', 'img'), { recursive: true });
            await symlink(join(original, sourcePath), join(source, sourcePath));
        }
        await assert.rejects(readBuildSource(source, sourcePath), (error) => {
            assert.match(error.message, /Build source contains a symlink/);
            assert.doesNotMatch(error.message, /TEST_ONLY_PRIVATE_TARGET/);
            return true;
        });
    }
    for (const invalid of ['../outside.txt', '/absolute.txt', 'assets/../outside.svg', 'assets\\outside.svg', 'assets//img/file.svg']) {
        await assert.rejects(readBuildSource(original, invalid), /Invalid build source path/);
    }
});

test('public output rejects symlinked roots and unexpected empty directories', async (t) => {
    const root = await fixture(t);
    const directory = join(root, 'output');
    await mkdir(join(directory, 'docs'), { recursive: true });
    await assert.rejects(verifyPublicOutput(directory), /Unexpected public output directory: docs/);
    const linked = join(root, 'linked-output');
    await symlink(directory, linked);
    await assert.rejects(verifyPublicOutput(linked), /Public output root must be a regular directory/);
});
