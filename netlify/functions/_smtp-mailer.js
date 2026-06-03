const net = require("node:net");
const tls = require("node:tls");
const crypto = require("node:crypto");

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_SMTP_HOST = ["smtp", "gmail", "com"].join(".");

const normalize = (value, maxLength = 5000) => String(value ?? "").trim().slice(0, maxLength);

const splitRecipients = (value) => {
    if (Array.isArray(value)) return value.map((item) => normalize(item)).filter(Boolean);
    return normalize(value).split(",").map((item) => item.trim()).filter(Boolean);
};

const encodeHeader = (value) => {
    const text = normalize(value, 1000);
    return /[^\x20-\x7E]/.test(text)
        ? `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`
        : text;
};

const escapeHtml = (value) => normalize(value, 10000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const extractEmail = (value) => {
    const text = normalize(value);
    const matched = text.match(/<([^>]+)>/);
    return matched ? matched[1].trim() : text;
};

const foldHeader = (name, value) => `${name}: ${value}`;

const dotStuff = (value) => String(value).replace(/^\./gm, "..");

const createMimeMessage = ({ from, to, replyTo, subject, text, html, headers = {} }) => {
    const boundary = `nero-${crypto.randomBytes(12).toString("hex")}`;
    const recipients = splitRecipients(to);
    const messageIdHost = extractEmail(from).split("@")[1] || "nero.ai.kr";
    const baseHeaders = [
        foldHeader("From", from),
        foldHeader("To", recipients.join(", ")),
        ...(replyTo ? [foldHeader("Reply-To", replyTo)] : []),
        foldHeader("Subject", encodeHeader(subject)),
        foldHeader("Date", new Date().toUTCString()),
        foldHeader("Message-ID", `<${crypto.randomUUID()}@${messageIdHost}>`),
        foldHeader("MIME-Version", "1.0"),
        foldHeader("Content-Type", `multipart/alternative; boundary="${boundary}"`),
        ...Object.entries(headers).map(([key, value]) => foldHeader(key, normalize(value, 1000))),
    ];

    const plainText = text || html?.replace(/<[^>]*>/g, "") || "";
    const htmlText = html || `<pre>${escapeHtml(plainText)}</pre>`;

    return [
        ...baseHeaders,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        plainText,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        htmlText,
        "",
        `--${boundary}--`,
        "",
    ].join("\r\n");
};

const createSmtpSession = ({ host, port, secure }) => new Promise((resolve, reject) => {
    let socket = secure
        ? tls.connect({ host, port, servername: host })
        : net.connect({ host, port });
    let buffer = "";
    const pending = [];
    let ready = false;

    const cleanup = () => {
        socket.removeAllListeners();
    };

    const fail = (error) => {
        while (pending.length > 0) {
            pending.shift().reject(error);
        }
        cleanup();
        socket.destroy();
        if (!ready) reject(error);
    };

    const parseResponses = () => {
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";
        lines.forEach((line) => {
            const match = line.match(/^(\d{3})([ -])(.*)$/);
            if (!match || match[2] !== " ") return;
            const waiter = pending.shift();
            if (waiter) waiter.resolve({ code: Number(match[1]), line });
        });
    };

    const attach = (nextSocket) => {
        socket = nextSocket;
        socket.setEncoding("utf8");
        socket.setTimeout(DEFAULT_TIMEOUT_MS);
        socket.on("data", (chunk) => {
            buffer += chunk;
            parseResponses();
        });
        socket.on("timeout", () => fail(new Error("SMTP connection timed out")));
        socket.on("error", fail);
    };

    const expect = (allowedCodes) => new Promise((responseResolve, responseReject) => {
        pending.push({
            resolve: ({ code, line }) => {
                if (!allowedCodes.includes(code)) {
                    responseReject(new Error(`SMTP unexpected response: ${line}`));
                    return;
                }
                responseResolve({ code, line });
            },
            reject: responseReject,
        });
        parseResponses();
    });

    const write = (command) => {
        socket.write(`${command}\r\n`);
    };

    const command = async (line, allowedCodes = [250]) => {
        write(line);
        return expect(allowedCodes);
    };

    const upgradeToTls = async () => {
        await command("STARTTLS", [220]);
        socket.removeAllListeners("data");
        socket.removeAllListeners("timeout");
        socket.removeAllListeners("error");
        buffer = "";
        const upgraded = tls.connect({ socket, servername: host });
        attach(upgraded);
        await new Promise((upgradeResolve, upgradeReject) => {
            upgraded.once("secureConnect", upgradeResolve);
            upgraded.once("error", upgradeReject);
        });
    };

    attach(socket);
    expect([220]).then(() => {
        ready = true;
        resolve({ command, write, expect, upgradeToTls, close: () => socket.end() });
    }).catch(fail);
});

const sendSmtpMail = async ({ from, to, replyTo, subject, text, html, headers }) => {
    const host = normalize(process.env.SMTP_HOST || DEFAULT_SMTP_HOST);
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = normalize(process.env.SMTP_SECURE || "true").toLowerCase() !== "false";
    const user = normalize(process.env.SMTP_USER);
    const pass = normalize(process.env.SMTP_PASS, 10000);
    const requireTls = normalize(process.env.SMTP_REQUIRE_TLS || "true").toLowerCase() !== "false";

    if (!host || !port || !user || !pass) {
        throw new Error("Missing SMTP environment variables");
    }

    const recipients = splitRecipients(to);
    if (!from || recipients.length === 0 || !subject) {
        throw new Error("Missing SMTP message fields");
    }

    const session = await createSmtpSession({ host, port, secure });
    try {
        await session.command(`EHLO ${normalize(process.env.SMTP_EHLO_DOMAIN || "nero.ai.kr")}`);
        if (!secure && requireTls) {
            await session.upgradeToTls();
            await session.command(`EHLO ${normalize(process.env.SMTP_EHLO_DOMAIN || "nero.ai.kr")}`);
        }
        await session.command("AUTH LOGIN", [334]);
        await session.command(Buffer.from(user).toString("base64"), [334]);
        await session.command(Buffer.from(pass).toString("base64"), [235]);
        await session.command(`MAIL FROM:<${extractEmail(from)}>`);
        for (const recipient of recipients) {
            await session.command(`RCPT TO:<${extractEmail(recipient)}>`, [250, 251]);
        }
        await session.command("DATA", [354]);
        session.write(`${dotStuff(createMimeMessage({ from, to: recipients, replyTo, subject, text, html, headers }))}\r\n.`);
        await session.expect([250]);
        await session.command("QUIT", [221]);
    } finally {
        session.close();
    }
};

module.exports = {
    sendSmtpMail,
};
