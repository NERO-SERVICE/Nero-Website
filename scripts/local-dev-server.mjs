import { createServer } from "node:http";
import { readFileSync, statSync, createReadStream, existsSync, realpathSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
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
    ".woff": "font/woff",
    ".woff2": "font/woff2",
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

const routeAliases = new Map([
    ["/", "/pages/home.html"],
    ["/announcement", "/pages/announcement.html"],
    ["/services", "/pages/services.html"],
    ["/landing", "/pages/landing.html"],
    ["/overview", "/pages/overview.html"],
    ["/about", "/pages/about.html"],
]);

const publicPages = new Set([...routeAliases.values()].map((path) => path.slice(1)));
const browserScripts = new Set([
    "analytics.js", "home.js", "landing.js", "about.js", "overview.js",
    "announcement.js", "components.js", "scripts.js",
].map((file) => `scripts/${file}`));
const publicComponents = new Set(["components/navbar.html", "components/footer.html"]);
const publicAssetTypes = new Set([".gif", ".ico", ".jpg", ".jpeg", ".png", ".svg", ".webp", ".woff", ".woff2"]);

const isPublicFile = (path) => publicPages.has(path)
    || browserScripts.has(path)
    || publicComponents.has(path)
    || path === "data/announcements.json"
    || (path.startsWith("css/") && extname(path).toLowerCase() === ".css")
    || (path.startsWith("assets/") && publicAssetTypes.has(extname(path).toLowerCase()));

// Keep the existing browser files available without exposing the repository or
// local credentials. The factory also permits tests against an isolated fixture.
export const createStaticResolver = (publicRoot = rootDir) => {
    const base = realpathSync(resolve(publicRoot));
    return (pathname) => {
        let requestPath;
        try { requestPath = decodeURIComponent(pathname); } catch { return undefined; }
        if (!requestPath.startsWith("/") || requestPath.includes("\\") || requestPath.includes("\0")) return undefined;
        if (requestPath.split("/").some((part) => part.startsWith("."))) return undefined;
        requestPath = requestPath.replace(/\/+$/, "") || "/";
        const decodedPath = (routeAliases.get(requestPath) || requestPath).slice(1);
        const candidates = [decodedPath, `${decodedPath}.html`].filter(isPublicFile);
        for (const candidate of candidates) {
            try {
                const file = realpathSync(resolve(base, candidate));
                if (!file.startsWith(`${base}${sep}`)) continue;
                const resolvedPath = relative(base, file).split(sep).join("/");
                if (!isPublicFile(resolvedPath) || resolvedPath.split("/").some((part) => part.startsWith("."))) continue;
                if (statSync(file).isFile()) return file;
            } catch {
                // Missing files and unavailable symlink targets are ordinary 404s.
            }
        }
        return undefined;
    };
};

const resolveStaticFile = createStaticResolver();

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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    loadLocalEnv();
    listen(preferredPort, portScanLimit);
}
