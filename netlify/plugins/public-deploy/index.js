const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');

const root = resolve(__dirname, '../../..');
const verifier = pathToFileURL(resolve(root, 'scripts/verify-deploy.mjs')).href;

module.exports = {
    async onPreBuild({ constants, utils }) {
        try {
            const { assertPublishDirectory } = await import(verifier);
            await assertPublishDirectory(constants.PUBLISH_DIR, { root, allowMissing: true });
        } catch {
            utils.build.failBuild('Public deployment blocked: publish must be this repository\'s dist directory, without symlinks.');
        }
    },
    async onPostBuild({ constants, utils }) {
        try {
            const { verifyDeployment } = await import(verifier);
            await verifyDeployment({ publishDirectory: constants.PUBLISH_DIR, root });
        } catch {
            // The underlying error may contain paths or environment-derived data.
            // failBuild stops deployment; failPlugin would not stop deployment.
            utils.build.failBuild('Public deployment blocked: dist is missing, unsafe or contains files outside the public allowlist.');
        }
    },
};
