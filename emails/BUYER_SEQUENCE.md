<!-- DRAFTING DOC — NOT SERVED, BUT THIS IS WHAT LIVE COPY GETS REWRITTEN FROM.
     Wording here must match the live code, not precede it. Three separate rounds of
     corrections were undone by someone re-copying from a doc like this one.
     Canonical sources: api/cycle-score.js commentary() for bands and register,
     /receipts for every figure. See COPY_SWEEP_NOTES.md. -->

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

> **This draft was deleted on 20 Aug 2026. Do not resurrect it.**
>
> The Day 0 email that actually sends is `plan0HTML()` / `plan0Text()` in
> `api/cron-welcome-followups.js`. **That is the only source of truth for it.**
>
> The draft that used to sit here had drifted badly from what ships: it had no
> "connect your Discord in Whop" step (the omission that left paying buyers without
> the @Plan role), it told the reader to "open the exit ladder" — which is the $197
> product, not the $29 one — it cited "Section 4" for the recompute sheet when that is
> section 5c, it pointed at `/cycle` where the product points at `/score`, and it still
> carried a `[link]` placeholder.
>
> Nothing was wired to it, so nothing shipped wrong. But this file's own header warns
> that three rounds of corrections were undone by someone re-copying from a doc like
> this one, and a divergent duplicate of a live email is exactly that hazard. Edit the
> cron; do not keep a second copy here.

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

> Between 16 November 2024 and 21 October 2025 the Score entered the exit zone three
> times and dropped back out of it three times — six transitions in twelve months.
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
> The ladder in your document is built for exactly this. I act on a fraction at each
> crossing rather than all of it at once, and I don't reverse on the way back. That's it,
> it's boring, and boring is the point.
>
> Every crossing above is in the log at liftoffr.com/receipts, along with the ones that
> went the wrong way. Scored directionally, the model was right on 21 of 46 directional
> crossings at 30 days and 25 of 46 at 180 — and neither is distinguishable from chance
> at that sample size.

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
