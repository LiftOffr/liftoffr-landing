> **SUPERSEDED (2026-08-02).** This document is a historical artifact. The single source of truth for offers, pricing, and routing is **LIFTOFFR_MASTER_PLAN.md** — do not implement anything from this file.

# LiftOffr Business Model Teardown + Redesign (2026-08-02)

Inputs: full read of the 55-file course (54,233 words), live tier pages, the discord-rebuild automation inventory, and fresh web research on Maurits Neo, Into The Cryptoverse, Milk Road PRO, Meet Kevin, Wealth Group, Glassnode, and 2022-23 bear-market postmortems (MN Trading shutdown, crypto YouTube viewership collapse).

---

## PART 1: THE CURRENT OFFER, DECONSTRUCTED

### 1a. The actual promised transformation

The course states it plainly: "From Beginner to Data-Driven Investor Through Complete Market-Cycle Mastery," and the homepage version is sharper: "you stop needing anyone's opinion."

Before-state: holds $2K-50K of crypto bought near a top, underwater or recently round-tripped, checks Twitter/YouTube to decide what to do, secretly knows he has no plan.
After-state: has pre-set buy and sell ladders sitting as limit orders, reads 8 indicators in 10 minutes a week, executes mechanically, never round-trips a cycle again.

That is a real, coherent transformation. The problem is not the promise.

### 1b. The specific buyer

Not the beginner Module 1 is written for. The realistic buyer, given a lifestyle-first personal IG audience:

- Male, 22-35, US. Income $50-100K (young professional, military-adjacent, or late college with money).
- Crypto experience: bought in 2024-25, has $2K-50K in it, lived through at least one -40% drawdown. Has already tried: YouTube gurus, at least one Telegram/Discord "alpha" group that burned him, probably one memecoin loss.
- Psychographic: sees the cars and wants proof-of-outcome, not more education. His actual question is "just tell me when to buy the bottom and when to sell the top." He is buying certainty and a plan, not a curriculum.

### 1c. Recurring value in month 3: the honest answer is nothing new

- The course is consumed in weeks 1-4 (54K words, ~4 hours of reading; 55% of it is read-once).
- The daily brief and Sunday Score are the same artifact every day/week. In a bear market the Score will read "neutral / accumulate slowly" for 6-12 straight months. The July score sat at 37-38 NEUTRAL for weeks.
- The genuinely valuable events (zone change, Pi Cycle cross, ladder tier trigger) fire a handful of times per YEAR.
- 100% of Core's recurring deliverables and ~100% of Pro's are emitted by eight Python scripts on LaunchAgents pulling free public APIs. The only human-recurring deliverable in the entire product line is Elite's 20-minute monthly call. Pro's "market intelligence" is Claude summarizing Benjamin Cowen's YouTube channel; "gem-radar" is a relay of someone else's Telegram group with no generator script of its own.

Month 3's charge buys reassurance and a ticker. That is real but thin, and it is worth $5-10/mo of perceived value, not $49-99.

### 2. Hormozi value equation scorecard

| Dimension | Score | Why |
|---|---|---|
| Dream outcome | 7/10 | Real and receipt-backed, but "don't round-trip BTC" is a smaller dream than the market's default "get rich trading" |
| Perceived likelihood | 3/10 | 0 Whop reviews, fictional composite case studies (Ethan/Olivia/Alex) sitting next to real receipts, backtest not a live audited track record, small brand |
| Time delay | 2/10 (worst) | The payoff of a cycle system lands in YEARS. Buy the bottom in the bear, sell the top 2-3 years later. You bill monthly against a biennial payoff |
| Effort | 8/10 | 10 min/week is genuinely low; the strongest dimension |

Worst score: time delay, and it is structural. No copy fixes billing monthly for value that arrives biennially. In a bull market subscribers tolerate it because dopamine arrives weekly. In a bear it is a churn machine: research confirms crypto attention drops 80-90% in downturns (creators at 100-200K views/video in 2021 report 15-20K now), and MN Trading, a far bigger paid crypto Discord, shut down Dec 31 2023 citing exactly this.

Second worst is likelihood, and that one IS fixable: /track-record and the timestamped calls are the lever, and they are underused.

### 3. The structural problem, named

LiftOffr is a signals/indicator business pretending to be an education membership, priced like coaching and staffed like a cron job.

Precisely: a one-time-consumable course (80% commodity content, ~20% real IP) welded to a zero-marginal-cost bot feed, wrapped in three recurring tiers whose pricing implies ongoing human service that structurally does not exist (you do no group calls ever; the entire human surface is 20 min/month at the $249 tier). The membership frame writes checks the operating model refuses to cash. That is why 72 members (56 of them comped) produce roughly 2 checkouts a month.

---

## PART 2: THE ALTERNATIVES

### 4. The five archetypes

**A. One-time high-ticket course/playbook.** Operator: Meet Kevin, $3,557 bundle (verified live), lifetime access, no subscription. Economics: $200-2,000 price, converts ~1-2% of engaged traffic; revenue is a function of audience, not retention. Hours: near zero after build. Bear survival: sales slow but there is no churn death spiral; the asset hibernates and re-sells next bull.

**B. Low-ticket membership with live recurring components.** Operators: Milk Road PRO ($25-99/mo, 5 analysts, weekly cadence, $1 trial, $499-value masterclass as annual bonus), Into The Cryptoverse ($19/$49/$109/mo + $12,999 lifetime; recurring hook is Cowen HIMSELF shipping weekly videos and daily updates). Economics: needs 500-2,000 paying subscribers to matter, fed by a massive free-content machine. Hours: 5-15/week of live/video presence, forever. Bear survival: worst of all archetypes; this is the model that died publicly in 2022-23.

**C. Free content to high-ticket coaching/1:1.** Operators: every coach; Cowen's own unlisted "Direct Access" monthly 1:1 tier; your existing $497 Playbook. Economics: $500-2,500 per engagement, 2-6/month on a small-but-warm audience = $2-10K/mo. Needs trust, not scale. Hours: ~2-3 hours per engagement, scheduled on your calendar, evenings-compatible. Bear survival: surprisingly good. "Build my accumulation plan for the bottom" is a BEAR-market product; that demand exists right now.

**D. Free tool/indicator to paid premium (product-led).** Operators: Glassnode ($0 to $49/mo to ~$999/mo), LookIntoBitcoin. Economics: $19-49/mo, near-zero marginal cost, but needs thousands of users for meaningful MRR. Hours: maintenance only. Bear survival: usage dies with interest but costs ~nothing, so it survives dormant. At your distribution, this is not a business; it is a funnel feature. You already built the tool (Score API, badge, widget, dashboard).

**E. Community-first (paid Discord as the product).** Operator: Wealth Group on Whop, $250/mo, 10,505 members, 4.9 stars from 1,983 reviews, FIVE educators running daily livestreams. Economics at the top are spectacular (~$2M+/mo gross ceiling) and near zero for everyone below the category leader. Hours: daily live human energy. Bear survival: leader survives, everyone else dies.

### 5. Maurits Neo, end to end

The research surprised me and it should reframe how you think about him:

- **He sells nothing.** His positioning is literally "I have nothing to sell you, no courses." Young Wealth, his community, is FREE on Skool, and as of yesterday it has **183 members**. Inside: chat, a classroom module with his courses (branding, crypto, ecom, biohacking), live calls on a calendar, gamified challenges (60-day fitness challenge, $500 prize), leaderboards.
- **The recurring hook is him, live:** streams on Candle.tv (a crypto streaming platform + launchpad he promotes, ~100+ live viewers), live calls, daily short-form. Nothing is evergreen except the course library inside the free group.
- **How he actually makes money:** on-chain attention monetization. Doxxed wallet revealed inside the free group, a memecoin position he claims is worth $1M+ launched live on stream, airdrops to the community, and whatever his Candle arrangement is (role unverified). His claimed $770K+ portfolio and net worth figures are all self-reported.
- **Funnel:** short-form (IG ~250-375K, TikTok ~150K, X ~43K) to a Telegram bot to the free community to token/attention monetization.

Three lessons, and one warning. Lessons: (1) a free community works as a trust engine at TINY scale (183 members and it still does its job); (2) "nothing to sell you" is itself the highest-converting positioning in a niche drowning in course-sellers; (3) the community is marketing, not product. Warning: his actual income model, launching and holding tokens he promotes to his own audience, is not replicable for you and would be radioactive for an active-duty officer. Copy his top of funnel, never his monetization.

### 6. Ranked fit for your constraints (active-duty, evenings only, no group calls, lifestyle IG, indicator IP already built)

1. **C, free-to-high-ticket 1:1.** Fits every constraint. Already half-built as /playbook. 1:1-only is your stated rule; evenings are exactly when 1:1 sessions book.
2. **A, one-time product.** The course's real IP (the ~20%) is a natural $197 one-time product. Zero ongoing hours.
3. **D, free tool.** As the FREE layer feeding 1 and 2, it is your best asset. As a paid tier, dead end at your scale.
4. **B, structurally cannot run.** The recurring hook that makes Milk Road/ITC work is the founder showing up weekly, live or on video, forever. Your no-group-calls rule plus active duty kills it, and it is the worst bear-market model anyway. This is what you are currently running, minus the live part that makes it work.
5. **E, structurally cannot run.** Requires daily live presence and thousands of members.

---

## PART 3: THE REDESIGN

### 7. The verdict and the new architecture

Say it exactly: **a paid BTC cycle indicator cannot sustain a subscription at your scale.** Cowen sustains one because HE is the recurring deliverable, shipping weekly videos to an enormous free audience. Your recurring deliverable is eight cron jobs. Kill the membership.

**LiftOffr 2.0: the receipts ladder.** Free score + free community, one $197 one-time system, one $997 1:1 playbook.

**FREE (the audience and trust engine):**
- LiftOffr Score public: live widget, Sunday Score email (commentary stays email-gated; email capture is the only gate in the free layer).
- Free Discord, invites open again. The bot output becomes the free product: daily brief, weekly Score, CBBI/Pi-Cycle, macro watch, tickers. At 2 checkouts/month the paywall is protecting nothing; the same feed working in public is the best proof-of-likelihood you can buy, and it costs you $0/month to run.
- /track-record and timestamped calls (including the 2021 miss) promoted harder, everywhere.

**PAID 1: The Cycle System, $197 one-time (founding window $147, 50 seats, review-conditioned).**
The distilled course: the confluence score, the 8-indicator phase matrix, the band-to-action maps, the exit ladder, the trigger map, custody architecture, the yield filter. ~18-20 lessons, all reference-grade. Includes LIFETIME access to the private #signals role (4hr trade setups + entry/exit trigger alerts) and the ladder-builder worksheets. Lifetime updates. The "$497 value" anchor is already established on your own homepage; now $497 is the anchor and $197 is the price.

**PAID 2: The Cycle Playbook, $997 1:1 (up from $497).**
Unchanged deliverable, fixed identity: 90-minute 1:1, personalized accumulation + exit ladders, plan doc, recording, 2 weeks DM access, and The Cycle System included. Cap 4/month. At $497 with a "$1,197 value" stack you priced a bespoke 1:1 with the founder below Wealth Group's monthly Discord fee. 2-4 sales/month = $2-4K/month on 6-12 evening hours.

**DELETED:** Core/Pro/Elite, the 7-day trial, annual toggle, Elite lounge, the monthly 20-min call, gem-radar as a paid bullet (relaying someone else's Telegram calls is a liability, not a product), and the Cowen-summary channel as a PAID bullet (someone else's analysis; move it to the free layer or kill it).

**Why this fixes the value equation:** one-time billing aligns payment with the biennial payoff (time-delay problem gone); the free layer lets buyers watch the system work in public for weeks before paying (likelihood problem attacked); revenue per real customer jumps from $49-99 collected once or twice before churn to $197-1,197 collected up front with zero churn management.

Honest revenue math: current path is roughly $150-300/mo. New path at MODEST volume (10 System sales + 2 Playbooks/month) is $4-6K/month, and every mechanism except the Playbook session runs itself.

### 8. Mapping the 54K-word course onto the new architecture

**KEEP AS PAID (The Cycle System, ~24K words, the reference-grade 45%):**
- Module 4 lessons 1-5 + 7 (CBBI, Pi Cycle, Rainbow, Cipher, MVRV/2Y-MA, the confluence scoring system). Cipher becomes a bonus lesson; cut Google Trends to the blog.
- Module 5 in full minus the Olivia composite: phase matrix, exit ladder, trigger map, rebalancing, the 2021 Investor A/B receipt, execution mistakes.
- Module 2 lessons 3 + 5 (portfolio templates, position-size caps).
- Module 6 lessons 3-5 (allocation buckets, custody architecture, yield filter).
- Resources page "My usage" annotations become the closing lesson.

**CONVERT TO FREE LEAD-GEN (the commodity 55% finally earns its keep):**
- Module 1 entirely: a free "Start Here" track in the open Discord + SEO blog posts. It was never worth paying for; it is excellent free onboarding.
- Module 3 entirely: the psychology module is your best short-form and email material (the dorm-room story, the six archetypes, the leverage liquidation math). Reel scripts and the nurture sequence, not curriculum.
- Module 2 lessons 1/4/6 to blog. Module 6 lessons 1-2 become a "surviving the bear" lead magnet, which is exactly the timely magnet for August 2026.

**CUT OUTRIGHT:**
- The three fictional composite case studies (Ethan, Olivia, Alex). Invented characters sitting next to real receipts actively weaken trust. Your proof is /track-record and the 2025 top exit.
- Assessments as standalone lessons; strip them into buyer worksheets inside the System.

### 9. Migration: 30 days, no member burn, receipts intact

**Week 1, members first (nobody loses anything):**
- Announcement to all 72: every current PAID member gets The Cycle System lifetime + keeps their signals access forever, no further charges required (they already paid more than $197's founding price in subscription months, or close). Founding Circle keeps everything. Anyone on the old tiers who wants to keep paying is grandfathered at their rate.
- Discord restructure: invites reopened, free layer public (brief, Score, CBBI, macro, general, wins), @System role gates course + #signals. The course-optin machinery you built in July does 90% of this already.

**Week 2, build the products:**
- New Whop one-time product at $197 with founding plan at $147 (this finally executes the founding-50 mechanic that has been staged since July, as a one-time price instead of a locked subscription).
- Playbook page rewritten once, consistently 1:1 (kill the "live cohort" copy in pricing.md and the leftover "three calls" bullet), repriced $997.

**Week 3, collapse the site:**
- Homepage becomes: live Score + receipts + two offers. Kill the tier grid, trial CTAs, annual toggle. /start repoints to the free community + Score email, not a trial.
- Email: T1-T4 trial sequence retired; welcome sequence re-aimed at System founding window. IG keywords: TRIAL retired, PLAN delivers the free plan + community invite.

**Week 4, launch:**
- Founding window ($147, 50 seats, deadline, Whop review as the founding condition, which also fixes the 0-reviews problem) announced to email list, members, and IG. Banger-slide receipts content carries it.

/receipts is never touched except to be linked from more places. It is the single asset that addresses your worst fixable score (likelihood).

### 10. Kill criteria, day 60 post-launch

- **Offer failure:** fewer than 20 Cycle System sales cumulative AND fewer than 4 Playbook sales, WHILE the free Discord has grown past ~150 members. That means people will take the free thing and still not pay $147-197 one-time for BTC cycle guidance from you. No third pricing architecture fixes that. Response: stop monetizing entirely, run the free layer on autopilot as an audience asset for the next bull, and put your evening hours into the IG audience itself.
- **Distribution failure (verdict deferred, not a kill):** free Discord under ~150 total members by day 60 means the problem is upstream traffic, not the model. Fix distribution before judging the offer; do not pivot the architecture again on no data.
- **Asymmetric signal:** Playbook sells but the System does not: go pure high-ticket, raise to $1,500, delete the mid-tier. System sells but Playbook does not: drop Playbook price back to $497 as a System upsell.
- **Constraint floor:** any month the business needs more than ~20 evening hours to hold together, the design has failed its own constraint regardless of revenue.

Calibration honesty: today's baseline is ~2 checkouts and ~30 site sessions a month. These thresholds are 10x baseline, which is what "the model works" has to look like; matching baseline with a new coat of paint means it did not.
