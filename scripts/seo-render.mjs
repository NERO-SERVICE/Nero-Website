import { site, absoluteUrl, developmentService } from '../content/site.mjs';

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const serializeJsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const orgId = `${site.origin}/#organization`;
export function structuredData(page) {
    const organization = { '@type': 'Organization', '@id': orgId, name: site.organizationName, legalName: site.legalName, alternateName: site.alternateName, url: `${site.origin}/`, logo: absoluteUrl(site.logo), email: site.email };
    const website = { '@type': 'WebSite', '@id': `${site.origin}/#website`, url: `${site.origin}/`, name: site.name, inLanguage: 'ko', publisher: { '@id': orgId } };
    const webpage = { '@type': 'WebPage', '@id': `${page.canonical}#webpage`, url: page.canonical, name: page.title, description: page.bodyDescription ?? page.description, inLanguage: 'ko', isPartOf: { '@id': website['@id'] } };
    const graph = [organization, website, webpage];
    webpage.publisher = { '@id': orgId };
    if (page.aboutOrganization) webpage.mainEntity = { '@id': orgId };
    if (page.developmentService) {
        const serviceId = `${site.origin}/#development-service`;
        graph.push({ '@type': 'Service', '@id': serviceId, ...developmentService,
            url: absoluteUrl('/'), provider: { '@id': orgId },
        });
        webpage.about = { '@id': serviceId };
    }
    return { '@context': 'https://schema.org', '@graph': graph };
}
export function metadata(page, config = { indexable: true, verification: [] }) {
    const indexable = page.indexable && config.indexable;
    return `<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeHtml(page.description)}" />
<link rel="canonical" href="${escapeHtml(page.canonical)}" />
${indexable ? '<meta name="robots" content="index, follow, max-image-preview:large" />' : '<meta name="robots" content="noindex, follow" />'}
${indexable ? config.verification.map(({ name, value }) => `<meta name="${escapeHtml(name)}" content="${escapeHtml(value)}" />`).join('\n') : ''}
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(page.title)}" />
<meta property="og:description" content="${escapeHtml(page.description)}" />
<meta property="og:url" content="${escapeHtml(page.canonical)}" />
<meta property="og:site_name" content="${site.name}" />
<meta property="og:locale" content="ko_KR" />
<meta property="og:image" content="${absoluteUrl(site.image)}" />
<script type="application/ld+json">${serializeJsonLd(structuredData(page))}</script>`;
}
