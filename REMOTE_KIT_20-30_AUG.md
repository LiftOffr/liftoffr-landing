# Remote content kit — 20 to 30 Aug

Eleven pieces, one a day, in posting order. **No face, no filming, made from anywhere.**
Every piece is a screen recording or a static frame of something already published on the site.

**Why screen recordings.** Crypto posts pull roughly **12× the shares** of lifestyle posts on
this account — the all-time #3 is *"know exactly when to sell your bitcoin"* at 48.5 shares per
1,000 views against 3.9 for the best lifestyle post. The product is now a visual artifact: a
live number, an arithmetic table, a 64-row log, nine indicator pages that each carry a "where
this has been wrong" section. Filming a screen is credible crypto content with no camera.

**Every factual claim below traces to a `/receipts` row or a published weight.** Nothing here
is new. Where a piece cites a figure, the row is named so it can be checked before posting.

**Rules, same as everywhere:** no instruction to buy, sell or size anything. Describe what the
record did. The CTA is spoken in the first five seconds and burned in as on-screen text.

**Links.** `/aug/N` → `/score` and `/log/N` → `/receipts`, each tagged
`utm_source=instagram&utm_medium=reel&utm_campaign=remote_aug&utm_content=N`. These are a
separate namespace from the Phase B kit's `/r/`, `/w/` and `/p/` links, which carry
`utm_campaign=phase_b` — otherwise August piece 1 and Phase B piece 1 would land in the same
bucket. Use the short link, never a bare URL: a bare link is untagged and the piece becomes
unmeasurable.

---

## Wed 20 Aug — #1 · The whole formula, on screen

- **Hook:** `This is my entire model. Not a summary of it — the actual arithmetic, on one screen.`
- **Screen:** `liftoffr.com/score`. Scroll to the nine-weight table. Hold on it for four seconds
  so it can be paused. Then scroll one line further to the sum and the divisor.
- **Caption:** RHODL 20, Puell 20, Trolololo 15, MVRV 15, Pi Cycle 10, then 2-Year MA, Reserve
  Risk, Woobull and RUPL at 5 each. Multiply each weight by its reading, add them up, divide by
  the weight you actually used. One rule if you try it: if the source published no reading for
  one of the nine that day, it's left out and the divisor drops — today that's 0.95, not 1.00.
  Everything you need is on the page, free, no email.
- **Pinned:** `The nine weights and today's arithmetic → liftoffr.com/aug/1`
- **Destination:** `/aug/1` → `/score`
- **Traces to:** the published weights in `api/cycle-score.js`; the live divisor on `/score`.

## Thu 21 Aug — #2 · My worst call

- **Hook:** `The worst call this model ever made: it said exit, and Bitcoin went up 149% in a month.`
- **Screen:** `liftoffr.com/receipts`, scrolled to the **Nov 17, 2017** row. Highlight the
  +149.1% in the +30d column.
- **Caption:** 17 November 2017. The Score hit 85.5, Bitcoin was $7,729, and the model called
  exit. Over the next thirty days Bitcoin rose 149.1%. That row has never come off the page and
  it never will — a record you've curated is marketing, a record you haven't is evidence. All 64
  crossings are published, winners and losers.
- **Pinned:** `All 64, including that one → liftoffr.com/log/2`
- **Destination:** `/log/2` → `/receipts`
- **Traces to:** `/receipts` row Nov 17 2017 — EXIT, score 85.5, $7,729, +149.1% at 30d.

> This is the most shareable thing on the site and it is currently underused. It is the only
> piece here that leads with a failure, and it should run early.

## Fri 22 Aug — #3 · Where this indicator has been wrong

- **Hook:** `Every indicator page I publish has a section called "where it has been wrong." Here's the one for the heaviest weight in my model.`
- **Screen:** `liftoffr.com/indicators/rhodl-ratio`, scroll to **Where it has been wrong**. Hold.
- **Caption:** RHODL carries the joint-highest weight in the Score at 20%. Its own page says it
  is a top-finder, not a bottom-finder — in a long grind lower it can sit near zero for a year
  while price keeps falling. That's on the page I'm asking you to trust, written by me. An
  indicator page that only lists the times it worked is an advertisement, not a reference.
- **Pinned:** `All nine, each with its own "where it's been wrong" → liftoffr.com/aug/3`
- **Destination:** `/aug/3` → `/score`
- **Traces to:** `/indicators/rhodl-ratio` "Where it has been wrong"; weight 20%.

## Sat 23 Aug — #4 · My numbers aren't statistically significant

- **Hook:** `My model is right about direction 54% of the time. That is not statistically significant, and I'll show you why I still publish it.`
- **Screen:** `liftoffr.com/receipts`, the hit-rate table at the top: 21 of 46 at 30 and 90 days,
  25 of 46 at 180. Then scroll to the paragraph underneath.
- **Caption:** 46 of the 64 crossings point in a direction. The model got 21 right at 30 days and
  25 at 180. Here's the part nobody in this category will tell you: those two numbers sit the
  same distance either side of an even split, so they carry the identical p-value. It would take
  31 of 46 before either meant anything statistically. So no, this doesn't predict next month —
  it was never built to. It's a cycle-position tool measured over months, and I'd rather tell
  you that than let a 54% look like an edge.
- **Pinned:** `The full scoring, and every row it's computed from → liftoffr.com/log/4`
- **Destination:** `/log/4` → `/receipts`
- **Traces to:** `/receipts` hit-rate table; the significance paragraph live on `/receipts`.

## Sun 24 Aug — #5 · Sunday Score (recurring)

- **Hook:** `Sunday. Here's where the cycle sits.`
- **Screen:** static frame — the live number from `liftoffr.com/score` with its band label.
- **Caption:** [Score] out of 100, [band]. Read the band as a description of what that range has
  done historically, not a forecast. The number is recomputed daily from public data and the
  weights are published, so you can check it rather than take it.
- **Pinned:** `Today's number and how it's built → liftoffr.com/aug/5`
- **Destination:** `/aug/5` → `/score`

> **Fill the number on the day from `/score`.** Never pre-write a Score value — it moves daily,
> and a stale number on a page promising a daily number is the one mistake that costs the most.

## Mon 25 Aug — #6 · The model whipsawed

- **Hook:** `My model told me to start selling three times in twelve months. Then it took it back three times.`
- **Screen:** `liftoffr.com/proof`, the six-row transition block. Read down it.
- **Caption:** In on 16 Nov 2024, out on 18 Feb 2025. In on 8 May, out on 19 Jun. In on 27 Jun,
  out on 21 Oct. Six transitions, three entries. The top was 6 October — the model left the exit
  zone for the last time fifteen days after it. A threshold model whipsaws; that's what
  thresholds do. I'm showing it because a record that only contains the clean crossings isn't a
  record.
- **Pinned:** `Every crossing, dated → liftoffr.com/log/6`
- **Destination:** `/log/6` → `/receipts`
- **Traces to:** `/receipts` rows Nov 16 2024, Feb 18 2025, May 8, Jun 19, Jun 27, Oct 21 2025.

## Tue 26 Aug — #7 · Recompute it yourself

- **Hook:** `Pause this, open the same free data source I use, and check my number against yours.`
- **Screen:** split the recording — `liftoffr.com/score` on one side, `colintalkscrypto.com/cbbi`
  on the other. Show the same component reading in both.
- **Caption:** The Score comes from CBBI's public daily data, weighted by numbers I publish on
  every indicator page. Pull the same source, apply the same weights, divide by the weight you
  actually used. You should land on my number. If you run it and get something materially
  different, tell me and I'll fix it — that offer is the entire reason the weights are public.
- **Pinned:** `The weights, the source, the arithmetic → liftoffr.com/aug/7`
- **Destination:** `/aug/7` → `/score`
- **Traces to:** the recompute block on `/score`.

## Wed 27 Aug — #8 · The 2022 signals that lost

- **Hook:** `My model gave two buy signals in 2022. Both were underwater six months later.`
- **Screen:** `liftoffr.com/receipts`, the **May 20 2022** and **Jun 20 2022** rows. Highlight
  both 180-day columns.
- **Caption:** 20 May 2022, Bitcoin $29,224 — down 43.0% at 180 days. 20 June 2022, $20,572 —
  down 18.5%. And it produced no signal at all at the November FTX low. This is what buying a
  zone instead of a bottom looks like, and it's why the plan is a ladder rather than one date.
  Both rows are on the page, where they've always been.
- **Pinned:** `Both rows, and the 62 others → liftoffr.com/log/8`
- **Destination:** `/log/8` → `/receipts`
- **Traces to:** `/receipts` rows May 20 2022 (−43.0% at 180d) and Jun 20 2022 (−18.5% at 180d).

## Thu 28 Aug — #9 · What it caught

- **Hook:** `March 2020. The model read 27 out of 100 the week the world shut down.`
- **Screen:** `liftoffr.com/receipts`, the **Mar 12 2020** row. Then the **Nov 25 2018** row.
- **Caption:** 12 March 2020, Bitcoin $4,959, Score 27.2 — accumulation band. 180 days later
  Bitcoin was up 103.8%. 25 November 2018 at $3,947 read 14.6 and was up 102.4% at 180 days.
  Those are two of the 25 that went the right way at 180 days out of 46 directional crossings.
  The other 21 are on the same page, same table, same columns.
- **Pinned:** `Both rows, and the ones that went the wrong way → liftoffr.com/log/9`
- **Destination:** `/log/9` → `/receipts`
- **Traces to:** `/receipts` rows Mar 12 2020 (score 27.2, $4,959, +103.8% at 180d) and
  Nov 25 2018 (score 14.6, $3,947, +102.4% at 180d); hit rate 25 of 46 at 180d.

> Deliberately paired with #8 two days earlier, and the caption names the ratio. A wins post that
> doesn't say what the wins are out of is the thing this account is trying not to be.

## Fri 29 Aug — #10 · I found a bug in my own arithmetic

- **Hook:** `I found a bug in my own model last week. It made my published number wrong by 1.8 points.`
- **Screen:** `liftoffr.com/score`, the dated correction notice. Read it on screen.
- **Caption:** When the data source publishes no reading for one of the nine, my code was
  averaging that gap in as a reading of zero instead of leaving it out. On 19 August that
  understated the published Score by 1.8 points — 34.5 when it should have read 36.3. Anyone who
  pulled the data and recomputed it properly would have got a different number from mine, and
  they'd have been right. Fixed the same day, the correction is dated on the page, and the
  64-signal record was never affected.
- **Pinned:** `The correction, dated and public → liftoffr.com/aug/10`
- **Destination:** `/aug/10` → `/score`
- **Traces to:** the dated correction notice on `/score`.

## Sat 30 Aug — #11 · Ten days of receipts

- **Hook:** `Ten days ago I said you could check everything on my site. Here's what checking it found.`
- **Screen:** quick cuts — `/score` correction notice, `/receipts` hit-rate table, the Nov 2017
  row, the six-transition block on `/proof`.
- **Caption:** Four corrections went out to the list this week, including one that changed the
  number on my front page. The hit rate now sits at the top of the receipts page instead of
  three clicks in, and it says outright that neither figure is statistically significant. None of
  that makes the model better. It makes it checkable, which is the only claim I've ever made for it.
- **Pinned:** `Start here — the free Score and all 64 signals → liftoffr.com/aug/11`
- **Destination:** `/aug/11` → `/score`

---

## Production notes

- **Record at 1080×1920.** Zoom the browser to 150% before recording; the tables are dense and
  unreadable at default zoom on a phone.
- **Never speak a Score value.** These post across eleven days and the number moves daily. Point
  at the live page instead. The only exception is #10, where 34.5 and 36.3 are historical values
  fixed to a date.
- **The `/receipts` table scrolls sideways on mobile.** Record it on desktop so all seven columns
  are visible at once.
- **Mix:** eight teaching, two loss-transparency (#2, #8), one correction (#10). No offer piece —
  the offer lives in the pinned comment on every one, and #14 of the Phase B kit is the first
  deliberate ask.
- **If a piece can't be posted on its day, drop it rather than shifting the rest.** #5 is Sunday
  and #11 is the closer; those two are fixed.
