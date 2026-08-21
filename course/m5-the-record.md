# The record — `m5-l1` … `m5-l6`

Six lessons, posted as Discord **Module 5**. This is the module that tells you what the number
cannot do. If you only read one module of this course before deciding whether to trust any of
it, read this one.

---

## `#m5-l1-how-to-read-receipts` — How to read `/receipts`

Every zone crossing the model has ever produced is at **liftoffr.com/receipts** — all 64, from
September 2011 to November 2025, winners and losers in the same table.

**The columns.** Date · Event (which zone it entered, and from which) · the Score that day · the
BTC price · and what Bitcoin did over the next 30, 90 and 180 days.

**A crossing counts only after the Score holds the new zone for seven straight days,** and the
date shown is the first day of that hold. That rule exists so a single day's touch of a boundary
does not enter the log as a signal.

**Two things to notice before you read a single row:**

1. **The zone names in that log use the earlier five-band scheme,** where NEUTRAL spanned 30–70.
   The live Score now names six bands (`#m4-score-2-the-six-bands`). The boundaries at 85, 70, 30 and 15 did not
   move, so no crossing in the log changes — the only difference is that the old NEUTRAL interval
   is now split at 50. No crossing in the log sits between 32 and 67, so nothing lands in the
   part that was split.
2. **These are backtest outputs, not calls published at the time.** The formula did not exist for
   most of the period it is measured against. Nobody traded these signals as they printed,
   because they did not print.

---

## `#m5-l2-why-35-of-64-is-not-a-hit-rate` — Why "35 of 64" is not a hit rate

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
a failure. If you ever see 29 of 64 quoted anywhere as this model's error rate, it is wrong — including
where I had it wrong myself before catching it.

---

## `#m5-l3-why-46pct-and-54pct-are-the-same` — Why 46% and 54% are the same number

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

## `#m5-l4-so-what-is-it-for` — So what is it for?

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

## `#m5-l5-the-whipsaw` — The whipsaw: three entries, three retreats

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

## `#m5-l6-what-the-number-asks-of-you` — What the number asks of you

Every lesson before this one has been about the model. This one is about the only part the model
cannot do for you.

**A threshold model is not a decision. It is an input to one.** Lesson `#m5-l5-the-whipsaw` is the proof: three
entries into the exit zone, three retreats, six transitions in twelve months, and the top arriving
fifteen days before the last exit. Anyone who treated each crossing as an instruction made six
reversals in a year. Anyone who treated none of them as anything got the same result as not
having the number at all.

So the question the Score puts to you is narrow and unavoidable: **what does a band change mean
for you, decided before it happens?**

I am not going to answer that for you, and you should be suspicious of anyone who does. The
answer depends on your position size, your timeline, your tax situation and your tolerance for
being early — and nobody publishing a percentage on the internet knows any of those. A rule
handed to you by someone who does not know your circumstances is a guess made at your expense.

What I can give you is the shape of a decision that survives contact with a whipsaw:

1. **Write it down before the crossing, not during.** A decision made mid-move is made by someone
   who is either frightened or euphoric. The same decision made in advance is made by someone who
   is neither. That difference is most of the value of having a number at all.
2. **Decide what a *retreat* means too.** Most people write down what they will do if the Score
   enters the exit zone and nothing at all about what they will do when it leaves again. Two of
   the three entries in 6.5 retreated without a top. A rule with no answer for that is a rule that
   will be abandoned the first time it happens.
3. **Decide how much a single crossing is allowed to change.** If the honest answer is "all of
   it", the model will whipsaw you. If the honest answer is "nothing", you did not need the model.
   The usable answers are in between, and they are yours to pick.
4. **Write the reason down when you override yourself.** Overriding is not forbidden. Overriding
   *silently* is how a plan quietly stops existing. Writing the reason first turns an impulse into
   an argument, and about half of impulses do not survive being written down.
5. **Re-read `#m5-l3-why-46pct-and-54pct-are-the-same` before you commit to anything.** The directional record is 21 of 46 at 30 days
   and 25 of 46 at 180, and neither is distinguishable from chance. Whatever you decide should be
   a decision that still makes sense given that — because that is the model you actually have, not
   the one the marketing of every other service implies you are buying.

**If you finished 6.3 and concluded the model is worthless, that is a serious objection and it
deserves a straight answer rather than a deflection.** Here it is: the Score is not a direction
predictor and the record says so plainly, which is exactly why it is published that way. What it
does is put a consistent, reproducible number on cycle position — the same number every morning,
computed the same way, from public data you can check — so that the decision you already have to
make is made against a stable reference instead of against how the last week felt. If you want a
tool that tells you which way price goes next, this is not it and no honest version of it exists.
If you want to stop re-deciding your entire thesis every time the market moves, this is the thing
that does that.

The buy plan is a worked example of one person answering the question above with his own money —
the tiers, the fallback dates and the override log are all in it. It is a description of what I
did, not an instruction for what you should do.
