import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const defaultEnvFile = fileURLToPath(new URL('../.env', import.meta.url));
const publicVerificationKeys = [
    ['NERO_GOOGLE_SITE_VERIFICATION', 'google-site-verification'],
    ['NERO_NAVER_SITE_VERIFICATION', 'naver-site-verification'],
    ['NERO_BING_SITE_VERIFICATION', 'msvalidate.01'],
];

async function readLocalValues(envFile) {
    try {
        return parseEnv(await readFile(envFile, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        // Do not forward parser details, file contents, or environment values.
        throw new Error('Unable to read the local build verification configuration');
    }
}

export async function readBuildConfig({ env = process.env, envFile = defaultEnvFile } = {}) {
    if (!env || typeof env !== 'object' || Array.isArray(env)) throw new TypeError('Build environment must be an object');
    const localValues = await readLocalValues(envFile);
    const verification = [];
    for (const [key, name] of publicVerificationKeys) {
        // An explicit empty runtime value intentionally suppresses the local value.
        const raw = Object.hasOwn(env, key) ? env[key] : localValues[key];
        if (raw === undefined) continue;
        if (typeof raw !== 'string') throw new Error(`Invalid public verification token for ${key}`);
        const value = raw.trim();
        if (!value) continue;
        if (!/^[A-Za-z0-9_-]{1,256}$/.test(value)) throw new Error(`Invalid public verification token for ${key}`);
        verification.push({ name, value });
    }
    // Deployment context only comes from the runtime environment, never .env.
    // Unknown contexts remain unindexable; canonical origins are configured elsewhere.
    const rawContext = Object.hasOwn(env, 'CONTEXT') ? env.CONTEXT : undefined;
    const context = rawContext === undefined ? '' : String(rawContext);
    return { indexable: context === '' || context === 'production', context, verification };
}
