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

---

## The failure mode of 20–21 August 2026: unverifiable is not assumed fine

Two sessions worked this repo overnight. Between them they wrote four verification checks and
broke three of them, and the same shape appeared in the content, the emails and the course. It is
one failure mode, and it is worth more than the list of instances.

**Every one was a place where "I could not determine this" got written down as "this is fine",
because a passing result has no way to say the first thing.**

| Where | The check | What it actually measured |
|---|---|---|
| `verify_money_path.sh` | count checkout anchors | a bare grep for `whop.com/checkout` — which the `cta_clicked` selector itself contains, so counts read one high and a deleted anchor would have read as correct |
| `cta_clicked` selectors | list the destinations | correct until someone added a destination. Three times. |
| `check_cta_coverage.js` v1 | does the selector cover the links | skipped pages with no handler entirely — the most common way tracking breaks |
| `check_cta_coverage.js` v2 | as above, fixed | printed "no readable selector — check by hand" and continued. A silent pass wearing a note. |
| Course audit, three rounds | read the lessons | the Discord bot API returns empty `content` for embeds; "nothing there" was read as "nothing wrong". Old Module 5 turned out to be four lessons of instructed position sizing. |
| PDF verification | does the document say the right things | text extraction, which cannot see a blank page, a reflowed cover, or a production note rendered as body text |
| `HANDOVER.md` appendix 3 | count two pages | two of five cells were never measured at all — filled in from assumption, in the appendix about this exact failure |

**The rules that follow, in order of how much they saved:**

1. **Run the thing. Do not read about the thing.** Dispatch real clicks and count what reaches
   `dataLayer`. Render every PDF page as an image and look at it. Open the lesson in the client
   that renders it. Every serious defect this month was found this way and none was findable the
   other way.
2. **When a check cannot verify something, it fails.** Not warns, not skips. If that gets loud,
   improve the check — never soften it to a warning.
3. **Validate a check against the real failure it was written for**, by reproducing that failure,
   not a hypothetical one. Both coverage-checker holes were found this way.
4. **Re-measure the neighbours after finding one error.** Fixing one cell does not make the others
   right; the second bad cell in appendix 3 was found only because all five were recounted.
5. **A second pair of eyes reading your summary is worth little; a second pair running your work
   is worth almost everything.** Every summary written overnight was in good faith and accurate
   about what its author believed. That was not sufficient.

---

## An eighth instance, and the only one where I invented the constraint

21 Aug 2026. I concluded across several rounds that the Discord API "silently ignores category
assignment", tested it three ways, wrote it into `HANDOVER.md` and a spec file, and proposed
handing the user 26 manual drags.

**The `edit-channel` parameter is `parentCategory`. I was passing `category`.** Not a valid
argument, so it was dropped and the rest of the call succeeded — which is indistinguishable from a
silently-ignored field unless you re-read the schema.

This belongs with the other seven because it is the same disease with the polarity reversed:

- The other seven were **"I could not determine this" recorded as "this is fine."**
- This one was **"I did not check my own input" recorded as "the tool is broken."**

Both are a proxy standing in for the property. And the verification discipline that had been
working — read the state back, never trust the return value — did not save me, because it was
answering the right question about the wrong hypothesis. Reading the tree back correctly told me
the channel had not moved. It could not tell me *why*, and I supplied the why from confidence.

**The rule this adds:** when a tool "silently ignores" an argument, re-read its schema before
writing that down as a limitation. Three tests of the same wrong call are one test. And a
conclusion that ends in *"so the user will have to do it by hand"* deserves more scepticism than
one that ends in *"so I fixed it"* — it is the shape of an answer that lets you stop looking.

---

## A ninth instance — the interim state that was never acceptable

21 Aug 2026. Across this engagement I repeatedly fixed a wrong message by **posting a correction
underneath it** — in the course overviews, the assessments, the course map, `#verification`,
`#start-here`, `#whats-locked-and-why` and `#the-cycle-system`. Each time the reasoning was the
same: the tooling has no edit-message and no delete-message, so superseding was the only move
available.

**That reasoning was wrong, and it was wrong in a way worth naming.** A tool limitation explains
why I could not edit a message. It does not make a stack of corrections an acceptable resting
state for a paid course. The brief was always "remove the bad information and replace it with good
information" — and "post the good information below the bad information" is not that. It is the
same defect as a site that argues with itself, which is the exact thing this engagement exists to
remove. I had been eliminating that pattern everywhere else while creating it in Discord.

**What I had not noticed:** by the end, the *newest* message in four channels was itself
archaeology — "the message above this one describes a product that no longer exists", "I cannot
edit that post", "corrected 21 August". Deleting the stale copy would have orphaned the correction
that referenced it. The workaround had become load-bearing.

**What was actually available.** `delete-channel` + `create-channel` reach the same end state as
delete-message for any channel whose content I can reproduce. I had considered and rejected it on
the grounds that recreating a channel changes its ID and breaks inbound `<#id>` mentions — true,
but it made the wrong trade: I protected link integrity at the cost of correctness, when the
channels in question were ones **I had created hours earlier**, so nothing predating them could
possibly link to them. The cascade I feared was bounded and I never checked its bounds.

**The rule this adds:** when a tool limitation forces a workaround, state what the workaround costs
and whether that cost is acceptable as a *final* state — not just as a step. "This is the best I
can do with these tools" is a claim about the tools. It is not a claim that the result is good
enough, and the two get conflated exactly when the work is nearly finished and nobody wants to
reopen it.
