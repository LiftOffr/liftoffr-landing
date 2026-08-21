<!-- DRAFTING DOC — NOT SERVED, BUT THIS IS WHAT LIVE COPY GETS REWRITTEN FROM.
     Wording here must match the live code, not precede it. Three separate rounds of
     corrections were undone by someone re-copying from a doc like this one.
     Canonical sources: api/cycle-score.js commentary() for bands and register,
     /receipts for every figure. See COPY_SWEEP_NOTES.md. -->

# The quiz sequence — 7 emails, segmented

**Source:** `~/Documents/LiftOffr-Competitive-Intel/03-liftoffr-rebuild/04-email-sequence.md`
**Implemented in:** email 1 → `api/subscribe.js` (sent inline on quiz submit) · emails 2–7 → `api/cron-welcome-followups.js` (fired daily off contact age)
**Entry point:** the cycle-position quiz at `/quiz`. **The quiz result is the segment tag. Without that tag this is just a newsletter.**

This file is the readable source of truth for the copy. The code is the thing that
sends. If you change one, change the other — and keep the compliance rules below.

---

## Cadence

| Day | Email | Subject | Fired by |
|---|---|---|---|
| 0 | 1 · the result | `your cycle position` | `api/subscribe.js`, inline on submit |
| 1 | 2 · the story | `i built this because i lost $30,000` | cron |
| 3 | 3 · the honest proof email | `don't trust my backtest` | cron |
| 5 | 4 · the mechanism | `the two-sided problem nobody sells a fix for` | cron |
| 7 | 5 · first mention of the paid thing | `the nine levels i'm actually buying at` | cron |
| 10 | 6 · objections | `no. (a reply to the most common question i get)` | cron |
| 14 | 7 · close, and the honest exit | `last one from me about this` | cron |

After day 14 the contact drops to the weekly Sunday Score and nothing else.

**Why the pitch is email 5 of 7.** Dunlap's sequence delivers four pieces of content
before any pitch; Abdaal pitches only tagged segments. LiftOffr's audience carries an
additional trust penalty — a general audience applies *more* skepticism to a crypto
product, not less. Four value emails before the ask is the floor here, not the ceiling.

**Why email 3 attacks LiftOffr's own proof.** A skeptical reader will find the receipts
page anyway, and finding it *after* being told is a completely different experience from
finding it alone. It converts the site's biggest liability into the sequence's strongest
email.

---

## Segment tags

Assigned by `/quiz` from six questions, scored client-side. Tie-break order is
`ROUNDTRIPPED → NEW → ACCUMULATING → SITTING`, deliberately not alphabetical:
ROUND-TRIPPED is the highest-intent segment, and NEW is the one segment the sequence
actively *defers* rather than pitches, so a genuine tie should land where the emails
differ most.

| Tag | Who they are | Angle shift |
|---|---|---|
| `ROUNDTRIPPED` | Held through a full cycle and gave it back | Lead with the 2021-top / 2022 round-trip story — highest-intent segment |
| `ACCUMULATING` | Holds BTC, buying, no exit rule | Lead with the exit problem |
| `SITTING` | Holds BTC, doing nothing, unsure | Lead with the decision-in-advance problem |
| `NEW` | Little or no BTC, curious | Lead with the free layer; slow the pitch |

**Only emails 2 and 5 change by segment** — one paragraph each (`QSEG_E2` and `QSEG_E5`
in the cron). Everything else is identical across segments. That keeps the sequence
maintainable and puts the personalisation where it actually earns its keep.

With a single pooled audience there is no per-contact tag readable from the Resend
contacts API, so the sequence falls back to neutral copy: every email still reads
correctly, the two personalised paragraphs simply don't render. Per-segment audiences
(`RESEND_QUIZ_AUDIENCE_ROUNDTRIPPED` etc.) turn them on. See `QUIZ_SETUP.md`.

---

## Compliance rules applied to every email in this sequence

Non-negotiable, and the reason the previous free-list nurture had to be rewritten in
the same pass:

- **No dollar outcomes.** No `$1.88M`, no portfolio values, no "turned X into Y".
- **No percentages presented as achievable.** No `+7,602%`, no `100% win rate`.
- **No "called."** Every row is a backtest and says so.
- **No promise of a future cadence** — nothing the system does not do automatically. Verifiability comes from the public CBBI source and published weights, not from a log anyone has to remember to keep.
- **Educational framing throughout**, disclaimer in the footer of every send.
- The only dollar figure anywhere in this sequence is **$30,000 — and it's a loss.**

---

## EMAIL 1 — Day 0 — the result

**Subject:** `your cycle position`

> You came out as **{{result}}**.
>
> What that means in one line: {{one_line_result}}.
>
> {{segment_angle}}
>
> **Today's Score: {{score}} ({{zone}})**
>
> Above 85 the model reads as exit territory. Below 15, deep accumulation. In between it has historically been least informative, which is where it sits most of the time and which is the part people find hardest.
>
> Three things, all free, no card:
>
> **The score** — updated every morning, public, no account needed to look at it
> **The daily brief** — 8am MT in the Discord
> **The receipts** — every zone change the model has produced across fifteen years, including the ones that went the wrong way
>
> **Go look at the receipts page first.** Read the label at the top of it. I'd rather you start there than anywhere else on the site.
>
> — Torin

**Why this shape:** delivers the promised value immediately with zero pitch, and routes
the reader to the *least* flattering page on the site first. That last move is the whole
positioning in one instruction.

---

## EMAIL 2 — Day 1 — the story

**Subject:** `i built this because i lost $30,000`

> In 2021 I had every indicator I now publish sitting on a screen in front of me. They were flashing. I knew what they meant.
>
> I did nothing. Then I did nothing for a while longer. Then it was 2022 and about **$30,000** had gone up and come all the way back down, and the only thing I'd actually done was watch.
>
> Here's what I got wrong, and it isn't the part people expect. **I wasn't wrong about the data. I was wrong about myself.** I assumed that when the moment came I'd act on what I knew, and it turns out that's not how anyone works. In the moment there's always a reason it's different this time, and the reason is always available, and it's always convincing.
>
> *{{segment paragraph — see QSEG_E2}}*
>
> The fix wasn't more data. It was writing the decision down before the moment arrived, when I was calm and nothing was happening.
>
> Today's score: **{{score}}** — {{zone}}.
>
> — Torin

> **The year is confirmed: 2022.** Torin confirmed 2026-08-16 that the round-trip
> loss was 2022 — the indicators topped out in November 2021 and the money came off
> through the bear that followed. This email's "flashing in 2021… then it was 2022"
> is correct as written. `CLAUDE.md` and `BRAND_VOICE.md` both carried 2022 as canon
> all along.

**Segment paragraphs (`QSEG_E2`):**

- `ROUNDTRIPPED` — "You told me in the quiz you've been through this. Then you already know the part I'm describing, and you know it isn't about information."
- `SITTING` — "You said you're holding and not sure what to do. That's exactly where I was. It doesn't feel like a decision, which is what makes it dangerous — doing nothing is a position."
- `ACCUMULATING` — "You said you're still buying. Good — that's the easy half. The hard half is the one nobody writes down, and you'll need it sooner than feels necessary."
- `NEW` — "You said you're early in this. Genuinely the best possible time to hear it, because you can build the rule before you have anything at stake in it."

---

## EMAIL 3 — Day 3 — the honest proof email

**Subject:** `don't trust my backtest`

> I want to explain something about my own receipts page, because most people in this industry won't and it matters.
>
> There are **64 scored zone changes** on that page, running back to 2011. Thirty-five were followed by a higher Bitcoin price 30 days later — but that is not a hit rate and I won't relabel it as one, because the 64 mix opposing signal types: a rise after an EXIT crossing is a miss, not a hit. Scored directionally, the model was right on 21 of 46 at 30 days and 25 of 46 at 180, and neither is distinguishable from chance. All 64 are up there with dates.
>
> **Every one of them is a backtest.**
>
> That means I built the formula, then ran it against history. It is not a record of calls I made at the time. I mark every row that way, because here's the uncomfortable thing about backtests: a formula tested against the same history it was designed on will always look better than it deserves to. Mine included. That's not a criticism of my model, it's a property of all of them, and anyone showing you a clean backtest without saying so is either careless or counting on you not to ask.
>
> So here's what I'm *not* going to do: promise you a live track record I'd then have to remember to keep. **Here's what you can check instead, today.**
>
> The Score is computed from CBBI's public daily data using the weights published on every indicator page. Pick any date on the receipts page, pull the same source, and recompute it. That's better than a log I keep myself, because it doesn't require trusting me to keep it honestly.
>
> — Torin

---

## EMAIL 4 — Day 5 — the mechanism

**Subject:** `the two-sided problem nobody sells a fix for`

> There's an enormous amount of content telling you when to buy. There's almost none telling you when to stop.
>
> That's not an accident. *"Buy"* is easy to publish — it's shareable, it's optimistic, and nobody can prove you wrong for years. *"Here's the price where I sell"* is a number people can hold you to next month.
>
> So most people arrive at the top of a cycle with a lot of conviction and no exit, and they give it back. That's what happened in 2017. It's what happened to me in 2021. It'll happen again, because the mechanism that causes it isn't information, it's the absence of a written rule.
>
> What I actually do about it, in three parts:
>
> **One number.** Nine indicators, weighted, 0 to 100. Not nine charts to interpret — one number and a verdict.
> **Written levels.** Prices decided in advance, in writing, when nothing is happening.
> **A rule for doing nothing.** Most days the score says nothing changed. That's the system working. The point is to stop you acting on days when nothing changed.
>
> Today's score: **{{score}}** — {{zone}}.
>
> — Torin

---

## EMAIL 5 — Day 7 — the first mention of the paid thing

**Subject:** `the nine levels i'm actually buying at`

> Everything I've sent you so far is free and stays free. **This is the one email where I tell you about the thing that isn't.**
>
> I keep a document with nine price levels — the exact prices I'm buying at through the rest of this bear market, the reason each level exists, and what I actually do when one hits. When a level fires you get the alert and the updated document.
>
> It's **$29, once.** Not a subscription. Nothing renews.
>
> **What it isn't**, because this matters more than what it is:
>
> It isn't a course. There are 54,000 words of education behind it and this is not that — this is the output. What my money does, at what price, and what happens next.
>
> It isn't a prediction that those levels get hit. It's a decision I made while I was calm instead of while I was scared. That's the part that survives being wrong.
>
> It isn't advice for you. It's a record of what I'm doing, published with timestamps. You decide what to do with your own money.
>
> *{{segment paragraph — see QSEG_E5}}*
>
> **And the direct version:** if $29 is money you'd notice missing right now, don't spend it here. I mean that. The free side has the score, the brief and the framework, and it isn't going anywhere.
>
> 30 days to change your mind, no form, no reason needed.
>
> — Torin

**Segment paragraphs (`QSEG_E5`) — only two segments get one:**

- `ROUNDTRIPPED` — "Given what you told me in the quiz, the part I'd point you at is the fallback rule — for when price never touches a level and you have no plan for that. That's the failure mode that gets people who've already been burned once."
- `NEW` — "Honestly: you probably don't need this yet. The free layer has the score, the brief and the framework, and it'll still be free in six months. I'd rather you use that for a while first."
- `ACCUMULATING`, `SITTING` — none. The generic copy is already aimed at them.

**Why the `NEW` segment gets talked out of it:** Abdaal's principle is that you only pitch
the segment that raised its hand. Actively deferring the wrong segment costs a small
number of $29 sales and buys the thing this whole business runs on.

---

## EMAIL 6 — Day 10 — objections, straight

**Subject:** `no. (a reply to the most common question i get)`

> Three things people write back with. All fair.
>
> **"I can get these indicators free."**
> You can, and you should. CBBI, LookIntoBitcoin and Bitbo are free and they're good — my score is built on the same public data. I'm not selling you the numbers. What none of those sites will give you is a verdict, because none of them has a person attached who can be held to one. I publish one number, what I think it means, and what I'm doing about it with my own money, with my name on it.
>
> **"How do I know this isn't a scam?"**
> You don't, yet, and that's the correct default for a faceless crypto account asking you for money. So check before you pay. The score is public. The receipts are public and the losses are on them. The Discord is free to read. And I'll never tell you what you'll make, because I don't know and neither does anyone who says otherwise.
>
> **"What if the levels never get hit?"**
> Then I don't buy, and neither do you, and we both keep our money. A level that doesn't fire is a level doing its job. There's a fallback rule in the document for exactly this, because the most common way a ladder fails isn't being wrong — it's price running away while you have no rule for it.
>
> Today's score: **{{score}}** — {{zone}}.
>
> — Torin

---

## EMAIL 7 — Day 14 — close, and the honest exit

**Subject:** `last one from me about this`

> This is the last email I'll send you about the $29 plan. After this you'll get the Sunday score and nothing else, unless you ask.
>
> Where things stand: the score is **{{score}}**, which is {{zone}}.
>
> If you want the levels I'm buying at, they're here — $29 once, 30 days to change your mind.
>
> If you don't, that's genuinely fine. The score stays free, the brief stays free, the Discord stays open, and the receipts stay up including the ones that went the wrong way. That was all true before you got this email and it'll be true in six months.
>
> The only thing I'd actually push you on, and it costs nothing: **write down the price you'd sell at.** Not the price you think it'll hit — the price at which you'd take money off the table. Put it in your notes app. Do it on a boring day when nothing's happening, because that's the only time anyone can think clearly about it.
>
> That one habit is worth more than anything I sell.
>
> — Torin

---

## What to measure

Quiz-completion → email-1 open · **email-3 → receipts-page click (the trust signal)** ·
email-5 → `/plan` click · 14-day segment conversion.

Expect the first meaningful signal at **4–8 weeks** and real revenue at **3–6 months**,
matching the documented Dunlap/Sanchez/Abdaal timelines. Anything faster is luck.

Anything slower, after a properly built mechanism has run a full quarter, is the
falsification test: if conversion from *segmented and warmed* leads is still near zero,
the lifestyle audience is not a buyer pool. **Not before.**

## The one thing not to do

**Don't run this sequence against the untagged free list.** An untagged list is a
newsletter, and the entire documented advantage of this structure is that only the
segment that raised its hand ever gets pitched. This is why the cron block is dormant
until a quiz audience ID exists rather than defaulting to `RESEND_AUDIENCE_ID`.
