# What the old course promised that the new one drops

**For Torin's decision, not a silent deletion.** Three people hold the $29 plan; the System's
buyer base is separate but the same principle applies — if someone paid for a lesson that is
disappearing, that is a call for you to make.

Source: the course map posted in `#how-to-use-this-course`, which lists all 36 lessons.

---

## 1. Lessons whose SUBJECT the method no longer has

These are the real decisions. The subject is not moving to another module — it is leaving.

| Old lesson | Module | Why it goes | Decision |
|---|---|---|---|
| **Market Cipher A/B basics** | M4 | Proprietary paid tool. Not reproducible from public data, so it cannot be a component of a number you are told to recompute. Also a short-horizon trading tool inside a multi-month model. | **DELETED** — Torin\'s call, 20 Aug. Nobody is currently working through the course, so there is no buyer mid-lesson. |
| **Indicator confluence strategy** | M4 | Taught the "N of 6 agreeing" heuristic. The method does not use it — the Score is a weighted average, and `/proof` explicitly disowns the counting framing as legacy. | **Replaced** by Module 1.1/1.3 (weighting, not counting). Nothing lost, but the *technique* a buyer learned is gone. |
| **Reading CBBI signals** | M4 | Framed the data source as a signal. It is the pipe the components are read from. | **Replaced** by Module 5.1, which teaches CBBI properly — as the thing you check my arithmetic against. |
| **Google Trends and retail behaviour** | M4 | Zero weight. Retail attention follows price, and its scaling is window-relative so there is no stable level to weight. | **Replaced** by Module 5.3 as context. Shorter than the original lesson. |

**Resolved 20 Aug.** Torin confirmed nobody is currently using the course, so the Market Cipher
lesson is deleted outright rather than deprecated — there is no buyer mid-lesson to strand. The
new curriculum contains no Market Cipher material at all.


---

## 2. Lessons replaced, with the subject intact

No decision needed; the buyer gets the same territory, corrected.

| Old | New |
|---|---|
| Pi Cycle top indicator | Module 3.3 — plus its 2025 miss, which the old lesson predates |
| BTC rainbow chart | Module 3.1 — taught as Trolololo, its actual name in the model, at 15% |
| MVRV Z-score **and** 2Y MA multiplier (one lesson, two components) | Modules 3.2 and 4.1 — split, because they carry 15% and 5% and are not a pair |

---

## 3. What the new curriculum adds that never existed

| New | Weight covered |
|---|---|
| Module 2.1 — RHODL Ratio | **20%** — joint-heaviest, never taught |
| Module 4.2 — Reserve Risk | 5% — never taught |
| Module 4.3 — Woobull Top Cap | 5% — never taught |
| Module 4.4 — RUPL | 5% — never taught |
| Module 1.3/1.4 — the arithmetic and the divisor rule | the spine; no equivalent existed |
| Module 6.2/6.3 — why 35/64 is not a hit rate, and why 46% and 54% are the same number | no equivalent existed |

**35% of the model by weight was absent from a course about the model's indicators.**

---

## 4. Old modules kept, and one thing to check

Modules 1, 2, 3 and 6 (wallets, exchanges, DCA mechanics, psychology, custody, bear survival) are
framework-independent and stay.

**RESOLVED 21 Aug 2026 — and it was worse than the flag anticipated.** I read all six old
Module 5 lessons through the Discord web client, which renders app-posted embeds that the bot API
returns as empty `content`. That is the only reason they had gone unread through three audits.

The flag guessed "the old eight-indicator set or a counting heuristic". Both were present, but
the real defect was larger: **four of the six lessons instructed the reader on what to do with
their own position, in the second person, with numbers.**

| Lesson | What it published |
|---|---|
| 1 · Spotting cycle phases | "What you should do" per phase: *maximum DCA*, *deploy cash reserves*, *sell aggressively — 50-70% of position minimum*, *do not re-enter on dips*. Phase ID via CBBI, Rainbow, F&G, Google Trends and **Market Cipher**. |
| 2 · Profit-taking frameworks | A six-rung sell ladder by price ($50K→$100K) and a second by CBBI (70/80/90). Forward price targets from a "cycles 2-3x from previous top" heuristic: *potential target zone $120K–$200K*. Three named risk profiles telling the reader what fraction to sell. |
| 3 · Indicator-driven exit signals | The worst one. Sell ladders on CBBI, Rainbow, Pi Cycle, MVRV, F&G and 2Y MA, plus a buy-side set. **"This signal has never given a false top in BTC history"** (Pi Cycle — false; it read 58 in 2021, 71 in 2025). **"Every previous cycle peaked here"** (MVRV Z 8 — false). *"When 4+ indicators are screaming sell … sell aggressively now."* |
| 4 · Portfolio rebalancing | Sound and framework-independent. Retired for tidiness; only its "rebalancing during euphoria" section is contaminated. |
| 5 · 2021 case study | Illustrated dollar returns: *Investor A +$13,750 vs Investor B −$11,750*, then *"could easily be at $100K+"*. The last surviving instance of the claim class removed from the site in the $1.88M sweep. |
| 6 · Execution errors | Mostly good. But *"the indicators have been right four cycles in a row"* and *"you can't lose by booking gains"* — neither is what the record shows. |

All six are now `retired-m5-*` in the Archive category, each with a notice naming its specific
defect. Nothing was deleted: the lessons contain Torin's own story and are his to re-shoot.

**Replacement:** six new channels, `m5-l1-how-to-read-receipts` through
`m5-l6-what-the-number-asks-of-you`, built from `module-6-the-record.md`. They contain no trigger
prices, no position percentages and no price targets.

**Modules 1, 2, 3 and 6 spot-checked and clean.** Module 3 lesson 5 (leverage control) is the
strongest lesson in the old course — it argues the right leverage is zero for 95% of readers and
gives harm-reduction guardrails for the rest. It stays untouched.

---

## Recommendation

Ship the new curriculum, retire old Module 4 entirely, and post a short note saying the indicator
module was rebuilt on the nine weighted components and what changed. The note costs you nothing
and it is the same move that makes Broadcast 1 worth sending: the correction is the credibility.


---

## Delivery surface — settled 21 Aug 2026

**Discord, via the bot. Not Whop Courses.** Torin confirmed he is not uploading anything, so the
upload table that used to live in `HANDOVER.md` is deleted and Discord is where the course is.

Everything in `course/` has a Discord counterpart; nothing is repo-only. The one intentional
compression is `module-5-zero-weight.md`, whose four lessons became the single channel
`m4-l10-context-zero-weight` — four short lessons that all conclude "this carries no weight" read
better as one, and splitting them would have given the zero-weight material more channels than
Pi Cycle has.

**One tooling limit worth knowing before the next change:** the bot cannot set a channel's
category and returns success when it fails to. Names and topics apply correctly. See
`HANDOVER.md` appendix 4 for the channels this left mis-grouped and the one-minute manual fix.
