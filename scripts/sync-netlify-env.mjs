import { spawnSync } from "node:child_process";

const requiredRuntimeEnv = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_SERVICE_ACCOUNT_BASE64",
];

const optionalRuntimeEnv = [
    "FIRESTORE_DATABASE_ID",
];

const requiredDeployEnv = [
    "NETLIFY_AUTH_TOKEN",
    "NETLIFY_SITE_ID",
];

const missingDeployEnv = requiredDeployEnv.filter((key) => !process.env[key]);
if (missingDeployEnv.length > 0) {
    throw new Error(`Missing Netlify deploy secrets: ${missingDeployEnv.join(", ")}`);
}

const missingRuntimeEnv = requiredRuntimeEnv.filter((key) => !process.env[key]);
if (missingRuntimeEnv.length > 0) {
    throw new Error(`Missing function runtime secrets: ${missingRuntimeEnv.join(", ")}`);
}

const setNetlifyEnv = (key, value) => {
    if (!value) return;

    const result = spawnSync("npx", [
        "--yes",
        "netlify-cli",
        "env:set",
        key,
        value,
        "--scope",
        "functions",
        "--context",
        "production",
        "--site",
        process.env.NETLIFY_SITE_ID,
        "--auth",
        process.env.NETLIFY_AUTH_TOKEN,
    ], {
        encoding: "utf8",
        stdio: "pipe",
    });

    if (result.status !== 0) {
        throw new Error(`Failed to sync Netlify environment variable: ${key}`);
    }

    console.log(`Synced Netlify environment variable: ${key}`);
};

[...requiredRuntimeEnv, ...optionalRuntimeEnv].forEach((key) => {
    setNetlifyEnv(key, process.env[key]);
});
