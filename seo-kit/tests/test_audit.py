"""Offline unit tests; these do not test the live NERO website."""
import importlib.util
import unittest
from pathlib import Path

script = Path(__file__).resolve().parents[1] / 'scripts' / 'audit_public_site.py'
spec = importlib.util.spec_from_file_location('audit_public_site', script)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class AuditTests(unittest.TestCase):
    def test_namespace_sitemap(self):
        kind, urls = audit.parse_sitemap('''<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.nero.ai.kr/</loc></url></urlset>''')
        self.assertEqual(kind, 'urlset')
        self.assertEqual(urls, ['https://www.nero.ai.kr/'])

    def test_index_sitemap(self):
        kind, urls = audit.parse_sitemap('''<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://www.nero.ai.kr/one.xml</loc></sitemap></sitemapindex>''')
        self.assertEqual(kind, 'sitemapindex')
        self.assertEqual(len(urls), 1)

    def test_html_is_not_sitemap(self):
        with self.assertRaises(ValueError): audit.parse_sitemap('<html><body>SPA</body></html>')

    def test_entity_refused(self):
        with self.assertRaises(ValueError): audit.parse_sitemap('<!DOCTYPE x><x/>')

    def test_valid_initial_html(self):
        url = 'https://www.nero.ai.kr/'
        body = '''<!doctype html><html><head><title>NERO</title>
        <meta name="description" content="검토 설명">
        <link rel="canonical" href="https://www.nero.ai.kr/">
        <script type="application/ld+json">{"@type":"Organization","name":"NERO"}</script>
        </head><body><h1>NERO</h1><p>''' + ('설명 본문 ' * 50) + '''</p><a href="/contact">문의</a></body></html>'''
        result = audit.page_checks({'requested_url':url,'final_url':url,'status':200,
            'headers':{'content-type':'text/html; charset=utf-8'},'body':body},url)
        self.assertEqual(result['issues'], [])
        self.assertEqual(result['jsonld_block_count'], 1)

    def test_fetch_failure_not_status_guess(self):
        result = audit.page_checks({'requested_url':'https://www.nero.ai.kr/','error':'DNS failure'}, 'https://www.nero.ai.kr/')
        self.assertIsNone(result['status'])
        self.assertTrue(result['issues'][0].startswith('FETCH_UNVERIFIED'))

    def test_noindex_and_invalid_ld(self):
        url='https://www.nero.ai.kr/'
        result = audit.page_checks({'requested_url':url,'final_url':url,'status':200,
            'headers':{'content-type':'text/html'},'body':'''<html><head><meta name="robots" content="noindex"><script type="application/ld+json">{invalid}</script></head><body><h1>x</h1></body></html>'''}, url)
        self.assertIn('INDEX_OR_SNIPPET_RESTRICTION_REVIEW', result['issues'])
        self.assertIn('JSONLD_SYNTAX_ERROR',result['issues'])

    def test_origin_blocks_credentials_and_schemes(self):
        for url in ('file:///etc/passwd','https://user:pass@example.com/'):
            with self.assertRaises(ValueError): audit.origin(url)
        self.assertEqual(audit.origin('https://www.nero.ai.kr/a'), 'https://www.nero.ai.kr')

    def test_noscript_and_scripts_not_counted_as_body_copy(self):
        parser = audit.HTMLAudit()
        parser.feed('<html><body>visible<script>hidden</script><noscript>fallback</noscript></body></html>')
        self.assertEqual(parser.body_text, ['visible'])

if __name__ == '__main__': unittest.main()
