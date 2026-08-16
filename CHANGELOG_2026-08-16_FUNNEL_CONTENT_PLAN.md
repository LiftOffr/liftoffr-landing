# 2026-08-16 — Funnel & content plan pass

Branch `funnel-content-plan-2026-08-16`. Four items from the funnel/content audit.
Not pushed — review before merge to main (main auto-deploys).

---

## 1. Performance-claim compliance (highest priority)

**The problem.** `/receipts` says, correctly, that all 64 entries are model-backtest
reconstructions and that only rows marked *logged live* were recorded in real time —
and zero rows carry that mark. The homepage and several other pages claimed LiftOffr
"called every cycle top since 2013" and that "members saw it that morning". The buried
page was the honest one. For trading education that gap is FTC-substantiation exposure,
so every claim now matches `/receipts`.

**The rule applied.** Two classes of statement, treated differently:

- *Kept.* Statements about what the indicators historically **read** at past tops —
  verifiable from public CBBI/on-chain data, already tabulated on `/indicator-history`
  and `/proof`, misses included. Wording moved to "ran hot at" / "flags … in backtest".
- *Removed.* Statements implying LiftOffr made a contemporaneous public call —
  "called every cycle top", "three perfect calls", "members saw it that morning",
  "every timestamped call". LiftOffr did not exist for most of that window and the
  site's own receipts page records nothing as logged live.

**Changes**

| File | What changed |
|---|---|
| `index.html` | H1 "Every cycle top **called** since 2013" → "Every cycle top since 2013 **shows up in them**". Hero sub, trust line, proof bar, og/twitter descriptions all re-cut to backtest framing. "100% win rate" → "across 417 start dates". New substantiation paragraph under the hero proof card. "Past calls" section → "In the backtest" / "What the framework **would have flagged**", with an explicit "not calls published at the time" line. Dec 2024 entry now states the model cleared ~20% early. Exit-intent modal: "This is what the system called" → "what the indicators read at every top"; four "Top called within X" → "Signals landed within X of the peak". FAQ "Can I verify your past calls?" replaced with "Are these real-time calls or a backtest?" answering plainly; matching JSON-LD entry added. |
| `proof/index.html` | "Three **perfect calls**" → "Three clean reads". "4/4 Cycle Tops Flagged by Confluence" → "…in Backtest"; "0 False Top Signals" → "0 Backtested False Top Signals". Removed "No hindsight" from the drawdown table — the readings were public at the time but the thresholds and weights were set afterwards, which is stated now. Hero sub and og/twitter descriptions updated. |
| `links/index.html` | Removed **"Members saw it that morning"** (unsubstantiated — see open question below). Section label "Timestamped calls — the receipts" → "Dated signals — the backtest"; footer note now says these are backtest outputs, not calls published at the time. |
| `faq/index.html` | New "Are your past results real-time calls or a backtest?" Q (visible + JSON-LD). "framework that fired in 2013…" → "reads … correctly in backtest". "every timestamped receipt" → "the complete zone-crossing log at /receipts". |
| `free/index.html`, `plan/index.html` | "every timestamped call I've made" → "the full backtested signal log". |
| `about/index.html`, `cycle/index.html`, `buyzone/index.html`, `checklist/index.html`, `playbook/index.html` | "called/flagged every cycle top since 2013" → "ran hot at" / "flags … in backtest". Playbook's "100% win rate vs DCA across 417 backtested start dates" → "beat plain DCA at all 417 start dates tested. Backtested result, not a live trading record." |
| `blog/pi-cycle-top-bitcoin-indicator.html`, `blog/index.html` | Title "The MA Cross That Called Every Cycle Peak" was contradicted by our own pages — Pi Cycle did not fire at the Oct 2025 top. Now "The MA Cross — and When It Missed", matching the article's own H1. |

**Left alone deliberately:** "timestamped receipts when a tier fires" on `/plan`,
`/stack`, `/buyzone` and the indicator pages. That is a forward-looking promise about
the paid product, not a past-performance claim.

---

## 2. Free CTA now follows the Score

The free-magnet slot pitched the sell-timing Cycle Top Checklist while the Score sat
around 31 — a selling answer to an audience with a buying problem.

Score-driven rather than hardcoded. `/api/cycle-score` already returns `{score, zone}`,
so `applyMagnetMode()` picks the magnet at **70** — the WARNING threshold in
`api/cycle-score.js`, so the CTA turns over at the same point the zone does.

- **Below 70:** Bear Market Buy-Zone Plan (`/buyzone`).
- **70 and above:** BTC Cycle Top Checklist (`/checklist`).

Buy-zone is the plain-HTML default, so the page is correct with JS off or the API down;
`DEFAULT_MODE` at the foot of `index.html` is the one knob if that ever inverts.

- `index.html` — nav button, lead-magnet section (both PDF mocks in markup, one hidden)
  and email popup all switch. `submitLeadForm()` now sends `magnet` so the right PDF
  goes out; `api/subscribe.js` already accepted `buyzone`/`checklist` but the homepage
  had never been sending it, so **every homepage signup was getting the checklist**.
  Success message and `utm_campaign` fallback follow the magnet too.
- `links/index.html` — same switch hooked into the Score fetch already on that page.
  Buy-zone plan is now the quick link; the checklist moved to the escape-hatch slot.
- New GA4 event `magnet_mode_switched {mode, score, zone}`.

---

## 3. `/playbook` un-hidden

$497, highest margin, and it was `noindex, nofollow` with two internal links.

- `playbook/index.html` — robots → `index, follow, max-image-preview:large`.
- `sitemap.xml` — added (outside the generated indicators block).
- Internal links added: homepage footer, homepage offer ladder (under the $197 line),
  `/plan` footer, `/faq` footer, and a new "Do you work with anyone 1:1?" FAQ entry
  (visible + JSON-LD) that routes everyone else to `/system`.
- `CLAUDE.md` page map updated.

`/system` is still `noindex` — CLAUDE.md documents that as deliberate (warm list only),
and the audit did not raise it. Left as is.

---

## 4. Indicator-post internal linking

The audit called the nine posts orphaned. **They are not, as of the 2026-08-14 quality
pass:** `/blog` indexes all nine, is in the homepage nav and footer plus `/about`,
`/faq` and `/indicator-history`, every post cross-links the other eight, all nine are in
`sitemap.xml`, and five have inbound links from their matching `/indicators/*` page.

The real gap was narrower, and that is what got fixed:

- `indicators/index.html` had **no link to `/blog` at all** despite being the hub these
  posts support. Added a "Read the long-form explainers" grid linking all nine, plus
  `/blog` in the footer row.
- Four posts (CBBI, Fear & Greed, Google Trends, how-to-identify-a-cycle-top) had no
  product-page inbound because no `/indicators/*` page matches them. The hub grid now
  covers them.
- Four indicator pages (`reserve-risk`, `rhodl-ratio`, `rupl`, `woobull-top-cap`) had no
  outbound blog link because no post matches them. They now point at the CBBI composite
  explainer and the cycle-top framework post.
- `/blog` added to the footers of `/cycle`, `/stack`, `/plan`,
  `/when-will-bitcoin-bottom` and `/indicators`.

---

## Verify before merge

- `/api/cycle-score` needs a live function — checked locally against a static server
  (API 404s) and the buy-zone default held with no console error, which is the failure
  mode that matters. Confirm on a preview deploy that a real Score below 70 keeps buy
  mode and that a forced `applyMagnetMode('sell')` still renders correctly.
- Submit the homepage form on preview and confirm the **buy-zone** PDF arrives, not the
  checklist.
- Re-request indexing for `/playbook` in Search Console once live.
