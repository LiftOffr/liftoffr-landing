# The 5% components — `m4-l6` … `m4-l9`

The four that carry 5% each. Every lesson below follows the same four parts: what it measures,
why it carries the weight it does, how to read it, and where it has been wrong. Nothing here
tells you what to do with a reading.

---

## `#m4-l6-2y-ma-multiplier-5pct` — 2-Year MA Multiplier · 5% of the Score

# Lesson 6 — 2-Year MA Multiplier · 5% of the Score

**What it measures.** Where price sits between its two-year mean and five times that mean.

**How it is calculated.** Price versus the 730-day MA and versus 5 × the 730-day MA, normalised 0-100.

**Why it carries 5%.** These are design weights informed by selected historical turns. That is an in-sample rationale, not evidence that this weighting outperforms alternatives or will predict future turns. The readings below use the source series, including its normalization.

**What it read at every cycle turn** — same daily series the live number comes from:

```
Cycle turn   Date         BTC close  Reading (0–100)
2013 top     2013-11-30   $1,119     98
2017 top     2017-12-17   $19,250    100
2021 top     2021-11-10   $64,756    81
2025 top     2025-10-06   $124,824   96
2015 bottom  2015-01-14   $176       0
2018 bottom  2018-12-15   $3,185     6
2022 bottom  2022-11-21   $15,778    0
```
**Where it has been wrong.** It is slow by construction — a two-year average takes months to reflect a regime change, so it confirms rather than warns. It also has no opinion on how long price stays under the line, which is the part that hurts.

Live reading, and this table in full: **liftoffr.com/indicators/2-year-ma-multiplier**

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ **Previous:** <#1540324251008245770> · **Next:** <#1540324343635255398> ▶
↩ **Module 4 overview:** <#1443375956835303535> · 🗺️ **Course map:** <#1442207394439626802>

## `#m4-l7-reserve-risk-5pct` — Reserve Risk · 5% of the Score

# Lesson 7 — Reserve Risk · 5% of the Score

**What it measures.** The ratio of holder conviction to the reward for abandoning it.

**How it is calculated.** Price ÷ HODL bank (cumulative coin-days destroyed opportunity cost), normalised 0-100.

**Why it carries 5%.** These are design weights informed by selected historical turns. That is an in-sample rationale, not evidence that this weighting outperforms alternatives or will predict future turns. The readings below use the source series, including its normalization.

**What it read at every cycle turn** — same daily series the live number comes from:

```
Cycle turn   Date         BTC close  Reading (0–100)
2013 top     2013-11-30   $1,119     96
2017 top     2017-12-17   $19,250    100
2021 top     2021-11-10   $64,756    91
2025 top     2025-10-06   $124,824   99
2015 bottom  2015-01-14   $176       0
2018 bottom  2018-12-15   $3,185     7
2022 bottom  2022-11-21   $15,778    0
```
**Where it has been wrong.** It depends on coin-day metrics that exchange and ETF custody distort — coins moving between custodial wallets look like holders capitulating when nothing changed hands economically. Custody changes can complicate interpretation; this lesson does not quantify a post-2024 causal effect.

Live reading, and this table in full: **liftoffr.com/indicators/reserve-risk**

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ **Previous:** <#1540324284759674931> · **Next:** <#1540324377378164736> ▶
↩ **Module 4 overview:** <#1443375956835303535> · 🗺️ **Course map:** <#1442207394439626802>

## `#m4-l8-woobull-top-cap-5pct` — Woobull Top Cap · 5% of the Score

# Lesson 8 — Woobull Top Cap · 5% of the Score

**What it measures.** Price as a fraction of a long-run modelled ceiling.

**How it is calculated.** Top Cap is 35 × Average Cap in market-cap units. Compare market cap with Top Cap, or price with the corresponding per-coin line; do not divide a per-coin price by an aggregate capitalization. LiftOffr consumes the source’s normalized reading.

**Why it carries 5%.** These are design weights informed by selected historical turns. That is an in-sample rationale, not evidence that this weighting outperforms alternatives or will predict future turns. The readings below use the source series, including its normalization.

**What it read at every cycle turn** — same daily series the live number comes from:

```
Cycle turn   Date         BTC close  Reading (0–100)
2013 top     2013-11-30   $1,119     96
2017 top     2017-12-17   $19,250    100
2021 top     2021-11-10   $64,756    92
2025 top     2025-10-06   $124,824   93
2015 bottom  2015-01-14   $176       0
2018 bottom  2018-12-15   $3,185     0
2022 bottom  2022-11-21   $15,778    0
```
**Where it has been wrong.** The ×35 constant was fitted to two cycles of data. The line is a fitted model reference, not a hard price ceiling, floor or target.

**Worth knowing:** this is the component that has no published reading on some days. When that happens it is excluded and the divisor drops to 0.95 rather than 1.00 — it is never counted as a zero. That rule is <#1540323967930339409>, and getting it wrong understated the published Score by 1.8 points until it was fixed on 20 August 2026.

Live reading, and this table in full: **liftoffr.com/indicators/woobull-top-cap**

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ **Previous:** <#1540324343635255398> · **Next:** <#1540324399645990992> ▶
↩ **Module 4 overview:** <#1443375956835303535> · 🗺️ **Course map:** <#1442207394439626802>

## `#m4-l9-rupl-5pct` — RUPL · 5% of the Score

# Lesson 9 — RUPL / NUPL · 5% of the Score

**What it measures.** Aggregate net unrealized profit/loss relative to market capitalization. This is not the percentage of coins or holders in profit.

**How it is calculated.** (market cap − realised cap) ÷ market cap, normalised 0-100.

**Why it carries 5%.** These are design weights informed by selected historical turns. That is an in-sample rationale, not evidence that this weighting outperforms alternatives or will predict future turns. The readings below use the source series, including its normalization.

**What it read at every cycle turn** — same daily series the live number comes from:

```
Cycle turn   Date         BTC close  Reading (0–100)
2013 top     2013-11-30   $1,119     100
2017 top     2017-12-17   $19,250    100
2021 top     2021-11-10   $64,756    98
2025 top     2025-10-06   $124,824   96
2015 bottom  2015-01-14   $176       5
2018 bottom  2018-12-15   $3,185     0
2022 bottom  2022-11-21   $15,778    0
```
**Where it has been wrong.** It is a lagging read on sentiment, not a trigger. Supply can stay in profit through a 40% drawdown, and the sub-zero readings that mark real capitulation appear months after the fall starts — useful for confirmation, useless for timing an exit.

That is the last of the nine. Together they are the whole model: RHODL 20, Puell 20, Trolololo 15, MVRV 15, Pi Cycle 10, then 2Y MA, Reserve Risk, Woobull and RUPL at 5 each. Nothing else feeds the number.

Live reading, and this table in full: **liftoffr.com/indicators/rupl**

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ **Previous:** <#1540324377378164736> · **Next:** <#1540324493707444307> ▶
↩ **Module 4 overview:** <#1443375956835303535> · 🗺️ **Course map:** <#1442207394439626802>
