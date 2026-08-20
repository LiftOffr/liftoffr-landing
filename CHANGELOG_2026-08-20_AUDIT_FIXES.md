# 2026-08-20 — Audit remediation pass

Branch: `audit-fixes-2026-08-20`. **Nothing deployed, nothing pushed, nothing sent.**
Six commits, rebased onto `main` at `c958f848` (PR #1, the Apple Pay merchant domain
association rewrite).

> **Rebase note, 2026-08-20.** This branch was originally cut from `ef16561`, before PR
> #1 merged. It touches `vercel.json` (adding the `/legal` → `/disclaimer` redirect),
> and the pre-merge version of that file contains no Apple Pay rewrite — so merging the
> branch as it stood would have silently reverted it and broken Apple verification.
> Rebased onto current `main` instead. The two changes live in different arrays
> (`rewrites` vs `redirects`) and merged without conflict; the Apple Pay block is
> byte-identical to `main` and was verified as such, and the only delta introduced by
> the rebase is that block being gained — nothing of this branch's work was lost.
> A guard is now in `CLAUDE.md` so a future session does not repeat the near-miss.

Source: the overnight *LiftOffr 30-Day Profitability Plan* (19–20 Aug 2026), Parts 3,
4 and 6. Where the audit and this repo's own data disagreed, the repo's data won.

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
