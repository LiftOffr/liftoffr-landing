#!/usr/bin/env python3
"""Render the Whop product image for The Cycle System (prod_b4DoR00YHuysT).

Two aspects, because Whop uses two slots and they are NOT interchangeable:

  wide (default, 1920x1080)  the product page's "Add a video or photo" media
                             slot — measured off the live storefront, the box
                             is 16:9. This is the one that actually needs
                             filling; it is currently empty and the page falls
                             back to the shared banner.
  tall (2400x3000)           4:5 portrait, matching the format of the $29
                             product's hero asset. For portrait surfaces.

Do NOT put either of these in "Edit banner image" on the Product tab. Whop
warns there that the banner is shared across ALL product pages, so a
Cycle-System-specific image would overwrite the storefront-wide one.

EVERY CLAIM ON THESE IMAGES IS VERIFIABLE. Deliberately absent: a lesson count
(sources disagree — 36 / 48 / 55), any performance or return figure, and any
was-price. The curve is abstract decoration with no axes and no data; it is not
a chart and must not be given tick labels later.

  python3 scripts/make_product_image.py --aspect wide
  python3 scripts/make_product_image.py --aspect tall
"""
from __future__ import annotations
import argparse, base64, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIZES = {"wide": (1920, 1080), "tall": (2400, 3000)}
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


# --- per-aspect layout. Everything above .panel differs; the copy does not. ---

# 4:5. Photo full-bleed, dissolved top-to-bottom into the type panel.
# Do not give .photo a height < 100% — a shorter photo leaves a visible seam
# where its gradient hands off to the body colour.
CSS_TALL = """
.photo{position:absolute;inset:0;
  /* source is 1536x1920 — exactly 4:5, same as the canvas — so `cover` crops
     nothing and background-position does nothing. 116% is what actually trims
     the dead sky and lifts the subject. */
  background:url('%PHOTO%') center 34%/116% no-repeat;
  filter:saturate(.62) contrast(1.1) brightness(.86)}
.photo:after{content:"";position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(7,9,13,.55) 0%,rgba(7,9,13,.10) 20%,
  rgba(7,9,13,.30) 38%,rgba(7,9,13,.86) 52%,rgba(7,9,13,.985) 62%,#07090d 70%)}
/* glow sits low-left, clear of the subject — on the car it just reads as haze */
.glow{position:absolute;left:-30%;top:52%;width:85%;height:44%;
  background:radial-gradient(circle at 50% 50%,rgba(230,57,70,.20),transparent 66%)}
.curve{position:absolute;left:0;bottom:0;width:100%;height:30%;opacity:.28}
.panel{position:absolute;left:0;bottom:0;width:100%;padding:0 150px 132px;z-index:4}
.logo{height:124px;display:block;margin-bottom:84px;opacity:.97}
.rule{width:110px;height:5px;background:#e63946;border-radius:3px;margin-bottom:44px}
.title{font-size:196px;letter-spacing:-8px;margin-bottom:40px}
.title .thin{font-size:92px;letter-spacing:26px;margin-bottom:26px}
.sub{font-size:56px;margin-bottom:70px;max-width:1750px}
.rows{gap:30px;margin-bottom:82px}
.row{gap:30px;font-size:52px}
.dot{width:16px;height:16px}
.foot{gap:34px;border-top-width:3px;padding-top:56px}
.price{font-size:132px;letter-spacing:-5px}
.terms{font-size:46px}
.disc{left:150px;bottom:52px;font-size:30px}
"""

# 16:9. Photo takes the right side and is dissolved left-to-right instead —
# the same split the campaign thumbnail uses, so the two read as one family.
CSS_WIDE = """
/* Full-bleed, not a right-hand panel. A panel's left edge is a hard cut that
   shows as a vertical seam no matter how dark the gradient starts; running the
   photo the whole width and fading it horizontally leaves nothing to cut. */
.photo{position:absolute;inset:0;
  background:url('%PHOTO%') 74% 20%/cover no-repeat;
  filter:saturate(.62) contrast(1.1) brightness(.9)}
.photo:after{content:"";position:absolute;inset:0;background:
  linear-gradient(90deg,#07090d 0%,rgba(7,9,13,.97) 22%,rgba(7,9,13,.78) 38%,
  rgba(7,9,13,.34) 54%,rgba(7,9,13,.12) 72%,rgba(7,9,13,.42) 100%)}
/* z-index 2 puts the glow OVER the photo. Under it, the photo's opaque left
   edge clips the glow and the cut shows as a hard vertical seam. */
.glow{position:absolute;left:-14%;top:-20%;width:72%;height:140%;z-index:2;
  background:radial-gradient(circle at 42% 50%,rgba(230,57,70,.26),transparent 62%)}
.curve{position:absolute;left:0;bottom:0;width:74%;height:46%;opacity:.24;z-index:3}
.panel{position:absolute;left:0;top:0;height:100%;width:62%;z-index:4;
  display:flex;flex-direction:column;justify-content:center;padding:0 0 0 104px}
/* align-self, or the flex column stretches the logo to panel width and skews it */
.logo{height:66px;width:auto;align-self:flex-start;margin-bottom:40px;opacity:.97}
.rule{width:74px;height:4px;background:#e63946;border-radius:3px;margin-bottom:26px}
.title{font-size:118px;letter-spacing:-5px;margin-bottom:26px}
.title .thin{font-size:52px;letter-spacing:15px;margin-bottom:14px}
.sub{font-size:34px;margin-bottom:40px;max-width:1000px}
.rows{gap:18px;margin-bottom:46px}
.row{gap:19px;font-size:31px}
.dot{width:11px;height:11px}
.foot{gap:24px;border-top-width:2px;padding-top:32px;max-width:1000px}
.price{font-size:82px;letter-spacing:-3px}
.terms{font-size:28px}
.disc{left:104px;bottom:38px;font-size:19px}
"""


def build(price: str, aspect: str) -> str:
    w, h = SIZES[aspect]
    photo = data_uri(ROOT / "img/torin-hero-bg.jpg")
    logo = data_uri(ROOT / "img/brand/logo-transparent.png")
    layout = (CSS_TALL if aspect == "tall" else CSS_WIDE).replace("%PHOTO%", photo)
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:{w}px;height:{h}px;overflow:hidden;background:#07090d;
  font-family:-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased}}
.wrap{{position:relative;width:{w}px;height:{h}px;overflow:hidden}}

/* shared type treatment; sizes come from the per-aspect block below */
.title{{font-weight:900;line-height:.9;color:#fff}}
.title .thin{{display:block;font-weight:300;color:#8d99ab}}
.sub{{font-weight:600;color:#b8c2d1;line-height:1.4}}
.rows{{display:flex;flex-direction:column}}
.row{{display:flex;align-items:center;font-weight:800;color:#e9eef7;letter-spacing:.5px}}
.dot{{border-radius:50%;background:#26d07c;flex:none}}
.foot{{display:flex;align-items:baseline;border-top:solid rgba(255,255,255,.14)}}
.price{{font-weight:900;color:#fff;line-height:1}}
.price .cur{{color:#26d07c}}
.terms{{font-weight:800;color:#8d99ab;letter-spacing:1.5px}}
.disc{{position:absolute;font-weight:600;color:#5c6675;letter-spacing:2px;z-index:5}}

/* --- abstract cycle curve: decoration, no axes, no data --- */
{layout}
</style></head><body><div class="wrap">
  <div class="photo"></div>
  <div class="glow"></div>

  <svg class="curve" viewBox="0 0 1200 560" preserveAspectRatio="none">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="#26d07c" stop-opacity="0"/>
        <stop offset="26%"  stop-color="#26d07c" stop-opacity=".55"/>
        <stop offset="62%"  stop-color="#e63946" stop-opacity=".75"/>
        <stop offset="100%" stop-color="#e63946" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M-40 500 C 200 490, 330 440, 470 250 S 660 20, 790 190
             S 980 490, 1240 505" fill="none" stroke="url(#g)"
          stroke-width="5" stroke-linecap="round"/>
  </svg>

  <div class="panel">
    <img class="logo" src='{logo}'>
    <div class="rule"></div>
    <div class="title"><span class="thin">THE</span>CYCLE SYSTEM</div>
    <div class="sub">The complete Bitcoin market-cycle framework&nbsp;&mdash;<br>
      how the top is read, and how the exit is planned.</div>
    <div class="rows">
      <div class="row"><span class="dot"></span>All eight cycle indicators, explained</div>
      <div class="row"><span class="dot"></span>The exit ladder, tier by tier</div>
      <div class="row"><span class="dot"></span>Full course + #signals access in Discord</div>
    </div>
    <div class="foot">
      <div class="price"><span class="cur">$</span>{price}</div>
      <div class="terms">ONE PAYMENT&nbsp; &middot; &nbsp;NO SUBSCRIPTION</div>
    </div>
  </div>
  <div class="disc">EDUCATION ONLY &middot; NOT FINANCIAL ADVICE</div>
</div></body></html>"""


def render(price: str, aspect: str, out: Path) -> bool:
    w, h = SIZES[aspect]
    tmp = Path(f"/tmp/liftoffr_product_{aspect}.html")
    tmp.write_text(build(price, aspect))
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([str(chrome()), "--headless", "--disable-gpu", "--no-sandbox",
                    "--hide-scrollbars", f"--window-size={w},{h}",
                    f"--screenshot={out}", f"file://{tmp}"],
                   capture_output=True, timeout=180)
    if not out.exists() or out.stat().st_size == 0:
        return False
    print(f"{out}  ({out.stat().st_size:,} bytes)  {w}x{h}  price=${price}")
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--price", default="197")
    ap.add_argument("--aspect", choices=["wide", "tall", "both"], default="both")
    ap.add_argument("--outdir", default=str(ROOT / "img/product"))
    a = ap.parse_args()

    wanted = ["wide", "tall"] if a.aspect == "both" else [a.aspect]
    ok = True
    for asp in wanted:
        out = Path(a.outdir) / f"cycle-system-whop-{asp}.png"
        ok = render(a.price, asp, out) and ok
    if not ok:
        print("render failed", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
