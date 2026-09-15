const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(join(__dirname, "../scripts/analytics.js"), "utf8");

function loadAnalytics(url, session = new Map(), blockedStorage = false) {
    const scripts = [];
    const listeners = {};
    const location = new URL(url);
    const window = {
        location,
        sessionStorage: {
            getItem(key) { if (blockedStorage) throw new Error("Storage blocked"); return session.get(key) || null; },
            setItem(key, value) { if (blockedStorage) throw new Error("Storage blocked"); session.set(key, value); },
        },
        localStorage: { getItem() { if (blockedStorage) throw new Error("Storage blocked"); return null; } },
        setTimeout() {},
        addEventListener() {},
    };
    const document = {
        title: "NERO 테스트 페이지",
        referrer: "https://search.example.invalid/",
        head: { appendChild(script) { scripts.push(script); } },
        createElement() { return {}; },
        addEventListener(name, listener) { listeners[name] = listener; },
    };
    vm.runInNewContext(source, { window, document, URLSearchParams, console }, { filename: "analytics.js" });
    return { window, scripts, listeners };
}

test("GA4 ID, one loader, attribution URL, UTM and referrer survive page initialization", () => {
    const original = "https://www.nero.ai.kr/services/research-platform?utm_source=chatgpt.com&utm_medium=referral";
    const { window, scripts } = loadAnalytics(original);
    assert.equal(window.location.href, original);
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-T4M4PX09GB");
    assert.equal(window.NERO_ANALYTICS.enabled, true);
    const config = window.dataLayer.filter((args) => args[0] === "config");
    assert.equal(config.length, 1);
    assert.equal(config[0][1], "G-T4M4PX09GB");
    assert.equal(config[0][2].page_location, original);
    const context = window.dataLayer.find((args) => args[1] === "nero_page_context")[2];
    assert.equal(context.utm_source, "chatgpt.com");
    assert.equal(context.utm_medium, "referral");
    assert.equal(context.first_referrer, "https://search.example.invalid/");
    assert.equal(context.entry_path, "/services/research-platform?utm_source=chatgpt.com&utm_medium=referral");
});

test("GA4 retains the session's first entry and tracks the current path and accepted lead separately", () => {
    const session = new Map();
    loadAnalytics("https://www.nero.ai.kr/?utm_source=chatgpt.com", session);
    const { window } = loadAnalytics("https://www.nero.ai.kr/overview", session);
    window.NERO_ANALYTICS.track("generate_lead", { lead_id: "test-lead-id", form_source: "overview_download" });
    const lead = window.dataLayer.find((args) => args[1] === "generate_lead")[2];
    assert.equal(lead.entry_path, "/?utm_source=chatgpt.com");
    assert.equal(lead.page_path, "/overview");
    assert.equal(lead.lead_id, "test-lead-id");
    assert.equal(lead.form_source, "overview_download");
});

test("GA4 storage restrictions do not prevent tracking setup", () => {
    const { window, scripts } = loadAnalytics("https://www.nero.ai.kr/", new Map(), true);
    assert.equal(scripts.length, 1);
    assert.equal(window.NERO_ANALYTICS.enabled, true);
    assert.doesNotThrow(() => window.NERO_ANALYTICS.track("generate_lead", { lead_id: "test-lead-id" }));
});
