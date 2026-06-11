import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const analyticsPath = join(rootDir, "scripts", "analytics.js");
const pagePaths = [
    "pages/home.html",
    "pages/landing.html",
    "pages/overview.html",
    "pages/about.html",
    "pages/announcement.html",
    "pages/services.html",
];

const analyticsSource = readFileSync(analyticsPath, "utf8");
const measurementMatch = analyticsSource.match(/const\s+GA4_MEASUREMENT_ID\s*=\s*"([^"]+)"/);
const measurementId = measurementMatch?.[1] || "";
const failures = [];

if (!/^G-[A-Z0-9]+$/i.test(measurementId) || measurementId === "G-XXXXXXXXXX") {
    failures.push("scripts/analytics.js의 GA4_MEASUREMENT_ID를 실제 G- 측정 ID로 교체해야 합니다.");
}

const requiredSnippets = [
    "window.NERO_ANALYTICS",
    "click_cta",
    "click_outbound",
    "form_submit_attempt",
    "scroll_depth",
    "time_on_page",
    "time_on_page_exit",
];

requiredSnippets.forEach((snippet) => {
    if (!analyticsSource.includes(snippet)) {
        failures.push(`scripts/analytics.js에 ${snippet} 수집 로직이 없습니다.`);
    }
});

pagePaths.forEach((relativePath) => {
    const source = readFileSync(join(rootDir, relativePath), "utf8");
    if (!source.includes("/scripts/analytics.js")) {
        failures.push(`${relativePath}에 /scripts/analytics.js 태그가 없습니다.`);
    }
});

if (failures.length > 0) {
    console.error("GA4 배포 전 검증 실패:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
}

console.log(`GA4 배포 전 검증 통과: ${measurementId}`);
