# 2026-08-20 — Audit remediation pass

Branch: `audit-fixes-2026-08-20`. **Nothing deployed, nothing pushed, nothing sent.**
Seven commits, rebased onto `main` at `9b2f1dd` (PR #2, the Apple Pay association file).

> **Rebase notes, 2026-08-20.** This branch was cut from `ef16561` and touches
> `vercel.json` (adding the `/legal` → `/disclaimer` redirect), so it had to be rebased
> twice as the Apple Pay work landed underneath it.
>
> - **PR #1 (`c958f84`)** added a `rewrites` proxy to Whop's hosted copy of the
>   association file. Rebased onto it and preserved the block.
> - **PR #2 (`9b2f1dd`)** then **removed that rewrite** — it failed Whop's verification.
>   Whop's origin serves the file with no `Content-Type` at all, and Vercel's external
>   rewrite passes the upstream response through verbatim, so liftoffr.com returned the
>   correct 228 bytes with no content type, which Whop's verifier rejects. The fix was to
>   commit the real file at `.well-known/apple-developer-merchantid-domain-association`
>   and pin `Content-Type: application/octet-stream` via a `headers` block.
>
> Rebased again onto PR #2. The rewrite is **deliberately not carried forward** — a static
> file takes precedence over a rewrite in Vercel's routing order, so resurrecting it
> would be dead config contradicting the file. Verified after the rebase that the
> `headers` block and the 228-byte file (sha256 `5d3b5ece…4def4c`) are intact, that no
> apple-pay `rewrites` entry exists, that the `/legal` redirect survived, and that the
> only delta between this branch pre- and post-rebase is those two upstream changes —
> nothing here was lost. The `CLAUDE.md` guard was rewritten to describe the current
> two-part mechanism; the earlier version of that note described the failed rewrite and
> would have told a future session to restore it.

---

## 1. The three fabricated signals — fixed, and where they actually came from

The homepage and `/links` presented three dated "signals" that do not exist in the
64-row log at `/receipts`:

| Claimed | Reality from the log |
|---|---|
| `Dec 15, 2018 — buy at $3.2K, BTC ran 21× to $69K` | Nearest crossing: **25 Nov 2018, Score 14.6, $3,947**, +102.4% at 180d. The market's actual low was 20 days later at $3,185 — the model was early and 24% high. |
| `Nov 26, 2022 — buy at $16.5K, BTC ran 7.5× to $124,824` | **No 2022 crossing after 20 Jun.** The two that did fire were $29,224 (20 May) and $20,572 (20 Jun), **−43.0%** and **−18.5%** at 180d. |
| `Dec 15, 2024 — exit at ~$104K, "the model was out before the turn"` | **16 Nov 2024, Score 85.0, $90,568**, after which BTC rose **+16.9% at 30d and +14.5% at 180d**. |

All three replaced with the real rows, including what they cost. "Out before the turn"
replaced with all six exit-threshold crossings between Nov 2024 and Oct 2025 — the
model left the exit zone on 21 Oct 2025, **fifteen days after the top**.

**One correction to the audit.** It concluded these figures were "lifted from your own
indicator table." They were not — they come from the **`tradesData` array on
`/track-record`**, which is a *different backtest*: a $50/wk DCA simulation from Jan
2017 running a tiered ladder, whose trade dates are tranche dates rather than
zone-crossing dates. It contains `2018-12-15 @ $3,185.07`, `2022-11-26 @ $16,448.64`
and `2024-12-15 @ $104,551.37` exactly. The homepage took ladder trades and labelled
them as Score signals. That is still wrong, but it is a labelling failure between two
real datasets, not invention — and it means the fix is to keep both and say which is
which, which is what `/track-record` now does.

**Found while in there:** that same `tradesData` payload shipped `amount`,
`btc_after` and `cash_after` fields to the browser. Nothing on the page read them, but
they carried the banned portfolio-value figures — including the **$1.88M** terminal
balance — straight past the sitewide income-claim sweep, visible in view-source.
Stripped.

## 2. Eight indicators vs the nine in the code

`api/cycle-score.js` weights nine: RHODL 20, Puell 20, Trolololo 15, MVRV 15,
PiCycle 10, 2YMA 5, ReserveRisk 5, Woobull 5, RUPL 5. The FAQ, meta descriptions,
`/about`, `/system`, `/blog` (all nine posts), `/indicator-history`, `/proof`,
`llms.txt`, `site.webmanifest`, the welcome emails and the weekly Score email all said
eight, including Fear & Greed and Google Trends — **which carry zero weight**. Anyone
who tried to recompute the Score from the FAQ could not have.

Every surface now states the real nine. The three zero-weight indicators the site
writes about (CBBI, Fear & Greed, Google Trends) are labelled as context, and CBBI is
labelled as what it is: the upstream data source, not a component.

## 3. The Score, surfaced

- `/indicators` promoted to a permanent nav item at every breakpoint (Track Record and
  Blog collapse on mobile instead).
- The homepage now renders **the full weight-by-reading arithmetic live** from
  `/api/cycle-score`, with the independent recomputation (34.35 vs published 34.4)
  stated on the page.
- A component returning zero is labelled as a dead upstream feed rather than silently
  averaged in — **Woobull Top Cap is currently returning a hard 0 from the live API
  while `/indicators` displays 24.** That is an ops bug, not a copy bug; see open items.
- The nine weights are also published in the FAQ, on `/plan`, and in `llms.txt`.

## 4. Proof pages reconciled

**`/proof`** was rebuilt, not removed. Its math table credited three of four exits to a
Pi Cycle cross — the one indicator the page exists to argue against — quoted a
"51–83% drawdown avoided" range whose low end the hero silently dropped, and had no row
for 2025 at all. It now lists **all ten exit-zone crossings** from `/receipts` with
Score, price and the +30/+90/+180d move. Six of ten were followed by a lower price at
180 days; four were not, and the page says so. The 2025 case no longer argues that
Fear & Greed and Google Trends "missed" — they carry zero weight and could not have.
A dated correction notice sits in the hero rather than a silent edit.

**`/indicator-history`**: the 2017 Fear & Greed row read "~95, extreme greed throughout
December 2017." The index launched 1 Feb 2018, and the same page correctly marks 2013
as not tracked two rows above. Corrected to N/A. A banner now names which tabulated
indicators carry zero weight and **which weighted components have no history published
here at all** — RHODL (20%), Reserve Risk, Woobull and RUPL, 35% of the Score between
them. The gap is stated rather than papered over.

**`/track-record`**: now says explicitly that there are two different backtests and
which is which — the 64-crossing signal log (Sep 2011 → Nov 2025) and the 489-week
$50/wk DCA simulation (Jan 2017 → today, 14 tiered trades). The simulation starts in
2017 so it does not cover the 2013 turn; the log does.

**`/receipts`**: header claimed coverage to Jul 2026 against a last row of 30 Nov 2025.
The hardcoded "Score today: 31.1" now renders live — five surfaces were publishing
different current values on the same day. The directional hit-rate table (**21/46 at
30d, 21/46 at 90d, 25/46 at 180d**) now sits above the log, with the reasoning, and is
explicitly not called a win rate.

All eight readings where `/proof` contradicted `/indicator-history` are aligned to
`/indicator-history`. Three different 2013 peak prices were live; one basis now applies
everywhere, with intraday extremes and CBBI daily closes distinguished.

## 5. Copy, per the plan's Part 4

`/plan` rewritten to the Part 4.5 structure in Torin's voice — new H1 built on the
whipsaw, exact checkout total ($30.45) on the button, the exit ladder / whipsaw rule /
recompute sheet added to what's inside, a verifiability block publishing all nine
weights **and the near-coin-flip hit rate on the same page as the pitch**, the two
missing objections, and a "what this is not" block.

**Product NOT renamed.** The plan proposes "The Exit Plan"; the Whop listing still
reads "My Bear Market Buy Plan." Renaming one without the other creates a fresh
contradiction at the checkout. Torin's call, and it needs the Whop edit in the same
sitting.

"When a tier fires you get the alert" → "you get the revised document." A timely,
instrument-specific message to a paid subscriber is the line between publishing and
advising and no disclaimer cures crossing it.

New, drafted but deliberately **not wired and not sent**: `emails/BUYER_SEQUENCE.md`
(the five-email post-purchase sequence that doesn't exist yet, no pitch before Day 7)
and `emails/BROADCASTS.md` (the corrections email, the Sunday Score template, and the
Discord description rewrite). Both are `.md`, so `.vercelignore` keeps them off the
public site.

## 6. Compliance, per Part 6

- **New `/disclaimer`.** `/disclaimer` and `/legal` returned 404 while the site made
  performance claims on nine other pages. `/legal` now redirects to it.
- **Cookie consent.** GA4, GTM and Clarity fired unconditionally on every page with no
  consent surface, and Clarity records session replays. Consent Mode v2 defaults now
  run inline before the Google tags on all 44 pages, every unconditional Clarity tag is
  gone, and `js/consent.js` renders the banner. Decline and Accept are the same size.
- **Entity.** "LiftOffr LLC" appeared on no surface at all despite the LLC being filed
  17 Aug 2026. Now on `/terms`, `/privacy`, `/disclaimer`, the sitewide footer and
  every outbound email.
- **`/terms` §9** was unenforceable — no state, no venue. Now Montana law, Missoula
  County venue, small-claims preserved.
- **CCPA/CPRA** section added to `/privacy`. GDPR was addressed; California was not.
- **18+** on `/terms`, `/disclaimer`, the sitewide footer, and above the fold on the
  homepage and `/plan`.
- **Email footers** now carry the full disclosure via `api/_disclosure.js` (shared,
  underscore-prefixed, does not count against the 12-function cap).
- `/about`: the car paragraph and the Corvette polaroid are gone — the FTC's 7 Aug 2026
  alert opens by naming exactly that pairing. "I locked his HiveOS access for leverage"
  softened: dispute kept, boast cut.
- The unevidenced **"I DCA'd out Oct 6, 2025 at $124,824"** is gone from `/about`,
  `/plan` and the D7 nurture email. It existed in two mutually incompatible versions
  and had no evidence, on a site whose footer says every dated signal is a backtest.
- **"208 members on Whop"** removed from the homepage, `/plan` and `/playbook`. Whop
  shows 350 records, every one $0.00 lifetime spend, joined in a six-day clipper
  window. The `/playbook` card invited readers to "check them yourself."
- **"4M+ views"** removed; replaced with IG's own dated 90-day figure (2.3M).
- Refund policy reconciled to one description (it was described four ways).

## 9. Second pass — capture, newsletter and the buyer sequence

**The homepage had no email field at all.** The only two capture points on the whole
site were `/free` and `/quiz`, both of which require navigating to them. 90 days of
data: 2.3M views, 344 sessions, ~8 captures. Added a capture immediately after the
recompute-it-yourself arithmetic — the highest-credibility moment on the page, where
the reader has just been handed the formula and told to check it. Posts to
`/api/subscribe` with the `buyzone` magnet (the only one whose PDF still exists) and
fires the same GA4 events as `/free`, so both report into one funnel.

**The zone commentary was giving instructions.** One function in `api/cycle-score.js`
feeds the weekly email, the homepage Score widget, `/cycle` and the Discord bot, and it
was returning *"Tier-A V7 exits warranted"*, *"let it run"*, *"Continue weekly DCA"*.
Those are advice, aimed at subscribers, in a paid-adjacent channel — the exact line the
audit's Part 6.5 says no disclaimer cures. Rewritten to describe what each band **has
historically meant**, in the past tense, with the unflattering cases named (the six
crossings, the 2022 signals still underwater at 180 days). A banned-word list is in the
comment above the function.

**The Sunday Score email** now carries what the audit's standing template asks for: the
three components actually carrying the number this week as `weight × reading`, the
recompute link, and the receipts link. "What moved it" is rendered as top contributors
rather than a week-over-week delta because the endpoint does not return week-ago
component values, and inventing a delta would have been worse than publishing a true
one. Verified by rendering both the HTML and text parts.

**Buyer sequence — the audit was wrong that it doesn't exist.** `api/cron-welcome-followups.js`
already has a six-email post-purchase sequence (D0/1/3/7/14/21), dormant until
`RESEND_PLAN_AUDIENCE_ID` is set. It is more complete than the five-email one the audit
proposed. Two real defects fixed instead:
  - **D3 opened the System pitch**, which broke the rule the file's own header comment
    states. The first mention of anything paid now sits at D7. Verified programmatically:
    D0, D1 and D3 contain no pitch; D7 does.
  - **The whipsaw email didn't exist.** D3 is now the six exit-threshold crossings
    between Nov 2024 and Oct 2025, told on day three rather than left to be discovered.
    It is the single most trust-building thing in the sequence and it costs nothing.

**Eight-indicator sweep, completed.** The earlier pass missed the pillar blog post's
title, H1, H2, OG/Twitter titles and JSON-LD headline, plus "eight-indicator framework"
in nine cross-link blocks. All gone; verified zero remaining across every HTML, JS, txt
and webmanifest file outside the two dead redirected pages, which are marked.

Also fixed: `/terms` and `/disclaimer` were rendering a literal
`[MONTANA REGISTERED ADDRESS — TO BE FILLED IN]` to visitors. Both now omit the line and
carry a build-time comment, matching how the email footer already degrades.

---

# Open items — deliberately not done

**1. Payment / checkout configuration.** Untouched by instruction. The Whop Apple Pay
fix, the 60 incomplete iOS checkouts and any pricing value are Torin's. No file under
`api/whop-webhook.js`, no plan ID and no price was changed.

**2. The Lamborghini photography.** The car *paragraph* is gone; the *images* are not.
Every founder photo in `/img` is a car shot — `torin-founder.jpg` (Lambo interior) is
the author photo on seven pages and both OG images, and `torin-hero-bg.jpg` is the
homepage hero background. Pointing at replacement files that don't exist would 404 on
the highest-trust pages. **This needs one photo shoot — desk, rig, screen, uniform —
and it clears the exposure sitewide.** Flagged in a loud comment in `about/index.html`.

**3. The Montana address.** `[MONTANA REGISTERED ADDRESS — TO BE FILLED IN]` appears in
`/terms` and `/disclaimer`, and `LIFTOFFR_MAILING_ADDRESS` is unset in Vercel. The
email footer omits the address line rather than shipping a placeholder, **which means
the emails are still not CAN-SPAM compliant until that env var is set.** Smallest item
on this list.

**4. The Discord server description.** Highest-severity single string across all
properties — a specific "$250K by 23" income claim plus "portfolio reviews" in a free
channel aimed at an audience that is 46.7% aged 18–24. It lives in Discord settings,
not this repo, and changing it publishes. Replacement text is in
`emails/BROADCASTS.md`.

**5. Quiz emails 2–7.** Still dormant, still gated on four Resend audience IDs and four
Vercel env vars. Untouched — that is a credentials task, and the repo's own checklist
already calls it the highest-value thing available.

**6. The Woobull dead feed.** `/api/cycle-score` returns a hard `0` for Woobull Top Cap
while `/indicators` displays 24. A zero on a 5%-weighted component drags the Score
down. The homepage now *labels* it rather than hiding it, but **the feed itself is not
fixed** — that needs someone to look at the upstream CBBI key.

**7. Surfaces outside this repo.** The Whop listing copy (still "My Bear Market Buy
Plan", still "3M+ views", still the DCA claim), the Instagram bio (promises a "free
market cycle checklist"; `/checklist` redirects to a quiz), and the Whop storefront
meta. All need the same edits; none are files here.

**8. The homepage live-logging promise.** *"From here forward, signals go out in the
daily brief as they fire, timestamped."* Left exactly as written — the previous pass
flagged it for Torin's decision and nothing in this audit changes that.

**9. The retired trial nurture emails.** `api/cron-welcome-followups.js` still contains
four trial emails selling Core/Pro/Elite subscriptions with "real-time signal alerts."
They are hard-disabled regardless of env and cannot fire. Left alone rather than risk
the live sequence — but if they are ever re-enabled, the alerts language has to go
first.

**10. Product rename to "The Exit Plan."** See §5. Needs the Whop change in the same
sitting or it becomes a new contradiction.

---

## Before this ships

1. Read the diff. Five commits, roughly 60 files.
2. The corrections broadcast in `emails/BROADCASTS.md` should go out **after** these
   changes are live, not before — every claim in it is checkable on arrival and that is
   the entire point of sending it.
3. Set `LIFTOFFR_MAILING_ADDRESS` and fill the two address placeholders before any
   email sends.
