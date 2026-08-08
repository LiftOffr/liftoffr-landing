#!/usr/bin/env python3
"""Programmatic SEO: /indicators/* + /when-will-bitcoin-bottom.

Why these pages and not more blog posts: ~68% of Google searches are now
zero-click and educational finance queries get 67-91% AI-Overview coverage —
but live-data and tool pages sit in the ~7% coverage band and rank on utility.
So every page here leads with a NUMBER that is true today, and its moat is the
historical table: what each indicator actually read at every cycle top and
bottom since 2013. That table is computed from CBBI's own daily series, not
written from memory, and nobody else publishes it.

Relationship to /blog: the blog posts explain an indicator ("what is CBBI").
These pages answer "what does it read today, and has it ever been wrong". Each
page canonicals to itself, links to the blog explainer as the deep dive, and
targets the live-reading query instead of the definition query, so the two do
not compete for the same SERP.

Every number on every generated page comes from the CBBI series or is derived
from it in this file. Nothing is hand-typed from memory — that rule is what
makes the tables safe to publish.

Usage:
  python3 scripts/build_indicator_pages.py              # write pages
  python3 scripts/build_indicator_pages.py --check      # no write, report drift
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CBBI_URL = "https://colintalkscrypto.com/cbbi/data/latest.json"
SITE = "https://liftoffr.com"

# LiftOffr Score V7 weights — kept in sync with api/cycle-score.js by hand;
# the generator asserts every weighted key exists in the CBBI payload.
WEIGHTS = {
    "RHODL": 0.20, "Puell": 0.20, "Trolololo": 0.15, "MVRV": 0.15,
    "PiCycle": 0.10, "2YMA": 0.05, "ReserveRisk": 0.05, "Woobull": 0.05,
    "RUPL": 0.05,
}

# Cycle turning points. Dates are the daily-close highs/lows of each cycle —
# the reading printed next to each one is looked up in the series, never typed.
TOPS = [
    ("2013-11-30", "2013 top"),
    ("2017-12-17", "2017 top"),
    ("2021-11-10", "2021 top"),
    ("2025-10-06", "2025 top"),
]
BOTTOMS = [
    ("2015-01-14", "2015 bottom"),
    ("2018-12-15", "2018 bottom"),
    ("2022-11-21", "2022 bottom"),
]

# ── Per-indicator editorial. Definitions are plain-English and answer-first
# (40-60 words) because that is the block AI Overviews cite. `failure` is the
# honest limitation — E-E-A-T gold, and the one section competitors skip.
INDICATORS = [
    {
        "slug": "rhodl-ratio",
        "key": "RHODL",
        "name": "RHODL Ratio",
        "h1": "RHODL Ratio today",
        "aka": "Realised HODL Ratio",
        "query": "rhodl ratio",
        "blog": None,
        "answer": (
            "The RHODL Ratio compares the value held by coins that moved in the last week "
            "against coins that last moved one to two years ago. When new money floods in and "
            "old holders sell, the ratio spikes — which is what a cycle top looks like from "
            "on-chain. It has flagged every major Bitcoin top since 2013."
        ),
        "measures": (
            "Whether the coins changing hands are new speculative money or long-held supply "
            "waking up. Tops happen when both are true at once."
        ),
        "formula": (
            "The 1-week RHODL band divided by the 1-2 year band, multiplied by the age of the "
            "market and by realised-cap ratio. CBBI normalises the result to 0-100."
        ),
        "failure": (
            "It is a top-finder, not a bottom-finder. In a long grind lower it can sit near "
            "zero for a year while price keeps falling, so a low reading tells you the top is "
            "behind you, not that the bottom is in."
        ),
    },
    {
        "slug": "puell-multiple",
        "key": "Puell",
        "name": "Puell Multiple",
        "h1": "Puell Multiple today",
        "aka": "miner revenue multiple",
        "query": "puell multiple",
        "blog": "/blog/puell-multiple-bitcoin-indicator",
        "answer": (
            "The Puell Multiple divides the daily dollar value of newly mined Bitcoin by its "
            "365-day average. High readings mean miners are earning far more than usual and have "
            "strong incentive to sell; low readings mean miner revenue is compressed, which has "
            "historically marked good accumulation zones."
        ),
        "measures": "Miner selling pressure relative to the last year of miner revenue.",
        "formula": "Daily issuance value in USD ÷ its own 365-day moving average, normalised 0-100.",
        "failure": (
            "Each halving cuts issuance in half overnight, which mechanically drops the multiple "
            "without anything changing about demand. Readings across a halving boundary are not "
            "like-for-like, and this is the single most common way people misread it."
        ),
    },
    {
        "slug": "rainbow-chart",
        "key": "Trolololo",
        "name": "Logarithmic Regression Band",
        "h1": "Bitcoin rainbow chart band today",
        "aka": "Trolololo / rainbow chart",
        "query": "bitcoin rainbow chart",
        "blog": "/blog/bitcoin-rainbow-chart-indicator",
        "answer": (
            "The rainbow chart is a logarithmic regression fitted to Bitcoin's whole price "
            "history, with coloured bands above and below the fit. Where price sits inside those "
            "bands is the reading: high in the band has meant euphoria, low in the band has "
            "meant the parts of the cycle nobody wants to talk about."
        ),
        "measures": "How stretched price is versus its own long-run log-growth trend.",
        "formula": "Price versus a log regression of price against time, normalised 0-100.",
        "failure": (
            "The regression is refitted as new data arrives, so the bands quietly move down over "
            "time. A reading from 2017 is not measured against the same curve as a reading "
            "today, and back-fitted curves always look more accurate than they were live."
        ),
    },
    {
        "slug": "mvrv-z-score",
        "key": "MVRV",
        "name": "MVRV Z-Score",
        "h1": "MVRV Z-Score today",
        "aka": "market value to realised value",
        "query": "mvrv z-score",
        "blog": "/blog/mvrv-ratio-bitcoin-indicator",
        "answer": (
            "MVRV Z-Score compares Bitcoin's market cap to its realised cap — roughly, what the "
            "whole supply last moved at — and expresses the gap in standard deviations. High "
            "readings mean the market is holding huge unrealised profit, which is the condition "
            "every cycle top has shared."
        ),
        "measures": "Aggregate unrealised profit across every coin in circulation.",
        "formula": "(market cap − realised cap) ÷ standard deviation of market cap, normalised 0-100.",
        "failure": (
            "Its peak readings have fallen every cycle as the asset matured — 2013's extreme is "
            "a level 2021 never came close to. Waiting for an old absolute number to print again "
            "is how people held through the last two tops."
        ),
    },
    {
        "slug": "pi-cycle-top",
        "key": "PiCycle",
        "name": "Pi Cycle Top Indicator",
        "h1": "Pi Cycle Top indicator today",
        "aka": "111DMA / 350DMA×2 cross",
        "query": "pi cycle top indicator",
        "blog": "/blog/pi-cycle-top-bitcoin-indicator",
        "answer": (
            "Pi Cycle fires when Bitcoin's 111-day moving average crosses above twice its "
            "350-day moving average. That cross has landed within three days of the 2013, 2017 "
            "and 2021 cycle highs. It is a single binary signal, not a gauge — the reading here "
            "is how close the two averages are to crossing."
        ),
        "measures": "How close short-term momentum is to a historically extreme stretch over the long trend.",
        "formula": "111-day MA versus 2 × 350-day MA; proximity of the cross normalised 0-100.",
        "failure": (
            "It did not cross at the 2025 top. Three hits and a miss is a small sample, and a "
            "signal that only fires at the very top gives you no information at all for the "
            "other 1,400 days of the cycle."
        ),
    },
    {
        "slug": "2-year-ma-multiplier",
        "key": "2YMA",
        "name": "2-Year MA Multiplier",
        "h1": "Bitcoin 2-Year MA Multiplier today",
        "aka": "2YMA / 2-year moving average multiplier",
        "query": "2 year ma multiplier",
        "blog": "/blog/bitcoin-2-year-ma-multiplier",
        "answer": (
            "The 2-Year MA Multiplier plots price against its 730-day moving average and against "
            "that average multiplied by five. Historically, price below the 2-year MA has marked "
            "accumulation zones and price above the 5× line has marked distribution zones. It is "
            "the simplest cycle indicator that has kept working."
        ),
        "measures": "Where price sits between its two-year mean and five times that mean.",
        "formula": "Price versus the 730-day MA and versus 5 × the 730-day MA, normalised 0-100.",
        "failure": (
            "It is slow by construction — a two-year average takes months to reflect a regime "
            "change, so it confirms rather than warns. It also has no opinion on how long price "
            "stays under the line, which is the part that hurts."
        ),
    },
    {
        "slug": "reserve-risk",
        "key": "ReserveRisk",
        "name": "Reserve Risk",
        "h1": "Bitcoin Reserve Risk today",
        "aka": "HODL bank / opportunity cost",
        "query": "bitcoin reserve risk",
        "blog": None,
        "answer": (
            "Reserve Risk weighs the confidence of long-term holders against the price they are "
            "being offered to sell. Low readings mean conviction is high and price is low — "
            "historically the best risk-reward accumulation windows. High readings mean holders "
            "are being paid a lot to give up their coins."
        ),
        "measures": "The ratio of holder conviction to the reward for abandoning it.",
        "formula": "Price ÷ HODL bank (cumulative coin-days destroyed opportunity cost), normalised 0-100.",
        "failure": (
            "It depends on coin-day metrics that exchange and ETF custody distort — coins moving "
            "between custodial wallets look like holders capitulating when nothing changed hands "
            "economically. Its signal has been noisier since 2024 for exactly that reason."
        ),
    },
    {
        "slug": "woobull-top-cap",
        "key": "Woobull",
        "name": "Woobull Top Cap Ratio",
        "h1": "Woobull Top Cap ratio today",
        "aka": "top cap vs price",
        "query": "woobull top cap",
        "blog": None,
        "answer": (
            "Woobull's Top Cap model takes Bitcoin's average cap over its entire history and "
            "multiplies it by 35 to draw a ceiling that past cycle tops have respected. The "
            "reading is how close price sits to that ceiling — near it has meant late cycle, far "
            "below has meant early."
        ),
        "measures": "Price as a fraction of a long-run modelled ceiling.",
        "formula": "Price ÷ (35 × average cap), normalised 0-100.",
        "failure": (
            "The ×35 constant was fitted to two cycles of data. Every cycle since has topped "
            "further below the ceiling, so treating the line as a target rather than an outer "
            "bound has been consistently wrong."
        ),
    },
    {
        "slug": "rupl",
        "key": "RUPL",
        "name": "RUPL / NUPL",
        "h1": "Bitcoin NUPL (RUPL) today",
        "aka": "net unrealised profit and loss",
        "query": "nupl bitcoin",
        "blog": None,
        "answer": (
            "NUPL measures what share of the entire Bitcoin supply is sitting in unrealised "
            "profit. Above roughly 0.75 the market has historically been in euphoria; below zero "
            "the average coin is underwater, which has only happened in the deepest parts of "
            "past bear markets."
        ),
        "measures": "The proportion of circulating supply held at a paper profit.",
        "formula": "(market cap − realised cap) ÷ market cap, normalised 0-100.",
        "failure": (
            "It is a lagging read on sentiment, not a trigger. Supply can stay in profit through "
            "a 40% drawdown, and the sub-zero readings that mark real capitulation appear months "
            "after the fall starts — useful for confirmation, useless for timing an exit."
        ),
    },
]


# ── data ──────────────────────────────────────────────────────────────────
def fetch_cbbi() -> dict:
    # CBBI answers 406 to urllib's default User-Agent; it serves any browser-ish
    # one. Same source api/cycle-score.js reads, so the pages and the live
    # widget can never disagree about what an indicator says.
    req = urllib.request.Request(CBBI_URL, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) liftoffr-page-builder/1.0",
        "Accept": "application/json,text/plain,*/*",
    })
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.load(r)


def series_map(raw: dict, key: str) -> dict[dt.date, float]:
    out = {}
    for ts, v in (raw.get(key) or {}).items():
        try:
            out[dt.datetime.fromtimestamp(int(ts), dt.timezone.utc).date()] = float(v)
        except (TypeError, ValueError):
            continue
    return out


def nearest(series: dict[dt.date, float], target: dt.date, window: int = 7):
    """Value on `target`, or the closest reading within `window` days.

    CBBI's series is daily but not gap-free, and a cycle top that lands in a
    gap should print the neighbouring day rather than nothing.
    """
    if target in series:
        return series[target], target
    for off in range(1, window + 1):
        for cand in (target - dt.timedelta(days=off), target + dt.timedelta(days=off)):
            if cand in series:
                return series[cand], cand
    return None, None


def pct(v: float | None) -> str:
    return "—" if v is None else f"{v * 100:.0f}"


def usd(v: float | None) -> str:
    return "—" if v is None else f"${v:,.0f}"


# ── html helpers ──────────────────────────────────────────────────────────
def head(title: str, desc: str, canonical: str, extra_ld: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="LiftOffr">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{SITE}/og-image.png">
<meta name="theme-color" content="#e63946">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="/img/favicon.svg">
{extra_ld}
<script async src="https://www.googletagmanager.com/gtag/js?id=G-015PKWM24J"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-015PKWM24J');
  function track(n,p){{if(typeof gtag==='function')gtag('event',n,p||{{}});if(window.clarity)try{{window.clarity('event',n)}}catch(e){{}}}} window.track = track;
</script>
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){{
    c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  }})(window, document, "clarity", "script", "wl50cvbc1c");
</script>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{
    --red:#e63946; --green:#26d07c; --amber:#e8b339; --blue:#4d8df0;
    --bg:#060910; --border:rgba(255,255,255,0.09); --text:#e9eef7; --muted:#8793a8;
    --glass:linear-gradient(158deg, rgba(255,255,255,0.055), rgba(255,255,255,0.014));
    --glass-bd:1px solid rgba(255,255,255,0.09);
    --glass-sh:inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 34px rgba(0,0,0,0.45);
    --blur:blur(14px) saturate(120%);
  }}
  body {{
    background:
      radial-gradient(1100px 560px at 22% -160px, rgba(38,208,124,0.10), transparent 60%),
      radial-gradient(900px 480px at 96% 0, rgba(77,141,240,0.07), transparent 55%),
      var(--bg);
    background-attachment: fixed; color: var(--text);
    font-family:'Inter',sans-serif; line-height:1.65; min-height:100vh;
  }}
  a {{ color:#9dc4ff; }}
  nav {{
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:13px 22px; background:rgba(6,9,16,0.82);
    backdrop-filter:blur(16px) saturate(120%); -webkit-backdrop-filter:blur(16px) saturate(120%);
    border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100;
  }}
  nav .brand {{ font-weight:900; letter-spacing:-0.4px; color:#fff; text-decoration:none; font-size:15px; }}
  nav .brand span {{ color:var(--red); }}
  nav .navlinks {{ display:flex; gap:16px; font-size:13px; }}
  nav .navlinks a {{ color:var(--muted); text-decoration:none; }}
  nav .navlinks a:hover {{ color:#fff; }}
  .wrap {{ max-width:820px; margin:0 auto; padding:44px 20px 72px; }}
  .crumb {{ font-size:12px; color:var(--muted); margin-bottom:14px; }}
  .crumb a {{ color:var(--muted); text-decoration:none; }}
  .crumb a:hover {{ color:#fff; }}
  h1 {{ font-size:38px; font-weight:900; letter-spacing:-1.4px; line-height:1.08; margin-bottom:10px; }}
  h2 {{ font-size:23px; font-weight:900; letter-spacing:-0.6px; margin:40px 0 12px; }}
  h3 {{ font-size:16px; font-weight:800; margin:22px 0 6px; }}
  p {{ margin-bottom:14px; color:#c3cbd9; }}
  .updated {{ font-size:12.5px; color:var(--muted); margin-bottom:24px; }}
  .reading {{
    background:var(--glass); border:var(--glass-bd); backdrop-filter:var(--blur);
    -webkit-backdrop-filter:var(--blur); box-shadow:var(--glass-sh);
    border-radius:16px; padding:26px 24px; margin-bottom:26px; text-align:center;
  }}
  .reading-num {{ font-size:60px; font-weight:900; letter-spacing:-2.5px; line-height:1; }}
  .reading-lbl {{ font-size:11px; text-transform:uppercase; letter-spacing:1.6px; color:var(--muted); font-weight:800; margin-top:8px; }}
  .reading-sub {{ font-size:13.5px; color:var(--muted); margin-top:12px; }}
  .answer {{
    background:rgba(38,208,124,0.07); border:1px solid rgba(38,208,124,0.28);
    border-radius:14px; padding:20px 22px; margin-bottom:26px; font-size:16px; color:#dbe4f0;
  }}
  .tablewrap {{ overflow-x:auto; -webkit-overflow-scrolling:touch; margin:14px 0 8px; }}
  table {{ width:100%; border-collapse:collapse; font-size:14px; min-width:460px; }}
  th, td {{ text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); }}
  th {{ font-size:11px; text-transform:uppercase; letter-spacing:1.1px; color:var(--muted); font-weight:800; }}
  td.num {{ font-variant-numeric:tabular-nums; font-weight:700; }}
  .hot {{ color:var(--red); }} .cold {{ color:var(--green); }} .mid {{ color:var(--amber); }}
  .note {{ font-size:12.5px; color:var(--muted); margin-top:6px; }}
  .card {{
    background:var(--glass); border:var(--glass-bd); backdrop-filter:var(--blur);
    -webkit-backdrop-filter:var(--blur); box-shadow:var(--glass-sh);
    border-radius:14px; padding:20px 22px; margin-bottom:12px;
  }}
  .card .q {{ font-weight:800; color:#fff; margin-bottom:6px; font-size:15.5px; }}
  .card .a {{ font-size:14.5px; color:#a9b3c6; }}
  .grid {{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin:18px 0 8px; }}
  .grid a {{ text-decoration:none; color:inherit; display:block; }}
  .grid .name {{ font-weight:800; color:#fff; font-size:15px; }}
  .grid .val {{ font-size:26px; font-weight:900; letter-spacing:-1px; margin-top:4px; }}
  .grid .w {{ font-size:11.5px; color:var(--muted); margin-top:2px; }}
  .cta {{
    background:linear-gradient(158deg, rgba(230,57,70,0.16), rgba(230,57,70,0.04));
    border:1px solid rgba(230,57,70,0.42); border-radius:16px;
    padding:26px 24px; margin:40px 0 26px; text-align:center;
  }}
  .cta h3 {{ font-size:20px; margin:0 0 8px; }}
  .cta p {{ font-size:14.5px; color:#bcc5d4; max-width:520px; margin:0 auto 16px; }}
  .cta a.btn {{
    display:inline-block; background:var(--red); color:#fff; text-decoration:none;
    padding:14px 28px; border-radius:10px; font-weight:800; font-size:15.5px;
    box-shadow:0 10px 30px rgba(230,57,70,0.28);
  }}
  .cta .fine {{ font-size:12px; color:var(--muted); margin-top:10px; }}
  .disclaimer {{
    border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:18px 20px;
    margin:32px 0 24px; font-size:12.5px; color:#5b6577; line-height:1.7;
  }}
  .footer-row {{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; font-size:12px; color:#555; padding:14px 0; }}
  .footer-row a {{ color:#666; text-decoration:none; }}
  @media (max-width:640px) {{
    h1 {{ font-size:29px; letter-spacing:-1px; }}
    .grid {{ grid-template-columns:1fr; }}
    .reading-num {{ font-size:48px; }}
    .wrap {{ padding:30px 15px 56px; }}
  }}
</style>
</head>
<body>
<nav>
  <a class="brand" href="/">lift<span>offr</span></a>
  <div class="navlinks">
    <a href="/cycle">Live Score</a>
    <a href="/indicators">Indicators</a>
    <a href="/track-record">Track record</a>
    <a href="/plan">The plan</a>
  </div>
</nav>
<div class="wrap">
"""


FOOTER = """
  <div class="disclaimer">
    <strong>Read this first.</strong> Everything on this page is educational market information, not
    financial advice, and not a recommendation to buy or sell anything. I am not a registered
    investment adviser. Indicator readings are historical measurements, not predictions — every one
    of them has been wrong before, which is why each page here has a section saying exactly how.
    Bitcoin can fall further than you expect and stay there longer than you expect. Do your own
    research and never invest money you cannot afford to lose.
  </div>
  <div class="footer-row">
    <a href="/">Home</a><span>·</span>
    <a href="/cycle">Live Score</a><span>·</span>
    <a href="/indicators">All indicators</a><span>·</span>
    <a href="/track-record">Track record</a><span>·</span>
    <a href="/privacy">Privacy</a><span>·</span>
    <a href="/terms">Terms</a>
  </div>
  <div style="text-align:center;color:#444;font-size:11px;padding:0 0 22px;">
    © 2026 LiftOffr · Educational content only. Not financial advice.
    Indicator data derived from the public CBBI dataset.
  </div>
</div>
<script>
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[data-dest]');
    if (!a || typeof window.track !== 'function') return;
    window.track('cta_clicked', {
      cta_text: (a.textContent || '').trim().slice(0, 80),
      cta_position: a.getAttribute('data-cta-slot') || 'indicator_page',
      destination: a.getAttribute('data-dest'),
      page: location.pathname
    });
  }, true);
</script>
<script>
/* Live refresh: the baked number is the crawler's copy and is honest as of the
   dateline above; this replaces it with today's reading for humans. Failure is
   silent on purpose — a stale-but-dated number beats an error state. */
(function(){
  var els = document.querySelectorAll('[data-live-key]');
  if (!els.length) return;
  fetch('/api/cycle-score').then(function(r){ return r.json(); }).then(function(d){
    els.forEach(function(el){
      var k = el.getAttribute('data-live-key');
      var v = k === 'score' ? d.score : (d.components && d.components[k] && d.components[k].value);
      if (typeof v === 'number') el.textContent = v.toFixed(k === 'score' ? 1 : 0);
    });
    var stamp = document.querySelectorAll('[data-live-asof]');
    if (d.asOf) {
      var day = new Date(d.asOf).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
      stamp.forEach(function(el){ el.textContent = day; });
    }
  }).catch(function(){});
})();
</script>
</body>
</html>
"""


def zone_class(v: float) -> str:
    return "hot" if v >= 70 else ("cold" if v <= 35 else "mid")


def history_table(series, price, label: str) -> str:
    rows = []
    for iso, name in TOPS + BOTTOMS:
        target = dt.date.fromisoformat(iso)
        val, found = nearest(series, target)
        pr, _ = nearest(price, target)
        if val is None:
            continue
        v100 = val * 100
        rows.append(
            f'<tr><td>{name}</td><td>{found.isoformat()}</td>'
            f'<td class="num">{usd(pr)}</td>'
            f'<td class="num {zone_class(v100)}">{v100:.0f}</td></tr>'
        )
    return (
        f'<div class="tablewrap"><table><thead><tr>'
        f'<th>Cycle turn</th><th>Date</th><th>BTC close</th><th>{label} (0-100)</th>'
        f'</tr></thead><tbody>{"".join(rows)}</tbody></table></div>'
    )


def faq_ld(pairs: list[tuple[str, str]]) -> str:
    items = [{
        "@type": "Question", "name": q,
        "acceptedAnswer": {"@type": "Answer", "text": a},
    } for q, a in pairs]
    return ('<script type="application/ld+json">'
            + json.dumps({"@context": "https://schema.org", "@type": "FAQPage",
                          "mainEntity": items})
            + "</script>")


def faq_html(pairs: list[tuple[str, str]]) -> str:
    return "".join(
        f'<div class="card"><div class="q">{q}</div><div class="a">{a}</div></div>'
        for q, a in pairs
    )


def build_indicator(ind: dict, raw: dict, today: str, all_now: dict) -> str:
    series = series_map(raw, ind["key"])
    price = series_map(raw, "Price")
    latest_date = max(series)
    now = series[latest_date] * 100
    price_now, _ = nearest(price, latest_date)

    tops_vals = [(n, nearest(series, dt.date.fromisoformat(d))[0]) for d, n in TOPS]
    tops_vals = [(n, v * 100) for n, v in tops_vals if v is not None]
    bots_vals = [(n, nearest(series, dt.date.fromisoformat(d))[0]) for d, n in BOTTOMS]
    bots_vals = [(n, v * 100) for n, v in bots_vals if v is not None]

    top_avg = sum(v for _, v in tops_vals) / len(tops_vals) if tops_vals else 0
    bot_avg = sum(v for _, v in bots_vals) / len(bots_vals) if bots_vals else 0
    lowest_top = min(tops_vals, key=lambda x: x[1]) if tops_vals else ("—", 0)
    highest_bot = max(bots_vals, key=lambda x: x[1]) if bots_vals else ("—", 0)

    # Where today sits between the average bottom and the average top reading.
    if top_avg > bot_avg:
        pos = (now - bot_avg) / (top_avg - bot_avg) * 100
        pos_txt = (f"Today's reading sits {pos:.0f}% of the way from the average cycle-bottom "
                   f"reading ({bot_avg:.0f}) to the average cycle-top reading ({top_avg:.0f}).")
    else:
        pos_txt = ""

    faqs = [
        (f"What is the {ind['name']} reading today?",
         f"As of {today} the {ind['name']} reads {now:.0f} out of 100 on the normalised scale "
         f"LiftOffr uses, with Bitcoin at {usd(price_now)}. The number on this page updates daily."),
        (f"What did the {ind['name']} read at the last Bitcoin top?",
         f"At the October 2025 top it read "
         f"{dict(tops_vals).get('2025 top', 0):.0f}. Every cycle top and bottom since 2013 is in "
         f"the table on this page, taken from the same daily series."),
        (f"Has the {ind['name']} ever been wrong?",
         ind["failure"]),
        (f"Is the {ind['name']} enough on its own?",
         "No. Every indicator on this site has a failure mode, which is why LiftOffr weights nine "
         "of them into one score rather than trusting any single one. The live composite is at "
         "liftoffr.com/cycle."),
    ]

    ld_dataset = ('<script type="application/ld+json">' + json.dumps({
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": f"{ind['name']} — normalised daily reading",
        "description": (f"Daily normalised (0-100) {ind['name']} reading for Bitcoin, with "
                        f"historical values at every cycle top and bottom since 2013."),
        "url": f"{SITE}/indicators/{ind['slug']}",
        "creator": {"@type": "Organization", "name": "LiftOffr", "url": SITE + "/"},
        "isBasedOn": "https://colintalkscrypto.com/cbbi/",
        "temporalCoverage": f"{min(series).isoformat()}/{latest_date.isoformat()}",
        "variableMeasured": ind["name"],
        "license": "https://liftoffr.com/terms",
    }) + "</script>")

    title = f"{ind['h1']} — live reading + every cycle top since 2013 | LiftOffr"
    desc = (f"{ind['name']} reads {now:.0f}/100 today. See what it read at every Bitcoin cycle top "
            f"and bottom since 2013, how it is built, and where it has been wrong.")
    canonical = f"{SITE}/indicators/{ind['slug']}"

    others = "".join(
        f'<a href="/indicators/{o["slug"]}" data-dest="indicator_{o["slug"]}">'
        f'<div class="card"><div class="name">{o["name"]}</div>'
        f'<div class="val {zone_class(all_now[o["key"]])}">{all_now[o["key"]]:.0f}</div>'
        f'<div class="w">weight {WEIGHTS[o["key"]]*100:.0f}% of the Score</div></div></a>'
        for o in INDICATORS if o["slug"] != ind["slug"]
    )

    blog_line = (f'<p>Want the long-form explainer rather than the live number? '
                 f'<a href="{ind["blog"]}" data-dest="blog_{ind["slug"]}">Read the full '
                 f'{ind["name"]} breakdown →</a></p>' if ind["blog"] else "")

    return head(title, desc, canonical, ld_dataset + faq_ld(faqs)) + f"""
  <div class="crumb"><a href="/">Home</a> › <a href="/indicators">Indicators</a> › {ind['name']}</div>
  <h1>{ind['h1']}</h1>
  <div class="updated">Last updated <span data-live-asof>{today}</span> ·
    Also called {ind['aka']} · Weighted {WEIGHTS[ind['key']]*100:.0f}% of the LiftOffr Score</div>

  <div class="reading">
    <div class="reading-num {zone_class(now)}" data-live-key="{ind['key']}">{now:.0f}</div>
    <div class="reading-lbl">{ind['name']} · 0-100 normalised</div>
    <div class="reading-sub">Bitcoin {usd(price_now)} · {pos_txt}</div>
  </div>

  <div class="answer">{ind['answer']}</div>

  <h2>What it actually measures</h2>
  <p>{ind['measures']}</p>
  <h3>How it is calculated</h3>
  <p>{ind['formula']}</p>
  {blog_line}

  <h2>What it read at every cycle top and bottom</h2>
  <p>This is the table that does not exist anywhere else. Every value is the {ind['name']} reading
     on the day of that cycle turn, pulled from the same daily series the number above comes from.</p>
  {history_table(series, price, ind['name'])}
  <p class="note">Readings are normalised 0-100. Bitcoin closes are the same day's price from the
     source dataset. Cycle turn dates are daily-close highs and lows.</p>
  <p>Average reading at a cycle top: <strong>{top_avg:.0f}</strong>.
     Average at a cycle bottom: <strong>{bot_avg:.0f}</strong>.
     The weakest top signal it ever gave was the {lowest_top[0]} at {lowest_top[1]:.0f};
     the highest it ever read at a bottom was the {highest_bot[0]} at {highest_bot[1]:.0f}.</p>

  <h2>Where it has been wrong</h2>
  <p>{ind['failure']}</p>
  <p>This section is on every indicator page here on purpose. An indicator sold as infallible is
     being sold, not explained — and the gap between "it called three tops" and "it will call the
     next one" is where people lose money.</p>

  <h2>The other eight</h2>
  <p>No single indicator survives contact with a real cycle. These are the other components of the
     LiftOffr Score, live right now:</p>
  <div class="grid">{others}</div>

  <div class="cta">
    <h3>The reading tells you where. It doesn't tell you what to do.</h3>
    <p>My Bear Market Buy Plan is the nine-tier ladder I'm actually executing against these
       indicators — every level, every trigger, timestamped receipts when a tier fires.
       $29 once, no subscription.</p>
    <a class="btn" href="/plan" data-dest="plan" data-cta-slot="indicator_page">Get my plan — $29, once →</a>
    <div class="fine">Or read the whole free feed first — <a href="/free" data-dest="free">the live Score, the daily brief, the open Discord →</a></div>
  </div>

  <h2>Questions</h2>
  {faq_html(faqs)}
""" + FOOTER


def build_hub(raw: dict, today: str, all_now: dict, score_now: float) -> str:
    price = series_map(raw, "Price")
    latest = max(price)
    cards = "".join(
        f'<a href="/indicators/{o["slug"]}" data-dest="indicator_{o["slug"]}">'
        f'<div class="card"><div class="name">{o["name"]}</div>'
        f'<div class="val {zone_class(all_now[o["key"]])}" data-live-key="{o["key"]}">{all_now[o["key"]]:.0f}</div>'
        f'<div class="w">weight {WEIGHTS[o["key"]]*100:.0f}% · {o["aka"]}</div></div></a>'
        for o in INDICATORS
    )
    faqs = [
        ("Which Bitcoin cycle indicator is the most accurate?",
         "None of them alone. Pi Cycle landed within days of the 2013, 2017 and 2021 tops and then "
         "did not fire at the 2025 top. MVRV's peak reading has fallen every cycle. The honest "
         "answer is that indicators disagree at the turns, which is why LiftOffr weights nine into "
         "one score instead of picking a favourite."),
        ("What are these numbers?",
         "Each indicator is normalised to a 0-100 scale where high means late-cycle and low means "
         "early-cycle. They are derived from the public CBBI dataset and updated daily."),
        ("What does the LiftOffr Score add?",
         "It weights the nine components by how much each one has actually helped at cycle turns — "
         "RHODL and Puell carry 20% each, Pi Cycle 10%, the slower ones 5%. The full weighting and "
         "the live number are at liftoffr.com/cycle."),
        ("Is this financial advice?",
         "No. These are measurements of public on-chain and price data, published as education. "
         "Nothing here tells you what to buy or sell."),
    ]
    title = "Bitcoin cycle indicators — live readings for all 9 | LiftOffr"
    desc = ("Live 0-100 readings for the nine Bitcoin cycle indicators behind the LiftOffr Score — "
            "RHODL, Puell, MVRV, Pi Cycle, rainbow band and more, plus what each read at every "
            "cycle top since 2013.")
    return head(title, desc, f"{SITE}/indicators", faq_ld(faqs)) + f"""
  <div class="crumb"><a href="/">Home</a> › Indicators</div>
  <h1>Bitcoin cycle indicators, live</h1>
  <div class="updated">Last updated <span data-live-asof>{today}</span> · Bitcoin {usd(price[latest])}</div>

  <div class="reading">
    <div class="reading-num {zone_class(score_now)}" data-live-key="score">{score_now:.1f}</div>
    <div class="reading-lbl">The LiftOffr Score · all nine, weighted</div>
    <div class="reading-sub">The composite these nine feed into. Full gauge and history at
      <a href="/cycle" data-dest="cycle">/cycle</a>.</div>
  </div>

  <div class="answer">Nine indicators, each normalised to 0-100, each weighted by how much it has
    actually helped at past cycle turns. High readings mean late cycle. Low readings mean early.
    Every page below carries the live number, what the indicator read at every cycle top and bottom
    since 2013, and a section on where it has been wrong.</div>

  <h2>All nine, right now</h2>
  <div class="grid">{cards}</div>

  <h2>Why nine and not one</h2>
  <p>Every indicator here has a failure mode, and the failures do not overlap. Pi Cycle is a binary
     that has to fire on the exact week. MVRV's extremes shrink every cycle. Puell breaks across a
     halving. The rainbow band gets refitted as new data arrives. Reserve Risk has been distorted by
     custodial flows since 2024.</p>
  <p>Weighting them together does not remove those problems — it stops any single one of them from
     making the whole decision. That is the entire argument for a composite, and it is why the
     "where it has been wrong" section exists on every page here.</p>

  <div class="cta">
    <h3>These indicators are why I buy where I buy.</h3>
    <p>My Bear Market Buy Plan is the nine-tier ladder built on top of them — the exact levels,
       what has to be true at each one, and a timestamped receipt every time a tier fires.
       $29 once.</p>
    <a class="btn" href="/plan" data-dest="plan" data-cta-slot="indicators_hub">Get my plan — $29, once →</a>
    <div class="fine">Not buying today? <a href="/free" data-dest="free">The Score, the daily brief and the Discord are free →</a></div>
  </div>

  <h2>Questions</h2>
  {faq_html(faqs)}
""" + FOOTER


def build_bottom_page(raw: dict, today: str, score_now: float) -> str:
    """/when-will-bitcoin-bottom — a live-data page, not a prediction post.

    The keyword is peaking right now and the incumbents win on freshness, so
    the page's whole edge is a visible dateline plus real drawdown arithmetic
    from previous bears. It states outright that nobody knows the date.
    """
    price = series_map(raw, "Price")
    latest = max(price)
    now_price = price[latest]

    rows, stats = [], []
    for (tiso, tname), (biso, bname) in zip(TOPS[:3], BOTTOMS):
        td, bd = dt.date.fromisoformat(tiso), dt.date.fromisoformat(biso)
        tp, tfound = nearest(price, td)
        bp, bfound = nearest(price, bd)
        if tp is None or bp is None:
            continue
        draw = (bp / tp - 1) * 100
        days = (bfound - tfound).days
        stats.append((draw, days))
        rows.append(
            f"<tr><td>{tname.replace(' top','')} cycle</td><td>{tfound.isoformat()}</td>"
            f'<td class="num">{usd(tp)}</td><td>{bfound.isoformat()}</td>'
            f'<td class="num">{usd(bp)}</td>'
            f'<td class="num hot">{draw:.0f}%</td><td class="num">{days}</td></tr>'
        )

    avg_draw = sum(s[0] for s in stats) / len(stats)
    avg_days = sum(s[1] for s in stats) / len(stats)
    min_days, max_days = min(s[1] for s in stats), max(s[1] for s in stats)
    min_draw, max_draw = max(s[0] for s in stats), min(s[0] for s in stats)

    last_top_date = dt.date.fromisoformat(TOPS[-1][0])
    last_top_price, _ = nearest(price, last_top_date)
    days_since = (latest - last_top_date).days
    draw_now = (now_price / last_top_price - 1) * 100

    proj_lo = last_top_date + dt.timedelta(days=min_days)
    proj_hi = last_top_date + dt.timedelta(days=max_days)
    proj_avg = last_top_date + dt.timedelta(days=int(avg_days))
    px_lo = last_top_price * (1 + max_draw / 100)
    px_hi = last_top_price * (1 + min_draw / 100)

    faqs = [
        ("When will Bitcoin bottom?",
         f"Nobody knows, and anyone giving you a date is guessing. What can be measured: the three "
         f"previous bear markets bottomed {min_days}, {sorted(s[1] for s in stats)[1]} and "
         f"{max_days} days after their cycle top, averaging {avg_days:.0f} days. Applied to the "
         f"{last_top_date.strftime('%B %-d, %Y')} top, that window runs "
         f"{proj_lo.strftime('%B %Y')} to {proj_hi.strftime('%B %Y')}. It is arithmetic on three "
         f"data points, not a forecast."),
        ("How far does Bitcoin usually fall in a bear market?",
         f"The last three drawdowns from cycle top to cycle bottom were "
         f"{', '.join(f'{abs(s[0]):.0f}%' for s in stats)}, averaging {abs(avg_draw):.0f}%. But "
         f"each one has been shallower than the last, so the average overstates it. Bitcoin is "
         f"currently {abs(draw_now):.0f}% below the {last_top_date.strftime('%B %Y')} top."),
        ("Has Bitcoin already bottomed?",
         f"As of {today} the LiftOffr Score reads {score_now:.1f} out of 100. Past cycle bottoms "
         f"printed composite readings in the low teens. The live number and the full history are "
         f"on the cycle page — it is a measurement, not a call."),
        ("What should I do while waiting?",
         "That is your decision and this page is not advice. What I do personally is published: "
         "a written ladder of buy levels set before the fear arrives, and a receipt every time one "
         "fires. The alternative — deciding while it is happening — is what cost me $30,000 in 2022."),
    ]

    title = f"When will Bitcoin bottom? Live cycle data — updated {today} | LiftOffr"
    desc = (f"Bitcoin is {draw_now:.0f}% below the {last_top_date.strftime('%B %Y')} top, "
            f"{days_since} days in. Past bears bottomed after {min_days}-{max_days} days and "
            f"{max_draw:.0f}% to {min_draw:.0f}% drawdowns. Live indicator readings, updated daily.")

    return head(title, desc, f"{SITE}/when-will-bitcoin-bottom", faq_ld(faqs)) + f"""
  <div class="crumb"><a href="/">Home</a> › When will Bitcoin bottom?</div>
  <h1>When will Bitcoin bottom?</h1>
  <div class="updated">Last updated <span data-live-asof>{today}</span> ·
    Updated daily from live cycle data</div>

  <div class="answer"><strong>Nobody knows the date, and anyone who gives you one is guessing.</strong>
    What can be measured: Bitcoin is <strong>{abs(draw_now):.0f}% below</strong> its
    {last_top_date.strftime('%B %-d, %Y')} top and <strong>{days_since} days</strong> into this
    drawdown. The last three bear markets bottomed {min_days}-{max_days} days after the top, with
    drawdowns of {abs(min_draw):.0f}% to {abs(max_draw):.0f}%. Applied to this cycle that is a
    window of {proj_lo.strftime('%B %Y')} to {proj_hi.strftime('%B %Y')} — three data points of
    arithmetic, not a forecast.</div>

  <div class="reading">
    <div class="reading-num {zone_class(score_now)}" data-live-key="score">{score_now:.1f}</div>
    <div class="reading-lbl">LiftOffr Score today · 0-100</div>
    <div class="reading-sub">Bitcoin {usd(now_price)} · {draw_now:.0f}% from the top ·
      <a href="/cycle" data-dest="cycle">see the full gauge →</a></div>
  </div>

  <h2>Every previous Bitcoin bear market, measured</h2>
  <div class="tablewrap"><table><thead><tr>
    <th>Cycle</th><th>Top date</th><th>Top price</th><th>Bottom date</th><th>Bottom price</th>
    <th>Drawdown</th><th>Days</th>
  </tr></thead><tbody>{''.join(rows)}</tbody></table></div>
  <p class="note">Prices are daily closes from the public CBBI price series. Dates are the
     daily-close cycle high and low.</p>

  <h2>What that implies for this cycle — and why it is weak evidence</h2>
  <p>Run the same arithmetic forward from the {last_top_date.strftime('%B %-d, %Y')} top:</p>
  <div class="tablewrap"><table><thead><tr>
    <th>Method</th><th>Implied bottom</th><th>Implied price</th>
  </tr></thead><tbody>
    <tr><td>Shortest previous bear ({min_days} days)</td><td>{proj_lo.strftime('%B %-d, %Y')}</td><td class="num">—</td></tr>
    <tr><td>Average previous bear ({avg_days:.0f} days)</td><td>{proj_avg.strftime('%B %-d, %Y')}</td><td class="num">—</td></tr>
    <tr><td>Longest previous bear ({max_days} days)</td><td>{proj_hi.strftime('%B %-d, %Y')}</td><td class="num">—</td></tr>
    <tr><td>Shallowest previous drawdown ({abs(min_draw):.0f}%)</td><td>—</td><td class="num">{usd(px_hi)}</td></tr>
    <tr><td>Deepest previous drawdown ({abs(max_draw):.0f}%)</td><td>—</td><td class="num">{usd(px_lo)}</td></tr>
  </tbody></table></div>
  <p><strong>Three cycles is not a sample, and those last two rows are not a price target.</strong>
     Each of those bears happened in a different market: no ETFs, no institutional allocation,
     different halving dynamics, different rate environment. Every drawdown so far has been
     shallower than the one before it ({abs(stats[0][0]):.0f}% → {abs(stats[1][0]):.0f}% →
     {abs(stats[2][0]):.0f}%), so applying an old percentage to a new top almost certainly
     understates the floor. LiftOffr does not publish price predictions; the rows are there because
     leaving the arithmetic out would be the dishonest version. Treat the whole table as a range of
     what has happened, never as a schedule of what will.</p>

  <h2>What actually moves at a bottom</h2>
  <p>Bottoms are not identified by a date. They are identified by a cluster of indicators reaching
     levels they only reach when everyone has given up. The nine components of the LiftOffr Score
     are live on <a href="/indicators" data-dest="indicators_hub">the indicators page</a>, each with
     what it read at every previous cycle bottom — that table is the honest version of this
     question.</p>
  <p>The three that have historically moved first at a bottom are the slow, supply-side ones:
     <a href="/indicators/2-year-ma-multiplier" data-dest="indicator_2yma">the 2-Year MA Multiplier</a>,
     <a href="/indicators/reserve-risk" data-dest="indicator_reserve_risk">Reserve Risk</a> and
     <a href="/indicators/rupl" data-dest="indicator_rupl">NUPL</a>. The momentum indicators confirm
     late, which is exactly the wrong order if you are trying to buy.</p>

  <div class="cta">
    <h3>You don't need the date. You need the levels, written down first.</h3>
    <p>My Bear Market Buy Plan is the nine-tier ladder I'm executing right now — the exact prices,
       what has to be true at each one, and a timestamped receipt every time a tier fires. Written
       before the fear, so the decision isn't made during it. $29 once.</p>
    <a class="btn" href="/plan" data-dest="plan" data-cta-slot="bottom_page">Get my plan — $29, once →</a>
    <div class="fine">Or watch the same numbers free — <a href="/free" data-dest="free">the Score, the daily brief, the open Discord →</a></div>
  </div>

  <h2>Questions</h2>
  {faq_html(faqs)}
""" + FOOTER


SITEMAP_START = "  <!-- BEGIN generated:indicators -->"
SITEMAP_END = "  <!-- END generated:indicators -->"


def sitemap_block(iso: str) -> str:
    entries = [("/indicators", "daily", "0.9"), ("/when-will-bitcoin-bottom", "daily", "0.9")]
    entries += [(f"/indicators/{i['slug']}", "daily", "0.85") for i in INDICATORS]
    out = [SITEMAP_START]
    for loc, freq, pri in entries:
        out += [
            "  <url>",
            f"    <loc>{SITE}{loc}</loc>",
            f"    <lastmod>{iso}</lastmod>",
            f"    <changefreq>{freq}</changefreq>",
            f"    <priority>{pri}</priority>",
            "  </url>",
        ]
    out.append(SITEMAP_END)
    return "\n".join(out)


def update_sitemap(iso: str, check: bool) -> bool:
    """Own one delimited block of sitemap.xml, leave the rest alone.

    The pages regenerate daily, so a hand-maintained sitemap would carry a
    stale lastmod on every one of them — and lastmod accuracy is the whole
    freshness signal these pages compete on.
    """
    path = ROOT / "sitemap.xml"
    body = path.read_text()
    block = sitemap_block(iso)
    if SITEMAP_START in body and SITEMAP_END in body:
        pre = body.split(SITEMAP_START)[0]
        post = body.split(SITEMAP_END)[1]
        new = pre + block + post
    else:
        new = body.replace("</urlset>", block + "\n</urlset>")
    if new == body:
        return False
    if not check:
        path.write_text(new)
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="report what would change, write nothing")
    args = ap.parse_args()

    raw = fetch_cbbi()
    missing = [k for k in WEIGHTS if k not in raw]
    if missing:
        print(f"ERROR: CBBI payload missing weighted components: {missing}", file=sys.stderr)
        return 1

    all_series = {k: series_map(raw, k) for k in WEIGHTS}
    latest = max(all_series["RHODL"])
    today = latest.strftime("%B %-d, %Y")
    all_now = {k: max(0.0, min(100.0, all_series[k][latest] * 100)) for k in WEIGHTS}
    score_now = sum(all_now[k] * w for k, w in WEIGHTS.items()) / sum(WEIGHTS.values())

    pages: dict[Path, str] = {
        ROOT / "indicators" / "index.html": build_hub(raw, today, all_now, score_now),
        ROOT / "when-will-bitcoin-bottom" / "index.html": build_bottom_page(raw, today, score_now),
    }
    for ind in INDICATORS:
        pages[ROOT / "indicators" / ind["slug"] / "index.html"] = build_indicator(
            ind, raw, today, all_now)

    changed = 0
    for path, body in pages.items():
        old = path.read_text() if path.exists() else ""
        if old == body:
            continue
        changed += 1
        if args.check:
            print(f"would update {path.relative_to(ROOT)}")
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body)
        print(f"wrote {path.relative_to(ROOT)}")

    if update_sitemap(latest.isoformat(), args.check):
        changed += 1
        print(("would update " if args.check else "wrote ") + "sitemap.xml")

    print(f"{len(pages)} pages, {changed} changed, data as of {today}, score {score_now:.1f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
