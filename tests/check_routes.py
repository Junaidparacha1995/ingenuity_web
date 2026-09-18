"""Read-only HTTP/asset/caching checks against a locally running server."""
import ast
import gzip
import importlib.util
import re
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5000").rstrip("/")
RELEASE = "20260918-zoom17"


class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        key = "data" if tag == "object" else "href" if tag == "link" else "src"
        if tag in {"img", "script", "object", "iframe", "source"} or (
            tag == "link" and attrs.get("rel") in {"stylesheet", "icon"}
        ):
            if attrs.get(key):
                self.urls.add(attrs[key])


def get(url, compressed=False):
    request = Request(url, headers={"Accept-Encoding": "gzip"} if compressed else {})
    with urlopen(request, timeout=10) as response:
        data = response.read()
        if response.headers.get("Content-Encoding") == "gzip":
            data = gzip.decompress(data)
        return response.status, response.headers, data, response.geturl()


def main():
    tree = ast.parse((ROOT / "server.py").read_text())
    routes = next(ast.literal_eval(node.value) for node in tree.body
                  if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "CLEAN_ROUTES" for t in node.targets))
    assert len(routes) == 22, len(routes)
    resources = set()
    for route in routes:
        status, headers, html, final_url = get(BASE + route, compressed=True)
        assert status == 200, route
        assert "no-cache" in headers.get("Cache-Control", ""), route
        parsed = Resources()
        parsed.feed(html.decode())
        for value in parsed.urls:
            url = urljoin(final_url, value)
            if urlsplit(url).netloc == urlsplit(BASE).netloc:
                resources.add(url)
        for asset in ["script.js", "styles.css", "responsive-v19.css"]:
            assert f"{asset}?v={RELEASE}" in html.decode(), (route, asset)
    css_resources = set()
    for url in sorted(resources):
        if urlsplit(url).path.endswith(".css"):
            _, _, data, _ = get(url)
            for value in re.findall(r"url\(['\"]?([^)'\"]+)", data.decode()):
                target = urljoin(url, value)
                if urlsplit(target).netloc == urlsplit(BASE).netloc:
                    css_resources.add(target)
    resources |= css_resources
    with ThreadPoolExecutor(max_workers=6) as pool:
        for url, result in zip(sorted(resources), pool.map(get, sorted(resources))):
            assert result[0] == 200, url
    for route in ["/projects/", "/case-studies/"]:
        assert "no-cache" in get(BASE + route)[1].get("Cache-Control", ""), route
    for file in ["script.js", "styles.css", "responsive-v19.css", "orange-ambient.js"]:
        assert "immutable" in get(f"{BASE}/{file}?v={RELEASE}")[1]["Cache-Control"]
        assert "no-cache" in get(f"{BASE}/{file}")[1]["Cache-Control"]
    print(f"PASS: {len(routes)} routes, {len(resources)} local resource URLs, gzip responses and cache policy.")
    print("No contact forms, provider APIs, Calendly bookings or outgoing webhooks were submitted.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main()
    else:
        # Start the actual app in this process, so the same check works in a
        # sandbox and in Replit without relying on an existing development tab.
        spec = importlib.util.spec_from_file_location("ingenuity_server", ROOT / "server.py")
        app = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(app)

        class QuietHandler(app.RouterHandler):
            def log_message(self, *args):
                pass

        httpd = app.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        BASE = f"http://127.0.0.1:{httpd.server_port}"
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            main()
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join(timeout=2)
