# Quiz + sequence — the dashboard steps only Torin can do

Everything in the repo is built and inert. Nothing below has been touched in any live
account: no Resend audience was created, no ManyChat keyword was changed, no Whop
config was modified, and nothing was deployed or pushed.

**Until step 1 is done, the quiz still works end to end** — a visitor takes it, gets
their result on the page, submits their email, lands in the existing free audience, and
receives email 1 with their segment. Only **emails 2–7 are dormant.** That is deliberate:
sending a segmented sequence to an untagged pooled list would throw away the whole
mechanism.

---

## What's already wired in the repo

| Piece | Where | State |
|---|---|---|
| The quiz | `/quiz/index.html` | Live-ready, client-side, no API needed to score |
| Email 1 (Day 0, "your cycle position") | `api/subscribe.js`, `magnet: "quiz"` branch | **Active** — sends on submit today |
| Emails 2–7 (Days 1/3/5/7/10/14) | `api/cron-welcome-followups.js`, quiz block | **Dormant** until step 1 |
| Segment routing | `api/subscribe.js`, `RESEND_QUIZ_AUDIENCE_*` lookup | No-op until step 1, by design |
| Copy source of truth | `emails/QUIZ_SEQUENCE.md` | — |

**No new serverless function was added.** The project is at Vercel's 12-function cap
(`CLAUDE.md`), so the quiz rides on the existing `/api/subscribe` endpoint and the
sequence rides on the existing daily follow-up cron. Function count is still 12.

---

## Step 1 — Resend: create the audience(s) *(required to switch on emails 2–7)*

Two options. **Recommended: option B**, because it is what makes emails 2 and 5 actually
personalised, and personalisation is the entire reason the quiz exists.

### Option A — one pooled audience (simpler, neutral copy)

1. Resend → **Audiences** → **Create Audience** → name it `LiftOffr Quiz`.
2. Copy its UUID.
3. Vercel → project → **Settings → Environment Variables** → add
   `RESEND_QUIZ_AUDIENCE_ID` = that UUID, for **Production**.

Result: all seven emails send on schedule. The two segment paragraphs (emails 2 and 5)
don't render — every email still reads correctly without them.

### Option B — four segment audiences (recommended)

1. Create four audiences: `LiftOffr Quiz — Round-tripped`, `— Accumulating`,
   `— Sitting`, `— New`.
2. Add four env vars in Vercel Production, each set to the matching UUID:
   - `RESEND_QUIZ_AUDIENCE_ROUNDTRIPPED`
   - `RESEND_QUIZ_AUDIENCE_ACCUMULATING`
   - `RESEND_QUIZ_AUDIENCE_SITTING`
   - `RESEND_QUIZ_AUDIENCE_NEW`

Result: full sequence with the segment paragraphs live. Per-segment audiences take
precedence over the pooled one if both are set.

**Either way the contact is also added to the main `RESEND_AUDIENCE_ID` free audience**,
so the Sunday Score keeps reaching them and the existing unsubscribe path keeps working
unchanged.

---

## Step 2 — ManyChat: point the keyword at the quiz

Not done here — this is live ManyChat config.

- Current keyword flows send to `/checklist` or `/buyzone`. **Both now 307-redirect to
  `/quiz`**, so nothing is broken if you never touch ManyChat.
- When convenient, change the destination URL to
  `https://liftoffr.com/quiz?utm_source=instagram&utm_medium=manychat&utm_campaign=quiz`
  so the redirect hop and the stale UTMs go away.

**The higher-impact ManyChat-adjacent change isn't in ManyChat at all** (research action
#4): the bottleneck measured was view → comment, not ManyChat → click. Say the CTA on
camera in the first 5 seconds and burn it in as a text overlay. That is the ~38×
lever; the keyword destination is housekeeping.

---

## Step 3 — Verify before you trust it

Preview any template without sending (auth required — same `CRON_SECRET`):

```
curl -u :$CRON_SECRET "https://liftoffr.com/api/cron-welcome-followups?preview=q2"
```

Valid values: `q2` `q3` `q4` `q5` `q6` `q7` (quiz), `qw` `e2` `proof` `e3` `stack`
`reengage` (free list), `p0` `p1` `p3` `p7` `p14` (plan buyers).

Then take the quiz yourself with a real address and confirm email 1 arrives with the
right segment. Contacts age off Resend's `created_at`, so email 2 lands the next day.

---

## Step 4 — Whop

**Nothing to do.** No Whop config was touched, no plan ID or price was changed, and the
quiz does not interact with checkout.

---

## Also changed in this pass, that you should know about

### The live email nurture was carrying the claims we removed from the site

`api/cron-welcome-followups.js` was sending a Day-5 email subject-lined
**"$50/week became $1.88M — the backtest"**, with a body containing `$24,450 → $1.88M`,
`+7,602% over plain DCA` and `100% win rate across 417 start dates`. That is the same
fact pattern removed from every page of the site, and it was going out daily to the
whole free list — a live send is a worse exposure than a page, not a better one.

That email is now the honest-proof email ("don't trust my backtest"). The dormant trial
templates carried the same figures and were stripped too, so re-enabling them can never
resurrect the claims. Every email footer's "Backtested 2017–2026" line is now the full
substantiation sentence.

### The two competing lead magnets are retired

`/checklist` and `/buyzone` now 307-redirect to `/quiz` (`vercel.json`). Both pages are
still in the repo and **both PDFs are still served from `/lead-magnet/`** — only the
landing pages are retired. Reverting is deleting two entries from `vercel.json`.

The Score-driven magnet swap (`applyMagnetMode`, buy-zone below Score 70 / checklist at
70+) is gone from the homepage and `/links` along with the magnets it switched between.

### Resolved: the $30K round-trip year is 2022

Confirmed by Torin 2026-08-16. The indicators topped out in **November 2021**; the
money came off **through 2022**. `CLAUDE.md` and `BRAND_VOICE.md` both already carried
2022 as canonical — the 2021 references on `/`, `/plan` and `/about` were drift, and
`/playbook` was the one page that had it right. All references now say 2022, and the
distinction between the 2021 signal and the 2022 loss is preserved everywhere rather
than flattened into one year.
