# Whop listing copy — 2026-08-07

Paste-ready descriptions for the three live ladder rungs. Written to a file
rather than pushed via the API on purpose: the Whop v5 `description` field
reads `None` on all three products (the storefront copy lives on the newer
`page_id` surface), and the checkout page is a payment surface — CLAUDE.md
requires per-item founder confirmation before anything touches it.

Constraints applied: one-time ladder only (no subscription language), no
promised returns, no price predictions, education framing with the
not-financial-advice line intact, no fabricated testimonials.

---

## ⛔ BLOCKER — verify before touching any listing

**`plan_uIpPdsPTSHdTp` charges $497. `/playbook` advertises $997 in five places.**

Confirmed live via the Whop API today (`plan_type: one_time`,
`initial_price: 497.0`, visibility `hidden`). The Aug 2 repricing from $497
to $997 was classifier-blocked and never landed. Right now a buyer who reads
"$997" on the page reaches a $497 checkout.

This is a founder decision (pricing is locked), so nothing here changes it.
Two options, both need Torin:

1. **Raise the plan to $997** in the Whop dashboard — matches the page and the
   master plan's ladder.
2. **Drop the page to $497** — five edits in `playbook/index.html` plus the
   two `btn-sub` lines.

Until one of those happens, the $997 listing copy below is unusable, because
it would state a price the checkout does not honor.

---

## 1 · My Bear Market Buy Plan — $29 one-time (`plan_MntgjXJaQnGsW`)

**Short description (store card, ~140 chars)**

> The exact nine-tier plan I'm buying this bear market with. Every level,
> every trigger, timestamped receipts when they fire. $29 once.

**Full description**

> ### The plan I actually use, written down before I need it.
>
> In 2022 I round-tripped roughly $30,000 because I had conviction and no
> written exit. In October 2025 I DCA'd out clean at $124,824 — not because I
> got smarter, but because the levels were on paper before the mania started.
>
> This is that document for the way down.
>
> **What you get**
> - **Nine buy tiers** — the exact BTC levels I'm laddering into, with the
>   reasoning behind each one, not round numbers picked for aesthetics.
> - **What has to be true at each tier** — the indicator conditions that make
>   a level a buy instead of a falling knife.
> - **Timestamped receipts.** When a tier fires, it's logged with the date and
>   the price. The misses stay in the log too.
> - **`#plan-updates` access** — the private channel where every revision goes
>   out. The plan changes when the data changes; you see it when I do.
> - **Free updates for the rest of this bear.** One payment, not a
>   subscription. There is no renewal, and there's no upsell to see the rest.
>
> **What this is not**
>
> Not signals. Not a group chat. Not someone telling you when to press buy.
> It's my homework, shown, so you can do yours against something concrete
> instead of a blank page at 2am.
>
> **Why $29**
>
> Because the point isn't the $29. The point is that people who write a plan
> down behave differently in a drawdown than people who don't, and $29 is the
> lowest number at which anyone actually reads the document.
>
> **Try it for 30 days.** If it doesn't change how you're approaching this
> bear, ask and I'll refund you. Whop handles it — no email chain.
>
> *Educational material only. Not financial advice, not a registered
> investment adviser. Nothing here is a promise of returns.*

---

## 2 · The Cycle System — $197 one-time ($147 founding, 50 seats)

**Short description**

> The full 8-indicator framework behind the plan: how the Score is built, how
> to read it, and how the exit ladder works. $197 once.

**Full description**

> ### The plan tells you what I'm buying. The System is why — and when I sell.
>
> The $29 plan is a set of levels. This is the machine that produces them.
>
> **What you get**
> - **All 8 indicators, one at a time** — MVRV Z-Score, Pi Cycle Top, Puell
>   Multiple, 2Y MA Multiplier, RHODL, Reserve Risk, Woobull, RUPL. What each
>   one measures, what it read at the 2013, 2017 and 2021 tops, and the
>   specific way each one fails on its own.
> - **The confluence method** — why single indicators get you chopped up, and
>   how the weighted Score turns eight noisy signals into one number.
> - **The exit ladder** — the half of this nobody teaches. Scaling out on the
>   way up, in tranches, on triggers set while you're calm.
> - **The backtest, fully shown** — $50/week since 2017 returned $217K on
>   plain DCA and $1.88M routed through cycle-Score exits, tested across 417
>   different start dates. Every assumption is on the table at
>   liftoffr.com/track-record, including the ones that hurt.
> - **Custody discipline** — hardware wallets, key handling, the boring
>   chapter that decides whether any of the rest matters.
>
> **Founding price: $147 for the first 50.** After that it's $197. One
> payment, lifetime access, no renewal — the same document keeps getting
> updated and you keep getting it.
>
> **Who this is for**
>
> Someone who has been through one cycle and doesn't want to repeat it on
> feel. If you want a signal to copy, this is the wrong purchase — the entire
> point is that you end up able to read the board yourself.
>
> **30-day refund.** Read the whole thing. If you'd have been better off
> without it, ask and it's refunded.
>
> *Educational material only. Not financial advice, not a registered
> investment adviser. Backtested results are historical and do not predict
> future performance.*

---

## 3 · The Cycle Playbook — 1:1 (`plan_uIpPdsPTSHdTp`)

> ⚠️ **Do not publish until the $497 / $997 mismatch above is resolved.**
> Copy below is written for $997; swap the two price mentions if the founder
> decision goes the other way.

**Short description**

> A private 90-minute session where we build your buy ladder and your exit
> ladder against your actual portfolio. 4 spots a month.

**Full description**

> ### Stop guessing your entries and exits. Build the actual plan.
>
> The $29 plan is my ladder. The $197 System is the framework. This is the
> one where I sit down with you and we build *yours* — against your real
> capital, your real timeline, your real risk tolerance.
>
> **The session**
> - **90 minutes, private, 1:1 with me.** Not a group call, not a webinar.
> - **Your accumulation ladder** — the levels *you* buy at, sized to the
>   capital you actually have, not a template.
> - **Your exit ladder for the next top** — the tranches, the triggers, and
>   the number you stop being greedy at, decided now while nothing is
>   happening.
> - **You leave with the document.** Plan doc plus the session recording, so
>   the decisions survive the moment you made them.
> - **Two weeks of DM access** afterwards for the questions that only show up
>   once you start executing.
>
> **Why it's capped at 4 a month**
>
> Because it's my calendar, and because the part of the cycle where building
> this matters is the accumulation phase — right now. By the time the next
> top is obvious, the window to have built an exit ladder calmly is gone.
>
> **The honest price framing**
>
> The self-serve route is $29 for the plan and $197 for the System — the
> framework, for you to apply alone. This is the version where I do it with
> you. For reference: I round-tripped about $30,000 in 2022 for want of a
> written exit ladder. That is the number this session exists to stop you
> repeating.
>
> **Zero-risk guarantee.** If within the first 30 minutes you feel it isn't
> for you, say so — I end the call and refund every dollar. I'd rather you
> walk than resent the spend.
>
> *Educational material only. Not financial advice, not a registered
> investment adviser. You build your own plan and make your own decisions —
> that's the entire point.*

---

## Also worth cleaning while you're in the dashboard

Eight retired plans are still present as `hidden` (Core/Pro/Elite monthly and
annual, plus the cardless 7-day trial `plan_zNprCbJjAquZ6` and an orphan
`plan_FJ3YmVpeeF4kH` at $249 with no internal note). Hidden is fine for
grandfathered billing and none of them should be deleted while subscribers
are on them — but the trial plan is a retired offer with a live checkout
object, and the site's code paths for it are already hard-disabled no-ops.
Worth confirming nothing can still reach it.
