#!/usr/bin/env python3
"""Render the Whop product cards for the LiftOffr ladder.

Products (Whop listing names, verified in the dashboard product list):

  system   "The Cycle System"  $197  prod_b4DoR00YHuysT
  plan     "LiftOffr"          $29   the bear-market buy plan

Two aspects, because Whop uses two slots and they are NOT interchangeable:

  wide (default, 1920x1080)  the product page's "Add a video or photo" media
                             slot — measured off the live storefront, the box
                             is 16:9. This is the one that needs filling; it is
                             empty on both products, so each page falls back to
                             the shared banner.
  tall (2400x3000)           4:5 portrait, for portrait surfaces.

Do NOT put these in "Edit banner image" on the Product tab. Whop warns there
that the banner is shared across ALL product pages, so a per-product image
would overwrite the storefront-wide one. Product settings (Theme / Growth
tools / Reviews) has no image slot at all — the Page media slot is the only
per-product image.

The two cards mirror each other (system: photo right, plan: photo left) so
they read as siblings in a store listing rather than as one template used
twice.

EVERY CLAIM IS VERIFIED, and the numbers are counted, not typed:
  - "36 lessons" = channels matching lesson-N-* inside the six Module
    categories, counted via the Discord API on 2026-08-11. The same count
    appears in the course outline in #how-to-use-this-course. (48 is the count
    of ALL course channels: 36 lessons + 6 overviews + 6 assessments. 55 has
    no basis and was corrected in the #the-cycle-system sales embed.)
  - Bullet copy is lifted from the canonical price map in
    #whats-locked-and-why and the product embeds.
No performance figure, no was-price, no invented word count. The curve is
abstract decoration with no axes and no data; it is not a chart and must not
be given tick labels later.

  python3 scripts/make_product_image.py                    # both products, both aspects
  python3 scripts/make_product_image.py --product system --aspect wide
"""
from __future__ import annotations
import argparse, base64, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIZES = {"wide": (1920, 1080), "tall": (2400, 3000)}

PRODUCTS = {
    "system": {
        "photo": "img/torin-hero-bg.jpg",
        "grade": "saturate(.62) contrast(1.1) brightness(.9)",
        "focus_wide": "74% 20%",
        "focus_tall": "center 34%",
        "zoom_tall": "116%",
        "flip": False,
        "kicker": "THE",
        "title": "CYCLE SYSTEM",
        "sub": "The complete Bitcoin market-cycle framework&nbsp;&mdash;<br>"
               "how the top is read, and how the exit is planned.",
        "rows": [
            "All eight cycle indicators, explained",
            "The exit ladder, tier by tier",
            "36-lesson course + #signals access",
        ],
        "price": "197",
    },
    "plan": {
        "photo": "img/torin-corvette.jpg",
        # shot in bright daylight and portrait (620x1100), so it needs a much
        # heavier grade than the Urus frame or it washes out pale blue and
        # stops matching the family
        "grade": "saturate(.42) contrast(1.12) brightness(.62)",
        "focus_wide": "20% 52%",
        "focus_tall": "center 30%",
        "zoom_tall": "128%",
        "flip": True,
        "kicker": "LIFTOFFR",
        "title": "THE BUY PLAN",
        "sub": "My actual bear-market buy ladder&nbsp;&mdash;<br>"
               "real trigger prices, kept live.",
        "rows": [
            "The tiers that fired, and the tiers still armed",
            "Build-your-own-ladder worksheet",
            "#plan-updates — every tier fire, live",
        ],
        "price": "29",
    },
}


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


def css_tall(p: dict) -> str:
    """4:5. Photo full-bleed, dissolved top-to-bottom into the type panel.

    Do not give .photo a height < 100% — a shorter photo leaves a visible seam
    where its gradient hands off to the body colour.
    """
    return f"""
.photo{{position:absolute;inset:0;
  background:url('%PHOTO%') {p['focus_tall']}/{p['zoom_tall']} no-repeat;
  filter:{p['grade']}}}
.photo:after{{content:"";position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(7,9,13,.55) 0%,rgba(7,9,13,.10) 20%,
  rgba(7,9,13,.30) 38%,rgba(7,9,13,.86) 52%,rgba(7,9,13,.985) 62%,#07090d 70%)}}
.glow{{position:absolute;left:-30%;top:52%;width:85%;height:44%;z-index:2;
  background:radial-gradient(circle at 50% 50%,rgba(230,57,70,.20),transparent 66%)}}
.curve{{position:absolute;left:0;bottom:0;width:100%;height:30%;opacity:.28;z-index:3}}
.panel{{position:absolute;left:0;bottom:0;width:100%;padding:0 150px 132px;z-index:4}}
.logo{{height:124px;width:auto;display:block;margin-bottom:84px;opacity:.97}}
.rule{{width:110px;height:5px;background:#e63946;border-radius:3px;margin-bottom:44px}}
.title{{font-size:196px;letter-spacing:-8px;margin-bottom:40px}}
.title .thin{{font-size:92px;letter-spacing:26px;margin-bottom:26px}}
.sub{{font-size:56px;margin-bottom:70px;max-width:1750px}}
.rows{{gap:30px;margin-bottom:82px}}
.row{{gap:30px;font-size:52px}}
.dot{{width:16px;height:16px}}
.foot{{gap:34px;border-top-width:3px;padding-top:56px}}
.price{{font-size:132px;letter-spacing:-5px}}
.terms{{font-size:46px}}
.disc{{left:150px;bottom:52px;font-size:30px}}
"""


def css_wide(p: dict) -> str:
    """16:9. Photo full-bleed with a horizontal fade, type in a half-width panel.

    Full-bleed, not a side panel: a panel's inner edge is a hard cut that shows
    as a vertical seam no matter how dark the gradient starts. Running the
    photo the whole width leaves nothing to cut. .glow sits at z-index 2 (over
    the photo) for the same reason.

    flip mirrors the whole composition for photos whose subject sits left.
    """
    if p["flip"]:
        fade, panel_side, glow_side = "90deg", "right:0", "right:-14%"
        stops = ("rgba(7,9,13,.72) 0%,rgba(7,9,13,.46) 24%,rgba(7,9,13,.56) 44%,"
                 "rgba(7,9,13,.86) 60%,rgba(7,9,13,.98) 76%,#07090d 100%")
        pad, disc_side, curve_side = "0 104px 0 0", "right:104px", "right:0"
    else:
        fade, panel_side, glow_side = "90deg", "left:0", "left:-14%"
        stops = ("#07090d 0%,rgba(7,9,13,.97) 22%,rgba(7,9,13,.78) 38%,"
                 "rgba(7,9,13,.34) 54%,rgba(7,9,13,.12) 72%,rgba(7,9,13,.42) 100%")
        pad, disc_side, curve_side = "0 0 0 104px", "left:104px", "left:0"
    return f"""
.photo{{position:absolute;inset:0;
  background:url('%PHOTO%') {p['focus_wide']}/cover no-repeat;
  filter:{p['grade']}}}
.photo:after{{content:"";position:absolute;inset:0;
  background:linear-gradient({fade},{stops})}}
.glow{{position:absolute;{glow_side};top:-20%;width:72%;height:140%;z-index:2;
  background:radial-gradient(circle at 50% 50%,rgba(230,57,70,.26),transparent 62%)}}
.curve{{position:absolute;{curve_side};bottom:0;width:74%;height:46%;opacity:.24;z-index:3}}
.panel{{position:absolute;{panel_side};top:0;height:100%;width:62%;z-index:4;
  display:flex;flex-direction:column;justify-content:center;padding:{pad}}}
/* align-self, or the flex column stretches the logo to panel width and skews it */
.logo{{height:66px;width:auto;align-self:flex-start;margin-bottom:40px;opacity:.97}}
.rule{{width:74px;height:4px;background:#e63946;border-radius:3px;margin-bottom:26px}}
.title{{font-size:118px;letter-spacing:-5px;margin-bottom:26px}}
.title .thin{{font-size:52px;letter-spacing:15px;margin-bottom:14px}}
.sub{{font-size:34px;margin-bottom:40px;max-width:1000px}}
.rows{{gap:18px;margin-bottom:46px}}
.row{{gap:19px;font-size:31px}}
.dot{{width:11px;height:11px}}
.foot{{gap:24px;border-top-width:2px;padding-top:32px;max-width:1000px}}
.price{{font-size:82px;letter-spacing:-3px}}
.terms{{font-size:28px}}
.disc{{{disc_side};bottom:38px;font-size:19px}}
"""


def build(product: str, aspect: str) -> str:
    p = PRODUCTS[product]
    w, h = SIZES[aspect]
    photo = data_uri(ROOT / p["photo"])
    logo = data_uri(ROOT / "img/brand/logo-transparent.png")
    layout = (css_tall(p) if aspect == "tall" else css_wide(p)).replace("%PHOTO%", photo)
    rows = "\n".join(
        f'      <div class="row"><span class="dot"></span>{r}</div>' for r in p["rows"]
    )
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
    <div class="title"><span class="thin">{p['kicker']}</span>{p['title']}</div>
    <div class="sub">{p['sub']}</div>
    <div class="rows">
{rows}
    </div>
    <div class="foot">
      <div class="price"><span class="cur">$</span>{p['price']}</div>
      <div class="terms">ONE PAYMENT&nbsp; &middot; &nbsp;NO SUBSCRIPTION</div>
    </div>
  </div>
  <div class="disc">EDUCATION ONLY &middot; NOT FINANCIAL ADVICE</div>
</div></body></html>"""


def render(product: str, aspect: str, out: Path) -> bool:
    w, h = SIZES[aspect]
    tmp = Path(f"/tmp/liftoffr_{product}_{aspect}.html")
    tmp.write_text(build(product, aspect))
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([str(chrome()), "--headless", "--disable-gpu", "--no-sandbox",
                    "--hide-scrollbars", f"--window-size={w},{h}",
                    f"--screenshot={out}", f"file://{tmp}"],
                   capture_output=True, timeout=180)
    if not out.exists() or out.stat().st_size == 0:
        return False
    print(f"{out}  ({out.stat().st_size:,} bytes)  {w}x{h}")
    return True


NAMES = {"system": "cycle-system", "plan": "liftoffr-buy-plan"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--product", choices=["system", "plan", "both"], default="both")
    ap.add_argument("--aspect", choices=["wide", "tall", "both"], default="both")
    ap.add_argument("--outdir", default=str(ROOT / "img/product"))
    a = ap.parse_args()

    prods = ["system", "plan"] if a.product == "both" else [a.product]
    aspects = ["wide", "tall"] if a.aspect == "both" else [a.aspect]
    ok = True
    for pr in prods:
        for asp in aspects:
            out = Path(a.outdir) / f"{NAMES[pr]}-whop-{asp}.png"
            ok = render(pr, asp, out) and ok
    if not ok:
        print("render failed", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
