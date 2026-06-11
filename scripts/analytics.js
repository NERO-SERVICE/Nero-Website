const GA4_PLACEHOLDER_ID = "G-XXXXXXXXXX";
const GA4_MEASUREMENT_ID = "G-T4M4PX09GB";

(() => {
    const measurementId = GA4_MEASUREMENT_ID.trim();
    const isConfigured = /^G-[A-Z0-9]+$/i.test(measurementId) && measurementId !== GA4_PLACEHOLDER_ID;
    const params = new URLSearchParams(window.location.search);
    const debugMode = params.has("ga4_debug") || (() => {
        try {
            return window.localStorage.getItem("nero_ga4_debug") === "true";
        } catch {
            return false;
        }
    })();
    const sessionKey = "nero_ga4_session_context";
    const now = Date.now();
    const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];

    const getSessionContext = () => {
        try {
            const saved = JSON.parse(window.sessionStorage.getItem(sessionKey) || "null");
            if (saved?.entryPath) return saved;
            const context = {
                entryPath: window.location.pathname + window.location.search,
                entryTitle: document.title,
                firstReferrer: document.referrer || "direct",
                startedAt: now,
            };
            window.sessionStorage.setItem(sessionKey, JSON.stringify(context));
            return context;
        } catch {
            return {
                entryPath: window.location.pathname + window.location.search,
                entryTitle: document.title,
                firstReferrer: document.referrer || "direct",
                startedAt: now,
            };
        }
    };

    const sessionContext = getSessionContext();

    const normalizeValue = (value) => {
        if (value === undefined || value === null || value === "") return undefined;
        if (typeof value === "number" || typeof value === "boolean") return value;
        return String(value).slice(0, 120);
    };

    const normalizeKey = (key) => String(key)
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toLowerCase()
        .slice(0, 40);

    const normalizePayload = (payload = {}) => Object.entries(payload).reduce((result, [key, value]) => {
        const normalized = normalizeValue(value);
        const normalizedKey = normalizeKey(key);
        if (normalized !== undefined && normalizedKey) result[normalizedKey] = normalized;
        return result;
    }, {});

    const campaignPayload = () => campaignKeys.reduce((result, key) => {
        const value = params.get(key);
        if (value) result[key] = value;
        return result;
    }, {});

    const basePayload = () => ({
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
        entry_path: sessionContext.entryPath,
        first_referrer: sessionContext.firstReferrer,
        ...campaignPayload(),
        debug_mode: debugMode || undefined,
    });

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };

    const track = (eventName, payload = {}) => {
        if (!isConfigured || typeof window.gtag !== "function" || !eventName) return;
        window.gtag("event", eventName, normalizePayload({
            ...basePayload(),
            ...payload,
        }));
    };

    window.NERO_ANALYTICS = {
        enabled: isConfigured,
        debugMode,
        measurementId: isConfigured ? measurementId : "",
        track,
    };

    if (!isConfigured) {
        console.warn("NERO GA4 is disabled. Replace GA4_MEASUREMENT_ID in /scripts/analytics.js with your G- measurement ID.");
        return;
    }

    const gtagScript = document.createElement("script");
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(gtagScript);

    window.gtag("js", new Date());
    window.gtag("config", measurementId, normalizePayload({
        page_title: document.title,
        page_path: window.location.pathname + window.location.search,
        page_location: window.location.href,
        debug_mode: debugMode || undefined,
    }));

    track("nero_page_context", {
        page_location: window.location.href,
    });

    const getText = (element) => (
        element.getAttribute("aria-label")
        || element.textContent
        || element.value
        || element.name
        || element.id
        || element.tagName
    ).trim().replace(/\s+/g, " ").slice(0, 80);

    const getSectionId = (element) => element.closest("section[id], main[id], footer")?.id || element.closest("footer")?.tagName?.toLowerCase() || "unknown";

    document.addEventListener("click", (event) => {
        const target = event.target.closest("a, button, summary, [role='button'], input[type='submit']");
        if (!target) return;
        if (target.closest("[data-track]")) return;

        const href = target.href || target.getAttribute("href") || "";
        const isOutbound = href && target.hostname && target.hostname !== window.location.hostname;
        track(isOutbound ? "click_outbound" : "click_cta", {
            cta_text: getText(target),
            cta_href: href,
            cta_section: getSectionId(target),
            cta_tag: target.tagName.toLowerCase(),
        });
    }, true);

    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        track("form_submit_attempt", {
            form_id: form.id,
            form_name: form.getAttribute("name"),
            form_source: new FormData(form).get("source"),
        });
    }, true);

    const scrollMarks = [25, 50, 75, 90];
    const firedScrollMarks = new Set();
    let scrollTicking = false;

    const checkScrollDepth = () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll <= 0 ? 100 : Math.round((window.scrollY / maxScroll) * 100);
        scrollMarks.forEach((mark) => {
            if (progress >= mark && !firedScrollMarks.has(mark)) {
                firedScrollMarks.add(mark);
                track("scroll_depth", { percent_scrolled: mark });
            }
        });
        scrollTicking = false;
    };

    window.addEventListener("scroll", () => {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(checkScrollDepth);
    }, { passive: true });

    const timeMarks = [15000, 30000, 60000, 120000];
    timeMarks.forEach((delay) => {
        window.setTimeout(() => {
            track("time_on_page", {
                engagement_time_msec: Date.now() - now,
                time_mark_sec: Math.round(delay / 1000),
            });
        }, delay);
    });

    window.addEventListener("pagehide", () => {
        track("time_on_page_exit", {
            engagement_time_msec: Date.now() - now,
            transport_type: "beacon",
        });
    });
})();
