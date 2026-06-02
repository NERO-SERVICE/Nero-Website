const crypto = require("crypto");

const json = (statusCode, body) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
});

const normalize = (value, maxLength = 2000) => String(value ?? "").trim().slice(0, maxLength);

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const CONTACT_NOTIFICATION = {
    to: "official@nero.ai.kr",
    subjectPrefix: "[NERO]",
    requestCollectionPath: "nero-web/contact_requests/items",
    emailQueueCollectionPath: "nero-web/email_queue/items",
};

const escapeHtml = (value) => normalize(value, 5000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const parseJson = (event) => {
    if (!event.body) return {};
    return JSON.parse(event.body);
};

const getServiceAccount = () => {
    const encoded = normalize(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 20000);
    if (!encoded) return null;
    const source = Buffer.from(encoded, "base64").toString("utf8");
    return JSON.parse(source);
};

const toBase64Url = (value) => Buffer.from(value).toString("base64url");

const createFirebaseJwt = (serviceAccount) => {
    const now = Math.floor(Date.now() / 1000);
    const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = toBase64Url(JSON.stringify({
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/datastore",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
    }));
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(`${header}.${claim}`);
    signer.end();
    const signature = signer.sign(serviceAccount.private_key).toString("base64url");
    return `${header}.${claim}.${signature}`;
};

const getFirebaseAccessToken = async (serviceAccount) => {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: createFirebaseJwt(serviceAccount),
        }),
    });

    if (!tokenResponse.ok) {
        const details = await tokenResponse.text();
        throw new Error(`Firebase token request failed: ${details}`);
    }

    const token = await tokenResponse.json();
    return token.access_token;
};

const firebaseContext = async () => {
    const projectId = normalize(process.env.FIREBASE_PROJECT_ID);
    const databaseId = encodeURIComponent(normalize(process.env.FIRESTORE_DATABASE_ID || "(default)"));
    const serviceAccount = getServiceAccount();
    if (!projectId || !serviceAccount) {
        throw new Error("Missing Firebase environment variables");
    }

    const accessToken = await getFirebaseAccessToken(serviceAccount);
    return { projectId, databaseId, accessToken };
};

const firestoreValue = (value) => {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === "boolean") return { booleanValue: value };
    if (typeof value === "number") return { doubleValue: value };
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map((item) => firestoreValue(item)),
            },
        };
    }
    if (typeof value === "object") {
        return {
            mapValue: {
                fields: Object.fromEntries(
                    Object.entries(value).map(([key, item]) => [key, firestoreValue(item)]),
                ),
            },
        };
    }
    return { stringValue: normalize(value, 5000) };
};

const firestoreFields = (data) => Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, firestoreValue(value)]),
);

const createFirestoreDocument = async (collectionPath, data) => {
    const { projectId, databaseId, accessToken } = await firebaseContext();
    const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionPath}`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fields: firestoreFields(data),
        }),
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Firestore write failed: ${details}`);
    }

    return response.json();
};

const buildContactText = ({ name, email, message }) => [
        `성함: ${name}`,
        `이메일: ${email}`,
        "",
        "문의내용:",
        message,
].join("\n");

const buildContactHtml = ({ name, email, message }) => `
        <h2>${escapeHtml(CONTACT_NOTIFICATION.subjectPrefix)} 프로젝트 진단 요청</h2>
        <p><strong>성함</strong>: ${escapeHtml(name)}</p>
        <p><strong>이메일</strong>: ${escapeHtml(email)}</p>
        <p><strong>문의내용</strong></p>
        <div style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</div>
`;

const saveContactRequest = async ({ name, email, message, userAgent, referer }) => {
    const now = new Date();
    const contactDoc = await createFirestoreDocument(CONTACT_NOTIFICATION.requestCollectionPath, {
        name,
        email,
        message,
        source: "landing_contact",
        status: "new",
        userAgent,
        referer,
        createdAt: now,
    });

    const requestId = contactDoc.name?.split("/").pop() || "";

    await createFirestoreDocument(CONTACT_NOTIFICATION.emailQueueCollectionPath, {
        to: CONTACT_NOTIFICATION.to,
        replyTo: email,
        requestId,
        message: {
            subject: `${CONTACT_NOTIFICATION.subjectPrefix} 프로젝트 진단 요청 - ${name}`,
            text: buildContactText({ name, email, message }),
            html: buildContactHtml({ name, email, message }),
        },
        createdAt: now,
    });

    return { requestId };
};

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return json(405, { ok: false, message: "POST 요청만 지원합니다." });
    }

    let data;
    try {
        data = parseJson(event);
    } catch {
        return json(400, { ok: false, message: "요청 형식이 올바르지 않습니다." });
    }

    if (normalize(data.company)) {
        return json(200, { ok: true, message: "접수되었습니다." });
    }

    const name = normalize(data.name, 120);
    const email = normalize(data.email, 254);
    const message = normalize(data.message, 5000);

    if (!name || !email || !message) {
        return json(400, { ok: false, message: "성함, 이메일, 문의내용을 모두 입력해주세요." });
    }

    if (!isEmail(email)) {
        return json(400, { ok: false, message: "이메일 형식이 올바르지 않습니다." });
    }

    try {
        await saveContactRequest({
            name,
            email,
            message,
            userAgent: event.headers["user-agent"] || "",
            referer: event.headers.referer || "",
        });
    } catch (error) {
        console.error(error);
        return json(500, { ok: false, message: "접수 저장에 실패했습니다. 잠시 후 다시 시도해주세요." });
    }

    return json(200, { ok: true, message: "아이디어가 접수되었습니다. 곧 연락드리겠습니다." });
};
