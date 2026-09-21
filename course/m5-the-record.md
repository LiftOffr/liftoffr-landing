# The record — `m5-l1` … `m5-l6`

Six lessons, posted as Discord **Module 5**. This is the module that tells you what the number
cannot do. If you only read one module of this course before deciding whether to trust any of
it, read this one.

---

## `#m5-l1-how-to-read-receipts` — How to read `/receipts`

# Lesson 1 — How to read /receipts

Every zone crossing the model has ever produced is at **liftoffr.com/receipts** — all 64, from September 2011 to November 2025, winners and losers in the same table. Free, no email required.

**The columns.** Date · Event (which zone it entered, and from which) · the Score that day · the BTC price · and what Bitcoin did over the next 30, 90 and 180 days.

**A crossing counts only after the Score holds the new zone for seven straight days**, and the date shown is the first day of that hold. That rule exists so a single day's touch of a boundary does not enter the log as a signal.

**Two things to notice before you read a single row:**

**1. The zone names in that log use a five-band scheme**, where NEUTRAL spans 30–70. The live Score names six bands. The boundaries at 85, 70, 30 and 15 are the same in both, so no crossing in the log changes — the only difference is that the NEUTRAL interval is split at 50 on the live number. No crossing in the log sits between 32 and 67, so nothing lands in the part that is split.

**2. These are backtest outputs, not calls published at the time.** The formula did not exist for most of the period it is measured against. Nobody traded these signals as they printed, because they did not print. Every row is marked that way on the page.

The next two lessons are about what the numbers on that page do and do not mean. They are the least comfortable lessons in this course and they are the reason the rest of it is worth anything.

*Educational content only. Not financial advice, and nothing here is personalised to you. Backtested results are historical; past performance does not guarantee future results.*

───
◀ *First lesson in this module* · **Next:** <#1540313214028619806> ▶
↩ **Module 5 overview:** <#1443375980294049854> · 🗺️ **Course map:** <#1442207394439626802>

## `#m5-l2-why-35-of-64-is-not-a-hit-rate` — Why "35 of 64" is not a hit rate

# Lesson 2 — Why "35 of 64" is not a hit rate

The receipts page shows a column counting every crossing after which Bitcoin was simply higher. At 30 days that is 35 of 64. At 180 days it is 37 of 64.

**Those are not hit rates and I will not relabel them as one.** Here is why, and it is not a technicality.

**The 64 crossings mix opposing signal types.** An EXIT crossing followed by a *rise* is a **miss** — the model said the top was near and price went up. An ACCUMULATION crossing followed by a rise is a **hit**. A column that counts "price went up" treats both identically, so it credits the model for its own failures.

Run it backwards and the problem is obvious: if the model had produced nothing but EXIT crossings, "35 of 64 went up" would describe a model that was wrong 35 times — and it would still read like 55%.

**The number you get by inverting it is worse.** 64 − 35 = 29, and calling those 29 "the times it was wrong" makes the same error in reverse: it counts every *correct* exit call as a failure.

**If you ever see "29 of 64" quoted anywhere as this model's error rate, it is wrong** — including where I had it wrong myself before catching it. A model whose selling point is that you can check it has to survive being checked, and that includes being checked by me.

The honest scoring is in the next lesson.

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ **Previous:** <#1540313188782968893> · **Next:** <#1540313246488330341> ▶
↩ **Module 5 overview:** <#1443375980294049854> · 🗺️ **Course map:** <#1442207394439626802>

## `#m5-l3-why-46pct-and-54pct-are-the-same` — Why 46% and 54% are the same number

# Directional scoring and the limits of a coin-flip comparison

The historical log contains 64 crossings. Excluding 18 neutral crossings leaves 46 directional observations. An exit/warning followed by a lower price and an accumulation crossing followed by a higher price count as directionally correct at the selected horizon.

The recorded counts are 21/46 at 30 days, 21/46 at 90 days and 25/46 at 180 days. These counts are not a realized trading return: they ignore position sizing, costs, taxes and execution.

**An illustrative benchmark:** if 46 outcomes were independent trials with a 50% success probability, 21 and 25 successes would have the same two-sided exact-binomial p-value, approximately 0.659. In that simplified model, 31/46 is the first count above half with a two-sided p-value below 0.05.

**Those assumptions are not established here.** Crossings and forward-return windows can overlap, returns have market drift, and the model was designed using historical information. The calculation does not validate independence, prove equivalence to chance, or certify that 31 successes would demonstrate a real trading edge.

A stronger evaluation would predefine rules and horizons, preserve information available at each date, account for dependence and model selection, and compare a feasible strategy with appropriate benchmarks after costs. Future observations not used to design the method are particularly important.

**Exercise:** explain why 35 positive price returns across mixed exit and accumulation signals is not a hit rate. Then name two reasons the 46 observations cannot simply be treated as independent fair coin flips.

**Answer guide:** a positive return contradicts an exit signal; overlapping windows and common market moves create dependence. Historical fitting adds another limitation.

Next: <#1540313273784864838> · Course map: <#1442207394439626802>


## `#m5-l4-so-what-is-it-for` — So what is it for?

# Lesson 4 — So what is it for?

A fair question after lesson 3, and it deserves a straight answer rather than a rescue.

**What the record does not support:** that this model predicts direction over 30, 90 or 180 days. It doesn't. The counts in lesson 3 do not establish a predictive edge; they are not a complete strategy evaluation.

**What the record does show:** every cycle top since 2013 printed with the Score in its 85+ exit band. That is a statement about *where the number sits at cycle turns*, not about what price does next — and it comes with its own limit, which is that the Score has **also** sat in that band for months with no top following.

The honest description is that this is a **cycle-position instrument on a multi-month horizon**, not a direction predictor on a monthly one. A 30-day directional test is a poor proxy for what it is built to do — but it is the test an outsider would run first, which is exactly why it sits at the top of the receipts page rather than nowhere on it.

**What you get from that.** A number that is the same every morning, computed the same way, published with its weights, that tells you roughly where in a cycle you are — and a written record of every time it has been early, late or wrong.

What you do with that is yours. Nothing on this server, in this course, or on the site will tell you what to do with a position, because none of it knows your size, your timeline or your tax situation — and anyone who hands you a percentage without knowing those is guessing at your expense.

*Educational content only. Not financial advice, and nothing here is personalised to you.*

───
◀ **Previous:** <#1540313246488330341> · **Next:** <#1540313303480275055> ▶
↩ **Module 5 overview:** <#1443375980294049854> · 🗺️ **Course map:** <#1442207394439626802>

## `#m5-l5-the-whipsaw` — The whipsaw: three entries, three retreats

# Lesson 5 — The whipsaw: three entries, three retreats

Between 16 November 2024 and 21 October 2025 the Score moved in and out of the exit zone six times:

```
Date          Transition        BTC
16 Nov 2024   into exit zone    $90,568
18 Feb 2025   back out          $95,444
 8 May 2025   into exit zone    $103,070
19 Jun 2025   back out          $104,710
27 Jun 2025   into exit zone    $107,091
21 Oct 2025   back out          $108,700
```

**Three entries, three retreats — six transitions, not six signals.** That distinction matters: counting all six as "the model said sell six times" describes a stronger signal than the log contains, and I made exactly that error on my own site before catching it.

**Two of the three entries did not contain a top.** The top was **6 October 2025 at $124,824**, and the Score left the exit zone for the last time **fifteen days after it**.

**This is what a threshold model does.** Any rule of the form "above X, do something" will flip back and forth around X. The lesson is not that thresholds are broken — it is that a threshold model is only usable if you have decided in advance what a crossing means to you, because acting in full on each of those six transitions would have meant six reversals in a year.

All six transitions are dated in the public log at **liftoffr.com/receipts**.

*Educational content only. Not financial advice, and nothing here is personalised to you.*

## The other side: a written rule still needs scrutiny

The section above is about a rule that fires too often. This is about having no rule at all, and it is the reason this business exists.

Torin’s published account describes giving back roughly **$30,000** through the 2022 bear market between college classes. This personal account is unaudited and distinct from the subsequently calculated model record.

Three reasons, and they are worth reading honestly because they are the common ones:

**Ego.** I had been right about the direction. I was up a lot, and selling would have meant admitting the cycle was ending — which I did not want, because being right had started to feel like an identity rather than a position.

**No written rule.** I had never written down "at reading X, I do Y." So every day was a fresh decision, made while looking at the price. There was no trigger, only deliberation, and deliberation at 2am loses to hope every time.

**Greed.** "It's going to a million, I'm not selling at $69K." That sentence cost more than the other two combined.

**Why this sits in the whipsaw lesson.** Both failures have the same root. In 2021 I had no rule and did nothing. In Torin’s published account, he began exiting after the 27 June 2025 crossing and missed later upside. **Process and model limitations both matter. A written rule can still produce losses, early exits or missed upside.**

*This is an account of what I did, not a suggestion about what you should do.*

───
◀ **Previous:** <#1540313273784864838> · **Next:** <#1540313337802395699> ▶
↩ **Module 5 overview:** <#1443375980294049854> · 🗺️ **Course map:** <#1442207394439626802>

## `#m5-l6-what-the-number-asks-of-you` — What the number asks of you

# Lesson 6 — What the number asks of you

Every lesson before this one has been about the model. This one is about the only part the model cannot do for you.

**A threshold model is not a decision. It is an input to one.** Lesson 5 is the proof: three entries into the exit zone, three retreats, six transitions in twelve months, and the top arriving fifteen days before the last exit. Anyone who treated each crossing as an instruction made six reversals in a year. Anyone who treated none of them as anything got the same result as not having the number at all.

So the question the Score puts to you is narrow and unavoidable: **what does a band change mean for you, decided before it happens?**

I am not going to answer that for you, and you should be suspicious of anyone who does. The answer depends on your position size, your timeline, your tax situation and your tolerance for being early. Nobody publishing a percentage on the internet knows any of those.

What I can give you is the shape of a decision that survives contact with a whipsaw:

**1. Write it down before the crossing, not during.** A decision made mid-move is made by someone who is either frightened or euphoric. The same decision made in advance is made by someone who is neither. That difference is most of the value of having a number at all.

**2. Decide what a retreat means too.** Most people write down what they will do if the Score enters the exit zone and nothing at all about what they will do when it leaves. Two of three entries retreated without a top. A rule with no answer for that is a rule that will be abandoned the first time it happens.

**3. Decide how much a single crossing is allowed to change.** If the honest answer is "all of it", the model will whipsaw you. A review-only response or no transaction can also be valid. Any exposure decision depends on your circumstances.

**4. Write the reason down when you override yourself.** Overriding is not forbidden. Overriding *silently* is how a plan quietly stops existing. Writing the reason makes a proposed change reviewable.

**5. Re-read lesson 3 before you commit to anything.** 21 of 46 at 30 days, 25 of 46 at 180, neither establishes a validated predictive edge. Whatever you decide should still make sense given that — because that is the model you actually have, not the one the marketing of every other service implies you are buying.

The next lesson turns all of that into a worksheet you can fill in.

*Educational content only. Not financial advice, and nothing here is personalised to you. Nothing in this lesson is an instruction to buy, sell or size anything.*

───
◀ **Previous:** <#1540313303480275055> · **Next:** <#1540313367422443601> ▶
↩ **Module 5 overview:** <#1443375980294049854> · 🗺️ **Course map:** <#1442207394439626802>
