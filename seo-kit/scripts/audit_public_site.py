#!/usr/bin/env python3
"""Read-only initial-HTML SEO smoke test, using Python 3.9+ standard library.

This is NOT an index-status, robots-policy, WAF, accessibility or schema validator.
It requests only robots.txt, sitemap files, a capped sample of sitemap HTML URLs,
root, and one deliberately nonexistent path. No forms are submitted. No external
search service is called. User-Agent changes do not establish crawler identity.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
import xml.etree.ElementTree as ET

MAX_BYTES = 2_000_000
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


def origin(url: str) -> str:
    """Return a normalized HTTP(S) origin, without credentials."""
    p = urlsplit(url)
    if p.scheme.lower() not in ('http', 'https') or not p.hostname or p.username or p.password:
        raise ValueError(f'Expected an HTTP(S) URL without credentials: {url!r}')
    return f'{p.scheme.lower()}://{p.netloc.lower()}'


class SameOriginRedirects(HTTPRedirectHandler):
    def __init__(self, permitted_origin: str):
        self.permitted_origin = permitted_origin

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = urljoin(req.full_url, newurl)
        if origin(target) != self.permitted_origin:
            raise HTTPError(req.full_url, code,
                            f'Cross-origin redirect not followed: {target}', headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, target)


def fetch(url: str, timeout: float, user_agent: str) -> dict[str, Any]:
    """Fetch a bounded response; retain failed HTTP status instead of inventing one."""
    result: dict[str, Any] = {'requested_url': url}
    opener = build_opener(SameOriginRedirects(origin(url)))
    request = Request(url, headers={'User-Agent': user_agent, 'Accept-Encoding': 'identity'})
    try:
        try:
            response = opener.open(request, timeout=timeout)
        except HTTPError as exc:
            response = exc
        with response:
            raw = response.read(MAX_BYTES + 1)
            headers = {k.lower(): v for k, v in response.headers.items()}
            charset = response.headers.get_content_charset() or 'utf-8'
            try:
                body = raw[:MAX_BYTES].decode(charset, errors='replace')
            except LookupError:
                body = raw[:MAX_BYTES].decode('utf-8', errors='replace')
            result.update(status=response.code, final_url=response.geturl(), headers=headers,
                          body=body, truncated=len(raw) > MAX_BYTES,
                          sha256=hashlib.sha256(raw[:MAX_BYTES]).hexdigest())
    except (URLError, OSError, ValueError) as exc:
        result['error'] = str(exc)
    return result


class HTMLAudit(HTMLParser):
    """Extract initial-HTML signals, not rendered visibility or schema semantics."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.titles: list[str] = []
        self._title: list[str] | None = None
        self.meta: dict[str, list[str]] = {}
        self.canonicals: list[str] = []
        self.links: list[str] = []
        self.h1_count = 0
        self.body_text: list[str] = []
        self.in_body = False
        self.excluded: list[str] = []
        self.ld_blocks: list[str] = []
        self._ld: list[str] | None = None

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        a = {k.lower(): v or '' for k, v in attrs}
        if tag == 'body': self.in_body = True
        if tag == 'title': self._title = []
        if tag == 'meta':
            key = (a.get('name') or a.get('property') or '').lower()
            self.meta.setdefault(key, []).append(a.get('content', ''))
        if tag == 'link' and 'canonical' in a.get('rel', '').lower().split():
            self.canonicals.append(a.get('href', ''))
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
        if tag == 'h1': self.h1_count += 1
        if tag in ('script', 'style', 'template', 'noscript'):
            self.excluded.append(tag)
        if tag == 'script' and a.get('type', '').lower() == 'application/ld+json':
            self._ld = []

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == 'title' and self._title is not None:
            self.titles.append(' '.join(''.join(self._title).split()))
            self._title = None
        if tag == 'script' and self._ld is not None:
            self.ld_blocks.append(''.join(self._ld))
            self._ld = None
        if tag in self.excluded:
            # This is a lightweight HTML parser, not a browser DOM implementation.
            reverse_index = len(self.excluded) - 1 - self.excluded[::-1].index(tag)
            self.excluded.pop(reverse_index)
        if tag == 'body': self.in_body = False

    def handle_data(self, data):
        if self._title is not None: self._title.append(data)
        if self._ld is not None: self._ld.append(data)
        if self.in_body and not self.excluded and data.strip():
            self.body_text.append(data.strip())


def page_checks(response: dict[str, Any], expected_canonical: str) -> dict[str, Any]:
    issues: list[str] = []
    result: dict[str, Any] = {
        'url': response['requested_url'], 'expected_canonical': expected_canonical,
        'status': response.get('status'), 'final_url': response.get('final_url'), 'issues': issues}
    if response.get('error'):
        issues.append('FETCH_UNVERIFIED: ' + response['error'])
        return result
    if response.get('status') != 200: issues.append('HTTP_NOT_200')
    if response.get('final_url') != response['requested_url']: issues.append('REDIRECTED')
    if response.get('truncated'): issues.append('RESPONSE_TRUNCATED')
    ctype = response.get('headers', {}).get('content-type', '')
    if 'text/html' not in ctype: issues.append('NOT_HTML_CONTENT_TYPE')
    parser = HTMLAudit()
    parser.feed(response.get('body', ''))
    if len(parser.titles) != 1 or not parser.titles[0]: issues.append('TITLE_MISSING_OR_MULTIPLE')
    descriptions = parser.meta.get('description', [])
    if len(descriptions) != 1 or not descriptions[0].strip():
        issues.append('DESCRIPTION_MISSING_OR_MULTIPLE')
    if parser.canonicals != [expected_canonical]: issues.append('CANONICAL_MISMATCH_OR_MULTIPLE')
    if parser.h1_count != 1: issues.append('H1_REVIEW: project convention is one main H1')
    directives = []
    for name in ('robots', 'googlebot', 'bingbot'):
        directives.extend(parser.meta.get(name, []))
    directives.append(response.get('headers', {}).get('x-robots-tag', ''))
    if any(re.search(r'\b(noindex|none|nosnippet)\b', d, re.I) for d in directives):
        issues.append('INDEX_OR_SNIPPET_RESTRICTION_REVIEW')
    text = ' '.join(parser.body_text)
    if len(text) < 120: issues.append('INITIAL_HTML_TEXT_REVIEW: heuristic, not SEO score')
    if not parser.links: issues.append('NO_INITIAL_HTML_ANCHORS')
    if not parser.ld_blocks: issues.append('JSONLD_NOT_FOUND')
    ld_errors = []
    for idx, block in enumerate(parser.ld_blocks):
        try: json.loads(block)
        except json.JSONDecodeError as exc: ld_errors.append(f'block {idx}: {exc}')
    if ld_errors: issues.append('JSONLD_SYNTAX_ERROR')
    result.update(title=parser.titles, description=descriptions, canonical=parser.canonicals,
                  h1_count=parser.h1_count, body_text_chars=len(text),
                  anchor_count=len(parser.links), jsonld_block_count=len(parser.ld_blocks),
                  jsonld_syntax_errors=ld_errors, content_type=ctype)
    return result


def parse_sitemap(body: str) -> tuple[str, list[str]]:
    if '<!DOCTYPE' in body.upper() or '<!ENTITY' in body.upper():
        raise ValueError('DTD/entities are not accepted by this audit tool')
    root = ET.fromstring(body)
    if root.tag == NS + 'urlset':
        return 'urlset', [n.text.strip() for n in root.findall(f'{NS}url/{NS}loc') if n.text]
    if root.tag == NS + 'sitemapindex':
        return 'sitemapindex', [n.text.strip() for n in root.findall(f'{NS}sitemap/{NS}loc') if n.text]
    raise ValueError('Expected namespaced sitemap urlset or sitemapindex, not HTML')


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--base-url', default='https://www.nero.ai.kr')
    ap.add_argument('--canonical-origin', help='Production origin while testing local preview')
    ap.add_argument('--max-pages', type=int, default=15)
    ap.add_argument('--timeout', type=float, default=10)
    ap.add_argument('--delay', type=float, default=0.15)
    ap.add_argument('--output', default='seo-audit.json')
    ap.add_argument('--user-agent', default='NERO-SEO-Audit/1.0 (read-only; owner-run)')
    args = ap.parse_args()
    if not 1 <= args.max_pages <= 200: ap.error('--max-pages must be 1..200')
    if args.timeout <= 0 or args.delay < 0: ap.error('timeout must be positive; delay nonnegative')
    try:
        base = origin(args.base_url)
        canonical_origin = origin(args.canonical_origin or args.base_url)
    except ValueError as exc:
        ap.error(str(exc))
    report: dict[str, Any] = {
        'checked_at_utc': datetime.now(timezone.utc).isoformat(),
        'base_url': base, 'canonical_origin': canonical_origin,
        'scope': 'initial HTTP HTML smoke test; no indexing/WAF/robots-policy certification',
        'sitemap_reports': [], 'pages': [], 'issues': []}

    def get(url):
        value = fetch(url, args.timeout, args.user_agent)
        time.sleep(args.delay)
        return value

    robots = get(base + '/robots.txt')
    report['robots'] = {k: v for k, v in robots.items() if k != 'body'}
    report['robots']['body'] = robots.get('body', '')[:30_000]
    if robots.get('status') != 200:
        report['issues'].append('ROBOTS_NOT_VERIFIED_200')
    elif 'text/plain' not in robots.get('headers', {}).get('content-type', ''):
        report['issues'].append('ROBOTS_NOT_PLAIN_TEXT')
    if '<html' in robots.get('body', '').lower(): report['issues'].append('ROBOTS_LOOKS_LIKE_HTML')
    report['robots']['policy_evaluation'] = 'NOT_IMPLEMENTED: review effective per-bot groups separately'

    queue = [base + '/sitemap.xml']
    seen_maps: set[str] = set()
    locations: list[str] = []
    while queue and len(seen_maps) < 10:
        url = queue.pop(0)
        if url in seen_maps: continue
        seen_maps.add(url)
        res = get(url)
        item = {k: v for k, v in res.items() if k not in ('body', 'headers')}
        item['content_type'] = res.get('headers', {}).get('content-type', '')
        item['issues'] = []
        if res.get('status') != 200: item['issues'].append('SITEMAP_NOT_200')
        if 'xml' not in item['content_type']: item['issues'].append('SITEMAP_NOT_XML_CONTENT_TYPE')
        try:
            if res.get('truncated'): raise ValueError('Sitemap exceeds smoke-test byte cap')
            kind, entries = parse_sitemap(res.get('body', ''))
            item.update(kind=kind, entry_count=len(entries))
            for loc in entries:
                try:
                    loc_origin = origin(loc)
                except ValueError:
                    item['issues'].append('INVALID_LOCATION: ' + loc)
                    continue
                if loc_origin not in (canonical_origin, base):
                    item['issues'].append('EXTERNAL_OR_WRONG_HOST: ' + loc)
                    continue
                parts = urlsplit(loc)
                if kind == 'urlset':
                    if parts.fragment or parts.query:
                        item['issues'].append('QUERY_OR_FRAGMENT_REVIEW: ' + loc)
                    locations.append(loc)
                else:
                    # In local preview, fetch production sitemap paths locally.
                    queue.append(base + parts.path + ('?' + parts.query if parts.query else ''))
        except (ValueError, ET.ParseError) as exc:
            item['issues'].append('SITEMAP_PARSE_UNVERIFIED: ' + str(exc))
        report['sitemap_reports'].append(item)
    if queue: report['issues'].append('SITEMAP_INDEX_SCAN_CAPPED')
    if len(set(locations)) != len(locations): report['issues'].append('DUPLICATE_SITEMAP_URLS')
    report['sitemap_url_count'] = len(set(locations))
    canonical_urls = list(dict.fromkeys([canonical_origin + '/'] + locations))
    report['sample_capped'] = len(canonical_urls) > args.max_pages
    for loc in canonical_urls[:args.max_pages]:
        p = urlsplit(loc)
        local_url = base + p.path + ('?' + p.query if p.query else '')
        # A query-containing sitemap loc is deliberately not normalized silently.
        expected = urlunsplit((urlsplit(canonical_origin).scheme,
                               urlsplit(canonical_origin).netloc, p.path, p.query, ''))
        report['pages'].append(page_checks(get(local_url), expected))
    missing = get(base + '/__nero_seo_nonexistent_' + str(int(time.time())) + '__')
    report['nonexistent_path'] = {k: v for k, v in missing.items() if k not in ('body', 'headers')}
    if missing.get('status') != 404:
        report['issues'].append('UNKNOWN_PATH_NOT_VERIFIED_404: production routing may differ')
    report['inspected_count'] = len(report['pages'])
    review_count = (len(report['issues']) + sum(len(x['issues']) for x in report['pages'])
                    + sum(len(x['issues']) for x in report['sitemap_reports']))
    report['review_item_count'] = review_count
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {path}. Pages checked: {report["inspected_count"]}; review items: {review_count}.')
    print('This does not confirm crawling, indexing, ranking, robots policy, or AI recommendation.')
    return 1 if review_count else 0


if __name__ == '__main__':
    sys.exit(main())
