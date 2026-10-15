"""Public SEO routing checks against the actual HTTP handler; no external APIs."""
import http.client
import sys
import threading
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from xml.etree import ElementTree

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class Links(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.anchors = []
        self.canonicals = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and "href" in attrs:
            self.anchors.append(attrs["href"])
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs["href"])


class CrawlabilityTests(unittest.TestCase):
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
        result = response.status, dict(response.getheaders()), response.read()
        conn.close()
        return result

    def test_permanent_redirects_preserve_queries(self):
        for old, final in server.CLEAN_REDIRECTS.items():
            for method in ("GET", "HEAD"):
                with self.subTest(old=old, method=method):
                    status, headers, body = self.request(old + "?campaign=a%20b&x=1", method)
                    self.assertEqual(status, 308)
                    self.assertEqual(headers["Location"], final + "?campaign=a%20b&x=1")
                    self.assertEqual(body, b"")
                    self.assertEqual(self.request(final)[0], 200)

    def test_xml_inventory_and_discovery(self):
        status, headers, body = self.request("/sitemap.xml")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Content-Type"], "application/xml; charset=utf-8")
        root = ElementTree.fromstring(body)
        locations = [node.text for node in root.findall("{*}url/{*}loc")]
        self.assertEqual(locations, [server.SITE_ORIGIN + route for route in server.PUBLIC_ROUTES])
        self.assertEqual(len(locations), 26)
        self.assertEqual(len(set(locations)), len(locations))
        for location in locations:
            self.assertEqual(self.request(urlsplit(location).path)[0], 200)
        status, headers, body = self.request("/robots.txt")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Content-Type"], "text/plain; charset=utf-8")
        self.assertIn(f"Sitemap: {server.SITE_ORIGIN}/sitemap.xml", body.decode())
        self.assertIn("User-agent: *\nAllow: /", body.decode())
        self.assertEqual([line for line in body.decode().splitlines() if line.startswith("Disallow:")],
                         ["Disallow: /api/"])
        for route in ("/sitemap.xml", "/robots.txt"):
            status, headers, body = self.request(route, "HEAD")
            self.assertEqual(status, 200)
            self.assertEqual(body, b"")
            self.assertGreater(int(headers["Content-Length"]), 0)

    def test_canonical_pages_and_navigation(self):
        for route in ("/projects", "/case-studies"):
            links = Links(self.request(route)[2].decode())
            self.assertEqual(links.canonicals, [server.SITE_ORIGIN + route])
        for source, target in (("/ai-maturity", "/build-your-system"), ("/case-studies", "/case-studies"),
                               ("/work", "/projects"), ("/work", "/case-studies")):
            links = Links(self.request(source)[2].decode())
            self.assertIn(target, links.anchors)
            resolved = urlsplit(urljoin(server.SITE_ORIGIN + source, target)).path
            self.assertEqual(self.request(resolved)[0], 200)
        links = Links(self.request("/sitemap")[2].decode())
        for route in server.PUBLIC_ROUTES:
            self.assertIn(route, links.anchors)


if __name__ == "__main__":
    unittest.main()
