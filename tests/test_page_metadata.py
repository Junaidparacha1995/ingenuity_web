"""Verify crawler-visible search and sharing metadata over the public HTTP routes."""
import http.client
import struct
import sys
import threading
import unittest
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class PageMetadata(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.in_head = False
        self.capture = None
        self.meta = defaultdict(list)
        self.canonicals = []
        self.titles = []
        self.headings = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "head":
            self.in_head = True
        if self.in_head and tag == "meta":
            key = attrs.get("property") or attrs.get("name")
            if key:
                self.meta[key].append(attrs.get("content", ""))
        if self.in_head and tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs.get("href"))
        if tag == "h1" or (self.in_head and tag == "title"):
            self.capture = tag
            (self.headings if tag == "h1" else self.titles).append("")

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False
        if tag == self.capture:
            self.capture = None

    def handle_data(self, data):
        if self.capture:
            values = self.headings if self.capture == "h1" else self.titles
            values[-1] += data


class PageMetadataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class QuietHandler(server.RouterHandler):
            def log_message(self, *args):
                pass

        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join()

    def request(self, path, method="GET"):
        conn = http.client.HTTPConnection("127.0.0.1", self.httpd.server_port)
        conn.request(method, path)
        response = conn.getresponse()
        result = response.status, {key.lower(): value for key, value in response.getheaders()}, response.read()
        conn.close()
        return result

    def page(self, route):
        status, headers, body = self.request(route)
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["content-type"])
        return PageMetadata(body.decode())

    def test_all_public_pages_have_matching_unique_metadata(self):
        titles, descriptions = [], []
        self.assertEqual(len(server.PUBLIC_ROUTES), 26)
        for route in server.PUBLIC_ROUTES:
            with self.subTest(route=route):
                page = self.page(route)
                self.assertEqual(len(page.titles), 1)
                title = page.titles[0]
                self.assertTrue(title.strip())
                self.assertEqual(len(page.meta["description"]), 1)
                description = page.meta["description"][0]
                self.assertTrue(description.strip())
                self.assertEqual(page.canonicals, [server.SITE_ORIGIN + route])
                expected = {
                    "og:title": title,
                    "og:description": description,
                    "og:url": server.SITE_ORIGIN + route,
                    "og:type": "website",
                    "og:site_name": "Ingenuity Systems",
                    "og:image": server.SITE_ORIGIN + "/assets/social-preview.png",
                    "twitter:card": "summary_large_image",
                    "twitter:title": title,
                    "twitter:description": description,
                    "twitter:image": server.SITE_ORIGIN + "/assets/social-preview.png",
                }
                for key, value in expected.items():
                    self.assertEqual(page.meta[key], [value], key)
                titles.append(title)
                descriptions.append(description)
        self.assertEqual(len(set(titles)), len(titles))
        self.assertEqual(len(set(descriptions)), len(descriptions))

    def test_shared_brand_image_is_public_png_with_large_card_dimensions(self):
        image_url = self.page("/").meta["og:image"][0]
        self.assertEqual(urlsplit(image_url).netloc, urlsplit(server.SITE_ORIGIN).netloc)
        path = urlsplit(image_url).path
        status, headers, body = self.request(path)
        self.assertEqual(status, 200)
        self.assertEqual(headers["content-type"], "image/png")
        self.assertEqual(body[:8], b"\x89PNG\r\n\x1a\n")
        self.assertEqual(struct.unpack(">II", body[16:24]), (1200, 630))
        self.assertLess(len(body), 1_000_000)
        status, head_headers, body = self.request(path, "HEAD")
        self.assertEqual(status, 200)
        self.assertEqual(body, b"")
        self.assertEqual(head_headers["content-length"], headers["content-length"])

    def test_core_services_name_the_offering_in_title_and_primary_heading(self):
        services = {
            "/services-ai": "AI & Intelligent Systems",
            "/services-automation": "Business Process Automation",
            "/services-software": "Software & Digital Engineering",
            "/services-integration": "Systems Integration & Data",
        }
        for route, offering in services.items():
            with self.subTest(route=route):
                page = self.page(route)
                self.assertEqual(page.titles, [offering + " | Ingenuity Systems"])
                self.assertEqual(page.headings, [offering])

    def test_collection_descriptions_reflect_different_contents(self):
        work = self.page("/work").meta["description"][0]
        cases = self.page("/case-studies").meta["description"][0]
        self.assertNotEqual(work, cases)
        self.assertIn("public repositories", work)
        self.assertIn("case studies", cases)
        self.assertIn("smart-contract agents", cases)


if __name__ == "__main__":
    unittest.main()
