# 2026-08-16 — Applying the competitive research findings

Source: `~/Documents/LiftOffr-Competitive-Intel/03-liftoffr-rebuild/`. Branch
`research-findings-2026-08-16`. **Not deployed, not pushed.** No Whop / ManyChat / Resend
config touched; no pricing values changed.

Three passes, in the order the research prioritises them: the contradiction, the compliance
sweep, then the copy rewrites.

---

## 1. The contradiction — every page now tells the same story

`/receipts` says all 64 rows are model-backtest reconstructions with zero logged live. Pages
elsewhere implied contemporaneous calls. Fixed at every remaining site:

| Page | Was | Now |
|---|---|---|
| `/plan` proof strip | "Every call timestamped" | "64 zone changes · Backtest, labelled — 29 went wrong" |
| `/plan` objection block | "every call I've made is timestamped on the receipts page" | The full replacement from `02-plan-page-rewrite.md`: read the label, everything before today is the model run against history, a formula tested against its own design history flatters itself, live logging starts now |
| `/plan` price-block link | "every zone cross, timestamped" | "every zone cross, labelled backtest or live" |
| `/` FAQ | "Are these real-time calls or a backtest?" | Rewritten as "Can I verify your past calls?" per `01-homepage-rewrite.md` §10, ending on *"Don't let anyone, including me, show you a backtest and call it a track record."* |
| `/` exit-intent modal | Four-cycle "✓ Signals landed within N days" claim list | Replaced entirely with the free offer. The checkmark-plus-claim construction was the element most directly contradicted by `/receipts` |
| `/404` | "Every call, timestamped — including the misses" | "All 64 zone changes — backtest, labelled, misses included" |
| `/proof` hero | "On-chain data doesn't lie." | "All of it run after the fact." |
| `/proof` stat row | "**0** Backtested False Top Signals" | "**29 of 64** Signals That Went The Wrong Way" — a zero-false-signal stat is a perfect-record claim and contradicts the receipts log |
| `/proof` case badges | "✓ Composite flagged", "✓ Top zone flagged" | "Composite reached the top zone", "Top zone reached" |
| `/indicator-history` | "Called the exact day of the cycle top" | "Crossed on the day of the cycle top" |
| `/lead-magnet/checklist` | "It called 2013, 2017, and 2021", "It nailed 2013…" | Backtest-anchored wording |
| blog ×7 | "Pi Cycle Top — Called the top within 3 days…" | "Crossed within 3 days of the top…" — same verifiable fact about a public third-party indicator, no ambiguity about who made a call |

**`/receipts` now states the live-log start date explicitly** (Aug 16, 2026) so the promise the
homepage and `/plan` make resolves on the page they send the reader to. This is the one item
that needs Torin's follow-through rather than a code change — see Open items.

---

## 2. Compliance sweep

### The `$1.88M` figure — removed everywhere except the methodology page

Per `05-offer-critique.md` §5, using its rewrite:

- **`/` hero proof card** — `$50→$1.88M` and `+7,602%` replaced with **64 / 29** (scored zone
  changes, and how many went the wrong way), linking to `/receipts` instead of `/track-record`.
- **`/` proof bar** — `+7,602% Backtested ROI` and `4M+ Content Views` replaced with the four
  checkable facts from `01-homepage-rewrite.md` §2: 15 years, 64, Free, 30-Day.
- **`/` pricing section** — the `+7,602% backtested vs DCA` strip replaced with a full-size
  guarantee block (prioritized action #7).
- **`/playbook` hero** — the exact replacement sentence from the offer critique: "using the same
  nine-indicator framework the whole site runs on — the one whose full record, including 29
  signals that went the wrong way, is public at /receipts."
- **`/playbook` proof block** — headline number changed from `$1.88M` to `64`.
- **`/playbook` twitter:description** — "the framework that backtested to $1.88M" removed.
- **`/buyzone`, `/checklist`** — `+7,602% Backtested ROI` cell → `64 / scored zone changes,
  losses shown`; substantiation line rewritten.
- **`/about`** — the "$50/week … = $1.88M" sentence replaced with a pointer to the methodology
  and the losses.
- **`/track-record`** — H1, `<title>`, meta description, `og:title` and `twitter:title` all
  de-headlined. The figure stays in the body because this is the methodology page, wrapped in
  the offer critique's "What the backtest is, plainly" block: it's retroactive, it flatters
  itself, it is not a prediction.

HTML comments sit at each removal site warning against reinstating a currency or ROI figure.

### Also removed under the same rule (not named in the research, same shape)

- **`/track-record` "Run the numbers for yourself" tier table** — projected `~$376,638` to
  `~$7,532,776` against "lifestyle equivalent" contribution levels ($10/wk = "a daily coffee").
  A personalised projection of what a reader could have is the single strongest income-claim
  shape that was on the site — structurally the WealthPress / DK Automation pattern. Deleted.
- **`/blog/mvrv-ratio-bitcoin-indicator`** — "1,200%+ returns", "400%+ returns", "300–500%
  returns if history repeats", and **"This strategy has never failed in a Bitcoin cycle."**
  Rewritten into a mechanism explanation with two explicit limitations (retroactive rules
  overfit; four cycles is a small sample). Also "Ready to Stop Guessing and Start Winning?" and
  "Join 60+ traders who are timing Bitcoin cycles with precision."
- **`/blog` index** — "the indicators and strategies that 60+ traders use" (unverified member
  count) → a description of the content.
- **`4M+ views` / `4M+ readers`** across `/plan`, `/free`, `/buyzone`, `/checklist`,
  `/welcome-plan`, `/links` → "15 years of public indicator history". Vanity metric, per
  `01-homepage-rewrite.md`.
- **`/playbook` testimonials** — two unattributed "— LiftOffr member" quotes pulled
  (16 CFR 255.2). **Original wording, for restoration:**
  > "I used to ride everything up and then all the way back down. Having an actual exit plan —
  > written, mechanical, decided ahead of time — is the thing I never had." — LiftOffr member

  > "The daily read reset how I think about the cycle. Knowing when to accumulate and when to
  > take profit instead of guessing is worth every penny." — LiftOffr member

  To restore: get the member's name and written permission on file, then reinstate verbatim
  with a typical-results disclosure. The slot was not backfilled with a fabricated stand-in —
  one card points at the record, the other says plainly that there are no testimonials yet.
- **`/` FAQ** — "If it saves you from one $5k panic-sell, it's paid for the next 8 years" — an
  implied savings figure. Cut.

### The "1:1" naming (prioritized action #10)

Renamed to "private session" / "Cycle Playbook — Private Session" in every visible string and
indexed meta across `/playbook`, `/plan`, `/system`, `/links`, `/faq`, `/terms`,
`/welcome-plan`, `/`. **Product, price, Whop plan ID and URL are unchanged** — this is a label
change only. Still needs the counsel review the research asks for; renaming was the
lower-risk direction to sit in while that happens.

---

## 3. Copy rewrites

### Homepage — `01-homepage-rewrite.md`

- **§0 qualifier bar** — replaced the old "$29, once" qualifier strip with
  *"For people who own Bitcoin, have a job, and don't want to watch charts all day."*
- **§1 hero — Variant A, "The Decision"**, chosen over B and C. Reasoning: B ("The Confession")
  is stronger but only for traffic where Torin is already the draw, and the current cold source
  is Explore-page lifestyle traffic that doesn't know him; C is the SEO-safe B-side with the
  weakest emotional pull. A names a problem in the reader's own language without requiring any
  crypto vocabulary, which is the specific failure mode of the old hero
  ("8 on-chain indicators…" to someone who has named no Bitcoin problem).
- **Hero CTA is now free** (`/cycle`), single, no pricing above the fold — the "no operator
  sells to cold traffic" finding. The $29 path is intact in the nav, the pricing section, and
  the sticky bar, so no revenue route was removed.
- **§2 proof strip** — four checkable facts, no performance figure.
- **§6 proof, expanded** — the honest rebuild, near-verbatim from the research: what the model
  has and hasn't done, "every one of those 64 is a backtest", "what is a live record starts now".
- **§7 free-substitute objection added** — names CBBI, LookIntoBitcoin and Bitbo, concedes them
  fully, states the defensible position (*the verdict, not the number*).
- **FAQ** — "Do you make money if I lose money?" added.
- **og:title / twitter:title** — "Know exactly when to sell your Bitcoin — before everyone else
  does" was a certainty claim; replaced with the hero line.

### `/plan` — `02-plan-page-rewrite.md`

- **Hero — Variant A, "The Document"** (the research's own recommendation): *"This is the
  document I open when Bitcoin drops and I want to do something stupid."* Leads with the job
  the product does instead of "nine buy tiers", which is a noun a cold reader has to decode.
- **Qualifier line** added above the hero.
- **Objection block moved above the price box** (action #17) — it's the best copy on the site
  and sat below the fold on mobile.
- **"What if the levels never get hit?" objection added** (action #18) — the most likely refund
  reason, previously unaddressed.
- **Guarantee enlarged** to a full block at the same weight as the price (action #7).
- **Disclaimer** — added the sentence the compliance memo asks for: *"Alerts tell you when a
  level in my published plan fires. They are notifications of what I'm doing with my own money,
  not instructions for you."*
- Everything the research said to keep is untouched: the "probably a scam" answer, "if $29 is a
  meaningful amount of money right now, don't spend it here", "I will never tell you what
  you'll make", "This is not a course", the exact-total transparency, the $29 credit.

### Consistency fix (action #16)

`/playbook` said the $30K round-trip was **2022**; `/`, `/plan` and `/about` say **2021**.
Changed `/playbook` to 2021 — three pages against one, and `/about` tells the story in detail.
**Confirm 2021 is the true year** before this ships.

---

## Judgment calls Torin should overrule if he disagrees

1. **The homepage hero CTA is now free rather than $29.** This is the research's central
   recommendation and the biggest behavioural change in this branch. The paid CTA survives in
   the nav and pricing section, so nothing is unreachable — but the first ask a cold visitor
   sees is now free. Reversible in one edit if you want the $29 back above the fold.
2. **`/track-record` keeps the $1.88M figure in its body.** The research explicitly allows this
   on the methodology page, wrapped in the "plainly" framing. Everywhere else it is gone. If the
   rule is zero occurrences sitewide, say so and it comes out of the body too.
3. **The tier projection table was deleted rather than disclaimed.** Not named in the research;
   removed under Torin's own no-income-claims rule because it is the same shape, aimed harder.
4. **"1:1" renamed before counsel signed off.** Label only. Reverting is one find-and-replace.
5. **Blog "Pi Cycle called the top" wording changed** even though it describes a public
   third-party indicator, not a LiftOffr call. Kept the fact, removed the ambiguity.

## Not done — deliberately out of scope for this branch

- **The 6-question cycle-position quiz (action #3, the highest-impact item).** It needs a new
  page, a ManyChat keyword, list segmentation and a Resend sequence — all live config this
  branch is barred from touching. The homepage and `/plan` still point at the two existing
  competing lead magnets. This is the single largest remaining gap.
- **The 7-email sequence (#11)**, the on-camera CTA rule (#4), indexing `/system` (#8, gated on
  the Sep 7 founding window), the order bump (#14), review collection (#7), proof-page
  consolidation (#15), and both pricing tests (#23, #24 — the research defers these until
  after the first ten `/system` buyers).
- **Starting the live log (#5).** `/receipts` now publishes the commitment and the date. The
  daily discipline is Torin's, not a code change.
