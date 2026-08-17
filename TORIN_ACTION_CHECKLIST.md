# Torin's checklist — branch `research-findings-2026-08-16`

Everything on this branch is built and inert. **Nothing has been pushed or deployed, and
no live account was touched** — no Resend audience created, no ManyChat keyword changed,
no Whop config or price modified.

This is the single list of things only you can do: **decide before merging**, **do in a
dashboard**, **do on an ongoing basis** — plus one optional project at the end.

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
- [ ] **`/receipts` no longer promises anything.** It previously committed to a live log
      starting August 16. That commitment is gone from all six places it appeared
      (`/receipts`, homepage §6, homepage FAQ, `/plan`, and both email templates), replaced
      with an instruction the reader can act on immediately: recompute any row from CBBI's
      public data using the published weights. Nothing on the site now depends on you
      remembering to do something daily.

---

## B. Dashboard steps

### B1. Resend — BLOCKED, and here is exactly why

I tried to create the four quiz audiences for you and could not. **Every credential in
your Vercel project is sensitive-flagged**, which means the value is write-only and cannot
be read back by anyone — not by the CLI, not by me, not by you without going to Resend
directly. `vercel env pull` returned 13 non-secret variables populated and all 34 actual
secrets empty, including `RESEND_API_KEY`.

That is good security and I did not try to work around it. It leaves three options:

1. **Do it by hand — about four minutes.** Resend → Audiences → Create Audience, four
   times: `LiftOffr Quiz — Round-tripped`, `— Accumulating`, `— Sitting`, `— New`. Then
   Vercel → Settings → Environment Variables → add for **Production**:
   `RESEND_QUIZ_AUDIENCE_ROUNDTRIPPED`, `RESEND_QUIZ_AUDIENCE_ACCUMULATING`,
   `RESEND_QUIZ_AUDIENCE_SITTING`, `RESEND_QUIZ_AUDIENCE_NEW`. Redeploy (any push, or
   Vercel → Deployments → Redeploy) so the functions pick them up.
2. **Simpler, slightly worse:** one audience called `LiftOffr Quiz`, one env var
   `RESEND_QUIZ_AUDIENCE_ID`. All seven emails send; the two personalised paragraphs in
   emails 2 and 5 don't render. Every email still reads correctly without them.
3. **Hand me a Resend API key** with audience scope and I'll do all of it plus the
   end-to-end verification.

Until then: **email 1 is live and sending today** — verified in production, Resend
returned a contact ID and a send ID. Only emails 2–7 wait on this.

- [ ] Audiences created
- [ ] Env vars set in Vercel Production
- [ ] Redeployed so the cron picks them up

### B2. Whop — NOT TOUCHED, needs your decision

The +$9 Exit Ladder Worksheet order bump (action #14) changes what customers are charged,
so it was deliberately left alone. The worksheet already exists as a `/system` deliverable,
so there is nothing to build — it is a Whop checkout config plus a decision about whether
you want a bump at all.

- [ ] Decide on the order bump, then configure it in Whop

### B3. Instagram — NOT TOUCHED, by design

Automating caption edits or comments on your account violates Instagram's terms and risks
the account. Paste-ready copy is in **`DRAFTS_FOR_TORIN.md`** instead — pinned comments,
caption openers, and the order to work through your back catalogue.

- [ ] Pin comments on your top 10 posts by views *(highest-return item available to you)*
- [ ] Bio link → `liftoffr.com/quiz`

### B4. Verify

Preview any email template without sending (needs `CRON_SECRET`, which I also can't read):

```
curl -u :$CRON_SECRET "https://liftoffr.com/api/cron-welcome-followups?preview=q2"
```

Valid: `q2`–`q7` (quiz) · `qw` `e2` `proof` `e3` `stack` `reengage` (free list) ·
`p0` `p1` `p3` `p7` `p14` (plan buyers).

### B5. Housekeeping

- [ ] Remove the test contact `torin.christianson+quiztest20260816@gmail.com` from the
      Resend free audience. It was created to verify email 1 fires in production. I can't
      remove it for the same reason I can't create the audiences.

## C. Ongoing — the things no code change can do for you

> **Removed from this list on purpose: "start the live signal log."** The site no longer
> promises one. There is no persistent storage wired into this project (no Blob, KV,
> Postgres or `GITHUB_TOKEN` — the Score is computed on the fly from CBBI and cached), so
> an automated append-only log could not be built on this branch. And every store that
> *could* be provisioned is freely rewritable by you, which would make a "live log" a
> claim rather than proof. So the copy now points at something better and permanent: the
> Score is deterministically recomputable from CBBI's public data using the weights already
> published on the indicator pages. Anyone can verify any date without trusting your
> storage or your memory. Nothing here can lapse. See section E if you ever want the
> automated version.

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

---

## E. If you ever want the automated live log

Not built, and deliberately not promised anywhere on the site. What it would take:

1. **Provision a store.** Vercel Blob is the least-effort option (dashboard → Storage →
   Create → Blob), which sets `BLOB_READ_WRITE_TOKEN` automatically.
2. **Append from the existing cron.** `api/cron-welcome-followups.js` already runs daily and
   already has the score-fetch helper. One append per run, no new function, cap untouched.
3. **Render `/receipts` from it** instead of the current static rows.

**The honest caveat, which is why it isn't the default:** Blob, KV and Postgres are all
freely rewritable by you. A log on mutable storage the publisher controls is not proof — it
is the same claim with more infrastructure, and claiming immutability for it would be worse
than claiming nothing. The only version that is genuinely tamper-evident is committing each
day's reading to git, where GitHub's timestamped history is external to you — the same
pattern `youtube_intel.py` already uses for `api/_cowen-data.js`. That needs a
`GITHUB_TOKEN` and would fire a production deploy daily, so it is a real project, not a
config change.

**Until then the current copy is stronger anyway**, because recomputability from a public
third-party source requires trusting neither your storage nor your discipline.
