# The Score itself — `m4-score-1` … `m4-score-5`

Five lessons, posted as the first five channels of Discord **Module 4**, before the nine
component lessons. By the end you can compute the Score by hand from free public data and get
the same number the site publishes. That is the whole point: if you cannot reproduce it, you are
trusting me, and trusting me is not the product.

---

## `#m4-score-1-what-the-score-is` — What the Score is

One number between 0 and 100 describing where Bitcoin sits in its cycle. It is a weighted
average of nine on-chain and market components, recomputed every morning from public data.

**The nine, and what each carries:**

| Component | Weight |
|---|---:|
| RHODL Ratio | 20% |
| Puell Multiple | 20% |
| Trolololo trend line | 15% |
| MVRV Z-Score | 15% |
| Pi Cycle Top | 10% |
| 2-Year MA Multiplier | 5% |
| Reserve Risk | 5% |
| Woobull Top Cap | 5% |
| RUPL | 5% |

They sum to 100%. Those weights are published on every indicator page and in the API response,
and they are the same numbers the site, the Sunday email and the Discord bot all use.

**What it is not.** It is not a price prediction, not a signal to act on, and not personalised
to anyone. It is a description of where a set of public measurements currently sit relative to
their own history.

**Why nine and not one.** Every single indicator in this course has failed at least once, and
`#m4-l1` through `#m4-l9` show you exactly where each one failed. A weighted average does
not fix that — it spreads it. One component being wrong moves the number a little instead of a
lot. That is the entire argument for the design, and it is worth understanding as a trade-off
rather than a solution: the same averaging that stops one bad reading dominating also stops one
correct early warning dominating.

---

## `#m4-score-2-the-six-bands` — The six bands

The Score is reported in six bands. These are the only ones, and they are identical everywhere
the number appears.

| Band | Range | What the record shows |
|---|---|---|
| Exit zone | 85–100 | Every cycle top since 2013 printed with the Score in this band. It has **also** sat here for months while price kept rising. |
| Warning | 70–85 | Has preceded exit-zone readings, though not every time. |
| Mid-cycle | 50–70 | Historically the least informative band. |
| Re-accumulation | 30–50 | The band after a drawdown has stopped deepening but before the next expansion. Historically it has resolved upward more often than not at 180 days. |
| Accumulation | 15–30 | Among the lower readings in a cycle. |
| Deep accumulation | 0–15 | The lowest band the Score produces. |

**Read the exit-zone row twice.** Both halves are true at once: every top happened in that band,
*and* the band has been occupied for long stretches with no top following. A band that contains
every top but also contains long stretches of nothing is useful for knowing roughly where you
are and useless for knowing what happens next. Any version of this that only tells you the first
half is selling you something.

**What "re-accumulation" actually means**, since it is the band people ask about and the one the
Score spends a lot of time in: it is not "the bottom is in". It is the range the Score occupies
after the deepest part of a drawdown has passed but before the next expansion has established
itself. Historically it has resolved upward more often than not over a 180-day window. That is a
description of what has happened before, not a forecast, and "more often than not" is doing real
work in that sentence — see `#m5-l3-why-46pct-and-54pct-are-the-same`.

Every band description above is a statement about the past. None of them is a prediction.

---

## `#m4-score-3-the-arithmetic` — The arithmetic

Three steps.

1. Take each component's reading, normalised to 0–100.
2. Multiply each reading by its weight.
3. Add those products together, then **divide by the total weight you actually used.**

On a normal day step 3 divides by 1.00, because all nine components reported and the weights
sum to 100%. Worked example, using the readings published on 19 August 2026:

```
RHODL Ratio          0.20 × 30.8 =  6.16
Puell Multiple       0.20 × 70.9 = 14.18
Trolololo            0.15 × 20.9 =  3.135
MVRV Z-Score         0.15 × 12.8 =  1.92
Pi Cycle Top         0.10 × 38.8 =  3.88
2-Year MA Multiplier 0.05 × 50.9 =  2.545
Reserve Risk         0.05 × 19.1 =  0.955
Woobull Top Cap      0.05 × (no reading published — see `#m4-score-4-the-divisor-rule`)
RUPL                 0.05 × 34.5 =  1.725
                                   ───────
Sum of the eight that reported     = 34.50
Divide by the weight actually used = ÷ 0.95
                                   ───────
Score                              = 36.3
```

That is the entire calculation. There is no second model behind it, no discretionary
adjustment, and nothing held back for paying customers — this same arithmetic renders live on
liftoffr.com/score, free, with no email required.

---

## `#m4-score-4-the-divisor-rule` — The divisor rule

This is the lesson people skip and then email me about, so it gets its own page.

**When the data source publishes no reading for one of the nine on a given day, that component
is excluded and the divisor drops to match.** It is never counted as a reading of zero.

In the example above, Woobull Top Cap had no published reading on 19 August. Its 5% weight comes
out of the divisor, so the eight remaining readings are divided by 0.95 rather than 1.00. Divide
by 1.00 instead and you get 34.50 — nearly two points lower — and you would conclude the
published number was wrong.

**Why this matters more than it looks.** Treating a missing reading as zero drags the average
toward zero every time a feed goes quiet. It is a silent error: nothing breaks, nothing warns
you, the number is just wrong in a direction that looks plausible.

**This is not hypothetical — I shipped exactly that bug.** My own code averaged missing readings
in as zeros. On a day when Woobull did not report, that understated the published Score by
**1.8 points**: it read 34.5 when it should have read 36.3. Someone who pulled the same data and
divided properly got a different number from mine, and they were right.

It is fixed, the correction is dated on liftoffr.com/score, and the 64-signal record was never
affected because that log was generated by code that handled it correctly.

That is the practical case for publishing a method rather than a conclusion: a published method
can be checked by the people using it, and this one was.

---

## `#m4-score-5-reproduce-it-unaided` — Reproduce it unaided

The exercise for this module. Do it once and you never have to take my word for a number again.

1. Open **colintalkscrypto.com/cbbi** — the public daily data source. Free, no account.
2. Read off the nine component values. They are already normalised to 0–100.
3. Multiply each by its weight from `#m4-score-1-what-the-score-is`.
4. Add the products.
5. Divide by the weight you actually used — 1.00 if all nine reported, less if any did not.
6. Compare against **liftoffr.com/score**.

You should land on the same number. If you run it properly and get something materially
different, tell me and I will fix it — that offer is the entire reason the weights are public,
and it has been taken up and been correct at least once.

**To check a past date instead of today:** pick any row from the 64-crossing log at
liftoffr.com/receipts and recompute that date. Same rule about the divisor applies. It matters more
historically than it looks: Pi Cycle alone has no published reading on roughly 349 days of the
5,533-day source series, so any date you pick has a real chance of being one where a component
is missing. A recompute that always divides by 1.00 will disagree with those rows, and it will
be the one that is wrong.
