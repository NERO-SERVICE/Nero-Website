import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { renderLegacyPage, renderLegacyAnnouncements } from '../scripts/prerender.mjs';

const source = async (name) => readFile(new URL(`../scripts/${name}.js`, import.meta.url), 'utf8');
const digest = (html) => createHash('sha256').update(html).digest('hex');
// Exact HTML produced by the user's requested original frontend commit 9e30d40.
const baseline = {
    home: { header: '23632edb756d1b87a0cd9772fb5bc83cfa3805a8d1d4867e5aa599838219710c', main: 'ba85e66bb66ec8f21f3bf7a4b462193f59aebec26017d1e70c3999a89eb3e8e2' },
    landing: { header: '83ea08d627708953b0547d50baba376cbdc7cb408b2e087f614c5caafa8338ea', main: 'e1b9dda1a42c72ebbcdb4587b96f34c9df84a2e7955aa784d72536a4d6509fc3' },
    about: { header: '50e3a951aa21316ba2ab6eed129e2f2fc7084e156b76a26cf0a1206eb816bd69', main: 'b4417e817d4e17b6b8ab134b3d59ea66878d29c831bc8c42b55c60026d1fc326' },
    overview: { header: '846e1bbe14046f9536a6913307312abbde393b778645f43cd84e0863874c37ff', main: 'b5bd08119f92db6baeb2f559f874729a83346570516380fa18432ddbcb6c4a68' },
};

for (const [name, hashes] of Object.entries(baseline)) {
    test(`${name}: original header and complete body remain byte-for-byte unchanged`, async () => {
        const rendered = renderLegacyPage(name, await source(name));
        assert.equal(digest(rendered.header), hashes.header);
        assert.equal(digest(rendered.main), hashes.main);
        assert.match(rendered.header, /class="site-header"/);
        assert.match(rendered.main, /official@nero\.ai\.kr/);
        assert.doesNotMatch(rendered.main, /seo-discovery|seo-about-intro|\/services\/research-platform/);
        if (name === 'home' || name === 'landing') {
            assert.match(rendered.main, /<h1 class="hero-title" id="hero-title">웹사이트, 앱개발, AI 모델, 관리자페이지까지<\/h1>/);
            assert.equal([...rendered.main.matchAll(/<figure class="asset-slot /g)].length, 11);
            assert.match(rendered.main, /id="contact-form" action="\/\.netlify\/functions\/contact" method="post"/);
        }
        if (name === 'overview') {
            assert.match(rendered.main, /<h2 id="overview-title">제안서 받아보기<\/h2>/);
            assert.match(rendered.main, /id="overview-form" action="\/\.netlify\/functions\/contact" method="post"/);
        }
    });
}

test('legacy rendering rejects missing or ambiguous browser-wiring boundaries', async () => {
    const original = await source('home');
    assert.throws(() => renderLegacyPage('unknown', original), /Unsupported legacy page/);
    assert.throws(() => renderLegacyPage('home', ''), /source text is required/);
    assert.throws(() => renderLegacyPage('home', original.replace('landingRoot.innerHTML = `', 'other.innerHTML = `')), /rendering boundary/);
    assert.throws(() => renderLegacyPage('home', `${original}\nconst hydrateAssetSlots = () => {};`), /rendering boundary/);
    assert.throws(() => renderLegacyPage('home', original.replace('\nconst hydrateAssetSlots =', '\nwindow.runEffects();\nconst hydrateAssetSlots =')), /finish immediately/);
});

test('legacy rendering does not execute browser wiring or permit network effects', async () => {
    const original = await source('home');
    const wiringProbe = original.replace('const hydrateAssetSlots = () => {', 'const hydrateAssetSlots = (() => { throw new Error("browser wiring executed"); })();\nconst unused = () => {');
    assert.equal(digest(renderLegacyPage('home', wiringProbe).main), baseline.home.main);
    const networkProbe = original.replace('landingRoot.innerHTML = `', 'fetch("https://example.invalid/must-not-send");\nlandingRoot.innerHTML = `');
    assert.throws(() => renderLegacyPage('home', networkProbe), /unavailable during prerender/);
});

test('announcement prerender uses original cards, initial order and page size without running the constructor', async () => {
    const original = (await source('announcement')).replace('constructor() {', 'constructor() { throw new Error("constructor must not run");');
    const data = JSON.parse(await readFile(new URL('../data/announcements.json', import.meta.url), 'utf8'));
    const before = JSON.stringify(data);
    const rendered = renderLegacyAnnouncements(original, data.announcements, { ...data.settings, postsPerPage: 2 });
    assert.match(rendered.header, /class="site-header"/);
    assert.match(rendered.header, /href="\/announcement"/);
    assert.equal([...rendered.main.matchAll(/<article class="announcement-card /g)].length, 2);
    assert.ok(rendered.main.indexOf('data-id="1"') < rendered.main.indexOf('data-id="3"'));
    assert.doesNotMatch(rendered.main, /data-id="2"|seo-announcement|<h2/);
    assert.match(rendered.main, /<h3 class="announcement-title">법인 설립 공고<\/h3>/);
    assert.match(rendered.main, /data-bs-target="#announcementModal"/);
    assert.match(rendered.main, /class="read-more-btn external-link-btn"/);
    assert.equal(JSON.stringify(data), before, 'prerender does not mutate source announcement data');
});

test('announcement prerender retains original empty-state input and validates its boundary', async () => {
    const original = await source('announcement');
    assert.equal(renderLegacyAnnouncements(original, []).main, '');
    assert.throws(() => renderLegacyAnnouncements(original, null), /array of public announcements/);
    assert.throws(() => renderLegacyAnnouncements(original.replace('// 페이지 로드 완료 시 시스템 초기화', '// changed initialization'), []), /rendering boundary/);
});
