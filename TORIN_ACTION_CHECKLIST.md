# Torin's checklist — branch `research-findings-2026-08-16`

Everything on this branch is built and inert. **Nothing has been pushed or deployed, and
no live account was touched** — no Resend audience created, no ManyChat keyword changed,
no Whop config or price modified.

This is the single list of things only you can do. Three groups: **decide before merging**,
**do in a dashboard**, **do on an ongoing basis.**

Deep technical detail lives in `QUIZ_SETUP.md`; the full record of what changed and why is
in `CHANGELOG_2026-08-16_RESEARCH_FINDINGS.md`.

---

## A. Decide before merging

None of these block the merge. They're calls I made that you should sign off on or
overrule — each is a small revert if you disagree.

- [ ] **The homepage hero CTA is now free (`/cycle`), not $29.** Biggest behavioural
      change on the branch, and the research's central recommendation: no operator in the
      study sells to cold traffic. The paid path survives in the nav, the pricing section
      and the sticky bar, so nothing is unreachable — but the first ask a stranger sees is
      free. One edit to revert.
- [ ] **`/track-record` keeps the `$1.88M` figure in its body.** Gone from every hero,
      proof strip, meta title and social card sitewide; it survives only on the methodology
      page, wrapped in the "what the backtest is, plainly" framing. If your rule is zero
      occurrences anywhere, say so and it comes out of the body too.
- [ ] **The `/track-record` tier projection table was deleted, not disclaimed.** It
      projected `~$376,638` to `~$7,532,776` against "lifestyle equivalent" contributions
      ($10/wk = "a daily coffee"). Not named in the research — I removed it under your own
      no-income-claims rule because it's the same shape aimed harder.
- [ ] **"1:1" renamed to "private session"** across 8 pages and the indexed meta. Label
      only — product, price, Whop plan ID and URL untouched. The research flags the literal
      string as the liability, so this is the safer place to sit while counsel looks at it.
      One find-and-replace to revert.
- [ ] **Two unattributed `— LiftOffr member` testimonials pulled from `/playbook`**
      (16 CFR 255.2). Original wording is preserved verbatim in the changelog. To restore:
      get the member's name and written permission on file, then reinstate with a
      typical-results disclosure. I did **not** backfill the slot with a fabricated
      stand-in — one card points at the record, the other says plainly there are no
      testimonials yet.
- [ ] **`/receipts` now publishes a live-log start date of August 16, 2026.** That's a
      public commitment the site now makes on your behalf. If you're not starting the daily
      log on that date, change the date before this merges — see section C.

---

## B. Dashboard steps

### B1. Resend — the only step that switches emails 2–7 on

**Required for the sequence. Everything else works without it.** Until this is done a
visitor still takes the quiz, sees their result, submits their email, lands in the existing
free audience, and receives email 1 with their segment. Only emails 2–7 are dormant — on
purpose, because sending a segmented sequence to an untagged pooled list would throw away
the entire mechanism.

**Recommended: Option B.** It's what makes emails 2 and 5 actually personalised, and
personalisation is the whole reason the quiz exists.

**Option B — four segment audiences (recommended)**

1. Resend → **Audiences** → **Create Audience**, four times:
   `LiftOffr Quiz — Round-tripped`, `— Accumulating`, `— Sitting`, `— New`
2. Copy each UUID.
3. Vercel → project → **Settings → Environment Variables** → add four vars for
   **Production**:
   - `RESEND_QUIZ_AUDIENCE_ROUNDTRIPPED`
   - `RESEND_QUIZ_AUDIENCE_ACCUMULATING`
   - `RESEND_QUIZ_AUDIENCE_SITTING`
   - `RESEND_QUIZ_AUDIENCE_NEW`

**Option A — one pooled audience (simpler)**

1. Create one audience, `LiftOffr Quiz`. Copy the UUID.
2. Add `RESEND_QUIZ_AUDIENCE_ID` = that UUID, Production.

All seven emails send on schedule either way; with Option A the two segment paragraphs
don't render and every email still reads correctly without them. Per-segment audiences
take precedence if both are set.

**Either way** the contact is also added to the main `RESEND_AUDIENCE_ID` free audience, so
the Sunday Score keeps reaching them and the existing unsubscribe path is unchanged.

- [ ] Audiences created
- [ ] Env vars set in Vercel Production

### B2. ManyChat — optional, nothing is broken if you skip it

- Current keyword flows point at `/checklist` and `/buyzone`. **Both now 307-redirect to
  `/quiz`**, so existing flows keep working untouched.
- When convenient, repoint the destination to
  `https://liftoffr.com/quiz?utm_source=instagram&utm_medium=manychat&utm_campaign=quiz`
  to drop the redirect hop and the stale UTMs.

- [ ] Keyword destination repointed *(optional)*

> **The higher-impact change isn't in ManyChat at all.** The measured bottleneck was
> view → comment, not ManyChat → click. Say the CTA on camera in the first five seconds
> and burn it in as a text overlay — that's the ~38× lever. The keyword destination is
> housekeeping. See section C.

### B3. Whop — nothing to do

No Whop config was touched. No plan ID, no price, no checkout change. The quiz doesn't
interact with checkout at all.

### B4. Verify before you trust it

Preview any email template without sending (auth uses your existing `CRON_SECRET`):

```
curl -u :$CRON_SECRET "https://liftoffr.com/api/cron-welcome-followups?preview=q2"
```

Valid values: `q2` `q3` `q4` `q5` `q6` `q7` (quiz) · `qw` `e2` `proof` `e3` `stack`
`reengage` (free list) · `p0` `p1` `p3` `p7` `p14` (plan buyers).

Then take the quiz yourself with a real address and confirm email 1 arrives with the right
segment. Contacts age off Resend's `created_at`, so email 2 lands the next day.

- [ ] Templates previewed
- [ ] Live quiz submission tested end to end

---

## C. Ongoing — the things no code change can do for you

- [ ] **Start the live signal log, and keep it.** `/receipts`, the homepage, `/plan` and
      email 3 of the sequence all now promise that from **August 16, 2026** every zone
      change is logged the day it happens, marked `LOGGED LIVE`, and left up whether it
      worked or not. The research calls this the only proof asset that compounds. It's also
      now a public commitment in four places — if it doesn't happen, the branch has made
      the credibility problem worse, not better.
- [ ] **Say the CTA on camera.** The shipping rule from the research: if it isn't spoken in
      the first five seconds and burned in as text, the post doesn't ship. This is the
      single biggest traffic lever available and it costs nothing.
- [ ] **Honour September 7 for the `/system` founding window.** It's the only credible
      urgency mechanic on the site. Per the scarcity analysis, if it slides once it's spent
      permanently.
- [ ] **Start requesting reviews from every buyer, now.** Star rating + review count is the
      most universal proof element in the category (4.8–5.0 across essentially every Whop
      listing) and LiftOffr displays none. The guarantee block and proof strips have room
      for them as soon as they exist.
- [ ] **Get a securities attorney to look at two things:** the "1:1" / private-session
      naming, and the alerts feature. `/plan` now carries the sentence the compliance memo
      asked for — *"Alerts tell you when a level in my published plan fires. They are
      notifications of what I'm doing with my own money, not instructions for you."* The
      research is explicit that it is research, not legal advice.

---

## D. Deliberately not done — for your awareness, no action needed

Left out on purpose, with the reason:

| Item | Why it's not here |
|---|---|
| Index `/system` (action #8) | Gated on the Sep 7 founding window closing |
| `/plan` order bump, +$9 Exit Ladder Worksheet (#14) | Needs Whop config, which this branch is barred from touching |
| Consolidate the three proof pages (#15) | Larger IA change; wanted the credibility fixes shipped first |
| Test $247 for the System (#23), re-price the $497 (#24) | The research explicitly defers both until after the first ten `/system` buyers — pricing with $0 revenue is a guess |
| Fix the brand account, face and voice (#19) | Not a code change |
| Start long-form at 1/week (#21) | Not a code change; 12-month payoff |

---

## One thing worth knowing before you read anything else

**The live email nurture was still sending the claims we stripped from the site.**
`api/cron-welcome-followups.js` had a daily Day-5 email subject-lined *"$50/week became
$1.88M — the backtest"*, with a body carrying `$24,450 → $1.88M`, `+7,602% over plain DCA`
and `100% win rate across 417 start dates` — going to the whole free list. A live send is a
worse exposure than a page, not a better one. That email is now the honest-proof email, the
dormant trial templates were stripped so re-enabling them can't resurrect the figures, and
every footer carries the full substantiation line.

The same `$1.88M` figure was also sitting in the `/track-record` anchor text of all nine
blog posts. Both were found on a second sweep after the first pass missed them.
