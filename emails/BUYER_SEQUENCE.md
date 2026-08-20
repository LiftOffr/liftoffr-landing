# Buyer sequence — after a $29 purchase

**Status: DRAFT COPY, NOT WIRED, NOT SENT.** Written 2026-08-20 from the audit's
Part 4.7. Nothing in this file sends. To ship it you need a Resend audience for
$29 buyers (`api/whop-webhook.js` already adds them to a "Plan Buyers" audience)
and five new branches in `api/cron-welcome-followups.js` keyed off contact age,
the same mechanic every other sequence in this repo uses. No new serverless
function — the repo is at Vercel's 12-function cap.

**Governing rule: no pitch before Day 7.** Delivery earns the right to sell.

Every email inherits the shared footer from `api/_disclosure.js`, which carries the
backtest language, the not-an-adviser line, 18+ and the mailing address. Do not
hand-write a disclaimer into the body of these.

**Do not use in any of these:** "guaranteed", "risk-free", "profitable", "make
you money", any dollar or percentage outcome for the reader, "I called the top",
"predicted", "buy now", "sell now", "entry", "target", "portfolio review",
"personalised", "for your situation", "signal service", "copy my trades".

---

## B1 — Day 0
**Subject:** `your plan + the one thing to do tonight`

> Hey,
>
> The plan's attached and it's also at [link] permanently.
>
> One thing to do tonight while it's fresh. It takes about ten minutes.
>
> Open the exit ladder. Write your four numbers in the blanks. Not mine — yours,
> scaled to what you actually hold. Then close the file.
>
> That's the whole product. Everything else in there is explanation.
>
> One thing I'd ask: don't take my number on faith. Section 4 has the nine
> indicators, their weights and the free public data source. Pull it and recompute
> today's Score yourself. If you get something different from what's on
> liftoffr.com/cycle, reply and tell me — I'd genuinely want to know.
>
> — Torin

---

## B2 — Day 1
**Subject:** `the boring execution stuff`

> Three things the doc assumes you know and I shouldn't have assumed.
>
> **Limit orders.** The ladder only works if the order is resting before price gets
> there. If you're setting it on the day, you're back to deciding in the moment,
> which is the thing we're trying to avoid.
>
> **Where it lives.** Whatever you sell into has to be somewhere you can actually
> reach on a day when everything is busy. Decide that now, not then.
>
> **The fallback.** If you miss a rung — and you will miss one — the rule is: take
> the next one, don't chase the one you missed. Missing a rung costs you a fraction.
> Chasing it costs you the plan.
>
> No pitch in this one. Next few are the same.

---

## B3 — Day 3
**Subject:** `the six times my own model flipped`

> Between 16 November 2024 and 21 October 2025 the Score crossed the exit threshold
> six separate times.
>
> ```
> Nov 16 2024 — exit           — $90,568
> Feb 18 2025 — back to warning — $95,444
> May 08 2025 — exit           — $103,070
> Jun 19 2025 — back to warning — $104,710
> Jun 27 2025 — exit           — $107,091
> Oct 21 2025 — back to warning — $108,700
> ```
>
> Six. In twelve months. And the top was 6 October 2025 — which means the model was
> still inside the exit zone when it happened and only left fifteen days later.
>
> I'm telling you this on day three rather than letting you discover it, because a
> threshold model whipsawing is not a bug you found. It is how threshold models
> behave, and it will happen again in the next cycle.
>
> The ladder is built for exactly this. You sell a fraction at each crossing. You do
> not re-enter on the way back. That's it, it's boring, and boring is the point.
>
> Every crossing above is in the log at liftoffr.com/receipts, along with the 29 that
> went the wrong way.

---

## B4 — Day 7 — first mention of anything paid
**Subject:** `the part the plan doesn't cover`

> Quick status check: have you filled in your four numbers?
>
> If not, do that first. Everything below matters less than that does.
>
> If yes — here's the honest limit of what you bought. The plan is a snapshot: my
> levels, my ladder, this cycle. What it doesn't teach is how to derive your own
> levels when this cycle ends and the numbers are all different. That's what The
> Cycle System is: the framework rather than the snapshot. $197 once, at [link].
> Same thing you already have, one level up in abstraction.
>
> No deadline on that and no discount coming. If the $29 doc is enough, it's enough
> — and for a lot of people it will be.

---

## B5 — Day 14
**Subject:** `one ask`

> Two weeks in. One thing, and then I'll leave you alone.
>
> If the plan changed what you actually do, would you leave a review on Whop? [link]
>
> If it didn't, would you tell me why? Reply to this. I'd rather have the reason than
> the review.
>
> And if you want the $29 back, say so and it's done — the 30 days isn't over yet.

**Ask everyone, not just the happy ones. Offer nothing in exchange.** Conditioning a
discount, a bonus or anything else on a positive review is incentivised-review
territory under the FTC Endorsement Guides (16 CFR 255), and it would poison the only
social proof this business has. This rule is already in the repo; keep it.
