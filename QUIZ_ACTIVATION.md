# Turning on quiz emails 2–7 — the actual click list

**Written 2026-08-20. Everything in the repo is already built, deployed and inert.**
The only thing missing is a Resend audience and one Vercel variable. Nothing here needs
a code change.

`QUIZ_SETUP.md` is the background/technical file. This one is the do-list.

---

## What is live right now

A visitor takes `/quiz`, sees their result on the page, submits their email, lands in
the existing free audience, and **receives email 1 immediately** with their segment
already personalised. That path works today.

**Emails 2–7 are the dormant part.** They are written, deployed, and fire from the same
daily cron as every other sequence (`/api/cron-welcome-followups`, 17:00 UTC). They are
gated on an audience existing, because sending a segmented sequence into an untagged
pooled list throws away the entire mechanism.

---

## Option A — the five-minute version (recommended, start here)

One audience, one variable. Emails 2–7 go out in **neutral copy**: every email reads
correctly end to end, only the two personalised paragraphs don't render.

**In Resend** (resend.com → Audiences):
1. **Create audience** → name it `LiftOffr Quiz`.
2. Copy the audience **ID** from the URL or the audience page. It looks like
   `78261eea-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

**In Vercel** (vercel.com → liftoffr-landing → Settings → Environment Variables):
3. **Add** → Key `RESEND_QUIZ_AUDIENCE_ID`, Value = that ID, Environment = **Production**.
4. **Save**, then **Deployments → ⋯ on the newest → Redeploy.** Env vars are read at
   invocation, but redeploying is the reliable way to be sure the cron picks it up.

That is the whole job. The next 17:00 UTC cron begins stepping contacts through 2–7 by
age. Nothing else to configure.

---

## Option B — full personalisation (same steps, four times)

Only worth doing if you want the two per-segment paragraphs to render. Same flow, but
create **four** audiences and **four** variables. The names must match exactly — the code
builds them as `RESEND_QUIZ_AUDIENCE_${SEGMENT}`:

| Audience name        | Vercel variable                       |
|----------------------|---------------------------------------|
| Quiz — Round-tripped | `RESEND_QUIZ_AUDIENCE_ROUNDTRIPPED`   |
| Quiz — Accumulating  | `RESEND_QUIZ_AUDIENCE_ACCUMULATING`   |
| Quiz — Sitting       | `RESEND_QUIZ_AUDIENCE_SITTING`        |
| Quiz — New           | `RESEND_QUIZ_AUDIENCE_NEW`            |

Segment keys are case-sensitive and are exactly `ROUNDTRIPPED`, `ACCUMULATING`,
`SITTING`, `NEW`. A typo means that segment silently never receives anything, which is
the main reason to start with Option A.

**A and B can coexist.** If both are set, the per-segment audiences win and the pooled
one is ignored, so you can start with A today and add B later without unpicking anything.

---

## The send schedule, once it is on

Contacts are stepped by age in days, one email per band, and each send carries an
idempotency key, so a re-run cannot double-send.

| Email | Fires on day |
|---|---|
| 2 | 1 |
| 3 | 3 |
| 4 | 5 |
| 5 | 7 |
| 6 | 10 |
| 7 | 14 |

Anyone outside a band on a given run is skipped, so switching this on does **not** blast
a backlog. A contact who is already 30 days old matches no band and receives nothing.

---

## How to check it worked

**Immediately:** preview any email without sending. Requires the `CRON_SECRET` value
from Vercel:

```
curl -H "Authorization: Bearer <CRON_SECRET>" \
  "https://liftoffr.com/api/cron-welcome-followups?preview=q3"
```

`q2` … `q7` all work. This returns rendered HTML and sends nothing.

**Next day:** the cron's JSON response reports `quizSeq` with per-step counts and a
`skipped` total. Resend's own dashboard shows the sends.

**Sanity check before trusting it:** take the quiz yourself four different ways and
confirm you receive email 1 with the right segment each time. Email 1 is the part that
already works, so if it is wrong, fix that before enabling 2–7.

---

## Why this has not been done for you

Creating a Resend audience needs the Resend account, and setting a Production variable
needs the Vercel account. Both are Torin's logins. Everything downstream of those two
actions is already built, deployed and tested.
