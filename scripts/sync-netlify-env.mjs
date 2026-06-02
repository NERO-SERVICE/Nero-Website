import { spawnSync } from "node:child_process";

const requiredRuntimeEnv = [
    "SMTP_USER",
    "SMTP_PASS",
];

const optionalRuntimeEnv = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_SERVICE_ACCOUNT_BASE64",
    "FIRESTORE_DATABASE_ID",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_FROM",
];

const requiredDeployEnv = [
    "NETLIFY_AUTH_TOKEN",
    "NETLIFY_SITE_ID",
];

const missingDeployEnv = requiredDeployEnv.filter((key) => !process.env[key]);
if (missingDeployEnv.length > 0) {
    throw new Error(`Missing Netlify deploy secrets: ${missingDeployEnv.join(", ")}. Add them as GitHub Repository secrets.`);
}

const missingRuntimeEnv = requiredRuntimeEnv.filter((key) => !process.env[key]);
if (missingRuntimeEnv.length > 0) {
    throw new Error(`Missing function runtime secrets: ${missingRuntimeEnv.join(", ")}. Add them as GitHub Repository secrets with the same names used in .env.`);
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
