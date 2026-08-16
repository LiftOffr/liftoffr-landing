# 2026-08-16 — Compliance sweep, follow-up pass

Second pass after a re-audit of the live site found pages the first sweep
(`CHANGELOG_2026-08-16_FUNNEL_CONTENT_PLAN.md`) missed. Same kept-vs-removed standard:

- **Kept** — statements about what the indicators historically *read*, verifiable from
  public data, wording anchored to "ran hot at" / "in backtest".
- **Removed** — anything implying LiftOffr made a contemporaneous published call, and
  any performance figure without an adjacent substantiation line.

---

## 1. `/receipts` meta description

Meta read "Every LiftOffr signal, timestamped as it fired", contradicting the page's own
body text ("model-backtest reconstructions, not contemporaneous calls"). Now matches the
body and the already-correct `og:description`.

**Not a regression from the first pass.** `git log -- receipts.html` shows the file was
last touched in `0c3e21e`; commit `f3c189f` did not modify it. The line predates both.

## 2. `/checklist` — skipped entirely by the first sweep

- Proof strip: "Cycle tops **called**" → "Cycle tops **in the backtest**".
- Added the substantiation line under the proof strip that the homepage already carried
  but this page did not — what the +7,602% is measuring, that it is a backtest, links to
  `/track-record` and `/receipts`, and past-performance language. This is a public opt-in
  page, so an unqualified ROI figure mattered more here than almost anywhere.
- Member testimonial removed — see item 5.

## 3. `/links` meta description

Still advertised "the free checklist" after the CTA swap made the buy-zone plan the
headline magnet. Now "the free buy-zone plan, the backtested signal log".

## 4. Pages the first sweep never verified

| Page | Result |
|---|---|
| `/buyzone` | Same two defects as `/checklist` — "Cycle tops called" and an unqualified +7,602%. Both fixed the same way. |
| `/proof` | **Three missed badges**: "✓ Top called within 2 weeks / within 3 days / 2 days early" → "Signals hit threshold within … of the peak". The first pass fixed this page's hero and stat row but not the per-cycle case badges. |
| `/track-record` | Clean. Hero is explicitly "Backtested Track Record", disclaimer already at the foot. |
| `/system` | Clean. Already carries "Backtested results are historical; past performance…". |
| `/free` | Clean — fixed in the first pass. |
| `/cycle` | Clean — fixed in the first pass. |
| `/about` | Checked opportunistically. The `$1.88M` reference is already labelled "The public backtest at /track-record shows the math". Torin's first-person "I DCA'd out cleanly through the 2025 top" is a personal account, not a product claim — left alone. |

## 5. Member testimonial pulled from `/checklist`

Original wording, preserved here for restoration:

> ★★★★★ "Used this exact checklist to scale out near the 2025 top instead of
> round-tripping it." — Tyr, member

Removed rather than disclaimed. An undocumented third-party trading-outcome claim is FTC
endorsement-guide territory (16 CFR 255); a disclaimer labels the claim but does not
substantiate it, and there is no documented typical member result to disclose alongside
it. **To restore:** get the member's written permission and the result on file, then put
the wording back verbatim with a typical-results disclosure.

## 6. The honest headline stat — and why it is not called a hit rate

Surfaced on the homepage directly under the proof bar, linking to `/receipts`:

> **All 64 zone crossings since 2011 are published** — the winners, the losers, and the
> ones that went nowhere. BTC was higher 30 days later after 35 of them and lower after
> 29. Whether that's a hit depends on the zone; every row shows you. Read the log →

**35/64 is not a hit rate and must not be relabelled as one.** It counts crossings after
which BTC *rose*, and the 64 mix opposing signal types — a rise after an EXIT crossing is
a miss, not a hit. Parsing the table on `/receipts` (64 rows: 20 WARNING, 18 NEUTRAL,
12 ACCUMULATION, 10 EXIT, 4 DEEP ACCUMULATION) and scoring directionally
(EXIT/WARNING should be followed down, ACCUMULATION up, NEUTRAL excluded as directionless):

| Horizon | BTC higher | Directional hit |
|---|---|---|
| +30d | 35/64 | 21/46 (46%) |
| +90d | 35/64 | 21/46 (46%) |
| +180d | 37/64 | 25/46 (54%) |

Near coin-flip on a 30–90 day directional read. That is not necessarily damning — the
framework is a multi-month cycle-timing tool, not a 30-day direction predictor, so a
short-horizon directional test is a poor proxy for what it claims to do. But it does mean
**neither number is publishable as an accuracy or win-rate claim**, and the completeness
of the record is the honest thing to lead with instead. A defensible hit-rate stat would
need a per-zone definition tied to the horizon the strategy actually operates on, agreed
in advance — worth doing, but it is a decision, not a copy edit.

An HTML comment at the insertion point in `index.html` warns against relabelling it.

---

## Untouched on purpose

- **The homepage FAQ live-logging promise** — "From here forward, signals go out in the
  daily brief as they fire, timestamped." Flagged for Torin's decision, left exactly as
  written. Verified still present after this pass.
- `/system` noindex — still deliberate per CLAUDE.md.
- "timestamped receipts when a tier fires" on `/plan`, `/stack`, `/buyzone` and the
  indicator pages — forward-looking product promise, not a past-performance claim.
