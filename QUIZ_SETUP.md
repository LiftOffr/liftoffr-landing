# Current operational status: September 21, 2026

This section supersedes the historical setup instructions below. Verify the authenticated runtime `?check=1` before activating.

- Resend now has three groups: LiftOffr Free, LiftOffr Plan Buyers, LiftOffr Quiz. The current account permits three segments, so four additional segment groups cannot be created without an upgrade. Use pooled neutral follow-up copy; the immediate result email remains personalized by quiz result.
- `RESEND_QUIZ_AUDIENCE_ID` routes new quiz opt-ins into the pooled group. No old contacts were imported and no customer email was sent during setup.
- Torin supplied and authorized the footer mailing address on September 21 UTC. Production `LIFTOFFR_MAILING_ADDRESS` and a prospective `QUIZ_SEQUENCE_START_AT` are configured. Follow-ups 2–7 apply only to qualifying contacts created on/after that timestamp. Do not reset old opt-in dates or bulk replay a sequence. Confirm deployed status with authenticated `?check=1`; release evidence is in `~/Documents/liftoffr-email-activation-2026-09-21/`.
- Quiz membership, including unsubscribed membership, suppresses the generic welcome sequence. Plan buyer membership suppresses free and quiz sales nurture. Complete paginated audience reads must succeed before sending; errors abort the run.
- Authenticated `?dry_run=1` reads audience membership and returns aggregate routing counts only. It sends nothing and does not invoke the DCA watchdog. Counts labelled eligible are routing eligibility, not emails due today.
- The daily sender retains narrow age windows and Resend idempotency. It is not a durable catch-up queue; an outage can miss a window. Do not describe it as guaranteed delivery.
- Public quiz signup now states the immediate result, six follow-ups over two weeks including paid Buy Plan information, and the Sunday Score. Reply-to and footer contact: `contact.liftoffr@gmail.com`. Address value stays in production configuration, not git.
- Evidence: `/Users/torin/Documents/liftoffr-friction-fixes-2026-09-20/RELEASE.md`.

---

## Historical setup (superseded where it conflicts)

# Quiz + sequence — technical notes

> **Not the starting point.** For what to actually do, in order, read
> **`TORIN_ACTION_CHECKLIST.md`**. This file is background detail.

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

## The steps themselves live in `TORIN_ACTION_CHECKLIST.md`

The Resend / ManyChat / Whop dashboard steps, the verification commands and the ongoing
items are consolidated into one checklist so there is a single file to work from and a
single place to keep current:

**→ `TORIN_ACTION_CHECKLIST.md`** (repo root)

Short version: **Resend is the only required step** — create the quiz audience(s) and set
the matching `RESEND_QUIZ_AUDIENCE_*` env vars in Vercel Production to switch on emails
2–7. ManyChat is optional (both retired magnet URLs already redirect to `/quiz`). Whop
needs nothing.

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
