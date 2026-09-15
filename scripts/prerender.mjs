import vm from 'node:vm';

// Render trusted repository sources, preserving their HTML instead of maintaining a
// second template. The VM receives no network, file, timer, or application APIs.
const legacyPages = Object.freeze({
    home: { wiring: 'hydrateAssetSlots', header: 'renderLandingHeader' },
    landing: { wiring: 'hydrateAssetSlots', header: 'renderLandingHeader' },
    about: { wiring: 'getAnchorOffset', header: 'renderLandingHeader' },
    overview: { wiring: 'wireDrawer', header: 'renderSiteHeader' },
});

function uniqueIndex(source, marker, label) {
    const index = source.indexOf(marker);
    if (index === -1 || source.indexOf(marker, index + marker.length) !== -1) {
        throw new Error(`${label}: expected one rendering boundary ${JSON.stringify(marker)}`);
    }
    return index;
}

function checkSource(source, label) {
    if (typeof source !== 'string' || source.trim() === '') throw new TypeError(`${label}: source text is required`);
}

function offlineContext(document) {
    const unavailable = () => { throw new Error('Network and browser effects are unavailable during prerender'); };
    return vm.createContext({
        document: Object.freeze(document),
        window: { addEventListener() {}, fetch: unavailable },
        fetch: unavailable,
        setTimeout: unavailable,
        setInterval: unavailable,
    }, { codeGeneration: { strings: false, wasm: false }, microtaskMode: 'afterEvaluate' });
}

function evaluate(source, context, filename) {
    return new vm.Script(source, { filename }).runInContext(context, { timeout: 1000 });
}

export function renderLegacyPage(sourceName, sourceText) {
    const config = legacyPages[sourceName];
    if (!Object.hasOwn(legacyPages, sourceName)) throw new Error(`Unsupported legacy page: ${sourceName}`);
    checkSource(sourceText, sourceName);
    const rootIndex = uniqueIndex(sourceText, 'const landingRoot = document.querySelector("#main");', sourceName);
    const headerIndex = uniqueIndex(sourceText, `document.body.insertAdjacentHTML("afterbegin", ${config.header}(pageConfig));`, sourceName);
    const mainIndex = uniqueIndex(sourceText, 'landingRoot.innerHTML = `', sourceName);
    const wiringIndex = uniqueIndex(sourceText, `\nconst ${config.wiring} =`, sourceName);
    const prefix = sourceText.slice(0, wiringIndex).trimEnd();
    if (!(rootIndex < headerIndex && headerIndex < mainIndex && mainIndex < wiringIndex) || !prefix.endsWith('`;')) {
        throw new Error(`${sourceName}: HTML assignment must finish immediately before browser wiring`);
    }

    let main;
    let header;
    let queries = 0;
    const root = Object.freeze({
        set innerHTML(value) {
            if (main !== undefined || typeof value !== 'string') throw new Error(`${sourceName}: expected one main HTML assignment`);
            main = value;
        },
    });
    const context = offlineContext({
        querySelector(selector) {
            if (selector !== '#main' || queries++ !== 0) throw new Error(`${sourceName}: unexpected DOM query during HTML rendering`);
            return root;
        },
        body: Object.freeze({
            insertAdjacentHTML(position, value) {
                if (position !== 'afterbegin' || header !== undefined || typeof value !== 'string') throw new Error(`${sourceName}: expected one header insertion`);
                header = value;
            },
        }),
    });
    evaluate(prefix, context, `scripts/${sourceName}.js:prerender`);
    if (!header?.trim() || !main?.trim()) throw new Error(`${sourceName}: original renderer produced incomplete HTML`);
    return { header, main };
}

export function renderLegacyAnnouncements(sourceText, announcements, settings = {}) {
    checkSource(sourceText, 'announcement');
    if (!Array.isArray(announcements)) throw new TypeError('announcement: an array of public announcements is required');
    // Do not run the DOMContentLoaded bootstrap or invoke the async constructor.
    const bootstrap = uniqueIndex(sourceText, '\n// 페이지 로드 완료 시 시스템 초기화\n', 'announcement');
    const definitions = sourceText.slice(0, bootstrap).trimEnd();
    if (!definitions.endsWith('}') || !definitions.includes('class AnnouncementSystem {')) {
        throw new Error('announcement: the original class must end before browser initialization');
    }
    const context = offlineContext({ addEventListener() {} });
    evaluate(definitions, context, 'scripts/announcement.js:definitions');
    context.__NERO_PRERENDER_INPUT__ = JSON.stringify({ announcements, settings });
    const rendered = evaluate(`(() => {
        const renderer = Object.create(AnnouncementSystem.prototype);
        renderer.data = JSON.parse(__NERO_PRERENDER_INPUT__);
        renderer.currentCategory = '전체';
        renderer.currentSearchTerm = '';
        renderer.applyFilters();
        const pageSize = renderer.data.settings.postsPerPage || 10;
        return {
            header: renderSiteHeader(SITE_NAV_CONFIG),
            main: renderer.filteredData.slice(0, pageSize).map((item) => renderer.createAnnouncementCard(item)).join(''),
        };
    })()`, context, 'scripts/announcement.js:render');
    if (typeof rendered.header !== 'string' || !rendered.header.trim() || typeof rendered.main !== 'string') {
        throw new Error('announcement: original renderer produced invalid HTML');
    }
    return { header: rendered.header, main: rendered.main };
}
