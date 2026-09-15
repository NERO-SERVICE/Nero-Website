import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readBuildConfig } from '../scripts/build-config.mjs';

async function fixture(t, contents = '') {
    const directory = await mkdtemp(join(tmpdir(), 'nero-build-config-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const envFile = join(directory, '.env');
    await writeFile(envFile, contents);
    return envFile;
}

test('only the three allowed verification keys can leave the environment reader', async (t) => {
    const envFile = await fixture(t, [
        'export NERO_GOOGLE_SITE_VERIFICATION="google_dummy-token"',
        "NERO_NAVER_SITE_VERIFICATION='naver_dummy_123'",
        'NERO_BING_SITE_VERIFICATION=BING_dummy_ABC # trailing comment',
        'SMTP_PASS="DUMMY_PRIVATE_SMTP_VALUE"',
        'CONTACT_TO="DUMMY_PRIVATE_CONTACT_VALUE"',
        'PUBLIC_SECRET="DUMMY_NOT_ALLOWLISTED"',
        'URL=https://dummy-file.invalid',
        'DEPLOY_URL=https://dummy-deploy.invalid',
        'CONTEXT=branch-deploy',
    ].join('\n'));
    const config = await readBuildConfig({ env: {}, envFile });
    assert.deepEqual(config, {
        indexable: true,
        context: '',
        verification: [
            { name: 'google-site-verification', value: 'google_dummy-token' },
            { name: 'naver-site-verification', value: 'naver_dummy_123' },
            { name: 'msvalidate.01', value: 'BING_dummy_ABC' },
        ],
    });
    assert.deepEqual(Object.keys(config).sort(), ['context', 'indexable', 'verification']);
    assert.doesNotMatch(JSON.stringify(config), /SMTP|CONTACT_TO|PUBLIC_SECRET|DUMMY_PRIVATE|DUMMY_NOT_ALLOWLISTED|DEPLOY|https:|origin/);
});

test('explicit runtime values override file values, including empty and whitespace-only strings', async (t) => {
    const envFile = await fixture(t, [
        'NERO_GOOGLE_SITE_VERIFICATION=file_google',
        'NERO_NAVER_SITE_VERIFICATION=file_naver',
        'NERO_BING_SITE_VERIFICATION=file_bing',
    ].join('\n'));
    const config = await readBuildConfig({ envFile, env: {
        NERO_GOOGLE_SITE_VERIFICATION: ' runtime_google ',
        NERO_NAVER_SITE_VERIFICATION: '',
        NERO_BING_SITE_VERIFICATION: '   ',
    } });
    assert.deepEqual(config.verification, [{ name: 'google-site-verification', value: 'runtime_google' }]);
});

test('reading configuration does not mutate the supplied environment or local file', async (t) => {
    const contents = 'NERO_NAVER_SITE_VERIFICATION=local_naver\nSMTP_PASS=DUMMY_FILE_SECRET\n';
    const envFile = await fixture(t, contents);
    const env = Object.freeze({
        CONTEXT: 'production',
        NERO_GOOGLE_SITE_VERIFICATION: 'runtime_google',
        SMTP_PASS: 'DUMMY_RUNTIME_SECRET',
        DEPLOY_PRIME_URL: 'https://dummy-prime.invalid',
    });
    const before = JSON.stringify(env);
    const config = await readBuildConfig({ env, envFile });
    assert.equal(JSON.stringify(env), before);
    assert.equal(await readFile(envFile, 'utf8'), contents);
    assert.equal(config.verification.length, 2);
    assert.doesNotMatch(JSON.stringify(config), /DUMMY_|dummy-prime|SMTP_PASS|DEPLOY_PRIME_URL/);
});

test('invalid explicit token values fail instead of falling back to a valid file token', async (t) => {
    const envFile = await fixture(t, 'NERO_GOOGLE_SITE_VERIFICATION=valid_file_token\n');
    for (const value of ['DUMMY <script>', 'DUMMY"attribute', 'DUMMY&entity', 'DUMMY 토큰', 'DUMMY\ninside', 'x'.repeat(257), 42, null]) {
        await assert.rejects(readBuildConfig({ envFile, env: { NERO_GOOGLE_SITE_VERIFICATION: value } }), (error) => {
            assert.equal(error.message, 'Invalid public verification token for NERO_GOOGLE_SITE_VERIFICATION');
            assert.doesNotMatch(error.stack, /DUMMY|valid_file_token|<script>/);
            return true;
        });
    }
});

test('file token validation applies only after runtime precedence is resolved', async (t) => {
    const envFile = await fixture(t, 'NERO_NAVER_SITE_VERIFICATION="DUMMY_INVALID <token>"\n');
    await assert.rejects(readBuildConfig({ env: {}, envFile }), /^Error: Invalid public verification token for NERO_NAVER_SITE_VERIFICATION$/);
    assert.deepEqual((await readBuildConfig({ env: { NERO_NAVER_SITE_VERIFICATION: '' }, envFile })).verification, []);
    assert.deepEqual((await readBuildConfig({ env: { NERO_NAVER_SITE_VERIFICATION: 'valid_override' }, envFile })).verification, [{ name: 'naver-site-verification', value: 'valid_override' }]);
});

test('missing or empty optional env files do not create verification tags', async (t) => {
    const envFile = await fixture(t, 'NERO_GOOGLE_SITE_VERIFICATION=\nNERO_NAVER_SITE_VERIFICATION=""\n');
    for (const path of [envFile, join(envFile, '..', 'missing.env')]) {
        assert.deepEqual(await readBuildConfig({ env: {}, envFile: path }), { indexable: true, context: '', verification: [] });
    }
});

test('deployment context comes only from env and every non-production named context is unindexable', async (t) => {
    const envFile = await fixture(t, 'CONTEXT=production\nNERO_GOOGLE_SITE_VERIFICATION=public_test_token\n');
    const cases = [
        [undefined, true, ''], ['', true, ''], ['production', true, 'production'],
        ['deploy-preview', false, 'deploy-preview'], ['branch-deploy', false, 'branch-deploy'],
        ['preview-server', false, 'preview-server'], ['dev', false, 'dev'],
        ['unknown-context', false, 'unknown-context'], ['PRODUCTION', false, 'PRODUCTION'],
        [' production ', false, ' production '],
    ];
    for (const [input, indexable, context] of cases) {
        const env = input === undefined ? {} : { CONTEXT: input };
        const config = await readBuildConfig({ env, envFile });
        assert.equal(config.indexable, indexable, String(input));
        assert.equal(config.context, context);
        assert.equal(config.verification.length, 1, 'the integration chooses whether to emit verification metadata');
    }
    const branchFile = await fixture(t, 'CONTEXT=branch-deploy\n');
    assert.equal((await readBuildConfig({ env: {}, envFile: branchFile })).indexable, true);
});

test('origin and deployment URL variables never affect or appear in configuration', async (t) => {
    const envFile = await fixture(t, 'NERO_SITE_ORIGIN=https://dummy-file.invalid\n');
    const config = await readBuildConfig({ envFile, env: {
        CONTEXT: 'production', URL: 'https://dummy-url.invalid',
        DEPLOY_URL: 'https://dummy-deploy.invalid', DEPLOY_PRIME_URL: 'https://dummy-prime.invalid',
        NERO_SITE_ORIGIN: 'https://dummy-origin.invalid', PUBLIC_SECRET: 'DUMMY_SECRET',
    } });
    assert.deepEqual(config, { indexable: true, context: 'production', verification: [] });
});

test('unreadable file errors do not include environment values or parser content', async (t) => {
    const envFile = await fixture(t);
    await assert.rejects(readBuildConfig({ env: {}, envFile: join(envFile, 'DUMMY_PRIVATE_PATH') }), (error) => {
        assert.equal(error.message, 'Unable to read the local build verification configuration');
        assert.doesNotMatch(error.stack, /DUMMY_PRIVATE_PATH/);
        assert.equal(error.cause, undefined);
        return true;
    });
});
