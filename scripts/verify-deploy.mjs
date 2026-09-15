import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyPublicOutput } from './public-output.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

// Netlify resolves PUBLISH_DIR before onPreBuild; dist may not exist yet.
// Never accept an alternate directory, even if it contains valid public files.
export async function assertPublishDirectory(publishDirectory, { root = repositoryRoot, allowMissing = false } = {}) {
    const expected = resolve(root, 'dist');
    if (typeof publishDirectory !== 'string' || !isAbsolute(publishDirectory) || resolve(publishDirectory) !== expected) {
        throw new Error('The publish directory must be the repository dist directory');
    }
    const rootInfo = await lstat(root);
    if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) throw new Error('The repository root must be a regular directory');
    let info;
    try {
        info = await lstat(expected);
    } catch (error) {
        if (allowMissing && error.code === 'ENOENT') return expected;
        throw new Error('The public output directory is missing or unavailable');
    }
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('The public output must be a regular directory, without symlinks');
    if (await realpath(expected) !== resolve(await realpath(root), 'dist')) throw new Error('The public output resolves outside the repository dist directory');
    return expected;
}

export async function verifyDeployment({ publishDirectory = resolve(repositoryRoot, 'dist'), root = repositoryRoot, env = process.env } = {}) {
    const directory = await assertPublishDirectory(publishDirectory, { root });
    return verifyPublicOutput(directory, env);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const count = await verifyDeployment();
        console.log(`Deployment output verified: ${count} approved public files in dist.`);
    } catch {
        // Do not log an underlying error, path, environment value or file content.
        console.error('Deployment output verification failed. Rebuild dist and check the public file allowlist.');
        process.exitCode = 1;
    }
}
