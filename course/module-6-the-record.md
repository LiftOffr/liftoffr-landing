# Module 6 — The record, and what this is actually for

Six lessons. This is the module that tells you what the number cannot do. If you only read one
module of this course before deciding whether to trust any of it, read this one.

---

## 6.1 — How to read `/receipts`

Every zone crossing the model has ever produced is at **liftoffr.com/receipts** — all 64, from
September 2011 to November 2025, winners and losers in the same table.

**The columns.** Date · Event (which zone it entered, and from which) · the Score that day · the
BTC price · and what Bitcoin did over the next 30, 90 and 180 days.

**A crossing counts only after the Score holds the new zone for seven straight days,** and the
date shown is the first day of that hold. That rule exists so a single day's touch of a boundary
does not enter the log as a signal.

**Two things to notice before you read a single row:**

1. **The zone names in that log use the earlier five-band scheme,** where NEUTRAL spanned 30–70.
   The live Score now names six bands (Module 1.2). The boundaries at 85, 70, 30 and 15 did not
   move, so no crossing in the log changes — the only difference is that the old NEUTRAL interval
   is now split at 50. No crossing in the log sits between 32 and 67, so nothing lands in the
   part that was split.
2. **These are backtest outputs, not calls published at the time.** The formula did not exist for
   most of the period it is measured against. Nobody traded these signals as they printed,
   because they did not print.

---

## 6.2 — Why "35 of 64" is not a hit rate

The receipts page shows a column counting every crossing after which Bitcoin was simply higher.
At 30 days that is 35 of 64. At 180 days it is 37 of 64.

**Those are not hit rates and I will not relabel them as one.** Here is why, and it is not a
technicality.

The 64 crossings mix opposing signal types. An EXIT crossing followed by a *rise* is a **miss** —
the model said the top was near and price went up. An ACCUMULATION crossing followed by a rise is
a **hit**. A column that counts "price went up" treats both identically, so it credits the model
for its own failures.

Run it backwards and the problem is obvious: if the model had produced nothing but EXIT
crossings, "35 of 64 went up" would describe a model that was wrong 35 times, and it would still
read like 55%.

**The number you would get by inverting it is worse.** 64 − 35 = 29, and calling those 29
"the times it was wrong" makes the same error in reverse — it counts every *correct* exit call as
a failure. If you ever see 29 of 64 quoted anywhere as this model's error rate, it is wrong, and
it was wrong on my own site until 20 August 2026.

---

## 6.3 — Why 46% and 54% are the same number

The honest scoring is directional. An EXIT or WARNING crossing is correct if Bitcoin was **lower**
afterwards; an ACCUMULATION crossing is correct if it was **higher**. The 18 NEUTRAL crossings
point nowhere and are excluded, which leaves 46 of the 64.

| Horizon | Right about direction |
|---|---|
| 30 days | 21 of 46 · 46% |
| 90 days | 21 of 46 · 46% |
| 180 days | 25 of 46 · 54% |

The 54% looks like the good one. **It isn't, and this is the most important paragraph in the
course.**

21 and 25 sit the same distance either side of an even split of 46 — 23 each way. That means they
carry the **identical** two-sided p-value of 0.659 against a coin flip. Statistically they are the
same result pointing in opposite directions.

**At a sample of 46, you would need 31 correct — 67% — before the result cleared the usual 5%
significance threshold.** Nothing in this record is close to that.

So: **none of the three figures is distinguishable from chance.** Not the 46%, and not the 54%
that looks better. A course that let you walk away thinking the 180-day number was evidence of an
edge would be teaching you something false about its own product.

---

## 6.4 — So what is it for?

A fair question after 6.3, and it deserves a straight answer rather than a rescue.

**What the record does not support:** that this model predicts direction over 30, 90 or 180 days.
It doesn't. The numbers above are the whole of the evidence and they say so.

**What the record does show:** every cycle top since 2013 printed with the Score in its 85+ exit
band. That is a statement about *where the number sits at cycle turns*, not about what price does
next — and it comes with its own limit, which is that the Score has also sat in that band for
months with no top following.

The honest description is that this is a **cycle-position instrument on a multi-month horizon**,
not a direction predictor on a monthly one. A 30-day directional test is a poor proxy for what it
is built to do — but it is the test an outsider would run first, which is exactly why it belongs
at the top of the receipts page rather than nowhere on it.

**What you get from that.** A number that is the same every morning, computed the same way,
published with its weights, that tells you roughly where in a cycle you are — and a written record
of every time it has been early, late or wrong. What you do with that is yours.

---

## 6.5 — The whipsaw: three entries, three retreats

Between 16 November 2024 and 21 October 2025 the Score moved in and out of the exit zone six
times:

| Date | Transition | BTC |
|---|---|---|
| 16 Nov 2024 | **into** exit zone | $90,568 |
| 18 Feb 2025 | back out | $95,444 |
| 8 May 2025 | **into** exit zone | $103,070 |
| 19 Jun 2025 | back out | $104,710 |
| 27 Jun 2025 | **into** exit zone | $107,091 |
| 21 Oct 2025 | back out | $108,700 |

**Three entries, three retreats — six transitions, not six signals.** That distinction matters:
counting all six as "the model said sell six times" describes a stronger signal than the log
contains, and I made exactly that error on my own site before correcting it.

The top was **6 October 2025** at $124,824. The Score left the exit zone for the last time
fifteen days *after* it.

**This is what a threshold model does.** Any rule of the form "above X, do something" will flip
back and forth around X. The lesson is not that thresholds are broken — it is that a threshold
model is only usable if you have decided in advance what a crossing means to you, because acting
in full on each of those six transitions would have meant six reversals in a year.

---

## 6.6 — Applying it — **[TORIN: your judgement, not mine]**

The frame is here; the content is yours, because it is a description of what you do with your own
capital and I am not going to invent that.

What this lesson should cover, in your words:

- **How you personally read the number day to day** — what you look at first, and what you ignore.
- **What a band change actually changes for you**, given 6.5 — the answer that makes a threshold
  model survivable rather than a source of six decisions a year.
- **How the ladder in the buy plan relates to the Score** — the plan document has the tiers; this
  is where a learner sees how the number and the ladder connect.
- **What you would tell someone who finished 6.3 and concluded the model is worthless.** That is
  the strongest objection in the course and it deserves your answer, not a deflection.

Whatever goes here: describe what you do, never instruct the learner. That is the line the whole
product runs on.

---

*Educational content only. Not financial advice, and not personalised to you. Backtested results
are historical; past performance does not guarantee future results. Nothing in this module is an
instruction to buy, sell or size anything.*
