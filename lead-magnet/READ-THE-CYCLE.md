## __COVER__

## Your first cycle review

Use this guide to check the LiftOffr Score yourself: identify the data date, inspect the nine
inputs, reproduce the weighted average, and examine historical outcomes. No signup or paid
software is required. The five-step checklist is at **liftoffr.com/checklist**.

Start with one dated reading. Write down its source date, which components are available, and
the total weight used. Then compare your calculation with **liftoffr.com/score**. If they differ,
check dates, normalization and missing inputs before drawing a conclusion.

Work through it once and you'll be able to read any day's Score on your own.

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
| RUPL / NUPL | 5% | Aggregate net unrealized profit/loss relative to market cap |

They sum to 100%. Nothing else feeds the number — not sentiment, not search interest, not
anything proprietary.

The weights are design choices informed by fifteen years of cycle history.

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
That is the entire case for weighting nine of them instead of trusting one.

## The six bands

| Band | Range | What the record shows |
|---|---|---|
| Exit zone | 85–100 | Selected historical tops printed here; the band also persisted while price rose. |
| Warning | 70–below 85 | Has preceded exit-zone readings in past cycles. |
| Mid-cycle | 50–below 70 | The middle range of this scale. |
| Re-accumulation | 30–below 50 | Historically resolved upward more often than not over 180 days. |
| Accumulation | 15–below 30 | Among the lower readings in a cycle. |
| Deep accumulation | 0–below 15 | The lowest band this model produces. |

Each band tells you which part of your written plan applies.

I am not printing today's Score here, because a number in a PDF is wrong by the time you read
it. The live one is free, forever, at **liftoffr.com/score**.

## The divisor rule — the part everyone gets wrong

Some days a source publishes no reading for a component. Pi Cycle alone has no published value
on roughly 349 days of the 5,533-day source series, so any date you pick has a real chance of
being one where something is missing.

**A missing reading is excluded. It is never counted as a zero.** When a 5% component does not
report, you divide by 0.95, not by 1.00.

For example, eight weighted readings sum to 34.5 and the available weights sum to 0.95.
The Score is 34.5 ÷ 0.95 = 36.3, rounded to one decimal place. Dividing by 1.00 would
incorrectly treat the missing component as zero. Match the data date as well as the formula.

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

## How the exit zone played out in 2025

Between 16 November 2024 and 21 October 2025 the Score moved in and out of the exit zone six times:

```
16 Nov 2024   into exit zone     BTC $90,568
18 Feb 2025   back out           BTC $95,444
 8 May 2025   into exit zone     BTC $103,070
19 Jun 2025   back out           BTC $104,710
27 Jun 2025   into exit zone     BTC $107,091
21 Oct 2025   back out           BTC $108,700
```

**Three entries, three exits, one top.** The top came on 6 October 2025 at $124,824, inside the third entry, and the Score left the exit zone fifteen days later.

Any rule of the form "above X, do something" will cross back and forth around X. That is what thresholds do, which is why a written plan decides in advance what a crossing means to you.

All 64 crossings, with the 30-, 90- and 180-day outcome beside each, are at liftoffr.com/receipts. Free, no email required.

## What this is for, then

A number that is the same every morning, computed the same way, published with its weights, that tells you where in a cycle you are, plus a dated record of every signal it has produced.

Ready to turn it into a written plan? The **Bear Market Buy Plan** gives you the buy tiers, the fallback rules and a sizing worksheet to build your own at whatever size you're working with. $29 once, at liftoffr.com/plan.

Either way, you keep everything in this document, the live number and the full record.
