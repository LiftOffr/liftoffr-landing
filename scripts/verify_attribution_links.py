"""Offline checks for internal placement links and deployment invariants."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, parse_qs
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
errors = []
placements = 0
class Links(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
    def handle_starttag(self, tag, attrs):
        global placements
        if tag != "a":
            return
        href = dict(attrs).get("href", "")
        u = urlsplit(href)
        internal = (not u.netloc and not u.scheme) or u.hostname in ("liftoffr.com", "www.liftoffr.com")
        q = parse_qs(u.query)
        if internal and any(k.startswith("utm_") for k in q):
            errors.append(f"{self.path}:{self.getpos()[0]} internal anchor has acquisition tags")
        if internal and "from" in q:
            placements += 1
        if u.hostname == "whop.com" and "from" in q:
            errors.append(f"{self.path}:{self.getpos()[0]} external checkout lost placement UTM")

for p in ROOT.rglob("*.html"):
    rel = p.relative_to(ROOT)
    if rel.parts[0] in ("dashboard", "emails"):
        continue
    Links(rel).feed(p.read_text())

config = json.loads((ROOT / "vercel.json").read_text())
redirects = {r["source"]: r for r in config["redirects"]}
for path in ("/checklist", "/buyzone", "/lead-magnet/checklist", "/lead-magnet/checklist.html"):
    q = parse_qs(urlsplit(redirects[path]["destination"]).query)
    if "from" not in q or any(k.startswith("utm_") for k in q):
        errors.append(f"{path}: internal redirect still changes acquisition")
for path in ("/ig", "/tt", "/yt", "/x", "/clip", "/start", "/join"):
    if not parse_qs(urlsplit(redirects[path]["destination"]).query).get("utm_source"):
        errors.append(f"{path}: external acquisition tagging missing")
functions = [p for p in (ROOT/"api").glob("*.js") if not p.name.startswith("_")]
if len(functions) > 12:
    errors.append(f"Vercel function budget exceeded: {len(functions)}")
apple = ROOT/".well-known/apple-developer-merchantid-domain-association"
if len(apple.read_bytes()) != 228 or apple.read_bytes().endswith(b"\n"):
    errors.append("Apple Pay domain association changed")
apple_header = any(
    h["source"] == "/.well-known/apple-developer-merchantid-domain-association"
    and any(v["key"].lower()=="content-type" and v["value"]=="application/octet-stream" for v in h["headers"])
    for h in config.get("headers", [])
)
if not apple_header:
    errors.append("Apple Pay content type missing")
print(json.dumps({"ok":not errors,"internal_placement_anchors":placements,"serverless_functions":len(functions),"errors":errors}, indent=2))
raise SystemExit(bool(errors))
