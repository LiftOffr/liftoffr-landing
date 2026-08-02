# LIFTOFFR MASTER PLAN — 2026-08-02

**This document supersedes** `STRATEGY_REDESIGN_2026-08.md` (the teardown) and `PIVOT_DECISION_2026-08-02.md` (the pivot decision), plus MONEY_WEEKEND_KIT.md and CONVERSION_OVERHAUL_KIT.md priorities. Feed this to any future session as the single source of truth. Where the two source docs conflicted, the rulings in Section 2 are final — do not relitigate.

*Amended 2026-08-02 after Torin's review (edited inline, not appended): founding window soft-opens to plan buyers in week 2 (Aug 24 = warm-list announcement only); Whop review is a soft ask everywhere, never a condition; `/free` added to the week-1 build block; compliance framing + securities-attorney trigger restored.*

---

## 0. SECURITY ROTATION STATUS (executed 2026-08-02, this session)

**DONE — verified live:**
- **DASHBOARD_PASSWORD**: rotated in Vercel production (40-char random hex), site redeployed (commit `f3b180b`), verified: new password → HTTP 200 on `/api/analytics`, wrong password → 401. New value stored at `~/.openclaw/secrets/dashboard.env` (chmod 600). Update any saved curl aliases.

**BLOCKED — needs Torin (session permission classifier denied credential-generation commands; these are web-UI operations anyway):**
1. **GitHub PAT** (classic `ghp_…`, embedded in `~/liftoffr-landing/.git/config` remote URL; also used by youtube_intel.py's hourly push through the same checkout — one location total). Steps: (a) github.com → Settings → Developer settings → create a new fine-grained PAT scoped to `LiftOffr/liftoffr-landing`, contents read/write only; (b) `git -C ~/liftoffr-landing remote set-url origin https://x-access-token:<NEW_PAT>@github.com/LiftOffr/liftoffr-landing.git`; (c) `git -C ~/liftoffr-landing push origin main` to test; (d) revoke the old PAT in the same UI; (e) after the next youtube-intel hour, confirm origin/main advanced. (Better long-term: an SSH deploy key per the Jul 26 handoff, but keygen was blocked this session.)
2. **GCP service-account key** (`~/.openclaw/secrets/liftoffr-6a17fe1803f7.json`): console.cloud.google.com → IAM → Service Accounts → create new key, download to same path/filename, delete old key ID. Used by `discord-rebuild/src/dashboard.py` GA4 pull.
3. **Kalshi RSA keys** (`~/.openclaw/secrets/LiftOffr-rsa-key.txt` + `~/Documents/kalshi-btc-bot/LiftOffr.pem`): Kalshi web UI → API keys → revoke both. Kalshi project is CONCLUDED — revoke, don't replace, unless S4 paper validation still needs one (it reads market data only).

---

## 1. DECISIONS LOCKED (do not reopen)

1. **The $49/$99/$249 subscription tiers are dead.** The pivot doc never rebutted the teardown's month-3 autopsy (recurring deliverable = eight cron jobs; billing monthly against a biennial payoff), and its own benchmark (87.8% of Whop products earn $0; Maurits Neo: 7 paying members on 400K followers) supports the kill. Existing payers grandfathered per Section 7.
2. **The offer ladder:** FREE (open Discord + live Score + /receipts) → **$29 one-time buy plan** (cold-traffic front end) → **$197 The Cycle System** (founding $147, 50 seats; purchasable by plan buyers the moment the System exists in week 2, warm-list announcement Aug 24; offered to $29 buyers + warm email ONLY — never the first ask to cold traffic) → **$997 The Cycle Playbook 1:1** (cap 4/month).
3. **Rent-the-reach** (brand deals + hardware-wallet affiliate) is its own parallel revenue line, not a fallback.
4. **Content strategy is the pivot doc's:** hybrid same-video reels — car hook + money payoff in ONE asset — keyword CTA → the $29 page.

Ground truth baseline (from the pivot audit, do not soften): real MRR $0; 90-day funnel 1.3M views → 170 sessions (0.013%) → 8 emails → 0 trials → $0; 72 Discord members, 56 comped; ~2 checkouts/month historical; the break is views→site, caused by lifestyle-audience mismatch with a technical assist.

---

## 2. CONFLICT RESOLUTIONS (every open contradiction, ruled)

| # | Conflict | Teardown said | Pivot said | RULING |
|---|---|---|---|---|
| 1 | Membership | Kill entirely | Keep $49/$99/$249 as backend | **Kill** (Decision 1). Whop tier plans + 7-day trial plan hidden from sale; existing subs handled per Section 7. |
| 2 | Front-end offer | $197 System is the paid entry | $29 product is the paid entry | **Both, sequenced**: $29 is the ONLY paid ask cold traffic ever sees. $197 exists solely as upsell to $29 buyers + warm email. |
| 3 | `/start` destination | Free community + Score email | Currently 307 → trial plan; demote trial | **`/start` → `/plan` (the $29 sales page).** One-line edit in vercel.json. The trial is retired week 1, not demoted. `/free` becomes the free onramp (Discord invite + Score email capture), linked as the visible no-cost door on every $29 surface. |
| 4 | Homepage | Live Score + receipts + two offers ($197/$997) | (silent — kept tier grid) | Live Score + receipts + **$29 primary CTA** + free community secondary. Tier grid, trial CTAs, annual toggle deleted. System gets its own page (`/system`), linked from nav/footer, never the hero ask. `/playbook` stays noindex, linked from /system + warm email only. |
| 5 | IG keywords | Retire TRIAL; PLAN → free plan + community invite | Keyword CTA → $29 page | **TRIAL retired. PLAN → $29 page** (Decision 4 overrides teardown). SCORE → free Score email capture. CHECKLIST → stays free lead magnet. Delivery via public comment reply + bio link now; private DM only after Meta approves `instagram_manage_messages`. |
| 6 | Email sequences | Retire trial sequence; welcome re-aimed at System founding window | Announce $29 to list | **Trial nurture (D1/3/6) retired** (never activated — leave `RESEND_TRIAL_AUDIENCE_ID` unset, remove the code path when convenient). **Free-capture welcome (D0/1/3/5/7/18) re-aimed at the $29 plan** (cold captures are lifestyle emails; $29 is the right ask). **New plan-buyer sequence** (Section 5) carries the $147/$197 upsell. **Founding-window campaign goes to the warm list only.** Sunday Score unchanged. |
| 7 | Founding-window promotion | Announce to email, members, AND IG | (n/a) | **Warm email + Discord + plan-buyer sequence only** (Decision 2 overrides: never the first ask to cold traffic). IG keeps carrying the $29. Banger receipts content on IG sells the $29, not the $147. |
| 7b | Founding-window go-live vs the plan-buyer D3 email | Window "opens" week 4 | (n/a — D3 email would otherwise pitch something unpurchasable) | **The $147 founding plan goes live the moment the System is built in week 2** — the welcome-plan bridge and D3+ emails point at a working checkout from day one (soft open; hottest buyers get first crack). **Aug 24 is the warm-list ANNOUNCEMENT, not the go-live.** Close date Sep 7 applies to everyone. |
| 14 | Whop review tied to founding price | "Review-conditioned" founding seats | (n/a) | **Review is a soft ask everywhere, NEVER a condition.** Conditioning a discount on a review is incentivized-review territory (FTC guidance + platform review policies) and off-brand for a receipts-only moat. The ask lives in the D7 plan-buyer email, the grandfather announcement, and post-purchase — always optional, never tied to price. The launch-email phrasing ("one honest ask, not a condition") is canonical. |
| 8 | Discord gating | Free layer public, invites open; @System gates course + #signals | Keep tier gating as backend | **Teardown wins.** Free/public: daily-market-brief, weekly Score, CBBI/Pi-Cycle, macro-watch, general, wins. New role **@Plan** ($29 buyers) → #plan-updates; grandfathered paid roles (Pro/Elite/LiftOffr Life/Founding Circle) RETAIN view access to #plan-updates — part of the "you lose nothing" migration promise (advisor ruling 2026-08-02; channel overwrites already reflect this). **@System** ($197 buyers + all grandfathered paid + Founding Circle) → course channels + #signals. Elite lounge archived (never delete channels — archive/rename per repo rule). |
| 9 | Gem-radar & Cowen-summary channels | Gem-radar dies as paid bullet (liability); Cowen summary → free or kill | (silent) | Gem-radar removed from every paid bullet and sales page. Cowen intel moves to the free layer as macro-watch content, with attribution. |
| 10 | Playbook price/copy | $997, pure 1:1, kill "live cohort" + "three calls" leftovers | (silent — $497 verified live) | **$997** (Decision 2). pricing.md cohort copy and the three-calls bullet die in the week-2 rewrite. Whop plan repriced. |
| 11 | Pricing pages generally | Collapse to two offers | 7 checkout links verified working, keep | Working links ≠ keep. All tier/trial/annual checkout paths removed from site copy in week 3. WHOP_ANNUAL_COPY.md and pricing.md are historical artifacts — mark superseded. |
| 12 | Kill criteria | Day-60 System/Playbook thresholds + asymmetric signals | Day-30 $29 cold-sales gate | **Both, layered** — Section 6. Day 0 = Aug 3. |
| 13 | DM bridge priority | (n/a) | App Review = background paperwork only | Agreed: submit week 1, forget until approved. Public-reply + bio link carry the keyword funnel meanwhile. |

---

## 3. THE 30-DAY CALENDAR (Aug 3 – Sep 1; evenings only; no new filming before ~Aug 15)

Two parallel tracks in weeks 1–2: **Track A = pivot punch list + $29 launch** (build work), **Track B = membership teardown + Discord restructure** (mostly announcements + Whop config). No double-booked evenings.

### Week 1 (Sun Aug 3 – Sat Aug 9)
- **Aug 3 (A):** Fix `data/drive_buffer.lock` (dead PID 9155) + add PID-liveness check at `drive_to_buffer.py:461` (0.5h). Refill the Drive reel queue — empty since Aug 1 (content selection from approved library). Strip "we'll DM you" from the unpublished `~/liftoffr-reels/REVIEW/2026-07-27` batch (0.5h).
- **Aug 4 (A):** Submit Meta App Review for `instagram_manage_messages` (text was staged Jul 26; 2h, then background). Optional if time: local GA4 service-account fix in `dashboard.py`.
- **Aug 5 (Torin):** Finish the three blocked key rotations (Section 0).
- **Aug 5–7 (A):** **Build the $29 product** (Section 4 spec): assemble the PDF/gated doc, create the Whop one-time $29 plan, build `/plan` sales page (reuse /buyzone's design language), **`/free` (the no-cost onramp: Discord invite + Score email capture — linked from `/plan` and every $29 surface on day one)**, `/welcome-plan` success page, extend `whop-webhook.js` (@Plan role + Resend "Plan Buyers" audience + GA4 purchase event). Repoint `/start` → `/plan` in vercel.json; repoint /links primary CTA; quick CTA-label pass on homepage buttons so none say "free trial" (full homepage collapse waits for week 3). `/plan` and the doc both carry the Section 4 compliance framing + disclaimer from the first deploy.
- **Aug 8–9 (B):** **Members-first migration**: post the announcement (Section 7 copy) to all 72 via Discord #announcements + email. Execute grandfathering in Whop (cancel-at-period-end by default; opt-in to keep paying). Discord restructure phase 1: reopen invites, flip free-layer channels public, create #plan-updates + @Plan + @System roles, archive Elite lounge. The July course-optin machinery does ~90% of the role work.
- **If an evening remains:** draft brand-deal rate card + 20-target outreach list (else first thing week 2).

### Week 2 (Aug 10 – Aug 16)
- Publish the re-cut hybrid batch from the 236-clip library (money-payoff text overlays, c8dunes_v2 quality bar), keyword CTA **PLAN** → `/plan` via pinned comment + bio.
- Announce the $29 plan to warm surfaces: email list, Discord, IG stories.
- **Build The Cycle System in Whop**: one-time $197 product + $147 founding plan (50 seats). **The founding plan goes LIVE for plan buyers the moment it exists** — wire it into the welcome-plan bridge and the D3+ emails immediately (soft open; ruling 7b). Reviews: soft ask only, never a condition (ruling 14) — the 0-reviews problem gets fixed by asking well, not by paying with discounts. Restructure course channels under @System per the Section 8 content map; cut the Ethan/Olivia/Alex composites; fold assessments into buyer worksheets.
- Rewrite `/playbook`: $997, consistently 1:1, kill cohort/three-calls copy.
- **~Aug 15 (filming constraint lifts):** film hybrid batch 1 — car IS the ad, money payoff inside the same 60 seconds.
- Finish rate card + 20-target list if not done.

### Week 3 (Aug 17 – Aug 23)
- **Site collapse**: homepage → live Score + receipts + $29 primary + free secondary; delete tier grid, trial CTAs, annual toggle. Retire trial email code path; re-aim free-capture welcome sequence at the $29. IG keyword TRIAL retired.
- Post 5–10 filmed hybrid reels. Measure per-reel CTR; target any format >0.1% views→site (10x current 0.013%).
- Send brand-deal outreach (20 targets). Wire Ledger/Trezor affiliate into /links + captions (hardware wallets fit the custody brand; exchange CPAs conflict with anti-trading positioning — permanently rejected).
- Write + wire the plan-buyer upsell sequence (Section 5) into `cron-welcome-followups.js`.

### Week 4 (Aug 24 – Sep 1)
- **Founding warm-list announcement Aug 24** ($147 already live for plan buyers since week 2 — ruling 7b): 50 seats, **stated close date Sep 7 for everyone** (a written date, not a countdown timer). Promoted to warm list + Discord + plan-buyer sequence only. Launch email in Section 7. Review = soft ask, never a condition.
- Scale whichever hybrid format cleared 0.1% CTR; kill formats that didn't.
- **Sep 1: Day-30 review** against the gate (Section 6).

Ongoing/untouched: receipts-daily logger, Sunday Score email, daily brief, /receipts (never touched except linked from more places).

---

## 4. THE $29 PRODUCT — "My Bear Market Buy Plan" (content spec)

**What it is:** the productized version of Torin's actual live accumulation plan (the $165K Cowen-driven ladder — IMMEDIATE/T1/T2 already fired, live tier triggers running), packaged as a one-time $29 purchase with lifetime updates for this bear market. Sales frame: *"the exact plan I'm buying this bear market with — not a course, a plan."* No new filming required; it's a document product.

**Contents (assembled from existing assets, ~25–35 pages or gated web doc):**
1. **The exact ladder** — real trigger prices for every tier, fired tiers in real dollars (receipts), armed tiers as shares of remaining deployment. **Disclosure rule (Option B, decided 2026-08-02 with advisor sign-off): the product never states total holdings, total budget, or the BTC target — fired receipts yes, headline net-worth number never.** Worksheet uses coarse fractions, not exact percentages, so fired dollars can't be back-divided into a total. Rationale: wrench-attack salience. *(Source: the live buying-plan doc + tier-trigger infra.)*
2. **Why each level** — the trigger logic in plain English (which indicator/condition arms each tier). *(Source: buying-plan rationale; Module 4 excerpts simplified — logic only, not the full indicator curriculum.)*
3. **Build-your-own-ladder worksheet** — 30-minute fill-in: stack size → tier prices → allocation per tier → limit orders. *(Source: Module 5 ladder mechanics + Module 2 position-size caps.)*
4. **Execution mechanics** — placing the limit ladder, the DCA fallback rule if levels never hit, and the buy → hardware-wallet custody flow. *(Source: Module 5 execution + Module 6 custody, condensed.)*
5. **The receipts** — the Oct 6 2025 top exit ($124,824 anchor), fired tiers, link to /receipts.
6. **Lifetime updates for this bear** — when a tier fires or the plan recalibrates, buyers get an updated doc + an alert in **#plan-updates** (@Plan role, Discord).

**Differentiation — why free users don't convert-block and buyers don't feel scammed:**
- **Free /buyzone page + checklist**: the *framework* — the philosophy, a generic 5-level structure, no exact numbers, no updates, no alerts. Stays as email capture.
- **Free Discord feed**: the *market state* — Score, daily brief, CBBI/Pi-Cycle, macro. Tells you where the cycle is; never what to do with your cash at each price.
- **$29**: *my exact numbers, kept live* — real tiers, real allocations, what fired, what's armed next, alert channel, worksheet.
- **$197 System**: *the machine that generates plans, both directions* — the 8-indicator phase matrix, confluence score, the EXIT ladder (selling is deliberately NOT in the $29), rebalancing, custody architecture, yield filter, #signals, the full course. The $29 is one play (accumulation); the System is the whole cycle.
- Rule of thumb for future content decisions: **free = framework + market state; $29 = my live buy plan; $197 = the operating system + the exit side.** Anything that tells a stranger exactly what to buy at what price belongs at $29+; anything about selling belongs at $197.

**Compliance framing (non-negotiable — selling "my exact plan" to strangers sits closer to the investment-advice line than the old education framing):**
- The defensible position is publisher/newsletter territory: **disclosing my own actions, never advising theirs.** Every page, email, and doc section stays strictly "what I'm doing / what I did" — never "what you should do," "you should buy at," or personalized anything.
- Strong disclaimer on `/plan` AND inside the doc (not financial advice; my personal plan, published as a record; do your own research; nothing personalized to you).
- The %-of-stack template is framed as a **worksheet** ("how I'd size this if my stack were smaller"), never a recommendation or allocation advice.
- Alert copy in #plan-updates follows the same rule: "Tier 3 fired — I bought" not "buy now."
- **Trigger: the first month this business clears ~$2K revenue, book a securities-attorney consult** (offer structure + marketing claims review). Given the commission, "probably fine" is not an acceptable resting state — this line item does not get dropped again.

---

## 5. UPSELL MECHANICS — the $29 → $197 joint (where the ladder lives or dies)

**Moment of purchase (Whop):**
- $29 checkout success → redirect to **`/welcome-plan`** (same pattern as existing /welcome).
- `whop-webhook.js` on the $29 purchase event: assign Discord **@Plan** role, add buyer to Resend **"Plan Buyers"** audience, fire GA4 `purchase` (value 29, item plan).

**Live IDs (created 2026-08-02, staged on branch `plan-launch` — nothing public until Torin's skim + merge):**
- Whop $29 plan: `plan_MntgjXJaQnGsW` (one-time, HIDDEN, on prod_qkbRaW1vFT2cM; checkout https://whop.com/checkout/plan_MntgjXJaQnGsW — product creation is dashboard-only for this API key, so it lives on the main product like the Playbook plan does; Torin can move it to a dedicated product later if the checkout branding matters).
- Discord @Plan role: `1533475043110293715` (additive addon role in webhook — never stripped by tier swaps; removed only on $29 refund).
- Branch `plan-launch`: /plan, /free, /welcome-plan pages (noindex, buyzone design) + webhook addon wiring. Known: /free is shadowed by the vercel.json trial redirect until that line is removed at launch; /welcome-plan bridge block ships hidden (`#system-bridge`) until the System soft-open.
- Product doc draft: `PLAN_PRODUCT_DRAFT.md` (untracked) — Torin's skim gate, includes disclaimer draft for sign-off.
- Still needed before launch: RESEND_PLAN_AUDIENCE_ID (create audience "LiftOffr Plan Buyers" in Resend dashboard — local resend.env key is STALE/invalid, prod key is Sensitive-typed and not pullable), Whop success-redirect for the $29 plan → /welcome-plan (Whop dashboard), #plan-updates channel gated to @Plan + grandfathered paid roles per ruling 8 (built 2026-08-02), D0-D14 plan-buyer emails in cron-welcome-followups.js (week 3 per calendar).
- **Pre-merge launch test (do in this order):** (1) the two dashboard items above; (2) test-buy the $29 with single-use promo code **`plantest802`** (promo_U01jTEWB5523, 100% off, stock 1, scoped to plan_MntgjXJaQnGsW) and confirm the full chain: redirect → /welcome-plan, @Plan role lands in Discord, buyer in Resend Plan Buyers audience, GA4 purchase event; (3) merge plan-launch. Note: a $0 promo purchase may arrive as payment.succeeded with amount 0 or membership.went_valid — both traverse the purchase path; check Vercel function logs for the `[whop-webhook] addon role:` line as the ground-truth signal. Delete/exhaust the promo after the test.

**`/welcome-plan` page — three steps + one quiet bridge:**
1. Access the plan (download/gated doc).
2. Join Discord → #plan-updates (tier-fire alerts land here).
3. "Do this tonight": set your limit ladder using the worksheet.
4. **The bridge block** (single, calm, bottom of page — no popup, no timer): *"The plan tells you what I'm buying. The System is why — and when to sell. Founding price for plan buyers: $147."* One CTA → /system.

**Email sequence (Resend, Plan Buyers audience, extend `cron-welcome-followups.js`):**
- **D0** — receipt + access + "set your ladder tonight" (pure delivery, zero pitch — earns the right to pitch later).
- **D1** — execution walkthrough: limit orders, custody step, the DCA fallback rule. Still no pitch.
- **D3** — System pitch #1: the plan is a snapshot, the System is the camera. What's in it, founding $147, seat count so far. Receipts, not urgency.
- **D7** — proof + objections: /track-record, /receipts, the 2021 miss (credibility through the scar), Whop reviews as they accrue.
- **D14** — founding status note: seats taken, close date, then the standing terms below. Last dedicated ask; buyer then falls into Sunday Score.
- **Discord reinforcement:** every tier-fire alert in #plan-updates carries a one-line footer: full system + exit ladder → /system. The free layer sees the headline ("Tier 3 triggered"); #plan-updates gets the execution detail; #signals (System) gets full trade setups — a visible value gradient at every rung.

**Standing terms after the founding window closes:** $29 buyers permanently get their $29 credited — System at $168 with code PLANCREDIT. Honest, evergreen, no fake scarcity, and the ladder keeps working after Sep 7.

**Measurement:** GA4 `purchase` events split by item; upsell take rate = System purchases by Plan-Buyers audience ÷ plan buyers. **Target: 10–20% of $29 buyers take the System within 30 days.** At the day-30 target of 20 plan sales, that's 2–4 System sales — which is also the early read on the day-60 gate.

---

## 6. KILL GATES (Day 0 = Aug 3)

### Day-30 gate — Sep 1 (the pivot doc's, unchanged)
**Metric: cold-traffic (non-friend, non-list) sales of the $29 plan. Target: 20+.**
- Operationalize "cold": cross-check each Whop buyer email against Resend audiences + Discord member list; weekly manual tally (numbers are small).
- **Kill criterion:** hybrid content delivered **500K+ views** and **<5 strangers** bought a $29 product → no crypto offer rides this audience at any price. Response: full rent-the-audience mode (brand deals + affiliate as the only monetization of this account) and rebuild a finance-native audience separately (likely long-form). The free layer stays on autopilot.
- **If views < 500K by Sep 1:** the verdict is deferred, not passed — that's a distribution failure (see day-60 rule), not an offer failure. Fix content throughput before judging the offer.
- **Expectation set in advance (do not panic-pivot on Sep 1):** filmed hybrid reels only start posting in week 3, so cold traffic barely flows before day 30. The day-30 review will almost certainly read "deferred — under 500K views." That is the plan working, not failing. **Oct 1 is realistically the first true verdict; do not touch the architecture before then.**

### Day-60 gate — Oct 1 (the teardown's, layered on)
- **Offer failure:** fewer than **20 cumulative Cycle System sales** AND fewer than **4 Playbook sales**, WHILE the free Discord has grown past **~150 members**. People take the free thing and won't pay one-time for cycle guidance — no fourth pricing architecture fixes that. Response: stop monetizing entirely, run the free layer as an audience asset for next bull, evening hours go to the IG audience itself. (Note: the System launches Aug 24, so this measures ~5 weeks of System sales — if it's borderline, weight the trajectory, not just the total.)
- **Distribution failure (deferred verdict, NOT a kill):** free Discord under ~150 members by Oct 1 → the problem is upstream traffic, not the model. Fix distribution; do not touch the architecture on no data.
- **Asymmetric signals:**
  - Playbook sells, System doesn't → go pure high-ticket: Playbook to $1,500, delete the mid-tier.
  - System sells, Playbook doesn't → Playbook back to $497 as a System upsell.
  - **$29 sells, System doesn't** (the new joint): the break is the $29→$197 bridge, not the products — fix sequence copy/framing first; consider a $97 intermediate rung ONLY if 100+ plan buyers and founding take-rate <5%. Do not touch prices before that sample exists.
  - $29 doesn't sell but free Discord grows → the cold offer is wrong, not the audience; iterate the $29 promise/page before concluding audience mismatch (the day-30 gate already covers the terminal case).
- **Constraint floor (absolute):** any month the business needs more than ~20 evening hours to hold together, the design has failed regardless of revenue.

Calibration honesty: baseline is ~2 checkouts and ~30 site sessions/month. These gates demand ~10x baseline. Matching baseline with new paint = it did not work.

---

## 7. MIGRATION — grandfathering terms + the three copy pieces

### Grandfathering terms (execute in Whop, week 1)
- **Every real paid member, current or past** (including the July-churned $29 founder): The Cycle System lifetime + #signals access forever, at no further charge. They already paid more than founding price in subscription months, or close to it.
- Subscriptions **cancel at period end by default** — nobody gets silently rebilled into a dead product.
- **Opt-in stay:** anyone who wants to keep paying keeps their current rate and everything they have today; Elite grandfathers who stay keep the monthly 20-minute call while subscribed.
- **Founding Circle (56 comped):** keeps everything, mapped to @System.
- Every grandfathered member gets one soft ask (not a condition) for an honest Whop review.

### Copy piece 1 — announcement to the 72 members (Discord #announcements + email, Aug 8)

> **LiftOffr is changing. You're getting more, not less.**
>
> I'm killing the monthly subscription. All of it — Core, Pro, Elite, the trial.
>
> Honest reason: the value of a cycle system doesn't arrive monthly. It arrives twice a cycle — when you buy the bottom and when you sell the top. Billing you every month between those moments never sat right with me, and I'm done pretending it did.
>
> What happens to you:
>
> **If you've ever paid for LiftOffr:** you now own The Cycle System — the full course, the signals feed, lifetime updates — permanently, at no further charge. Your subscription stops billing at the end of your current period. You lose nothing. You keep everything that mattered.
>
> **If you're Founding Circle:** nothing changes. Everything you have stays.
>
> **If you'd rather keep your subscription** (Elite members: this keeps your monthly call): reply within 7 days and I'll leave it exactly as is, at your current rate, for as long as you want it.
>
> The Discord opens up this week — the daily brief, the Score, and the indicator feeds go public. That's deliberate: the system working in the open is better proof than any sales page. Your course access and signals stay members-only, behind your new role.
>
> One ask, not a condition: if LiftOffr has been worth anything to you, an honest review on Whop takes two minutes and matters more to this than any ad I could run.
>
> Questions → DM me. — Torin

### Copy piece 2 — founding-window launch email (warm list, Aug 24)

> **Subject: The Cycle System is open — founding price, 50 seats**
>
> For two years the full system lived behind a monthly paywall. As of this month, that's over — I killed the subscription and made the Score, the daily brief, and the indicator feeds public. If you've been in the Discord these past weeks, you've been watching it run.
>
> The complete system — the 8-indicator phase matrix, the confluence score, the buy ladders AND the exit ladders, the rebalancing rules, custody setup, the signals feed — is now one product, one payment, lifetime updates: **The Cycle System, $197.**
>
> **Founding window: $147 for the first 50 seats.** Window closes September 7. No timer on this page, no fake urgency. 50 seats and a date, that's it.
>
> Separately — and this is an ask, not a condition of anything: if you go through it and it's worth what you paid, an honest review on Whop helps this more than any ad I could run. If it's not, tell me that instead.
>
> Why now, in a bear market? Because this is when the plan gets written. The people who bought the 2022 bottom decided to in 2022 — not the week of the halving. My own ladder is already two tiers deep. [receipts]
>
> The track record, including the 2021 miss that built this system, is public: liftoffr.com/track-record and /receipts. Judge it on that.
>
> [Get The Cycle System — $147 founding]
>
> Not ready to spend $147? The exact buy plan I'm executing this bear is $29, and your $29 credits toward the System whenever you're ready. Start there.
>
> — Torin

### Copy piece 3 — grandfathering terms one-pager (pinned in Discord, linked from the announcement)
Use the terms block at the top of this section verbatim as a pinned #announcements follow-up, so nobody has to dig for what they're owed.

---

## 8. COURSE CONTENT MAP (per the teardown's Section 8 — restated so this doc stands alone)

**PAID — The Cycle System (~24K words, the reference-grade 45%):**
- Module 4, lessons 1–5 + 7: CBBI, Pi Cycle, Rainbow, Cipher, MVRV/2Y-MA, confluence scoring. Cipher = bonus lesson; Google Trends lesson → blog.
- Module 5 in full minus the Olivia composite: phase matrix, exit ladder, trigger map, rebalancing, 2021 Investor A/B receipt, execution mistakes.
- Module 2, lessons 3 + 5: portfolio templates, position-size caps.
- Module 6, lessons 3–5: allocation buckets, custody architecture, yield filter.
- Resources "My usage" annotations → closing lesson.

**FREE LEAD-GEN (the commodity 55%):**
- Module 1 entirely → free "Start Here" track in the open Discord + SEO blog posts.
- Module 3 (psychology) → reel scripts + nurture emails (dorm-room story, six archetypes, leverage liquidation math). Not curriculum.
- Module 2 lessons 1/4/6 → blog. Module 6 lessons 1–2 → "Surviving the Bear" lead magnet (the timely August 2026 magnet).

**CUT OUTRIGHT:**
- All three fictional composites (Ethan, Olivia, Alex) — invented characters next to real receipts weaken trust.
- Standalone assessments → folded into System buyer worksheets.

**$29 plan pulls** (per Section 4): Module 5 ladder mechanics + Module 2 sizing (worksheet), Module 6 custody flow (execution), Module 4 trigger logic in simplified form only. The full indicator curriculum and the exit side stay at $197.

---

## 9. RENT-THE-REACH (parallel revenue line — not a fallback)

- **Brand deals:** rate card at $1,500–3,500/reel (credible at verified 100K–550K lifestyle hits; auto + finance niches pay premiums). 20-target outreach list drafted week 1–2, sent week 3. One evening/week cadence thereafter.
- **Hardware-wallet affiliate:** Ledger/Trezor wired into /links + captions week 3. Fits custody-first brand. Exchange CPAs permanently rejected (conflict with anti-trading positioning).
- **Boundary:** deals must clear the brand filter — no leverage products, no exchanges, no hype coins, nothing that contradicts anti-hype/custody-first. The Jason Stone benchmark (~$0.39/follower/yr renting reach) is the honest ceiling model for lifestyle-only reach; this line monetizes the views the $29 funnel doesn't convert.
- If the day-30 kill fires, this line **becomes** the monetization, not a parallel one.

---

## 10. CONTENT SYSTEM (locked per Decision 4)

- **Format:** hybrid same-video reels — car hook, money payoff, one asset. The Tai Lopez mechanic, not lifestyle reach cross-sold later. c8dunes_v2 quality bar.
- **CTA:** keyword **PLAN** → public comment reply + bio link → `/plan`. (DM automation only after Meta approval; never promise a DM in a caption until then.)
- **Cadence:** re-cut library batch (236 clips) week 2; filmed batch 1 after ~Aug 15; 5–10 posted week 3; scale the winner week 4.
- **Measurement:** per-reel views→site CTR; any format >0.1% = scale; below = kill. Banger-slide receipts drops (per established style: asymmetry flex, 3-line story close, no CTA pill) carry proof for the $29.
- **Never:** military/D1 angle, leverage content, countdown timers, hype framing.

---

## 11. STANDING CONSTRAINTS (unchanged, restated for future sessions)

Active-duty; evenings only (~20 hrs/month absolute ceiling, see constraint floor). No group calls — 1:1 only. Military/D1 marketing angle permanently off-limits. Anti-hype, anti-leverage, hardware-wallet-custody brand. No countdown timers (stated dates + seat caps are fine). No fabricated testimonials or results. No incentivized reviews — review asks are always optional, never tied to price or access (ruling 14). Compliance framing per Section 4 on everything that touches money decisions; securities-attorney consult triggers at the first ~$2K revenue month. No new filming until ~Aug 15. Site: 12-serverless-function Vercel cap (AT it — new endpoints require consolidation), deploy via git push not `vercel --prod`, never link /dashboard publicly.

**Key repos:** `~/liftoffr-landing` (site) · `~/.openclaw/workspace/discord-rebuild` (IG/Discord bots) · `~/liftoffr-reels` (Remotion) · `~/liftoffr-course/content/` (course source md) · `~/liftoffr-video` (editor workspace).
