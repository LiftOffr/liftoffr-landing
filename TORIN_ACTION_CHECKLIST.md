# Start here when you're back

**Updated 2026-08-16. Everything below is already live on liftoffr.com.**

Two files, that's it:

- **This one** — what to do, in order.
- **`DRAFTS_FOR_TORIN.md`** — copy to paste (review requests, Instagram comments).

---

## Where things stand

**Live and working:** the whole research rebuild. Income claims are gone from the site
*and* from the daily nurture email that was still sending them. The cycle quiz is at
`liftoffr.com/quiz` and email 1 fires the moment someone finishes it — tested on
production, it works.

**Dormant, waiting on you:** emails 2 through 7. Written, tested, deployed. They need four
audiences made in Resend and four variables pasted into Vercel. That's the only thing
between you and a working funnel. **~5 minutes, phone is fine.** Step 1 below.

**New:** every $29 buyer now gets a review request automatically at day 21, and star
ratings appear on the sales pages the moment real reviews exist. Two small things make
that fully live — steps 2 and 3.

**Not touched, on purpose:** anything that charges customers money, and anything on your
Instagram account.

---

# Do these in order

## 1. Switch on emails 2–7 · ~5 min · phone is fine

Highest-value thing you can do. Everything else can wait.

### In Resend → Audiences

Tap **Create Audience** four times. Type these names exactly:

```
LiftOffr Quiz — Round-tripped
LiftOffr Quiz — Accumulating
LiftOffr Quiz — Sitting
LiftOffr Quiz — New
```

Open each one after making it. The **Audience ID** is shown on the page — a long
`xxxxxxxx-xxxx-xxxx-...` string. Copy all four.

### In Vercel → liftoffr-landing → Settings → Environment Variables

Tap **Add Another** four times. Paste the Key, paste the matching Audience ID as the
Value, set Environment to **Production**.

```
RESEND_QUIZ_AUDIENCE_ROUNDTRIPPED   →  Round-tripped ID
RESEND_QUIZ_AUDIENCE_ACCUMULATING   →  Accumulating ID
RESEND_QUIZ_AUDIENCE_SITTING        →  Sitting ID
RESEND_QUIZ_AUDIENCE_NEW            →  New ID
```

### Then redeploy so the code picks them up

Vercel → **Deployments** → top one → **⋯** → **Redeploy**. Done.

> **Too fiddly on a phone? One-audience version works too.** Make a single audience called
> `LiftOffr Quiz`, add one variable `RESEND_QUIZ_AUDIENCE_ID` with its ID, redeploy. All
> seven emails still send. You lose one personalised paragraph in emails 2 and 5;
> everything else is identical. Take this if the four-way version is irritating you.

**Why I didn't do it for you:** every secret in your Vercel project is sensitive-flagged,
so the Resend API key can't be read back by anyone — including you — without going to
Resend directly. That's correct security and not worth defeating to save five minutes.

### While you're in Resend

Delete the contact `torin.christianson+quiztest20260816@gmail.com`. I made it to prove
email 1 really sends in production. Same reason I can't remove it myself.

---

## 2. Fill in the Playbook product ID · ~2 min · one field

**This silently costs you star ratings on your most expensive product.**

The review display is live on `/plan`, `/system` and `/playbook`. It reads real
reviews from Whop and renders them automatically. But the Playbook's Whop
product ID isn't recorded anywhere in the repo, so `/playbook` — the $497 page —
will show no rating even after reviews come in.

1. dash.whop.com → **Products** → Cycle Playbook → copy the `prod_…` from the URL
2. Vercel → liftoffr-landing → **Settings → Environment Variables** → add
   `WHOP_PLAYBOOK_PRODUCT_ID` = that value, **Production**
3. Deployments → top one → ⋯ → **Redeploy**

`/plan` and `/system` already have their IDs and need nothing.

- [ ] Playbook product ID set

---

## 3. Post the review request · ~1 min · phone is fine

You have 208 Whop members and 70 in Discord, and **zero reviews**. TJR has 2,240.
That's the biggest proof gap on the site.

Every future $29 buyer now gets asked automatically at day 21 — that part is
done and needs nothing from you. But it can't reach anyone who bought *before*
today, and Discord is the only channel that does.

Copy is in **`REVIEW_CAMPAIGN.md` § 2** — Discord announcement, three buyer
emails, and a Whop DM. Paste the Discord one first; it's the highest return.

Three rules baked into all of it, don't edit them out: ask **everyone** (not just
the happy ones), offer **no incentive**, and point unhappy buyers at the 30-day
refund. Selectively soliciting positive reviews is what forced the old
testimonials off `/playbook`.

- [ ] Discord announcement posted
- [ ] Buyer emails sent (Resend → Broadcasts, or hand me a send-scoped key)
- [ ] Whop DM sent

---

## 4. Pin comments on your top 10 posts · ~20 min · phone is fine

Second-highest value, no filming needed.

The bottleneck is **people not commenting**, not the funnel — roughly 1.3M views produced
only a few hundred keyword comments. Your back catalogue is inventory you can fix today.

Open **`DRAFTS_FOR_TORIN.md` → Part 2.** Six pinned comments, written and ready. Pick by
what the post is about, one per post, start with your most-viewed.

Also point your bio link at `liftoffr.com/quiz`.

---

## 5. Film the on-camera CTA · when you can

The one thing nothing substitutes for, and roughly a 38× lever by itself.

**The rule:** if the CTA isn't spoken in the first five seconds *and* burned in as
on-screen text, the post doesn't ship. About 55% of your views are non-followers who never
read the caption.

---

## 6. September 7 — honour it, then index `/system`

`/system` publicly says founding pricing closes September 7 and that the date won't move.
It's `noindex` right now on purpose; the research says index it *after* the window closes.

On Sep 7: let it close, then change `/system`'s robots meta to `index, follow`.

If the date slides, that mechanic is spent permanently — it's the only real urgency the
site has.

---

## 7. Two decisions I left for you

**The $9 order bump on `/plan`.** Adding the Exit Ladder Worksheet as a checkout add-on.
The worksheet already exists inside `/system`, so there's nothing to build — it's a Whop
config plus deciding whether you want a bump at all. Untouched because it changes what
customers get charged.

**Counsel review** of two things: the "1:1" → "private session" rename (already made; a
lawyer should confirm it's sufficient), and the alerts feature. `/plan` now states that
alerts are notifications of what you're doing, not instructions for the reader.

---

# Things I changed that you might want back

Each is a small edit to reverse. All are live.

- **Homepage lead CTA is now free** (`/cycle`), not the $29 plan. The paid path is still in
  the nav, the pricing section and the sticky bar. Research: nobody in this category sells
  to cold traffic.
- **The backtest outcome figures are gone from `/track-record` entirely** — including the
  equity-curve chart, which plotted the same number. That page now shows the method, the
  signals against price, and the drawdown comparison instead.
- **The projection table is deleted** — the one estimating what different weekly amounts
  would have become. It was the strongest income claim on the site.
- **Two `— LiftOffr member` quotes came off `/playbook`.** Exact wording saved in
  `CHANGELOG_2026-08-16_RESEARCH_FINDINGS.md`. To restore: real name, written permission,
  and a typical-results line.
- **Car captions on `/about`** no longer say the system paid for them. Photos and the whole
  dad-callback story stayed.
- **Homepage close** is no longer "a great cycle and a great regret" — that implied money
  missed by not buying.

**To undo everything:**

```
git revert -m 1 df2bd9f && git push origin main
```

---

# Deliberately not done

Per the research, not oversight:

- **Repricing** — System to $247, Playbook above $497. Both wait until ten System buyers
  exist. Pricing with no revenue is guessing.
- **A live signal log.** The site used to promise one. There's no storage in the project to
  build it honestly, and every store that could be added is one you could silently edit —
  so the promise came out. What replaced it is stronger: every number is recomputable from
  CBBI's public data using published weights, so nobody has to trust your record-keeping.

---

# Reference

| File | What's in it |
|---|---|
| `DRAFTS_FOR_TORIN.md` | Review emails, pinned comments, caption openers |
| `CHANGELOG_2026-08-16_RESEARCH_FINDINGS.md` | Every change and why |
| `emails/QUIZ_SEQUENCE.md` | The 7-email copy |
| `QUIZ_SETUP.md` | Technical notes on the quiz |
