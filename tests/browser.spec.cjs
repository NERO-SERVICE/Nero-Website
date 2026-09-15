const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');

const root = resolve(__dirname, '..');
const baselineOrigin = 'http://baseline.nero.test';
const pageFiles = new Map([
    ['/', 'pages/home.html'], ['/landing', 'pages/landing.html'],
    ['/about', 'pages/about.html'], ['/overview', 'pages/overview.html'],
    ['/services', 'pages/services.html'], ['/announcement', 'pages/announcement.html'],
]);
const routes = [...pageFiles.keys()];
const removedRoutes = [
    '/services/research-platform', '/services/startup-mvp', '/services/maintenance',
    '/guides', '/guides/mvp-cost', '/guides/research-app-checklist', '/guides/software-handover',
];
const types = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2',
};

// A deterministic local test double, not a downloaded CDN library. Both pages use
// this same modal/collapse behavior; real third-party fonts, icons and Spline are
// intentionally outside this offline comparison's validation scope.
const bootstrapDouble = `(() => {
    const instances = new WeakMap();
    class Modal {
        constructor(element) { this.element = element; instances.set(element, this); }
        show() {
            this.element.dispatchEvent(new Event('show.bs.modal'));
            this.element.style.display = 'block';
            this.element.classList.add('show');
            this.element.removeAttribute('aria-hidden');
            document.body.classList.add('modal-open');
        }
        hide() {
            this.element.classList.remove('show');
            this.element.style.display = 'none';
            this.element.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            this.element.dispatchEvent(new Event('hidden.bs.modal'));
        }
        static getInstance(element) { return instances.get(element); }
        static getOrCreateInstance(element) { return instances.get(element) || new Modal(element); }
    }
    window.bootstrap = { Modal, Collapse: class { constructor() {} }, ScrollSpy: class { constructor() {} } };
    document.addEventListener('click', (event) => {
        const close = event.target.closest('[data-bs-dismiss="modal"]');
        if (close) Modal.getInstance(close.closest('.modal'))?.hide();
        const toggle = event.target.closest('[data-bs-toggle="collapse"]');
        if (toggle) {
            const target = document.querySelector(toggle.getAttribute('data-bs-target'));
            target?.classList.toggle('show');
            toggle.setAttribute('aria-expanded', String(target?.classList.contains('show') || false));
        }
    });
})();`;

async function serveBaseline(route, url) {
    let path;
    try { path = decodeURIComponent(url.pathname); } catch { return route.fulfill({ status: 400, body: 'Bad path' }); }
    const normalized = path.replace(/\/+$/, '') || '/';
    const relative = pageFiles.get(normalized) || normalized.slice(1);
    const allowed = pageFiles.has(normalized) || /^(?:pages|css|scripts|components|assets|data)\//.test(relative);
    const file = resolve(root, relative);
    if (!allowed || !file.startsWith(`${root}${sep}`) || relative.split('/').some((part) => part.startsWith('.')) || !types[extname(file)]) {
        return route.fulfill({ status: 404, body: 'Not found' });
    }
    try {
        const body = await readFile(file);
        return route.fulfill({ status: 200, contentType: types[extname(file)], body });
    } catch {
        return route.fulfill({ status: 404, body: 'Not found' });
    }
}

async function isolateNetwork(context, previewOrigin) {
    const state = { externalMocks: [], contactRequests: [], contactSuccess: false, contactResponseGate: null };
    // Every browser request reaches this handler. Only this local preview origin
    // can continue to the network; baseline files are fulfilled from the repo.
    await context.route('**/*', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.pathname === '/.netlify/functions/contact') {
            state.contactRequests.push({ origin: url.origin, method: request.method(), data: request.postDataJSON() });
            if (state.contactResponseGate) await state.contactResponseGate;
            return route.fulfill({ status: state.contactSuccess ? 200 : 500, contentType: 'application/json', body: JSON.stringify(state.contactSuccess
                ? { ok: true, message: '테스트 접수 완료' }
                : { ok: false, message: '테스트 실패' }) });
        }
        if (url.origin === baselineOrigin) return serveBaseline(route, url);
        if (url.origin === previewOrigin) return route.continue();
        state.externalMocks.push({ url: url.href, type: request.resourceType() });
        const isBootstrap = url.hostname === 'cdn.jsdelivr.net' && url.pathname.endsWith('/bootstrap.bundle.min.js');
        const type = request.resourceType();
        const contentType = type === 'stylesheet' ? 'text/css' : type === 'script' ? 'text/javascript' : 'text/html';
        return route.fulfill({
            status: 200,
            contentType,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: isBootstrap ? bootstrapDouble : type === 'document'
                ? '<!DOCTYPE html><html lang="ko"><head><title>Local external-content placeholder</title></head><body></body></html>'
                : '',
        });
    });
    await context.routeWebSocket('**/*', (socket) => socket.close());
    return state;
}

async function settle(page, path, origin) {
    const response = await page.goto(new URL(path, origin).href, { waitUntil: 'networkidle' });
    expect(response.status()).toBe(200);
    await expect(page.locator('main')).toBeAttached();
    if (path === '/announcement') await expect(page.locator('.announcement-card')).toHaveCount(3);
    if (path === '/services') {
        await expect(page.locator('#mainNav')).toBeAttached();
        await expect(page.locator('#footer-container footer')).toBeAttached();
    } else await expect(page.locator('.site-header')).toHaveCount(1);
    if (path === '/about') await expect(page.locator('.about-loader')).toBeHidden({ timeout: 16000 });
    await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].filter((img) => img.loading !== 'lazy' && !img.complete).map((img) => new Promise((done) => {
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
        })));
        window.scrollTo(0, 0);
    });
    // Finish the original entrance transitions, then freeze only ongoing motion
    // identically in both test pages so timing cannot mask a layout regression.
    await page.waitForTimeout(800);
    await page.addStyleTag({ content: '*, *::before, *::after { animation-play-state: paused !important; transition-duration: 0s !important; }' });
}

async function visualState(page) {
    return page.evaluate(() => {
        const text = (value) => String(value || '').replace(/\s+/g, ' ').trim();
        const visible = (node) => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
        };
        const box = (node) => {
            const rect = node.getBoundingClientRect();
            return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
        };
        const headingProperties = ['fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing', 'color', 'textAlign', 'textTransform', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom'];
        const headings = [...document.querySelectorAll('main h1, main h2, main h3, main h4')].filter(visible).map((node) => {
            const style = getComputedStyle(node);
            return { tag: node.tagName, text: text(node.textContent), style: Object.fromEntries(headingProperties.map((key) => [key, style[key]])), box: box(node) };
        });
        const anchors = [...document.querySelectorAll('body a[href]')].map((node) => ({
            text: text(node.textContent), label: node.getAttribute('aria-label') || '',
            href: node.getAttribute('href'), target: node.getAttribute('target') || '', visible: visible(node),
        }));
        const layout = [...document.querySelectorAll('header.site-header, #mainNav, main, main > section, footer, main form, .announcement-card')].filter(visible).map((node) => ({
            tag: node.tagName, id: node.id, classes: node.className, box: box(node),
        }));
        return { text: text(document.body.innerText), anchors, headings, layout, overflow: document.documentElement.scrollWidth - innerWidth };
    });
}

function compareBoxes(actual, expected, label) {
    expect(actual.length, `${label} count`).toBe(expected.length);
    for (let i = 0; i < expected.length; i += 1) {
        const { box: actualBox, ...actualIdentity } = actual[i];
        const { box: expectedBox, ...expectedIdentity } = expected[i];
        expect(actualIdentity, `${label} ${i}`).toEqual(expectedIdentity);
        for (const key of ['x', 'y', 'width', 'height']) {
            expect(Math.abs(actualBox[key] - expectedBox[key]), `${label} ${i} ${key}`).toBeLessThanOrEqual(1);
        }
    }
}

function accessibilityKeys(results) {
    return results.violations.flatMap((violation) => violation.nodes.map((node) => JSON.stringify({ id: violation.id, impact: violation.impact, target: node.target }))).sort();
}

for (const path of routes) {
    test(`existing page matches repository baseline: ${path}`, async ({ context, baseURL }, testInfo) => {
        const previewOrigin = new URL(baseURL).origin;
        const network = await isolateNetwork(context, previewOrigin);
        const baseline = await context.newPage();
        const production = await context.newPage();
        const errors = { baseline: [], production: [] };
        baseline.on('pageerror', (error) => errors.baseline.push(error.message));
        production.on('pageerror', (error) => errors.production.push(error.message));
        await Promise.all([settle(baseline, path, baselineOrigin), settle(production, path, previewOrigin)]);
        const [expected, actual] = await Promise.all([visualState(baseline), visualState(production)]);
        await testInfo.attach('visual-comparison', { body: JSON.stringify({ path, expected, actual, errors, externalMocks: network.externalMocks }, null, 2), contentType: 'application/json' });
        expect(actual.text).toBe(expected.text);
        // This includes hidden original menus as well as visible links, so even an
        // unnoticed new discovery link causes a failure.
        expect(actual.anchors).toEqual(expected.anchors);
        compareBoxes(actual.headings, expected.headings, 'heading style and position');
        compareBoxes(actual.layout, expected.layout, 'layout');
        expect(actual.overflow).toBeLessThanOrEqual(Math.max(1, expected.overflow));
        expect(errors.production).toEqual(errors.baseline);
        await testInfo.attach('repository-baseline', { body: await baseline.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
        await testInfo.attach('production-preview', { body: await production.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
        const [baselineAxe, productionAxe] = await Promise.all([baseline, production].map((page) => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()));
        const oldViolations = new Set(accessibilityKeys(baselineAxe));
        const newViolations = accessibilityKeys(productionAxe).filter((key) => !oldViolations.has(key));
        await testInfo.attach('accessibility-baseline-comparison', { body: JSON.stringify({ baseline: baselineAxe, production: productionAxe, newViolations }, null, 2), contentType: 'application/json' });
        expect(newViolations).toEqual([]);
        expect(network.contactRequests).toEqual([]);
    });
}

test('only the six original routes are public; initial HTML remains readable without JavaScript', async ({ browser, baseURL }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block', viewport: testInfo.project.use.viewport });
    await isolateNetwork(context, new URL(baseURL).origin);
    const page = await context.newPage();
    try {
        for (const path of routes) {
            const response = await page.goto(new URL(path, baseURL).href, { waitUntil: 'networkidle' });
            expect(response.status()).toBe(200);
            await expect(page.locator('main')).toBeVisible();
            expect((await page.locator('main').innerText()).trim().length).toBeGreaterThan(20);
            expect(await page.locator('main h1, main h2, main h3').count()).toBeGreaterThan(0);
            expect(await page.locator('a[href]').count()).toBeGreaterThan(0);
            await expect(page.locator('head title')).not.toBeEmpty();
            expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();
            expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`https://www.nero.ai.kr${path === '/' ? '/' : path}`);
        }
        for (const path of [...removedRoutes, '/this-page-does-not-exist']) {
            const response = await page.goto(new URL(path, baseURL).href, { waitUntil: 'domcontentloaded' });
            expect(response.status(), path).toBe(404);
        }
        const sitemapResponse = await page.goto(new URL('/sitemap.xml', baseURL).href, { waitUntil: 'domcontentloaded' });
        const sitemap = await sitemapResponse.text();
        const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname).sort();
        expect(urls).toEqual([...routes].sort());
    } finally { await context.close(); }
});

async function fillContactForm(page) {
    const form = page.locator('form');
    const values = { name: '화면 회귀 테스트', email: 'test@example.invalid', message: '실제 발송하지 않는 모의 문의', companyName: '테스트 회사', phone: '010-0000-0000', visitPath: '테스트 경로' };
    for (const input of await form.locator('input:not([type="hidden"]):not([name="company"]), textarea').all()) {
        const name = await input.getAttribute('name');
        if (await input.isVisible()) await input.fill(values[name] || '테스트');
    }
    for (const select of await form.locator('select').all()) await select.selectOption({ index: 1 });
    return form;
}

async function exerciseForm(page, path, origin, network) {
    await settle(page, path, origin);
    const form = await fillContactForm(page);
    network.contactSuccess = false;
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('.form-status')).toHaveText('테스트 실패');
    await expect(form.locator('[name="email"]')).toHaveValue('test@example.invalid');
    await expect(form.locator('button[type="submit"]')).toBeEnabled();
    const failedState = await form.getAttribute('data-submitted');
    network.contactSuccess = true;
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('.form-status')).toHaveText('테스트 접수 완료');
    await expect(form.locator('button[type="submit"]')).toBeEnabled();
    await expect(form.locator('[name="email"]')).toHaveValue('');
    return { failedState, successState: await form.getAttribute('data-submitted') };
}

for (const path of ['/', '/landing', '/overview']) {
    test(`original contact failure and success are preserved: ${path}`, async ({ context, baseURL }) => {
        const previewOrigin = new URL(baseURL).origin;
        const network = await isolateNetwork(context, previewOrigin);
        const baseline = await context.newPage();
        const production = await context.newPage();
        const expected = await exerciseForm(baseline, path, baselineOrigin, network);
        const actual = await exerciseForm(production, path, previewOrigin, network);
        expect(actual).toEqual(expected);
        expect(actual).toEqual({ failedState: 'false', successState: 'true' });
        const baselineRequests = network.contactRequests.filter((item) => item.origin === baselineOrigin);
        const productionRequests = network.contactRequests.filter((item) => item.origin === previewOrigin);
        expect(baselineRequests).toHaveLength(2);
        expect(productionRequests.map(({ method, data }) => ({ method, data }))).toEqual(baselineRequests.map(({ method, data }) => ({ method, data })));
    });

    test(`original disabled submit button prevents repeat clicks while pending: ${path}`, async ({ context, baseURL }) => {
        const previewOrigin = new URL(baseURL).origin;
        const network = await isolateNetwork(context, previewOrigin);
        for (const origin of [baselineOrigin, previewOrigin]) {
            const page = await context.newPage();
            await settle(page, path, origin);
            const form = await fillContactForm(page);
            const submitButton = form.locator('button[type="submit"]');
            const requestCountBefore = network.contactRequests.length;
            let releaseResponse;
            network.contactSuccess = true;
            network.contactResponseGate = new Promise((resolve) => { releaseResponse = resolve; });
            try {
                await submitButton.click();
                await expect(submitButton).toBeDisabled();
                await expect.poll(() => network.contactRequests.length).toBe(requestCountBefore + 1);
                // HTMLButtonElement.click() respects the native disabled state.
                // This checks the existing UI behavior, not synthetic form-event
                // dispatch or server-wide request deduplication.
                await submitButton.evaluate((button) => button.click());
                expect(network.contactRequests.length).toBe(requestCountBefore + 1);
                releaseResponse();
                network.contactResponseGate = null;
                await expect(form.locator('.form-status')).toHaveText('테스트 접수 완료');
                await expect(submitButton).toBeEnabled();
                expect(network.contactRequests.length).toBe(requestCountBefore + 1);
            } finally {
                releaseResponse();
                network.contactResponseGate = null;
                await page.close();
            }
        }
    });
}

test('original announcement filters and modal behavior match baseline', async ({ context, baseURL }) => {
    const previewOrigin = new URL(baseURL).origin;
    await isolateNetwork(context, previewOrigin);
    const snapshots = [];
    for (const origin of [baselineOrigin, previewOrigin]) {
        const page = await context.newPage();
        await settle(page, '/announcement', origin);
        await page.getByRole('tab', { name: '보도자료', exact: true }).click();
        await expect(page.locator('.announcement-card')).toHaveCount(2);
        const pressTitles = await page.locator('.announcement-title').allTextContents();
        await page.getByRole('tab', { name: '법정공고', exact: true }).click();
        await expect(page.locator('.announcement-card')).toHaveCount(1);
        await page.locator('.read-more-btn').click();
        await expect(page.locator('#announcementModal')).toBeVisible();
        await expect(page.locator('#announcementModalBody')).toContainText('【공고방법】');
        const modalText = await page.locator('#announcementModalBody').innerText();
        await page.locator('#announcementModal .modal-footer [data-bs-dismiss="modal"]').click();
        await expect(page.locator('#announcementModal')).toBeHidden();
        snapshots.push({ pressTitles, modalText });
    }
    expect(snapshots[1]).toEqual(snapshots[0]);
});
