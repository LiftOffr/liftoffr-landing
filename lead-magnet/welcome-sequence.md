# LiftOffr Welcome Sequence — Consolidated (Checklist + Score)

**Trigger:** New subscriber via "BTC Cycle Top Checklist + Weekly Score" form
**Sequence length:** 3 emails over 7 days, then the recurring Sunday Score takes over
**Goal:** Deliver the Checklist instantly → frame the Score as the recurring relationship → soft-pitch LiftOffr Founder once

The Checklist is the *door*. The Sunday Score is the *room*. Don't separate them — treat them as one funnel where the welcome hands off cleanly into the weekly cadence.

---

## EMAIL 1 — Day 0 (Immediate)

**Subject:** Your Cycle Top Checklist + the Score you'll get every Sunday
**Preheader:** Two things below. The checklist is the foundation; the Score is what you'll get from me weekly.

---

Hey,

Two things in this email — the checklist you asked for, and a quick heads-up about what shows up in your inbox every Sunday from now on.

**1. The BTC Cycle Top Checklist (your download):**

[👉 Download the PDF](https://liftoffr.com/lead-magnet/cycle-top-checklist.pdf)

Print it. Stick it next to your screen. Run through the 8 indicators every Sunday and count how many are in the trigger zone. When 5+ flash at once, history says the cycle is near peak. Confluence is the signal — no single indicator is.

**2. The LiftOffr Score — every Sunday morning:**

Reading the checklist yourself takes ~15 minutes a week. The LiftOffr Score does it for you. It's a single number (0–100) that weights all 9 cycle indicators into one read.

- Above 85 → historic top zone. Time to start scaling out.
- 60–85 → late-cycle / warning. Tighten exits.
- 40–60 → neutral. DCA continues.
- 20–40 → accumulation. Buy more weekly.
- Below 20 → deep accumulation. Aggressive DCA.

This week's Score is **45.6 — neutral, falling**. Recovery / re-accumulation phase. Continue weekly DCA.

You'll get a fresh read in your inbox every Sunday morning. No fluff, no charts to interpret, no Twitter takes. Just the number, the zone, and what to do this week.

**Why I built this:**

In 2021 I watched friends ride BTC from $20k → $69k → $16k. Round trip. Zero profit. They didn't have a system — they had hopium. The Checklist + Score is the system I wish I'd had then.

See you Sunday.

— Torin
*Founder, LiftOffr*

P.S. The PDF link again in case the first one didn't open: [download here](https://liftoffr.com/lead-magnet/cycle-top-checklist.pdf). Live dashboard with the current Score: [liftoffr.com/dashboard](https://liftoffr.com/dashboard).

---

## EMAIL 2 — Day 3

**Subject:** How to actually use the Score (and what 60+ members do daily)
**Preheader:** The checklist tells you when. The framework tells you how.

---

Quick one.

You've got the Checklist. You'll get the Score every Sunday. Here's the gap between *having information* and *running a system*:

**The Score tells you the zone. The framework tells you what to do in each zone.**

Example: Score crosses 85.

Most people: panic-sell 100% of their stack. Or worse — convince themselves "this time is different" and hold through the top.

What works instead (this is Module 5 of the LiftOffr course):

- 25% out when Score hits 70
- 25% out when Score hits 80
- 25% out when Score hits 85
- 25% out when 3+ binary triggers fire (Pi Cycle, MVRV 7+, CBBI 90+)

By the time the top is obvious in hindsight, you're 75% in stables. You captured most of the upside without trying to time the exact peak.

**Why this matters:** The biggest mistake of every cycle is binary thinking. Sell everything or hold everything. The Score lets you scale — that's the difference between round-tripping and compounding.

Members of LiftOffr get this framework as part of the 6-module course, plus a daily 3-minute brief in Discord every morning at 8am MT that says "here's the read, here's what to do today." If you've been getting value from these emails, the daily brief is the same thing — every day, before market hours.

[See what's inside →](https://liftoffr.com/?utm_source=beehiiv&utm_medium=email&utm_campaign=welcome_seq&utm_content=email_2)

— Torin

---

## EMAIL 3 — Day 7

**Subject:** Last welcome email — what happens next
**Preheader:** From here on out it's just the Sunday Score. Plus a 30-day window if you want more.

---

Last email in the welcome sequence.

From now on you'll get one email from me every Sunday morning — the LiftOffr Score, the zone, and a one-line read on what it means this week. That's the ongoing relationship. No daily spam, no sales sequences, no recycled Twitter takes.

You can absolutely DIY this. Read the Score each Sunday, run the Checklist yourself, build your own discipline. That alone puts you ahead of 99% of crypto investors.

But if you'd rather have it *done for you* — the daily briefs, the live dashboard, real-time signal alerts when triggers fire, the 6-module course, and the private Discord community — LiftOffr's Founder Rate is **$29/mo, locked in forever**.

**Risk-free for 30 days.** If it's not for you, full refund. No friction.

What you get:
- Daily BTC market brief in Discord (8am MT, weekdays)
- Live dashboard with the current Score updated daily
- Real-time signal alerts when V7 triggers fire
- 6 modules: foundations → exit framework → multi-cycle wealth strategy
- Custom AI Q&A bot trained on the LiftOffr curriculum
- Founder badge + access to the private community

[Claim Founder Rate — $29/mo locked forever →](https://whop.com/checkout/plan_CH1L53GLZsaq1?utm_source=beehiiv&utm_medium=email&utm_campaign=welcome_seq&utm_content=email_3)

Either way — see you Sunday.

— Torin
*Founder, LiftOffr*

P.S. The Founder Rate is capped at 30 spots. Live count at [liftoffr.com](https://liftoffr.com).

---

## Notes for Beehiiv setup

**The old 5-email sequence is replaced.** Delete Emails 4 and 5 from the existing automation (the "60+ members" and "30-day window" emails). Compress to 3 emails + 2 delays:

1. **Email 1** (Day 0, immediate) — paste new EMAIL 1 above
2. **Time delay** — 3 days
3. **Email 2** (Day 3) — paste new EMAIL 2 above
4. **Time delay** — 4 days
5. **Email 3** (Day 7) — paste new EMAIL 3 above
6. **End of automation** — subscribers fall into the recurring Sunday Score broadcast

**Critical:** after Email 3 the subscriber is now in the "weekly Score" cadence. The Vercel cron at `/api/cron-weekly-score` pulls every active Beehiiv subscriber every Sunday and sends them the Score via Resend. No additional setup needed — they're already on the list.

**Why 3 emails not 5:** the old sequence was a pure sales funnel ending at "buy LiftOffr." The new sequence positions the Score as the ongoing value, so the welcome only needs to: (a) deliver the Checklist, (b) set the Sunday expectation, (c) make one Founder pitch. After that, the Score does the selling every week by demonstrating value.
