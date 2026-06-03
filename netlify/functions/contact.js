const crypto = require("node:crypto");
const { sendSmtpMail } = require("./_smtp-mailer");

const normalize = (value, maxLength = 2000) => String(value ?? "").trim().slice(0, maxLength);

const CONTACT_TO = process.env.CONTACT_TO || process.env.SMTP_USER || "";
const CONTACT_FROM = process.env.SMTP_FROM
    || (process.env.SMTP_USER ? `NERO <${process.env.SMTP_USER}>` : CONTACT_TO);
const SUBJECT_PREFIX = "[NERO]";
const CONTACT_SOURCES = {
    landing_contact: {
        label: "랜딩 프로젝트 진단",
        subject: "프로젝트 진단 요청",
        success: "아이디어가 접수되었습니다. 곧 연락드리겠습니다.",
    },
    test_home_quote: {
        label: "테스트 홈 문의",
        subject: "테스트 홈 문의",
        success: "문의가 접수되었습니다. 곧 연락드리겠습니다.",
    },
};

const json = (statusCode, body) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
});

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const escapeHtml = (value) => normalize(value, 10000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const errorCodeFrom = (error) => {
    const message = String(error?.message || "");
    if (message.includes("Missing SMTP environment variables")) return "smtp_env_missing";
    if (message.includes("SMTP connection timed out")) return "smtp_timeout";
    if (message.includes("SMTP unexpected response")) return "smtp_response_failed";
    return "smtp_submit_failed";
};

const missingSmtpKeys = () => ["SMTP_USER", "SMTP_PASS"].filter((key) => !normalize(process.env[key], 10000));

const parseFormBody = (event) => {
    const contentType = normalize(event.headers?.["content-type"] || event.headers?.["Content-Type"]).toLowerCase();
    const body = event.body || "";

    if (contentType.includes("application/json")) {
        return JSON.parse(body || "{}");
    }

    return Object.fromEntries(new URLSearchParams(body));
};

const getContactSource = (value) => {
    const key = normalize(value, 80);
    return CONTACT_SOURCES[key] ? { key, ...CONTACT_SOURCES[key] } : { key: "landing_contact", ...CONTACT_SOURCES.landing_contact };
};

const buildContactText = ({ name, email, message, requestId, source }) => [
    `접수 ID: ${requestId}`,
    `접수 구분: ${source.label}`,
    `성함: ${name}`,
    `이메일: ${email}`,
    "",
    "문의내용:",
    message,
].join("\n");

const buildContactHtml = ({ name, email, message, requestId, source }) => `
    <h2>${escapeHtml(SUBJECT_PREFIX)} ${escapeHtml(source.subject)}</h2>
    <p><strong>접수 ID</strong>: ${escapeHtml(requestId)}</p>
    <p><strong>접수 구분</strong>: ${escapeHtml(source.label)}</p>
    <p><strong>성함</strong>: ${escapeHtml(name)}</p>
    <p><strong>이메일</strong>: ${escapeHtml(email)}</p>
    <p><strong>문의내용</strong></p>
    <div style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</div>
`;

exports.handler = async (event) => {
    if (event.httpMethod === "GET" || event.httpMethod === "HEAD") {
        return {
            statusCode: 302,
            headers: {
                Location: "/landing/#contact",
                "Cache-Control": "no-store",
            },
            body: "",
        };
    }

    if (event.httpMethod !== "POST") {
        return json(405, { ok: false, code: "method_not_allowed", message: "문의 폼 전송만 지원합니다." });
    }

    let data;
    try {
        data = parseFormBody(event);
    } catch {
        return json(400, { ok: false, message: "요청 형식이 올바르지 않습니다." });
    }

    if (normalize(data.company)) {
        return json(200, { ok: true, message: "접수되었습니다." });
    }

    const name = normalize(data.name, 120);
    const email = normalize(data.email, 254);
    const message = normalize(data.message, 5000);
    const source = getContactSource(data.source);

    if (!name || !email || !message) {
        return json(400, { ok: false, message: "성함, 이메일, 문의내용을 모두 입력해주세요." });
    }

    if (!isEmail(email)) {
        return json(400, { ok: false, message: "이메일 형식이 올바르지 않습니다." });
    }

    const requestId = crypto.randomUUID();
    try {
        await sendSmtpMail({
            from: CONTACT_FROM,
            to: CONTACT_TO,
            replyTo: email,
            subject: `${SUBJECT_PREFIX} ${source.subject} - ${name}`,
            text: buildContactText({ name, email, message, requestId, source }),
            html: buildContactHtml({ name, email, message, requestId, source }),
            headers: {
                "X-NERO-Request-ID": requestId,
                "X-NERO-Source": source.key,
            },
        });
    } catch (error) {
        const code = errorCodeFrom(error);
        console.error("[contact]", code, error);
        return json(500, {
            ok: false,
            code,
            missing: code === "smtp_env_missing" ? missingSmtpKeys() : undefined,
            message: "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
        });
    }

    return json(200, { ok: true, message: source.success });
};
