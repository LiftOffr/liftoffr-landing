# Module 5 — What carries zero weight, and why

Five lessons. This is the module that exists because the previous version of this course was
wrong, and it says so.

**Read this first.** The course you originally bought taught eight indicators. Three of them —
CBBI, Google Trends and Market Cipher — carry **no weight** in the LiftOffr Score. Meanwhile
RHODL Ratio, which carries 20% and is tied for the heaviest weight in the model, was not taught
at all. That was a real defect in a paid product and this module is the correction, not a
footnote to it.

None of what follows means those indicators are useless. It means they are **context** — things
worth looking at — rather than **inputs**, things the number is built from. Confusing the two is
how you end up unable to reproduce a number you were told you could check.

---

## 5.1 — CBBI: the source, not a component

**What it is.** The Colin Talks Crypto Bitcoin Bull Run Index — a composite that averages its
own set of sub-indicators into a single 0–100 reading, published free and daily.

**Why it carries zero weight.** Because it is the *pipe*, not a *component*. The LiftOffr Score
reads its nine component values **from** CBBI's public data. Including CBBI's own composite as a
tenth input would mean counting the same underlying readings twice — once as components, once
again inside CBBI's average of them.

**How to use it.** As the place you go to check my arithmetic — lesson 1.5 sends you there. If
CBBI's composite and the Score diverge, that is not one contradicting the other; it is two
different weightings of an overlapping set of measurements, and the interesting question is
which components account for the gap.

**Where the old course had this wrong.** "Reading CBBI signals" was taught as Module 4's first
lesson, which framed the data source as a signal. It is a source.

---

## 5.2 — Fear & Greed: sentiment, not an input

**What it is.** A 0–100 sentiment index built from volatility, momentum, volume, social
activity, dominance and trends.

**Why it carries zero weight.** It measures how people feel, and the Score measures what the
chain and the price structure are doing. Sentiment is fast, noisy, and mean-reverting on a
timescale of days; the Score is built for cycle position over months. Mixing the two would give
a multi-month tool a short-horizon tremor.

**The specific evidence.** At the October 2025 top, Fear & Greed never reached Extreme Greed.
A framework that required a sentiment extreme to confirm a top would have been waiting for
confirmation that never arrived. That is on liftoffr.com/indicator-history with the readings.

**How to use it.** As colour on a reading you already have. Never as the reading.

---

## 5.3 — Google Trends: attention, not an input

**What it is.** Relative search interest in Bitcoin over time.

**Why it carries zero weight.** It measures retail attention, which historically *follows* price
rather than leading it, and its scaling is relative to its own window — a "100" in one date
range is not a "100" in another. There is no stable level to weight.

**The specific evidence.** At the October 2025 top, Google Trends sat well below its 2021 levels.
The 2025 cycle topped without the retail attention spike the previous cycle produced.

**How to use it.** As a check on how crowded the trade feels, on a chart you read separately.

---

## 5.4 — Market Cipher: why it left the framework

**What it is.** A commercial charting toolkit (A and B) combining momentum, money-flow and
divergence signals into a visual overlay.

**Why it carries zero weight.** Two reasons, and the second is the one that matters here.

1. **It is not reproducible from public data.** Every component in the Score reads from a free,
   public source, so anyone can recompute the number. Market Cipher is proprietary and paid. A
   component you cannot check breaks the one promise this whole product rests on.
2. **It is a short-horizon trading tool inside a multi-month cycle model.** Its signals fire on
   timeframes the Score is not built to speak about.

**Where the old course had this wrong.** "Market Cipher A/B basics" was a Module 4 lesson,
presented alongside genuine components. It should not have been in a module about the inputs to
the Score, because it was never one.

---

## 5.5 — The framework moved: what changed, and what replaced what

Plainly, so you can see the whole edit.

**Taught as inputs before, and are not inputs:**

| Was taught as | Actually is |
|---|---|
| CBBI | The public data source the components are read from |
| Google Trends | Context — retail attention, follows price |
| Market Cipher | A separate short-horizon charting tool, not reproducible from public data |
| Fear & Greed | Context — sentiment, no weight |
| BTC Dominance | Context — appeared in the retired indicator panel, never a component |

**Are inputs, and were under-taught or missing:**

| Component | Weight | Old course coverage |
|---|---:|---|
| RHODL Ratio | 20% | **Not taught at all** — the joint-heaviest weight in the model |
| Puell Multiple | 20% | Taught |
| Trolololo trend line | 15% | Taught as "Rainbow chart" |
| MVRV Z-Score | 15% | Taught, bundled with 2Y MA |
| Pi Cycle Top | 10% | Taught |
| 2-Year MA Multiplier | 5% | Taught, bundled with MVRV |
| Reserve Risk | 5% | **Not taught** |
| Woobull Top Cap | 5% | **Not taught** |
| RUPL | 5% | **Not taught** |

Four of the nine weighted components — 35% of the model by weight — were absent from a course
about the model's indicators. Modules 2 through 4 of this curriculum are where they get taught.

**Why say all this instead of quietly reshooting Module 4.** Because the argument for this
product is that you can check it, and an argument you can check has to survive being checked.
A course that silently swapped its own syllabus would be asking you to trust that the *new* one
is right, with no way to tell. Here is what was wrong, here is what replaced it, and here is the
free page where you can verify the weights I have just claimed:
**liftoffr.com/score**.

Nothing in this module tells you to act on any indicator, weighted or not.
