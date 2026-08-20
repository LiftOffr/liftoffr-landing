# Copy sweeps: check components, not pages

**Written 2026-08-20 after the same class of bug survived three review rounds.**

## The failure mode

Every sweep so far was organised by *page* — "fix `/plan`, fix `/proof`, fix `/receipts`".
The defects are organised by *component*. A block of copy gets duplicated across surfaces,
one copy gets corrected, and the others keep serving the old claim for weeks.

Actual instances, in order of discovery:

| Correction | Fixed on | Survived on | Rounds it took |
|---|---|---|---|
| "crossed the exit threshold six times" | `/`, `/plan`, `/proof`, `/receipts`, D7 email | `/links` showcase, then `/blog` index card | 3 |
| Instruction ladder ("DCA continues", "Buy more weekly") | `api/cycle-score.js` `commentary()` | `api/subscribe.js`, both dashboards, `lead-magnet/welcome-sequence.md` | 2 |
| "eight indicators" / "other seven" | 3 blog posts | 3 more blog posts, `/faq` visible copy *and* its JSON-LD | 2 |
| Band boundaries | `zone()` | `commentary()`, the weekly-email prompt, `/quiz`, gauge legends, `/score` | 2 |
| "institutional-grade cycle intelligence" | — | 8 blog posts in 6 wordings, `llms.txt`, 3 other pages | found round 4 |

## What to do instead

1. **Grep the whole repo, every file type.** Not the pages you think own the claim.
   `grep -rn --exclude-dir=node_modules --exclude-dir=.git -i "<phrase>" .`
   Include `.md`, `.js`, `.txt`, `.py`, and `*.backup-*`. The generator script
   `scripts/build_indicator_pages.py` regenerates nine pages; a phrase fixed by hand there
   comes back on the next build.
2. **Search for the *wording variants*, not the canonical string.** "institutional-grade"
   existed in six different endings. One exact-match grep would have found one of nine.
3. **Check JSON-LD separately from visible copy.** They drift apart, and the JSON-LD is what
   Google and AI answer engines quote. `/faq` and the blog posts have both.
4. **Check the drafting docs in `emails/` and `lead-magnet/`.** They are not served, which is
   exactly why they get missed — and they are what live copy is rewritten from. They now carry
   a header saying so.
5. **After fixing, re-grep repo-wide and paste the result.** "I edited the file" is not
   evidence the string is gone; twice it wasn't.

## Canonical sources

- **Bands, register, commentary** — `api/cycle-score.js` `commentary()` and `zone()`. They
  must agree band-for-band; a comment in that file says so.
- **Every dated figure** — `/receipts`. Nothing may cite a signal figure that does not
  reconcile to a row there.
- **Indicator readings at cycle tops** — `/indicator-history` governs, and `/proof` says so.
- **Hit rates** — 21 of 46 at 30d and 90d, 25 of 46 at 180d. None is statistically
  distinguishable from chance; 31 of 46 would be needed. Never quote 35 of 64 or its
  complement 29 as a hit rate — `/receipts` refuses that framing in bold.

## Register rules

No instruction verbs in customer-facing copy: buy, sell, reduce, take profits, scale out,
de-risk, DCA, hold. No quality claims about the product (institutional-grade, proven,
best-in-class). No superlatives. Describe what the record did; never tell the reader what to
do. Limitations are kept and framed as the reason to trust the rest — never deleted.
