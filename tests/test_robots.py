from pathlib import Path
from urllib.robotparser import RobotFileParser
import unittest


class RobotsPolicyTests(unittest.TestCase):
    def test_each_crawler_inherits_public_and_private_rules(self):
        parser = RobotFileParser()
        parser.parse(Path('dist/robots.txt').read_text().splitlines())
        for agent in ['Googlebot', 'Bingbot', 'Yeti', 'OAI-SearchBot', 'PerplexityBot',
                      'Claude-SearchBot', 'Claude-User', 'ChatGPT-User', 'Perplexity-User',
                      'GPTBot', 'ClaudeBot', 'Google-Extended', 'unlisted-bot']:
            with self.subTest(agent=agent):
                for public in ['/', '/landing', '/services', '/about', '/overview', '/announcement',
                               '/robots.txt', '/sitemap.xml', '/?utm_source=chatgpt.com',
                               '/scripts/home.js', '/assets/favicon.ico']:
                    self.assertTrue(parser.can_fetch(agent, public))
                for private in ['/.env', '/.git/config', '/.netlify/functions/contact', '/docs/seo/facts.md',
                                '/seo-kit/README.md', '/admin/users', '/api/contact', '/tests/contact.test.cjs']:
                    self.assertFalse(parser.can_fetch(agent, private))
