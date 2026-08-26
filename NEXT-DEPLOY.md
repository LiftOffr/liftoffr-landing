# NEXT-DEPLOY — 2026-08-26

Three commits. Nothing here touches payment logic, pricing values, the `$147` founding price,
the September 7 date, or any `plan_*` ID.

---

## FIRST: clear the stale git lock

A read-only `git status` in this session created `.git/index.lock` and could not remove it
(the session mount denies `unlink`). It is a 0-byte file and it **will block your first
commit**. Delete it before anything else:

```bash
cd ~/liftoffr-landing
rm -f .git/index.lock
```

---

## Commit 1 — `/system` copy: the market feed is not a $197 benefit

One file. Copy only, no markup or script changes. Present tense throughout, no correction
framing.

```bash
git add system/index.html
git commit -m "system: lead the What's in it list with what @System actually gates

The list sold the market-intelligence channels -- daily brief, macro, live
component readings -- as part of the \$197. Those sit under the Discord category
'📡 FREE · MARKET FEED' with @everyone able to view, and @System gates the
Modules 1-6 lesson channels, course-resources and the Q&A channel instead. The
bullet now names those, and the feed is described as free where it belongs.

Price, the \$147 founding seat and the September 7 date are untouched."
git push
```

**Verify:**

```bash
curl -s https://liftoffr.com/system | grep -c 'market-intelligence channels'   # expect 0
curl -s https://liftoffr.com/system | grep -o '\$147\|September 7, 2026'       # expect both still present
```

Then eyeball <https://liftoffr.com/system> — the "What's in it" card should end with the free-Discord
line, and the price block should still read **$197 one-time · $147 founding seat … closes
September 7, 2026**.

---

## Commit 2 — GTM: close the coverage gaps

Sixteen files. Twelve pages had no GTM at all; `/score` had the head half but no `<noscript>`;
three pages were missing the closing `<!-- End Google Tag Manager -->` comment. Snippet
inserted is byte-identical to the one already on `/system`, placed **after** the Consent Mode
defaults and before the GA4 loader.

```bash
git add indicators/ stack/index.html when-will-bitcoin-bottom/index.html \
        score/index.html receipts.html track-record/index.html welcome/index.html
git commit -m "gtm: add GTM-K5B4BX46 to the 12 public pages that were missing it

The ten /indicators/* pages, /stack and /when-will-bitcoin-bottom are indexable,
in the sitemap, and carry GA4 + Consent Mode already, but had no GTM container.
/score had the head snippet and was missing the <noscript> half. receipts,
track-record and welcome were missing the closing GTM comment only -- cosmetic,
folded in so the block greps cleanly everywhere.

Snippet is byte-identical to the block on /system and is inserted after the
consent-default call and before the GA4 loader, so nothing fires unconsented.
Skipped: /dashboard (basic-auth), and 404.html (noindex). logo-lab and
lead-magnet/buy-zone-plan are in .vercelignore and never deploy at all.

All 45 instrumented pages verified: one snippet variant, zero ordering
violations, every page has both halves."
git push
```

**Verify** — each of these should return `2` (head snippet + noscript):

```bash
for p in indicators indicators/rupl indicators/mvrv-z-score indicators/pi-cycle-top \
         indicators/puell-multiple indicators/rainbow-chart indicators/reserve-risk \
         indicators/rhodl-ratio indicators/woobull-top-cap indicators/2-year-ma-multiplier \
         stack when-will-bitcoin-bottom score receipts track-record welcome; do
  printf '%-40s %s\n' "/$p" "$(curl -s https://liftoffr.com/$p | grep -c 'GTM-K5B4BX46')"
done
```

Then open GTM Preview on `/indicators/rupl` and confirm the container fires **after** consent
resolves, not before.

---

## Commit 3 — move the positioning rationale out of shipped HTML

`system/index.html` carried a 23-line HTML comment naming internal pricing strategy, an
undelivered plan item, the deleted `#trade-setups` channel and specific lesson channel IDs —
all readable in View Source. Same failure mode CLAUDE.md records for the Whop/Apple Pay note.
Moved to `SYSTEM_POSITIONING.md`; `.vercelignore` excludes all markdown, so it stays private.

```bash
git add system/index.html SYSTEM_POSITIONING.md NEXT-DEPLOY.md
git commit -m "system: move positioning rationale out of shipped HTML

A 23-line comment in the sales page named pricing strategy, the undelivered
Part 4.2 exit-ladder move, the deleted #trade-setups channel and lesson channel
IDs -- all visible in View Source. Now in SYSTEM_POSITIONING.md, which
.vercelignore keeps off the public site. Same rule as the Apple Pay note.

SYSTEM_POSITIONING.md also records what @System actually gates, so the /system
bullet list can be checked against it."
git push
```

**Verify:**

```bash
curl -s https://liftoffr.com/system | grep -c 'Positioning sharpened'          # expect 0
curl -s https://liftoffr.com/system | grep -c 'm5-l7-build-your-exit-ladder'   # expect 0
curl -s -o /dev/null -w '%{http_code}\n' https://liftoffr.com/SYSTEM_POSITIONING.md  # expect 404
```

---

## Open, needs your call

- **`404.html`** has Consent Mode and GA4 but no GTM. Skipped as `noindex` per your rule.
  Worth reconsidering — it is a real visitor surface, not an ops one, and broken-link data is
  the kind of thing you would want. Say the word and it is a one-line addition.
- **Seat-cap conflict.** `CLAUDE.md` describes the founding tier as "$147 founding, 50 seats"
  in two places. `/system` line ~219 says "There is no seat cap on it, because nothing here
  counts seats." Both cannot be right and it is price-adjacent, so I left it alone entirely.
  The live page is the more conservative claim; `CLAUDE.md` is likely the stale one.
- **`/system` founding-link paragraph** (~line 225) explains that the `$147` page is `noindex`
  but not password-protected, "so read this as where I point people rather than as a lock."
  That is the only remaining hedging passage on the page and it is price-adjacent, so I did
  not touch it. It reads as pre-emptively confessing a funnel weakness to a buyer.

## Deliberately left in place

- **The dated correction notices on `/score` and `/proof`** stay. Those disclose that a
  published *number* was wrong — different from sales copy carrying changelog voice. The
  comment above the `/score` one makes the point: a silent fix to the headline number on the
  page whose pitch is "recompute this yourself" would be worse than the bug.
- **`pricing.md`** — I flagged this earlier as publicly exposed. That was wrong. `.vercelignore`
  excludes `*.md` and `**/*.md` wholesale, so it never shipped. No action needed.
