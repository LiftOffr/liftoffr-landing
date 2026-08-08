#!/usr/bin/env python3
"""Render the Whop Content Rewards campaign thumbnail.

Whop's own guidance says gallery images should be 16:9, so this renders
1920x1080. The thing that actually matters is that it survives being shrunk to
a ~340px card in the campaign browser — that is the size a clipper decides at,
so the rate is the largest element on the image by a wide margin.

Why the rate is the hero: clippers pick campaigns on three numbers — rate,
remaining budget, competition. Everything else on the card is noise to them.

Change the rate or pool and re-run; the layout re-flows.

  python3 scripts/make_campaign_thumb.py --rate 1 --pool 500
  python3 scripts/make_campaign_thumb.py --rate 1.50 --pool 500
"""
from __future__ import annotations
import argparse, base64, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHROME_CANDIDATES = [
    Path.home() / "Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell",
    Path.home() / "Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell",
    Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
]

def chrome() -> Path:
    for p in CHROME_CANDIDATES:
        if p.exists():
            return p
    raise RuntimeError("no Chrome/Chromium found")

def data_uri(p: Path) -> str:
    mime = "image/jpeg" if p.suffix.lower() in (".jpg", ".jpeg") else "image/png"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()

def build(rate: str, pool: str) -> str:
    urus = data_uri(ROOT / "img/torin-urus.jpg")
    logo = data_uri(ROOT / "img/brand/logo-transparent.png")
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;background:#07090d}}
.wrap{{position:relative;width:1920px;height:1080px;display:flex;align-items:center}}
.photo{{position:absolute;right:0;top:0;width:46%;height:100%;background:url('{urus}') center 22%/cover no-repeat}}
.photo:after{{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#07090d 0%,rgba(7,9,13,.85) 22%,rgba(7,9,13,.15) 65%,rgba(7,9,13,.45) 100%)}}
.glow{{position:absolute;left:-8%;top:-25%;width:70%;height:150%;background:radial-gradient(circle at 40% 50%,rgba(230,57,70,.30),transparent 62%)}}
.left{{position:relative;z-index:3;padding:0 0 0 108px;width:60%}}
.logo{{height:74px;margin-bottom:40px;display:block}}
.kicker{{display:inline-block;background:#e63946;color:#fff;font-size:30px;font-weight:900;letter-spacing:3.5px;padding:11px 22px;border-radius:7px;margin-bottom:34px}}
.rate{{font-size:190px;font-weight:900;letter-spacing:-9px;line-height:.84;color:#fff}}
.rate .cur{{color:#26d07c}}
.per{{font-size:52px;font-weight:800;color:#cfd6e2;letter-spacing:-1px;margin-top:14px}}
.sub{{font-size:41px;font-weight:700;color:#8d99ab;margin-top:30px;line-height:1.35}}
.sub b{{color:#fff;font-weight:900}}
.pills{{display:flex;gap:16px;margin-top:44px}}
.pill{{border:2.5px solid rgba(255,255,255,.22);border-radius:100px;padding:15px 30px;font-size:29px;font-weight:800;color:#e9eef7}}
.pill.hot{{border-color:#26d07c;color:#26d07c}}
</style></head><body><div class="wrap">
<div class="photo"></div><div class="glow"></div>
<div class="left">
  <img class="logo" src='{logo}'>
  <div class="kicker">CLIPPING CAMPAIGN</div>
  <div class="rate"><span class="cur">$</span>{rate}<span style="font-size:96px;letter-spacing:-4px"> / 1K</span></div>
  <div class="per">VIEWS &nbsp;·&nbsp; PAID ON APPROVAL</div>
  <div class="sub">Faceless Bitcoin content.<br><b>Footage provided.</b> Just clip and post.</div>
  <div class="pills">
    <div class="pill hot">${pool} POOL</div>
    <div class="pill">TikTok</div><div class="pill">Reels</div>
    <div class="pill">Shorts</div><div class="pill">X</div>
  </div>
</div></div></body></html>"""

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rate", default="1")
    ap.add_argument("--pool", default="500")
    ap.add_argument("--out", default=str(ROOT / "img/campaign/liftoffr-clipping-thumbnail.png"))
    a = ap.parse_args()

    tmp = Path("/tmp/liftoffr_thumb.html")
    tmp.write_text(build(a.rate, a.pool))
    out = Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([str(chrome()), "--headless", "--disable-gpu", "--no-sandbox",
                    "--hide-scrollbars", "--window-size=1920,1080",
                    f"--screenshot={out}", f"file://{tmp}"],
                   capture_output=True, timeout=120)
    if not out.exists() or out.stat().st_size == 0:
        print("render failed", file=sys.stderr); return 1
    print(f"{out}  ({out.stat().st_size:,} bytes)  rate=${a.rate}/1K pool=${a.pool}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
