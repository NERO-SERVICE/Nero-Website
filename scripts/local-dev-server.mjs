import { createServer } from "node:http";
import { readFileSync, statSync, createReadStream, existsSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const preferredPort = Number(process.env.PORT || 4173);
const portScanLimit = Number(process.env.PORT_SCAN_LIMIT || 20);
const listenHost = process.env.HOST || "127.0.0.1";
const displayHost = listenHost && !["0.0.0.0", "::"].includes(listenHost) ? listenHost : "127.0.0.1";
let activePort = preferredPort;

const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webp": "image/webp",
};

const parseEnvValue = (value) => {
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
};

const loadLocalEnv = () => {
    const envPath = join(rootDir, ".env");
    if (!existsSync(envPath)) return;

    readFileSync(envPath, "utf8")
        .split(/\r?\n/)
        .forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) return;
            const index = trimmed.indexOf("=");
            if (index === -1) return;
            const key = trimmed.slice(0, index).trim();
            const value = parseEnvValue(trimmed.slice(index + 1));
            if (key && process.env[key] === undefined) {
                process.env[key] = value;
            }
        });
};

const sendJson = (response, statusCode, body) => {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    });
    response.end(JSON.stringify(body));
};

const collectBody = (request) => new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    request.on("data", (chunk) => {
        chunks.push(chunk);
    });
    request.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    request.on("error", rejectBody);
});

const isInsideRoot = (filePath) => {
    const relative = normalize(filePath).slice(rootDir.length);
    return relative === "" || relative.startsWith(sep);
};

const routeAliases = new Map([
    ["/", "/pages/home.html"],
    ["/announcement", "/pages/announcement.html"],
    ["/services", "/pages/services.html"],
    ["/landing", "/pages/landing.html"],
    ["/overview", "/pages/overview.html"],
]);

const resolveStaticFile = (pathname) => {
    const requestPath = decodeURIComponent(pathname);
    const decodedPath = routeAliases.get(requestPath) || requestPath;
    const candidates = [];

    if (decodedPath.endsWith("/")) {
        candidates.push(join(rootDir, decodedPath, "index.html"));
    } else {
        candidates.push(join(rootDir, decodedPath));
        candidates.push(join(rootDir, `${decodedPath}.html`));
        candidates.push(join(rootDir, decodedPath, "index.html"));
    }

    return candidates.find((candidate) => {
        if (!isInsideRoot(candidate) || !existsSync(candidate)) return false;
        return statSync(candidate).isFile();
    });
};

const serveStatic = (request, response, pathname) => {
    const filePath = resolveStaticFile(pathname);
    if (!filePath) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
    }

    const extension = extname(filePath).toLowerCase();
    response.writeHead(200, {
        "Content-Type": mimeTypes[extension] || "application/octet-stream",
        "Cache-Control": "no-store",
    });

    if (request.method === "HEAD") {
        response.end();
        return;
    }

    createReadStream(filePath).pipe(response);
};

const invokeContactFunction = async (request, response) => {
    const { handler } = require("../netlify/functions/contact.js");
    const body = await collectBody(request);
    const result = await handler({
        httpMethod: request.method,
        headers: request.headers,
        body,
    });

    response.writeHead(result.statusCode || 200, result.headers || {});
    response.end(result.body || "");
};

loadLocalEnv();

const createAppServer = () => createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${displayHost}:${activePort}`}`);

    try {
        if (url.pathname === "/.netlify/functions/contact") {
            await invokeContactFunction(request, response);
            return;
        }

        if (request.method !== "GET" && request.method !== "HEAD") {
            sendJson(response, 405, { ok: false, message: "지원하지 않는 요청입니다." });
            return;
        }

        serveStatic(request, response, url.pathname);
    } catch (error) {
        console.error(error);
        sendJson(response, 500, { ok: false, message: "로컬 서버 처리 중 오류가 발생했습니다." });
    }
});

const listen = (candidatePort, attemptsLeft) => {
    const server = createAppServer();

    const handleListenError = (error) => {
        const canTryNextPort = !process.env.PORT
            && attemptsLeft > 0
            && ["EADDRINUSE", "EACCES", "EPERM"].includes(error.code);

        if (canTryNextPort) {
            const nextPort = candidatePort + 1;
            console.warn(`Port ${candidatePort} is unavailable. Trying ${nextPort}...`);
            server.close();
            listen(nextPort, attemptsLeft - 1);
            return;
        }

        console.error(`Could not start local dev server on port ${candidatePort}.`);
        console.error(error.message);
        process.exitCode = 1;
    };

    server.once("error", handleListenError);
    server.listen(candidatePort, listenHost, () => {
        activePort = candidatePort;
        server.off("error", handleListenError);
        console.log(`NERO local dev server ready: http://${displayHost}:${activePort}/`);
        console.log(`Landing page ready: http://${displayHost}:${activePort}/landing`);
        console.log("Contact function ready: /.netlify/functions/contact");
    });
};

listen(preferredPort, portScanLimit);
