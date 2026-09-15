import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
for (const directory of ['scripts', 'content', 'tests']) {
    for (const file of await readdir(directory)) {
        if (!/\.(mjs|cjs)$/.test(file)) continue;
        const result = spawnSync(process.execPath, ['--check', `${directory}/${file}`], { stdio: 'inherit' });
        if (result.status !== 0) process.exit(result.status || 1);
    }
}
const plugin = spawnSync(process.execPath, ['--check', 'netlify/plugins/public-deploy/index.js'], { stdio: 'inherit' });
if (plugin.status !== 0) process.exit(plugin.status || 1);
