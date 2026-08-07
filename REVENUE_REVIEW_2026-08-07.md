# LiftOffr Revenue Review — 2026-08-07 (Day 5 of the 30-day plan)

Independent read of the business model as it exists in code, live surfaces, and running infrastructure. Not a relitigation of the locked decisions in LIFTOFFR_MASTER_PLAN.md §1 — the ladder stays. This is about where the 20 monthly evening hours go, and what the ladder can actually pay at full success.

## 1. The finding: the offer ladder's ceiling is ~$1,000/mo, and it's absorbing ~all the effort

Run the plan's own target numbers forward. Nothing here is pessimistic; every input is the plan's stated *goal*, not the current actual.

| Input | Value | Source |
|---|---|---|
| IG views | ~433K/mo | 1.3M/90d, pivot audit |
| views→site CTR | 0.10% | the plan's 10x target (current: 0.013%, recent 0.034%) |
| sessions/mo | 433 | |
| /plan conversion | 3–5% | generous for cold traffic, $29 impulse digital |
| $29 sales/mo | 13–22 | |
| **$29 revenue** | **$377–$628/mo** | |
| System upsell take | 15% of buyers | plan's own 10–20% target |
| **$147 System revenue** | **$294–$441/mo** | 2–3 sales/mo |
| **Ladder total at full target** | **~$670–$1,070/mo** | |

That is the ceiling if *everything in the 30-day plan works exactly as designed*. The day-30 gate (20 cold sales = $580) is not a step toward a business; it is approximately the whole business.

Meanwhile the two revenue lines with 3–5x that ceiling have **zero built assets** as of day 5:

| Line | Monthly potential | Assets built | Effort/mo |
|---|---|---|---|
| $29 → $147 ladder | $670–1,070 | ~everything | most of the 20 hrs |
| **$997 Playbook** (cap 4/mo) | **$3,988** | page exists, no route to it | ~4 hrs (1:1 delivery) |
| **Brand deals** ($1.5–3.5K/reel) | **$1,500–3,500** at 1/reel | **none — no rate card, no target list** | ~2 hrs |

**One brand deal per month out-earns the entire ladder at full target execution.** One Playbook sale equals 34 plan sales.

The effort allocation is inverted: maximum build effort at the minimum price point, zero build effort at the two highest. The master plan already says brand deals are "a parallel revenue line, not a fallback" (§9) — but the calendar puts the rate card in week 1 "if an evening remains" and outreach in week 3, and neither exists yet.

### What I'd change (not the architecture — the sequencing)
1. **Build the brand-deal rate card and 20-target list this week, not week 3.** It is the only revenue line that doesn't require converting a mismatched audience — the exact problem the pivot diagnosed. `COLLAB_TARGETS.md` is a *collab-reel* list (free reach, co-authored posts); it is not a paid brand-deal target list. Different asset, different pitch, doesn't exist yet.
2. **Build one route to $997.** Right now 28 blog CTAs and 12 homepage CTAs all point at /plan, and nothing anywhere points at /playbook. The page is noindex with no inbound path. A single line on /welcome-plan and in the D14 email ("if you'd rather I just walk your portfolio 1:1, that's /playbook") costs nothing and addresses the one buyer type that makes the math work.
3. **Treat the $29 as a lead-qualifier, not the revenue.** Its job is producing a list of people who paid for Bitcoin cycle guidance — that list is what makes $997 sellable. Judge it on buyer count, not dollars.

## 2. The free tier is going backwards, and it's a gate

Discord membership: 72 (pivot baseline) → 70 (Aug 2) → **58 (today)**. That's −12 in 5 days, before the migration announcement has even gone out.

The day-60 gate (§6) reads free Discord >150 members as the distribution signal. It is moving away from the gate at ~2.4 members/day. And ~54 of the 58 are comped Founding Circle, so genuine non-friend membership is roughly **2–4 people**.

This matters more than it looks: the whole "free layer as proof, open Discord as the moat" strategy assumes the free layer *accumulates*. It's currently a leaky bucket, which means the Oct 1 verdict will read "distribution failure — deferred" and you'll have burned two months to learn nothing. Worth finding out what the −12 is before Aug 10.

## 3. /plan has no risk reversal — the single cheapest conversion fix available

`/plan` is the only paid page cold traffic ever sees, and it has:

- **No refund or guarantee anywhere.** The killed membership had a 30-day money-back guarantee; the replacement has nothing. For a $29 purchase from a stranger on a phone, risk reversal is the highest-leverage element on the page and it costs nothing (Whop processes refunds natively). Note the earlier audit's framing: "try it free for 30 days" outperforms "money-back guarantee."
- **First CTA at ~70% scroll depth** (`plan/index.html:263`). No buy button above the fold. IG traffic arrives on mobile and mostly leaves before the price block.
- **No email capture for non-buyers.** The free door (`:270`) is a *link* to /free, so a non-buyer costs one extra click to capture and most won't take it. This recreates exactly the "funnel has no middle" hole the May audit flagged — on the new page. `/free` already has a working `/api/subscribe` form; inlining it on /plan is a copy-paste.
- **No price anchor.** "$29" sits alone. Anchoring it against the $197 System (or a concrete comparison) makes it read as cheap rather than arbitrary.

None of these conflict with the standing constraints — no timers, no fabricated proof, no hype.

## 4. What's running on the MacBook

26 LaunchAgents, one Python daemon, and `caffeinate -i -m -s` that has been holding the machine awake for **13 days straight**.

| Item | State | Risk |
|---|---|---|
| `com.liftoffr.caffeinate` | running 13d, KeepAlive | The entire business — daily brief, IG posting, Discord bots, Telegram bridge, receipts — stops if this laptop sleeps, closes, or dies. No failover. |
| 4× orphaned Remotion `chrome-headless-shell` | **fixed today** — 12 days old, reparented to launchd, killed | was leaking ~74MB and a puppeteer profile |
| Disk | **33 GB free** | 63 GB of LiftOffr footage on Desktop, 5.4 GB `liftoffr-video`, 785 MB `liftoffr-reels`. Renders fail silently when disk fills. |
| IG publish pacing | 10 posts on Aug 6, 2 on Aug 7 | A 10-post day is a burst, not a cadence. Reach penalties are a real risk and it burns queue depth that took a week to refill. |
| Drive permission revoke | failing on every post (403 / connection reset) | Every posted video stays **publicly downloadable** on Google Drive. Cosmetic today, but it is an open door that never closes. |

**The infrastructure recommendation:** the recurring jobs that produce customer-visible output — daily brief, weekly Score, receipts logger, price alerts — should not depend on a laptop being awake. You already run Vercel crons (`vercel.json` has two). Moving the customer-facing subset there, or to a $5/mo VPS, removes the single point of failure. The IG/Drive posting pipeline can stay local since it depends on local media.

## 5. Open items that are quietly costing money or risk

1. **GitHub PAT is still live and embedded in plaintext** in `~/liftoffr-landing/.git/config` (classic `ghp_`). The Aug 2 status flagged it was *also echoed into a session transcript* and marked it "rotate today." Five days later it is unrotated. This is the most urgent item in this document and it isn't a revenue item.
2. **Playbook price may not match the page.** `playbook/index.html` says $997 in five places; the Whop plan repricing from $497 was classifier-blocked on Aug 2 with no evidence it happened. If the plan still charges $497, you are either underselling by $500 or showing a price you don't honor. Verify in the Whop dashboard — I can't read plan pricing without dashboard access.
3. **`/system` returns 404** while `/welcome-plan`'s bridge block points at it (`welcome-plan/index.html:179`, `href="#"`). Currently harmless because the block is `display:none`, but it goes live in week 2 (Aug 10) and the D3 plan-buyer email pitches it. Ship the page before the email fires.
4. **Kalshi API keys still live** on a concluded project; GCP service-account key untouched since May 8. Both were Aug 5 deadlines.
5. **`free/index.html` has uncommitted local changes** and `STATUS_2026-08-02.md` is untracked. Minor, but the deploying repo should be clean.

## 6. If I had to rank the next five actions by dollars-per-hour

1. Rotate the GitHub PAT (0.2 hr, not revenue — but an exposed write token on the deploying repo outranks everything).
2. Rate card + 20 paid brand-deal targets, sent (2 hr → $1,500–3,500/mo potential).
3. Risk reversal + hero CTA + inline email capture on /plan (1 hr → lifts every dollar the funnel will ever make).
4. One route to /playbook from /welcome-plan and the D14 email (0.5 hr → $997/sale).
5. Diagnose the Discord −12 before the Aug 8 migration announcement (0.5 hr → protects the day-60 gate).

Items 2–4 total ~3.5 hours and address the three highest price points. That's within one evening.
