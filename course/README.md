# The Cycle System — curriculum (nine-component rebuild)

**Status: DRAFT for Torin's review. Not uploaded to Whop.** Written 20 Aug 2026.

## Why this exists

The course that shipped taught **eight indicators**. Three of them — CBBI, Fear & Greed and
Google Trends — carry **no weight** in the Score, and a fourth, Market Cipher, was never a
component of it at all. Meanwhile RHODL Ratio, the joint-heaviest
component at 20%, was not taught at all. The site was corrected to nine weighted components on
20 Aug 2026. The course was not. That left the $197 product teaching a different framework than
the free Score publishes, which is the exact "which one do I believe" question this whole
correction pass exists to stop a buyer asking.

**This curriculum replaces Module 4 and every framework lesson.** Old Modules 1, 2, 3 and 6
(wallets, DCA mechanics, psychology, custody) are framework-independent and stay.

## Rules every lesson here follows

1. Every factual claim traces to published site content or a `/receipts` row. Nothing is
   invented for teaching purposes.
2. **No instruction to buy, sell, size or time anything.** Lessons describe what the model
   reads. What a learner does with that is theirs.
3. No accuracy claim the record does not support, and no forward-looking prediction.
4. Limits are taught as the reason to trust the rest, not as disclaimers bolted on the end.
5. Where a lesson would benefit from Torin's own judgement or capital decisions, **the lesson
   still ships complete without it** and the addition is marked as optional. Nothing customer-
   facing is left as a production note to be filled in later. Exactly one such marker remains,
   in 6.6, and it is explicitly labelled as an optional insert rather than a gap — the lesson
   above it stands on its own. Internal notes reaching a customer's page is how the 20 Aug PDF
   build failed; the rule is that a `[TORIN]` marker may never be the body of a lesson, and may
   never be its heading.

## Module map

| Module | Lessons | Status |
|---|---|---|
| 1 · The number itself | 5 | ✅ drafted |
| 2 · The heavy half (RHODL, Puell) | 2 | ✅ drafted |
| 3 · The middle (Trolololo, MVRV, Pi Cycle) | 3 | ✅ drafted |
| 4 · The 5% components (2YMA, Reserve Risk, Woobull, RUPL) | 4 | ✅ drafted |
| 5 · What carries zero weight, and why | 4 | ✅ drafted |
| 6 · The record, and what this is for | 6 | ✅ drafted |

Files: `module-1-the-number.md`, `module-5-zero-weight.md`, and so on. 24 lessons plus
`reference-phase-matrix.md`.

## Where this ships

**Discord, posted by the bot. Not Whop Courses — Torin confirmed on 21 Aug 2026 that he is not
uploading anything, so Discord is the delivery surface and these files are the source of record
for what is posted there, not a staging area.**

| This file | Discord channels |
|---|---|
| `module-1-the-number.md` | `m4-score-1` … `m4-score-5` |
| `module-2-the-heavy-half.md` | `m4-l1`, `m4-l2` |
| `module-3-the-middle.md` | `m4-l3` … `m4-l5` |
| `module-4-the-five-percents.md` | `m4-l6` … `m4-l9` |
| `module-5-zero-weight.md` | `m4-l10-context-zero-weight` (all four condensed into one) |
| `module-6-the-record.md` | `m5-l1` … `m5-l6` |
| `reference-phase-matrix.md` | `#course-resources` |

**The numbering here and in Discord deliberately do not match.** These files are numbered by the
new curriculum's own logic; Discord's Module 1, 2, 3 and 6 are the original course (wallets, DCA,
psychology, the long game) and are unchanged. The new material occupies Discord's Module 4 and
Module 5 because those are the two the rebuild replaced. If you renumber anything, renumber it in
both places in the same commit.

The Market Cipher lesson that stood in Module 5 was deleted on 20 August 2026, not deprecated:
it is proprietary, not reproducible from free public data, and was never a component of the
Score. Its Discord channel is gone too.
