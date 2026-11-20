#!/usr/bin/env python3
"""Fetch staff/YouTuber lists from the API and save them as static JSON for the site.

Run by .github/workflows/sync-api.yml. The key comes from the TEAM_API_KEY environment
variable (a GitHub Actions secret) and is never written to any file.
A failed or unsuccessful response leaves the existing file untouched.
"""
import json, os, sys, urllib.request
from urllib.error import HTTPError

BASE = os.environ.get("API_BASE", "https://ori-api.vipaaxx.xyz")
KEY = os.environ.get("TEAM_API_KEY")
if not KEY:
    sys.exit("TEAM_API_KEY is not set")

OUT = sys.argv[1] if len(sys.argv) > 1 else "data"
DROP = {"id", "username", "avatarUrl"}  # private-ish / unused fields: never published

def clean(o):
    if isinstance(o, dict): return {k: clean(v) for k, v in o.items() if k not in DROP}
    if isinstance(o, list): return [clean(x) for x in o]
    return o

failed = 0
for name in ("team", "youtubers"):
    try:
        req = urllib.request.Request(f"{BASE}/api/{name}", headers={"x-api-key": KEY, "User-Agent": "teamflick-site-sync/1.0", "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as r:
            d = json.load(r)
        if d.get("success") is False:
            raise ValueError(d.get("error", "unsuccessful"))
        d.pop("updatedAt", None)  # keeps the file stable when nothing changed
        with open(f"{OUT}/api-{name}.json", "w") as f:
            json.dump(clean(d), f, indent=2, ensure_ascii=False); f.write("\n")
        print(f"{name}: ok")
    except HTTPError as e:
        failed += 1
        body = e.read().decode("utf-8", errors="replace")
        print(f"{name}: FAILED (HTTP {e.code}: {body}) - keeping previous file")
    except Exception as e:
        failed += 1
        print(f"{name}: FAILED ({type(e).__name__}: {e}) - keeping previous file")
sys.exit(0)  # don't fail the workflow just because one endpoint is down
