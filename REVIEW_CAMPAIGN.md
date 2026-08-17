# The review campaign — built, mostly automated

**Nothing has been sent.** No email went out, no Discord post, no Whop message.
Everything below is built and waiting on the actions in the last section.

**Why this matters more than any copy change:** TJR's Whop listing shows
**4.8★ from 2,240 reviews**. LiftOffr shows none. That gap is the single largest
proof deficit on the site, and until now nothing in the funnel ever asked.

---

## 1. The review destination — read this before writing any copy

**There is no shareable "leave a review" deep link on Whop.** I checked Whop's
help docs, their own creator guide on asking for reviews, and the store pages.
Reviews are left from inside the buyer's own account:

> **Whop → Hub → find LiftOffr → three dots (or gear) → "Leave a Review" →
> pick stars, add a title and comment → submit.**

Facts that shape the copy:

- **Only verified purchasers can review.** Every review carries a
  verified-purchase tag automatically. Nobody outside the buyer list can leave one.
- **The buyer must be logged in**, so the link can only ever go to
  `https://whop.com/hub` — the last hop is theirs.
- **Whop offers creators no built-in review request tool** — no automated
  prompt, no dashboard "request reviews" button, no per-product review URL.
  That is exactly why the automation below had to be built.

**So every request must carry the three-step path in words.** A bare link drops
people on their Hub with no idea what to do next. All the copy below does this.

### The links

| Product | Whop product ID | Where the reviewer goes |
|---|---|---|
| $29 My Bear Market Buy Plan | `prod_qkbRaW1vFT2cM` | `https://whop.com/hub` → LiftOffr → ⋯ → Leave a Review |
| $197 / $147 The Cycle System | `prod_b4DoR00YHuysT` | same path, pick The Cycle System |
| $497 Cycle Playbook | **not recorded in this repo** | same path |

> **One gap:** the Playbook's product ID isn't in the repo anywhere. Until it's
> filled in, `/playbook` renders no rating — correct behaviour, not a bug. Get it
> from dash.whop.com → Products → Cycle Playbook (the `prod_…` in the URL) and
> set it as `WHOP_PLAYBOOK_PRODUCT_ID` in Vercel Production.

---

## 2. The requests — one ask, one link, no preamble

Three rules baked into every version, and they are not stylistic:

1. **Ask everyone.** No filtering for likely-happy buyers. Selectively
   soliciting positive reviews is the 16 CFR 255 problem that took the
   unattributed testimonials off `/playbook`.
2. **No incentive.** Not for a good review, not for any review. If Torin ever
   wants to offer something, it must be for reviewing *at all*, regardless of
   what it says — and it must be disclosed.
3. **Route the unhappy to the refund.** It's already binding for 30 days. A
   refund is cheaper than a bad review and more honest than suppressing one.

### Email — $29 Plan buyers

**Subject:** `three weeks in — worth it or not?`

> Three weeks since you got the plan. Long enough to know whether it did anything.
>
> **Did you actually write your levels down?** That's the only question that matters. Not whether you liked the document — whether it changed what you'll do when price moves.
>
> **If yes:** a review on Whop takes two minutes and does more for this than anything else you could do. Whatever it says. I'm not asking for a good one, I'm asking for a real one.
>
> **If no — or if it wasn't worth the $29 — tell me that instead.** Reply and I'll refund you, and I'd genuinely rather have the correction than the money.
>
> To leave one: open Whop, go to your Hub, find LiftOffr, tap the three dots and choose **Leave a Review**.
>
> — Torin

*This one is **already automated** — see section 3.*

### Email — Cycle System buyers

**Subject:** `did it replace my levels yet?`

> The whole promise of the System is that you stop needing my levels.
>
> **So: are you running the confluence score yourself, or still waiting on my daily read?** Either answer is useful, and either one is worth a review on Whop — Hub → LiftOffr → three dots → Leave a Review.
>
> If it stalled somewhere, reply and tell me which module lost you. That's a gap in how I taught it, and the 30-day refund stands regardless.
>
> — Torin

### Email — Playbook buyers

**Subject:** `your ladders — did you follow them?`

> One question, three weeks on: **is there a number in your ladder you've since decided you wouldn't actually follow?**
>
> If the session was worth it, a review on Whop helps more than you'd think — Hub → LiftOffr → three dots → Leave a Review. Say whatever's true.
>
> If it wasn't, reply and say so. The guarantee didn't expire when the call ended.
>
> — Torin

### Discord announcement — post once in #announcements

> **Asking a favour, and I want to be straight about it.**
>
> If you've bought anything from me — the $29 plan, the System, a Playbook session — I'd like a review on Whop. **Hub → LiftOffr → three dots → Leave a Review.** Two minutes.
>
> I'm not asking for a good review and there's nothing in it for you. I'm asking for a real one, because right now there are zero and that makes it harder for anyone new to judge whether this is worth their money.
>
> And if your honest review would be a bad one — DM me first. The 30-day refund is real and I'd rather fix it or give you your money back than have you sit on something that didn't work.

### Whop DM

Whop supports messaging members through the dashboard's chat. Keep it to this:

> Hey — if you've got two minutes, a review on Whop would help me a lot. Hub → LiftOffr → three dots → Leave a Review. Good or bad, I just want a real one. And if it'd be a bad one, message me first — the 30-day refund still stands.

---

## 3. What's automated, and what it rides on

**A D+21 review request now fires automatically to every $29 plan buyer.**

- Added to the existing plan-buyer sequence in `api/cron-welcome-followups.js`
  (D0 → D1 → D3 → D7 → D14 → **D21 review request**).
- **No new serverless function.** The project sits at Vercel's 12-function cap:
  I removed the vestigial `api/founder-count.js` (it counted the retired 30-seat
  Founder Rate and nothing on the site fetched it) and added `api/reviews.js` in
  its place. Still 12.
- **Timed at 21 days on purpose** — after the last sales email in the sequence,
  so the ask is never bundled with a pitch, and late enough that the buyer has
  actually used the thing.
- **The soft review mention that used to sit in the D7 email was removed**, so
  the ask lands once, cleanly, instead of being diluted mid-sequence.
- Dedupes on Resend's idempotency key like every other step, so a cron retry
  can't double-send.

Preview it without sending:
```
curl -u :$CRON_SECRET "https://liftoffr.com/api/cron-welcome-followups?preview=p21"
```

**System and Playbook buyers are not yet automated** — there's no Resend
audience for either. `RESEND_PLAN_AUDIENCE_ID` exists; the equivalents don't.
Until they do, use the email copy above manually. Same reason emails 2–7 of the
quiz sequence are still dormant.

---

## 4. What displays, where, and the rule it obeys

`api/reviews.js` reads Whop's reviews API and returns count, average and rows.
`js/reviews.js` renders them.

| Page | Position | Mode |
|---|---|---|
| `/plan` | directly above the guarantee block | stars + count + up to 3 quotes |
| `/system` | directly above the guarantee block | stars + count + up to 3 quotes |
| `/playbook` | directly above the guarantee block | stars + count + up to 2 quotes |
| `/` homepage | at the decision point, above the guarantee | one-line rating + count |

Those positions come from the TJR teardown in `COMPETITOR_STANDARD.md`: rating
adjacent to the risk-reversal, before the price ask.

**The hard rule, enforced in code:** nothing renders until real published
reviews exist. No placeholder stars, no "no reviews yet", no skeleton, no seeded
example. The container stays empty and the page reads exactly as it does today.

Three filters run server-side before anything reaches a page:

- `status === "published"` — Whop's own moderation state; pending and removed are dropped.
- `paid_for_product !== false` — verified purchase only.
- A real name or `@username` — anything that would display anonymously is dropped
  rather than shown as "a member". That's the specific failure that took the old
  testimonials down.

A Whop outage returns the same empty shape as "no reviews yet", so a bad fetch
can never paint a broken widget on a sales page.

---

## 5. Actions left for Torin

Ordered by value.

1. **Post the Discord announcement.** ~1 minute, reaches all 70 members, and
   it's the only channel that reaches people who bought before the automation
   existed. Copy is in section 2.
2. **Send the three buyer emails.** I can't send them — every Vercel secret is
   sensitive-flagged, so `RESEND_API_KEY` is unreadable by anyone but Torin via
   the Resend dashboard. Two options:
   - Resend → Broadcasts → paste the copy → pick the audience → send, **or**
   - hand me a Resend API key with send scope and I'll do it and verify delivery.
3. **Whop DM the buyer list**, dashboard chat, copy in section 2.
4. **Fill in the Playbook product ID** — dash.whop.com → Products → Cycle
   Playbook → copy the `prod_…` from the URL → set `WHOP_PLAYBOOK_PRODUCT_ID` in
   Vercel Production → redeploy. Until then `/playbook` shows no rating.
5. **Create Resend audiences for System and Playbook buyers** if you want their
   review requests automated too, the same way the plan buyers' now is.

**Nothing else needs doing.** Every future $29 buyer gets asked at day 21
automatically, and the moment the first real review lands it appears on `/plan`
and the homepage without another deploy.
