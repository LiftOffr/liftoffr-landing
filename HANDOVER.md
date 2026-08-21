# LiftOffr — what to do next

Written 20 Aug 2026. Everything below is either **yours to do** (needs your accounts or your
judgement) or **already done**. Nothing here needs you to reason about how it got this way.

Work top to bottom. It is ordered by consequence, not by category.

---

## Part 1 — Do these, in this order

### 1. Re-print the buy plan PDF and replace it in Whop · 15 min
**Why it matters:** three people have paid for this document and the copy they hold says the
System has "8 indicators" (it has nine), and it is missing three of the nine things `/plan`
promises on the sales page. The corrected source is ready.

**What breaks if you skip it:** buyers hold a document that contradicts your own site, and three
of your nine numbered promises are undelivered.

**Steps:**
1. Open `PLAN_PRODUCT_DRAFT.md` in the repo. It is the source the current PDF was printed from.
2. Render it to a page (any markdown previewer) and **Print → Save as PDF** from Chrome. That is
   how the existing PDF was made — its metadata says Chrome print-to-PDF, 2 Aug.
3. Go to **whop.com → your LiftOffr product → Content → "My Bear Market Buy Plan"** and replace
   the attached PDF with the new file.
4. Post one line in `#plan-updates` saying the doc was updated and what changed.

**Already corrected in the source:** the nine-component count, the exit thresholds and whipsaw
rule (new section 5b), the recompute sheet (new 5c), the dated revision line, and your exit
paragraph. **No trigger price, tranche size or budget figure was touched** — they already matched
the live ladder exactly.

---

### 2. Confirm the three $29 buyers actually have access · 10 min
**Why it matters:** money has changed hands. The role code is correct — the $29 plan maps to the
`@Plan` role — but nobody has verified it fired for the three real purchases.

**What breaks if you skip it:** a paying customer sitting outside the channel they were promised,
with no way for you to know.

**Steps:** Discord → **Server Settings → Members** → search each buyer → confirm they hold
**@Plan**. If any is missing, they never linked Discord in Whop account settings, or the webhook
did not fire. Add the role by hand and tell them.

---

### 3. Check whether `#plan-updates` is actually gated · 5 min
**Why it matters:** it sits under **Signals & Alerts**, not under **🔒 Locked · Paid Access**,
while `#the-29-buy-plan` sits under Locked. If Signals & Alerts is open, the channel you sell as
buyer-only is readable by everyone.

**Steps:** right-click `#plan-updates` → **Edit Channel → Permissions** → check whether
`@everyone` can View Channel. If they can, deny it and allow `@Plan` explicitly.

---

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

**Steps:** files are in `course/`. Whop → your product → **Courses → Add Chapter** per module,
**Add Lesson** per lesson, paste the markdown. Modules 1 and 5 are drafted; the rest are coming.
Old Modules 1, 2, 3 and 6 (wallets, DCA, psychology, custody) stay — they do not depend on the
indicator framework.

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

## Part 3 — Open, with a decision attached

| Decision | The tension | My read |
|---|---|---|
| **The $497 Playbook** | It is a private session sold beside a $197 course that teaches independence. | Leave it. It is capacity-limited and priced honestly. |
| **Showcase magnitudes** | The count is honest (3/3) but featured hits average larger than the log's, and the Nov 2017 +149% miss is not in the homepage showcase. | Swapping it in for a 2022 signal would fix the skew but lose the "no signal at the FTX low" admission. Your call. |
| **Old course Modules 1/2/3/6** | Kept because they are framework-independent. Not re-read line by line. | Worth a pass for anything that assumes the eight-indicator model. |
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

## One thing needing your answer

**Your 2025 exit is described two different ways and they do not agree.**

- The **PDF** now says, on your instruction: *"I exited at the October 2025 top."*
- **`/about`** says: *"I sold into the 2025 top on a ladder... I laddered out over the following
  weeks,"* and that **"the ladder was early, and being early cost me the last leg."**

Early and costing you the last leg means you were out **before** the top. Exiting **at** the top
means you were not. Both carry the same honest carve-out — your word, unquantified, unauditable,
not evidence the model works — so neither overclaims. But a buyer who reads both sees a
contradiction, and this is the one class of error we spent the whole day removing.

**I have not changed `/about`,** because which is true is a fact about your own trading and not
mine to decide. Tell me which, and I will make both surfaces match in one edit.
