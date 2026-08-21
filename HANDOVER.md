# LiftOffr — what to do next

Written 20 Aug 2026. Everything below is either **yours to do** (needs your accounts or your
judgement) or **already done**. Nothing here needs you to reason about how it got this way.

Work top to bottom. It is ordered by consequence, not by category.

---

## Part 1 — Do these, in this order

### 1. Replace the buy plan PDF in Whop · 3 min
**Why it matters:** three people have paid for this document and the copy they hold says the
System has "8 indicators" (it has nine), and it is missing three of the nine things `/plan`
promises on the sales page. The corrected source is ready.

**What breaks if you skip it:** buyers hold a document that contradicts your own site, and three
of your nine numbered promises are undelivered.

**The PDF is built and sitting in two places on this Mac:**

```
~/Desktop/My-Bear-Market-Buy-Plan.pdf
~/liftoffr-plan-product/My-Bear-Market-Buy-Plan.pdf
```

**Use either — they are identical (214 KB, 8 pages).** The old version that was at those paths is
preserved beside each as `My-Bear-Market-Buy-Plan.SUPERSEDED-2026-08-02.pdf` (401 KB). If you are
ever unsure which you are holding: **the correct one is 214 KB; the superseded one is 401 KB.**

**It is deliberately NOT in the repo.** Every file here is served publicly — the free lead-magnet
PDF returns 200 today — so committing a paid deliverable would publish the $29 product as a free
download. `product/` and `*.paid.pdf` are now excluded in `.vercelignore` in case anyone tries.

**Verified before it was handed over:** no internal markers, review gates or `[TORIN]` notes
leaked; it says nine weighted components, not eight; the exit paragraph says he got out early and
it cost him the last leg; sections 5b and 5c are present; all nine trigger prices are unchanged;
and the total budget figure does not appear anywhere in it.

**Steps:**
1. **whop.com → your LiftOffr product → Content → "My Bear Market Buy Plan"** → replace the
   attached PDF with `~/Desktop/My-Bear-Market-Buy-Plan.pdf`.

> **Note:** the Whop content app would not load for us — it hung on a spinner indefinitely. If it
> does the same for you, try a different browser or the Whop mobile app before assuming anything
> is broken on your side.
4. Post one line in `#plan-updates` saying the doc was updated and what changed.

**Already corrected in the source:** the nine-component count, the exit thresholds and whipsaw
rule (new section 5b), the recompute sheet (new 5c), the dated revision line, and your exit
paragraph. **No trigger price, tranche size or budget figure was touched** — they already matched
the live ladder exactly.

---

### 2. Your paying buyers have no Discord access · 10 min — **CONFIRMED PROBLEM**
**Status:** filtering the member list by role returns **one holder of `@Plan`: Torin.** So of the
active $29 memberships, the ones that are not the test purchase have **no access** to
`#the-29-buy-plan` or `#plan-updates`.

**It is not a bug in the role code.** That path is correct and I traced it: the $29 plan maps to
`@Plan`, applied on `membership.activated`, with a Whop-API fallback to resolve the Discord ID.
It has nothing to act on, because the buyers never linked Discord to Whop.

**It was an onboarding gap, and it is now fixed in the repo.** The D0 email said "Join the
Discord", which reads as "click an invite" — and joining without linking puts you in the server
as an ordinary member with none of the plan channels. The linking instruction existed only on
`/welcome-plan`, in 12px grey small print. Both are corrected: connecting Discord inside Whop is
now step 1 of the D0 email in both HTML and plaintext, and the `/welcome-plan` instruction is a
callout rather than a footnote.

**Consequence while it stands:** the PDF in the Whop library is the *only* thing those buyers
have actually received. That raises the priority of step 1 — they are holding the old version.

**Steps for you:**
1. Discord → **Server Settings → Members** → filter by `@Plan` to confirm the current state.
2. Message the buyers: ask them to connect Discord in Whop account settings, or add `@Plan` by
   hand if you can match them.

---

### 3. ~~Check whether `#plan-updates` is gated~~ — DONE

**✅ It is gated.** Discord marks it "Private Channel (locked)" despite sitting under Signals &
Alerts rather than under Locked · Paid Access. No action needed; the category label is cosmetic.

### 4. ~~Retire the old indicator panel~~ — DONE
**Why it matters:** it published price targets ($38k/$53k/$70k/$80k), "DCA is the recommended
strategy" and "would be warranted" — the register removed everywhere else — on a channel
`/system` advertises.

**✅ DONE — nothing left here.** The retirement notice is posted, pinned, and the channel topic
points at `/score`, `/indicators` and `/receipts`.

The channel was deliberately **not** locked. It is bot-fed, the pin and the topic already stop
anyone reading the panel as current, and misconfiguring permissions on a paid-adjacent channel is
a worse risk than leaving it writable.

---

### 5. Upload the new course to Whop Courses · 30 min once written
**Why it matters:** the shipped course teaches eight indicators. Three of them carry no weight in
the Score, and RHODL — tied for the heaviest at 20% — is not taught at all. Four of the nine
weighted components, 35% of the model by weight, are missing from a course about the model.

**What breaks if you skip it:** the $197 product teaches a different framework than the free
Score publishes, so a buyer cannot tell which to believe.

**All 25 lessons are written.** Files are in `~/liftoffr-landing/course/`.

Whop → your product → **Courses**. Create six chapters in this order, then add the lessons under
each. Every lesson body is a copy-paste from the file named — no judgement required.

| # | Chapter | Lesson title | Body from |
|---|---|---|---|
| 1 | The number itself | 1.1 What the Score is | `module-1-the-number.md` |
| 2 | | 1.2 The six bands | `module-1-the-number.md` |
| 3 | | 1.3 The arithmetic | `module-1-the-number.md` |
| 4 | | 1.4 The divisor rule | `module-1-the-number.md` |
| 5 | | 1.5 Reproduce it unaided | `module-1-the-number.md` |
| 6 | The heavy half | 2.1 RHODL Ratio · 20% | `module-2-the-heavy-half.md` |
| 7 | | 2.2 Puell Multiple · 20% | `module-2-the-heavy-half.md` |
| 8 | The middle | 3.1 Trolololo trend line · 15% | `module-3-the-middle.md` |
| 9 | | 3.2 MVRV Z-Score · 15% | `module-3-the-middle.md` |
| 10 | | 3.3 Pi Cycle Top · 10% | `module-3-the-middle.md` |
| 11 | The 5% components | 4.1 2-Year MA Multiplier | `module-4-the-five-percents.md` |
| 12 | | 4.2 Reserve Risk | `module-4-the-five-percents.md` |
| 13 | | 4.3 Woobull Top Cap | `module-4-the-five-percents.md` |
| 14 | | 4.4 RUPL | `module-4-the-five-percents.md` |
| 15 | What carries zero weight | 5.1 CBBI — the source, not a component | `module-5-zero-weight.md` |
| 16 | | 5.2 Fear & Greed | `module-5-zero-weight.md` |
| 17 | | 5.3 Google Trends | `module-5-zero-weight.md` |
| 18 | | 5.4 Market Cipher | `module-5-zero-weight.md` |
| 19 | | 5.5 The framework moved | `module-5-zero-weight.md` |
| 20 | The record | 6.1 How to read /receipts | `module-6-the-record.md` |
| 21 | | 6.2 Why 35 of 64 is not a hit rate | `module-6-the-record.md` |
| 22 | | 6.3 Why 46% and 54% are the same number | `module-6-the-record.md` |
| 23 | | 6.4 So what is it for? | `module-6-the-record.md` |
| 24 | | 6.5 The whipsaw | `module-6-the-record.md` |
| 25 | | 6.6 Applying it | `module-6-the-record.md` — **needs your writing first** |

Plus one reference sheet: **The Phase Matrix**, from `reference-phase-matrix.md`.

**This is a large, error-prone operation and half-finishing it leaves buyers with a broken
product.** Do it in one sitting, or create all six chapters first and fill them in order so an
interruption leaves a visible gap rather than a silent one.

**Retire old Module 4 entirely when this goes up.** Old Modules 1, 2, 3 and 6 (wallets, DCA,
psychology, custody) stay — they do not depend on the indicator framework. See
`course/OLD_VS_NEW_DIFF.md` for what a buyer paid for that is disappearing (short answer: the
Market Cipher lesson, and it is your call what to do about it).

---

### 6. Switch on quiz emails 2–7 · 5 min
**Why it matters:** the sequence is written, deployed and inert. Everything downstream of two
actions is already built.

**Steps:**
1. **resend.com → Audiences → Create audience.** Name it anything; only the ID is read.
2. Copy the audience **ID**.
3. **vercel.com → liftoffr-landing → Settings → Environment Variables → Add**: key
   `RESEND_QUIZ_AUDIENCE_ID`, value the ID, environment **Production**. Save.
4. **Deployments → ⋯ on the newest → Redeploy.**
5. **Verify it took** (this is the step that saves you a day of guessing):
   ```
   curl -H "Authorization: Bearer <CRON_SECRET>" \
     "https://liftoffr.com/api/cron-welcome-followups?check=1"
   ```
   You want `"quiz_emails_2_to_7": "ACTIVE"`. If it still says DORMANT, the variable did not save
   to Production or you did not redeploy. `CRON_SECRET` is on the same Vercel screen.

Full detail: `QUIZ_ACTIVATION.md`.

---

### 7. Send Broadcast 1 · 10 min
**Why it matters:** it is the highest-leverage piece of writing you have. It turns the site's
biggest liability into its strongest asset and cannot be faked. Every claim in it is live and
checkable the moment it lands.

**Steps:** copy from `emails/BROADCASTS.md` (Broadcast 1), send to the free list from Resend.
It now covers **four** corrections including the arithmetic bug that changed your front-page
number — that fourth one is the one that makes the email worth sending.

---

### 8. Point your Instagram bio at `/score` · 2 min
**Why it matters:** every content link and pinned comment routes there, it is the free entry
point, and it now has a proper next step in it. Use **liftoffr.com/ig** — it tags the traffic so
you can tell Instagram apart from everything else.

---

### 9. Pin a comment on your top ten posts · 20 min
**Why it matters:** roughly 1.3M views produced a few hundred keyword comments. Pinned comments
are free real estate on reach you have already paid for.

**Text:** `Free: today's Score, all nine weights and the arithmetic → liftoffr.com/score`

---

### 10. Send the Sunday Score · 10 min, every Sunday
**Why it matters:** a cadence you keep is a proof asset; a cadence you break is a liability.

**Steps:** draft is at `emails/SUNDAY_SCORE_2026-08-23_DRAFT.md`. **Re-read liftoffr.com/score
and replace every number before sending** — the draft holds Wednesday's reading and the number
moves daily.

---

### 11. Add GA4 credentials · 15 min, only if you want the Day 7 attribution answer
**Why it matters:** it settles whether the 60 failed checkouts came from Instagram or Whop
Discover. Not urgent; it is a measurement question, not a revenue one.

**Steps:** `GA4_CREDENTIAL_SETUP.md`. **Run the check command at the top of that file first** —
the variables may already be set, in which case you do nothing.

---

### 12. Wire `#plan-updates` tier fires · 20 min, optional but it is a live promise
**Why it matters:** `/plan`, `/welcome-plan`, the D0 and D3 emails and the PDF all promise tier
fires land in `#plan-updates`. That channel has **zero messages, ever.**

**Steps:**
1. `#plan-updates` → **Edit Channel → Integrations → Webhooks → New Webhook.** Copy the URL.
2. Vercel → add `DISCORD_PLAN_UPDATES_WEBHOOK` (Production), paste, redeploy.
3. **Tell me before going live.** The existing payload carries your total budget and every
   tier's dollar amount; the buyer-facing version must carry only tier name, trigger price,
   fill and date. That split has to be built — it is not just a webhook.

---

### 13. Supply the CAN-SPAM mailing address · 5 min
**Why it matters:** commercial email legally requires a physical mailing address. Your emails do
not have one.

**Steps:** Vercel → add `LIFTOFFR_MAILING_ADDRESS` (Production) with the Montana registered
address. The footer renders it automatically and omits the line while unset. **Do not invent an
address** — it must be one that receives mail.

---

## Part 2 — Done and live

- Apple Pay works. `.well-known` file serving 200, correct bytes, correct content type. Real $29
  purchase confirmed.
- All four checkout links intact and verified after every deploy.
- **The Score arithmetic bug is fixed** — missing readings were averaged in as zeros,
  understating the published number by 1.8 points. Corrected, dated publicly on `/score`.
- One band scheme everywhere: six bands, same on the site, the API, the Sunday email prompt and
  the Discord bot.
- The zone-change alert now requires a 7-day hold, matching the rule `/receipts` publishes.
- Portfolio instructions removed from two blog posts and every reinfection source.
- Every published figure reconciles to `/receipts`. The showcase is 3 hits / 3 misses against a
  log that is 25 of 46.
- The site now states that **neither** hit rate is statistically distinguishable from chance.
- `/score`, `/free`, `/receipts` and `/proof` have a next step at the point of conviction.
- Attribution works end to end: first-touch source survives to the Whop checkout URL.
- Credential and webhook fallbacks removed — see hazards below.
- **The budget-exposure question is closed.** A search of the whole Discord server for the total
  budget figure returned zero results, none of the five webhooks in the server points at a
  signals or buy-plan channel, and the `||` fallback that could have redirected the briefing has
  been removed. Nothing leaked, and the path that would have allowed it no longer exists.
- Mobile: 29 pages clean at 375px.
- **Every entry point now has a next step at the point of conviction.** `/quiz` had *zero* route
  to anything paid despite being a designated funnel destination — that was the worst finding of
  the sweep, not the blog. Fixed, along with `/score`, `/free`, `/receipts`, `/proof` and all
  nine blog posts (which now carry a step at 55–66% of the article rather than 80%+).
  The blog steps point at the **free** Score and receipts, not at $29 — a cold reader arriving
  from a search about MVRV is not ready for a paid ask, and the funnel is blog → /score → /plan.
- Buyer onboarding fixed: connecting Discord inside Whop is now step 1 of the D0 email, and the
  `/welcome-plan` instruction is a callout rather than 12px grey small print.

## Part 2b — A strategic correction, and it is the important one

**Your paying customers number two, not sixty. Plan on that basis.**

Whop shows **350 users**. Sorted by spend, every visible one is **$0.00**, and they joined in a
6–12 day window. The names and emails are not ambiguous: "Aadi clips", "Crypto Clipz", "Clipper
Master / clippingaimaster@gmail.com", "advanced.clipping01@gmail.com", plus a long tail from
India, Nigeria, Tunisia, Algeria, Morocco, Uzbekistan and the Philippines. **That is a
clipper-programme intake, not an audience.**

Which means the 60 failed checkouts on 8–13 August were almost certainly clipper applicants
hitting a paywall — exactly what Part 0.1 of the overnight audit suspected, and contrary to how
the plan's Day 7 test framed it.

**What follows from that:**

- **DM-3 is downgraded.** The plan's reactivation script treats those 60 as recoverable buyers.
  They are not. Sending 60 individual DMs to people who wanted a clipping gig costs an evening
  and returns nothing. Do not run it as written.
- **The GA4 credential work drops down the list.** It exists to answer a question we now have the
  answer to. It is still worth doing eventually for ordinary funnel measurement — it is no longer
  a blocker for anything.
- **Instagram is not yet feeding the funnel.** The traffic in Whop is a clipper intake with zero
  purchase intent. The real conversion test starts when Torin's own crypto content goes out, not
  before.
- **"Day 7" means something different now.** The revenue checkpoints in the plan assume a warm
  audience arriving. There isn't one yet. Judge the next fortnight on whether content produces
  *any* qualified traffic, not on a sales target built for a funnel that was never running.

This is better to know now than after three weeks of DMing clippers. Nothing about the product is
wrong; the audience assumption was.

## Part 3 — Open, with a decision attached

| Decision | The tension | My read |
|---|---|---|
| **The $497 Playbook** | It is a private session sold beside a $197 course that teaches independence. | Leave it. It is capacity-limited and priced honestly. |
| **Showcase magnitudes** | The count is honest (3/3) but featured hits average larger than the log's, and the Nov 2017 +149% miss is not in the homepage showcase. | Swapping it in for a 2022 signal would fix the skew but lose the "no signal at the FTX low" admission. Your call. |
| **Old course Modules 1/2/3/6** | Kept because they are framework-independent. Not re-read line by line. | Worth a pass for anything that assumes the eight-indicator model. |
| **Old Module 5, lesson 3 — "Indicator-based exit signals"** | **I could not read it.** Discord lesson content is posted as embeds and the API returns them blank, so I can see the message exists but not what it says. If it teaches the eight-indicator set or the "N of 6 agreeing" heuristic, it has the same defect Module 4 had. | **Ten minutes of your reading.** Same for old Module 5's other lessons. I am not guessing at content I cannot see. |
| **`#indicator-readings`** | Retired, history visible. | Leave retired. Resuming means committing to a weekly cadence you have not kept since 26 July. |
| **Your exit account** | See the flag at the end of this file. | Needs you. |

## Part 4 — Standing hazards

1. **`vercel.json` Apple Pay is load-bearing.** Two parts: the 228-byte `.well-known` file and a
   `headers` entry pinning `application/octet-stream`. Both required. Never restore the old
   `rewrites` proxy — it failed verification. Never resolve a `vercel.json` conflict by taking
   one side wholesale.
2. **Never `||` one credential or notification destination onto another.** A payload carrying
   money must resolve to an explicitly-set variable or no-op. Two of these existed: the buy-plan
   briefing fell through to the ops webhook, and the DCA function fell back to the read-only
   Coinbase key, defeating the separation that stops a read-only credential placing live orders.
   Both are now explicit-or-skip.
3. **Sweep copy by component, not by page.** The same claim lives in duplicated blocks; fixing
   the page you think owns it leaves the copies serving the old version. Grep the whole repo
   including `.md`, `.js`, `.txt`, `.py` and backups, check JSON-LD separately from visible copy,
   and re-grep after. Details and the failure table: `COPY_SWEEP_NOTES.md`.
4. **`.md` drafting docs are downstream of live code, never upstream.** Three rounds of
   corrections were undone by someone re-copying from a doc. The files in `emails/` say so at the
   top.
5. **Never speak a Score value in recorded content.** It moves daily; recorded footage outlives it.

---

## Resolved

**The 2025 exit account is settled.** Torin exited *early*: he began laddering out from the
27 June 2025 exit crossing at $107,091, Bitcoin peaked at $124,824 on 6 October, and being early
cost him the last leg. `/about`, `/disclaimer` §4 and the buy-plan PDF now all tell that story,
with the same carve-out — his own account, unquantified, unauditable, not evidence the model
works, judge the method on `/receipts` instead.

That is also the better version. It is consistent with what the model published, it is the
version his own record supports, and a system that got him out early and cost him money — said
out loud — is more persuasive than a clean top call he cannot evidence.
