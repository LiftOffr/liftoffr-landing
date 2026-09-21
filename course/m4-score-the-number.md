# The Score itself — `m4-score-1` … `m4-score-5`

Five lessons, posted as the first five channels of Discord **Module 4**, before the nine
component lessons. By the end you can compute the Score by hand from free public data and get
the same number the site publishes. That is the whole point: if you cannot reproduce it, you are
trusting me, and trusting me is not the product.

---

## `#m4-score-1-what-the-score-is` — What the Score is

# The Score, lesson 1 — What the Score is

**Read the five `m4-score-*` channels before `m4-l1`.** They are the arithmetic spine: what the number is, how it is computed, and how you reproduce it yourself. The nine component lessons only make sense once you know what the components feed into.

One number between 0 and 100 describing where Bitcoin sits in its cycle. It is a weighted average of nine on-chain and market components, recomputed every morning from public data.

**The nine, and what each carries:**

```
Component               Weight
RHODL Ratio               20%
Puell Multiple            20%
Trolololo trend line      15%
MVRV Z-Score              15%
Pi Cycle Top              10%
2-Year MA Multiplier       5%
Reserve Risk               5%
Woobull Top Cap            5%
RUPL                       5%
                  total  100%
```

They sum to 100%. Those weights are published on every indicator page and in the API response, and they are the same numbers the site, the Sunday email and this server's bot all use.

**What it is not.** Not a price prediction, not a signal to act on, and not personalised to anyone. It is a description of where a set of public measurements currently sit relative to their own history.

**Why nine and not one.** Every single indicator in this module has failed at least once, and lessons 1 to 9 show you exactly where each one failed. A weighted average does not fix that — it spreads it. One component being wrong moves the number a little instead of a lot.

That is the entire argument for the design, and it is worth understanding as a trade-off rather than a solution: **the same averaging that stops one bad reading dominating also stops one correct early warning dominating.**

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ *First lesson in this module* · **Next:** <#1540323884677726328> ▶
↩ **Module 4 overview:** <#1443375956835303535> · 🗺️ **Course map:** <#1442207394439626802>

## `#m4-score-2-the-six-bands` — The six bands

# The six Score bands

These names partition the normalized reading. Lower bounds are included; upper bounds are excluded, except the final band includes 100.

```
85–100       Exit zone
70–below 85  Warning
50–below 70  Mid-cycle
30–below 50  Re-accumulation
15–below 30  Accumulation
0–below 15   Deep accumulation
```

The names do not establish that a bottom has passed, a top has arrived, or a purchase or sale is appropriate. A reading can move between bands repeatedly. Historical top dates in the published matrix had elevated readings, but the dates are selected with hindsight and elevated readings also occurred before further gains.

**Exercise:** classify 14.9, 15, 30, 50, 70 and 85. Answers: deep accumulation, accumulation, re-accumulation, mid-cycle, warning and exit. Then explain why moving from 29.9 to 30 does not establish a new market fact beyond crossing this chosen boundary.

Compare readings from the same data date and model version. Source revisions or missing components can affect comparisons. The next lessons show the calculation and the missing-data rule.

Next: <#1540323914977382461> · Course map: <#1442207394439626802>


## `#m4-score-3-the-arithmetic` — The arithmetic

# The Score, lesson 3 — The arithmetic

Three steps.

1. Take each component's reading, normalised to 0–100.
2. Multiply each reading by its weight.
3. Add those products together, then **divide by the total weight you actually used.**

On a normal day step 3 divides by 1.00, because all nine components reported and the weights sum to 100%. Worked example, using the readings published on **19 August 2026**:

```
RHODL Ratio           0.20 × 30.8 =  6.16
Puell Multiple        0.20 × 70.9 = 14.18
Trolololo             0.15 × 20.9 =  3.135
MVRV Z-Score          0.15 × 12.8 =  1.92
Pi Cycle Top          0.10 × 38.8 =  3.88
2-Year MA Multiplier  0.05 × 50.9 =  2.545
Reserve Risk          0.05 × 19.1 =  0.955
Woobull Top Cap       0.05 × (no reading published — see lesson 4)
RUPL                  0.05 × 34.5 =  1.725
                                    ───────
Sum of the eight that reported      = 34.50
Divide by the weight actually used  = ÷ 0.95
                                    ───────
Score                               = 36.3
```

That is the entire calculation. **There is no second model behind it, no discretionary adjustment, and nothing held back for paying customers** — this same arithmetic renders live on **liftoffr.com/score**, free, with no email required.

If that sounds like it undermines the product, it is worth being clear that it *is* the product. What you are paying for is the explanation of why those nine and those weights, where each has failed, and what the record does and does not support. Not access to the number.

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ **Previous:** <#1540323884677726328> · **Next:** <#1540323967930339409> ▶
↩ **Module 4 overview:** <#1443375956835303535> · 🗺️ **Course map:** <#1442207394439626802>

## `#m4-score-4-the-divisor-rule` — The divisor rule

# The Score, lesson 4 — The divisor rule

This is the lesson people skip and then email me about, so it gets its own channel.

**When the data source publishes no reading for one of the nine on a given day, that component is excluded and the divisor drops to match. It is never counted as a reading of zero.**

In lesson 3's example, Woobull Top Cap had no published reading. Its 5% weight comes out of the divisor, so the eight remaining readings are divided by **0.95** rather than 1.00. Divide by 1.00 instead and you get 34.50 — nearly two points lower — and you would conclude the published number was wrong.

**Why this matters more than it looks.** Treating a missing reading as zero drags the average toward zero every time a feed goes quiet. It is a silent error: nothing breaks, nothing warns you, the number is just wrong in a direction that looks plausible.

It is not rare, either. Pi Cycle alone has no published reading on roughly **349 days of the 5,533-day** source series.

## This is not hypothetical — I shipped exactly that bug

My own code averaged missing readings in as zeros. On a day when Woobull did not report, that understated the published Score by **1.8 points**: it read 34.5 when it should have read 36.3.

Someone who pulled the same data and divided properly got a different number from mine, **and they were right.**

It is fixed, the correction is dated on **liftoffr.com/score**, and the 64-signal record was never affected because that log was generated by code that handled it correctly.

That is the practical case for publishing a method rather than a conclusion: **a published method can be checked by the people using it, and this one was.**

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ **Previous:** <#1540323914977382461> · **Next:** <#1540323997940711494> ▶
↩ **Module 4 overview:** <#1443375956835303535> · 🗺️ **Course map:** <#1442207394439626802>

## `#m4-score-5-reproduce-it-unaided` — Reproduce it unaided

# The Score, lesson 5 — Reproduce it unaided

The exercise for this module. **Do it once and you never have to take my word for a number again.**

1. Open **colintalkscrypto.com/cbbi** — the public daily data source. Free, no account.
2. Read off the nine component values. They are already normalised to 0–100.
3. Multiply each by its weight from lesson 1.
4. Add the products.
5. Divide by the weight you actually used — 1.00 if all nine reported, less if any did not.
6. Compare against **liftoffr.com/score**.

You should land on the same number.

**If you run it properly and get something materially different, tell me and I will fix it.** That offer is the entire reason the weights are public, and it has been taken up and been correct at least once — see lesson 4.

**To check a past date instead of today:** pick any row from the 64-crossing log at liftoffr.com/receipts and recompute that date. The same divisor rule applies, and it matters more historically than it looks — a recompute that always divides by 1.00 will disagree with those rows, and it will be the one that is wrong.

---

**That is the arithmetic spine finished.** You now know what the number is, what the bands mean, how it is computed, the one rule that trips people up, and how to reproduce it without me.

**Next:** <#1540324063832969256> through <#1540324399645990992> — the nine components in weight order, each with what it measures, why it carries the weight it does, what it read at all seven cycle turns since 2013, and where it has been wrong. Then <#1540324493707444307> for what carries no weight at all.

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ **Previous:** <#1540323967930339409> · **Next:** <#1540324063832969256> ▶
↩ **Module 4 overview:** <#1443375956835303535> · 🗺️ **Course map:** <#1442207394439626802>
