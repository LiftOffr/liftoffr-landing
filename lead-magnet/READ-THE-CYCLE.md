## __COVER__

## Before anything else: what this is not

This is not a buy plan. There are no trigger prices in it, no tranche sizes, and no budget
figures, and that is deliberate rather than a gap I ran out of time to fill.

The document this replaces had all three, and it had them wrong. It published four buy bands
anchored to a 200-week moving average as it stood in July 2026, a five-way capital split, and a
line reading "It's at 26 right now" about a number that changes every morning. Every one of
those went stale within weeks, and the ladder in it did not match the ladder in the paid plan
that the same person sells. Someone who read both got two incompatible documents from me. That
is the exact problem this whole body of work exists to stop, so the fix is not a fresher set of
levels — it is not putting levels in a free PDF at all.

What you get instead is the thing the levels were supposed to rest on: **the number itself, in
full, with the arithmetic exposed and the failures published.** Read it and you can compute the
LiftOffr Score yourself, from free public data, without me. That is not a teaser for something
paid. It is the whole method.

Nothing in this document tells you to buy, sell, size or time anything.

## The nine components, and what each one is worth

The Score is a weighted average of nine public indicators, normalised 0-100. The weights are
fixed, published, and the only thing that turns nine readings into one number.

| Component | Weight | What it measures |
|---|---:|---|
| RHODL Ratio | 20% | Where value sits between recently-moved and long-dormant coins |
| Puell Multiple | 20% | Miner revenue against its own yearly average |
| Trolololo trend line | 15% | Price against a long-run logarithmic regression |
| MVRV Z-Score | 15% | Market value against realised value, in standard deviations |
| Pi Cycle Top | 10% | The 111-day MA against twice the 350-day MA |
| 2-Year MA Multiplier | 5% | Price between its two-year mean and five times that mean |
| Reserve Risk | 5% | Holder conviction against the reward for abandoning it |
| Woobull Top Cap | 5% | Price as a fraction of a modelled long-run ceiling |
| RUPL / NUPL | 5% | The share of supply held at a paper profit |

They sum to 100%. Nothing else feeds the number — not sentiment, not search interest, not
anything proprietary.

The weights were set by how much each component has actually helped at past cycle turns, not by
how well known it is. You do not have to take that on trust; the next page is the evidence, and
you can check every cell of it against free public sources.

## The Phase Matrix

What each component read on the day of each cycle turn, normalised 0-100, from the same daily
series the live number is built from.

```
Component              Wt   2013  2017  2021  2025 | 2015  2018  2022
                            top   top   top   top  | bot   bot   bot
RHODL Ratio           20%    100   100    93    89 |   0     2     3
Puell Multiple        20%     99   100    76    95 |   0     0    17
Trolololo trend line  15%    100   100   100    86 |   0     4     0
MVRV Z-Score          15%     97   100    88    92 |   0     0     0
Pi Cycle Top          10%     95   100    58    71 |   0    17    11
2-Year MA Multiplier   5%     98   100    81    96 |   0     6     0
Reserve Risk           5%     96   100    91    99 |   0     7     0
Woobull Top Cap        5%     96   100    92    93 |   0     0     0
RUPL                   5%    100   100    98    96 |   5     0     0
```

Read down a column to see what a cycle turn looked like across the whole model at once. Read
across a row to see how one component has behaved over four tops and three bottoms.

**The thing the columns show that no single indicator can.** No component reads at its extreme
at every turn. Pi Cycle read 100 in 2017 and 71 in 2025. Puell read 76 at the 2021 top against
99 in 2013. A reading that would have been decisive in one cycle was unremarkable in the next.
That is the entire case for weighting nine of them instead of trusting one — and it is also the
reason the weighted number is a description of where you are, not a forecast of where you are
going.

## The six bands

| Band | Range | What the record shows |
|---|---|---|
| Exit zone | 85-100 | Every cycle top since 2013 printed here. The Score has **also** sat here for months while price kept rising. |
| Warning | 70-85 | Has preceded exit-zone readings, though not every time. |
| Mid-cycle | 50-70 | Historically the least informative band. |
| Re-accumulation | 30-50 | After a drawdown stops deepening, before the next expansion. Has resolved upward more often than not at 180 days. |
| Accumulation | 15-30 | Among the lower readings in a cycle. |
| Deep accumulation | 0-15 | The lowest band the Score produces. |

Every one of those descriptions is a statement about the past. None is a prediction, and none of
them tells you what to do at any reading.

I am not printing today's Score here, because a number in a PDF is wrong by the time you read
it. The live one is free, forever, at **liftoffr.com/score**.

## The divisor rule — the part everyone gets wrong

Some days a source publishes no reading for a component. Pi Cycle alone has no published value
on roughly 349 days of the 5,533-day source series, so any date you pick has a real chance of
being one where something is missing.

**A missing reading is excluded. It is never counted as a zero.** When a 5% component does not
report, you divide by 0.95, not by 1.00.

This is not pedantry. Treating a missing reading as a zero drags the number down for a reason
that has nothing to do with the market, and a recompute that always divides by 1.00 will
disagree with the published history on exactly those dates — and it will be the one that is
wrong. Getting this rule wrong understated the published Score by 1.8 points until it was
caught and fixed on 20 August 2026, and that correction is dated on the site.

## Recompute it yourself, in about ten minutes

Do this once and you never have to take my word for a number again.

1. Open **colintalkscrypto.com/cbbi** — the public daily data source. Free, no account.
2. Read off the nine component values. They are already normalised to 0-100.
3. Multiply each by its weight from the nine-component table earlier in this document.
4. Add the products.
5. Divide by the weight you actually used — 1.00 if all nine reported, less if any did not.
6. Compare against **liftoffr.com/score**.

You should land on the same number.

If you run it properly and get something materially different, tell me and I will fix it. That
offer is the entire reason the weights are public, and it has been taken up and been correct at
least once.

**To check a past date instead of today,** pick any row from the 64-crossing log at
liftoffr.com/receipts and recompute that date. The same divisor rule applies.

## What carries zero weight, and why

Three well-known indicators are deliberately not inputs. They are worth looking at. They are
not part of the number, and confusing the two is how people end up unable to reproduce a figure
they were told they could check.

**CBBI** is the *source*, not a component. The Score reads its nine component values from CBBI's
public data. Including CBBI's own composite as a tenth input would count the same underlying
readings twice.

**The Fear & Greed Index** measures how people feel; the Score measures what the chain and the
price structure are doing. At the October 2025 top, Fear & Greed never reached Extreme Greed. A
framework that required a sentiment extreme to confirm that top was waiting for a confirmation
that never arrived.

**Google Trends** measures retail attention, which historically follows price rather than
leading it, and its scale is relative to whatever window you chose — a "100" in one date range
is not a "100" in another. There is no stable level to weight. At the October 2025 top it sat
well below its 2021 levels.

## Where it has been wrong

A model you can check has to survive being checked, so here is the part most people leave out.

**Directional accuracy, over 64 dated zone crossings from 2011 to 2025:**

| Horizon | Right | Rate |
|---|---|---|
| 30 days | 21 of 46 | 46% |
| 90 days | 21 of 46 | 46% |
| 180 days | 25 of 46 | 54% |

Forty-six, not sixty-four, because 18 of the crossings point nowhere directionally and are
excluded rather than quietly counted. On 46 crossings you would need **31 of them — 67%** before
the result cleared statistical significance. Neither 46% nor 54% is distinguishable from a coin
flip, and I do not publish either as a win rate.

**The whipsaw.** Between 16 November 2024 and 21 October 2025 the Score moved in and out of the
exit zone six times:

```
16 Nov 2024   into exit zone     BTC $90,568
18 Feb 2025   back out           BTC $95,444
 8 May 2025   into exit zone     BTC $103,070
19 Jun 2025   back out           BTC $104,710
27 Jun 2025   into exit zone     BTC $107,091
21 Oct 2025   back out           BTC $108,700
```

**Three entries, three retreats — six transitions, not six signals.** Counting all six as "the
model said sell six times" describes a stronger signal than the log contains, and I made exactly
that error on my own site before correcting it. Two of the three entries did not contain a top.
The top was 6 October 2025 at $124,824, and the Score left the exit zone for the last time
fifteen days *after* it.

Any rule of the form "above X, do something" will flip back and forth around X. That is not a
broken threshold, it is what thresholds do — which is why a threshold model is only usable if
you have decided in advance what a crossing means to you.

All 64 crossings, with the 30-, 90- and 180-day outcome beside each, are at
**liftoffr.com/receipts**. Free, no email required, including every one that went the wrong way.

## What this is for, then

Not prediction. A number that is the same every morning, computed the same way, published with
its weights, that tells you roughly where in a cycle you are — plus a written record of every
time it has been early, late or wrong.

What you do with that is yours, and I am not going to pretend otherwise. If you want to see how
I turned it into a ladder with my own money — the tiers, the fallback dates, the override log,
and a worksheet for building your own at whatever size you are actually working with — that is
**My Bear Market Buy Plan**, $29 once, at liftoffr.com/plan. It is a description of what I did,
not an instruction for what you should.

If you never buy it, you still have everything in this document, and the live number, and the
full record. That was the point.

## The part the lawyers care about, and so should you

Educational content only. **This is not financial advice, I am not a registered investment
adviser, and nothing here is personalised to you.** Nothing in this document is an instruction
to buy, sell, size or time a position.

Every dated signal referenced here is the LiftOffr Score computed over public historical price
and on-chain data — a backtest, not a record of trades placed or calls published at the time.
Past performance does not predict future results.

Bitcoin can fall further than you expect, stay down longer than you expect, and can go to zero.
Do your own research. Never deploy money you cannot afford to lose. 18+ only.

LiftOffr LLC (Montana). Full disclaimer at liftoffr.com/disclaimer.
