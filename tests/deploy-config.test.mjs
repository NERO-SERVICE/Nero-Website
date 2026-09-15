import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('SMTP host example stays blank as in the last successful deployment', async () => {
    const example = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
    const hosts = [...example.matchAll(/^SMTP_HOST=(.*)$/gm)].map((match) => match[1].trim());
    assert.deepEqual(hosts, [''], 'runtime host values belong in the environment, not the committed example');
    const config = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
    assert.doesNotMatch(config, /SECRETS_SCAN_(?:ENABLED|OMIT_KEYS|OMIT_PATHS)/, 'fix the example instead of bypassing secret scanning');
});

test('deployment uses the standard build with dist and no custom plugin or duplicate gate', async () => {
    const config = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
    const publishValues = [...config.matchAll(/^\s*publish\s*=\s*"([^"]+)"\s*$/gm)].map((match) => match[1]);
    assert.deepEqual(publishValues, ['dist', 'dist'], 'build and dev must not publish repository source');
    assert.match(config, /^\s*command\s*=\s*"npm run build"\s*$/m);
    assert.match(config, /^\s*directory\s*=\s*"netlify\/functions"\s*$/m);
    assert.doesNotMatch(config, /\[\[plugins\]\]|public-deploy/);
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(pkg.scripts['deploy:check'], undefined);
    const workflow = await readFile(new URL('../.github/workflows/netlify-deploy.yml', import.meta.url), 'utf8');
    assert.deepEqual([...workflow.matchAll(/^\s*- run: (.+)$/gm)].map((match) => match[1]), ['npm run check', 'npm run build']);
    assert.doesNotMatch(workflow, /npm ci|playwright install|upload-artifact|netlify deploy/);
});
