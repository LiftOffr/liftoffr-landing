<!-- DRAFTING DOC — NOT SERVED, BUT THIS IS WHAT LIVE COPY GETS REWRITTEN FROM.
     Wording here must match the live code, not precede it. Three separate rounds of
     corrections were undone by someone re-copying from a doc like this one.
     Canonical sources: api/cycle-score.js commentary() for bands and register,
     /receipts for every figure. See COPY_SWEEP_NOTES.md. -->

# Broadcasts — drafted, not scheduled, not sent

**Status: DRAFT COPY. Nothing here sends.** Written 2026-08-20.

---

## Broadcast 1 — the corrections email

**Send to:** the free list.
**Subject:** `three things on the site were wrong. here they are.`

This is the highest-leverage piece of writing in the whole plan. It converts the
site's largest liability into its strongest asset, it cannot be faked, and it is the
same move the quiz sequence already makes at email 3 ("don't trust my backtest"). No
competitor in the eleven-operator sample has sent anything like it.

**Send it only after the site changes are live**, so every claim in it is checkable
at the moment it lands. All three corrections below shipped on the
`audit-fixes-2026-08-20` branch.

> I went through liftoffr.com line by line this week and found things that don't hold
> up. Rather than quietly fix them, here they are.
>
> **1. Three "signals" on the homepage were never signals.** The page said the model
> gave a buy signal on 15 December 2018 at $3.2K. It didn't. That's the market's
> actual bottom date and price, and I'd labelled it as my model's call. The model's
> nearest real signal was 25 November 2018 at $3,947 — twenty days earlier and 24%
> higher. Same problem with a November 2022 buy signal I claimed (the model's two
> actual 2022 signals were both underwater six months later, at −43% and −18.5%) and
> a December 2024 exit at $104K (the real exit was 16 November 2024 at $90,568, after
> which Bitcoin rose 14.5% over six months). All three are gone. The real rows are on
> the page instead.
>
> **2. The FAQ listed the wrong indicators.** It named eight, two of which — Fear &
> Greed and Google Trends — carry zero weight in the actual Score. The real list is
> nine: RHODL 20, Puell 20, Trolololo 15, MVRV-Z 15, Pi Cycle 10, 2YMA 5, Reserve
> Risk 5, Woobull 5, RUPL 5. If you ever tried to recompute the number from the FAQ,
> it wouldn't have worked. That's my fault and it's fixed everywhere.
>
> **3. The homepage said the model "was out before the turn" in 2025.** It wasn't. It
> entered the exit zone three times between November 2024 and October 2025 and
> dropped back out of it three times — six transitions — and only left it for good
> fifteen days *after* the top. Every one of those
> transition is now on the page with its date and price.
>
> I'm sending this because the entire argument for this thing is that you can check
> it. That argument doesn't survive me quietly editing pages.
>
> Everything is at /receipts, unchanged, including the signals that went the wrong
> way. While I was in there I also put the honest scoring at the top of that page:
> across the 46 directional crossings the model was right about direction 21 times at
> 30 days, 21 at 90, and 25 at 180. None of the three is distinguishable from chance:
> 21 and 25 of 46 carry the same p-value, and it would take 31 of 46 to clear significance.
> It's a multi-month cycle tool, not a next-month predictor, and now the page says so
> before it says anything else.
>
> — Torin

---

## Broadcast 2 — Sunday Score, standing template

**Subject:** `Score: [N]. [Zone].`

> **[N.N] — [ZONE]** · Bitcoin $[price] · [date]
>
> **What moved it:** [one sentence, the largest weight change]
>
> **What the zone has historically meant:** [one sentence, past tense, no forecast]
>
> **What I'm doing:** [one sentence, first person, no instruction]
>
> Recompute it yourself: [nine weights, source link]
> Full record, losers included: /receipts

**Never** put a price target, a ticker, an entry, an exit, or the word "should" in
this email.

"What I'm doing" is a disclosure. "What you should do" is advice. The gap between
those two sentences is the entire compliance position, and it is the difference
between publishing and advising. A timely, instrument-specific message to a paid
subscriber is outside the publisher's exclusion and no disclaimer cures it.

---

## Discord server description — REPLACE THIS TONIGHT

**Not applied by this pass.** The description lives in Discord's server settings, not
in this repo, and changing it is a publish action. Torin does this one.

**Current, live, on guild `1380245793780531351`** — this is the first thing a free
lead reads after clicking through from `/free`:

> "Exclusive community for **young men building real wealth**. Learn the exact
> strategies that **built $250K by 23** through crypto, investing, and smart money
> moves. **Weekly calls**, daily education, **portfolio reviews**, and direct access
> to proven wealth building systems. **No BS, just results.**"

Four problems in forty-five words, and it is the single highest-severity string
across all LiftOffr properties:

1. **"built $250K by 23"** is a specific personal income claim with no substantiation
   anywhere, in a free channel, aimed at an audience that is 46.7% aged 18–24. It
   also directly contradicts `/plan`'s own line: *"I will never tell you what you'll
   make, because I don't know and neither does anyone who says otherwise."*
2. **"young men"** contradicts the homepage's *"For people who own Bitcoin, have a job."*
3. **"Weekly calls… portfolio reviews"** are not in the free tier and do not exist.
   "Portfolio reviews" is also the single phrase across these properties most likely
   to be read as personalised investment advice, which is where the publisher's
   exclusion breaks.
4. **"No BS, just results"** is an implied outcome promise, and precisely the register
   `/about` claims to reject.

**Replacement — paste this:**

> The free room behind LiftOffr. One Bitcoin cycle Score, nine published indicator
> weights, recomputed daily from public data — and a log of every signal it has ever
> produced, including the ones that went the wrong way. Daily read at 8am MT. No
> calls, no alerts, no tips, no tickers. Educational only, not financial advice.
> Nothing here is personalised to you. 18+.

**Rules to pin in the server at the same time:** no tickers, no entries, no targets,
no "I'm buying X" — from Torin or from members. Archive everything. A free Discord
becomes acutely dangerous the moment anybody in it posts a specific entry.
