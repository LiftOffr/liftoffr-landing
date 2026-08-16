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
