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

## 2. Pin comments on your top 10 posts · ~20 min · phone is fine

Second-highest value, no filming needed.

The bottleneck is **people not commenting**, not the funnel — roughly 1.3M views produced
only a few hundred keyword comments. Your back catalogue is inventory you can fix today.

Open **`DRAFTS_FOR_TORIN.md` → Part 2.** Six pinned comments, written and ready. Pick by
what the post is about, one per post, start with your most-viewed.

Also point your bio link at `liftoffr.com/quiz`.

---

## 3. Send the review requests · ~10 min

You have buyers and zero displayed reviews, in a category where every competitor shows
4.8–5.0.

**`DRAFTS_FOR_TORIN.md` → Part 1.** Three emails, one per product tier.

They deliberately invite unhappy buyers to speak up and offer them refunds. Keep that in —
asking only happy customers is exactly what forced the unverifiable testimonials off
`/playbook`.

---

## 4. Film the on-camera CTA · when you can

The one thing nothing substitutes for, and roughly a 38× lever by itself.

**The rule:** if the CTA isn't spoken in the first five seconds *and* burned in as
on-screen text, the post doesn't ship. About 55% of your views are non-followers who never
read the caption.

---

## 5. September 7 — honour it, then index `/system`

`/system` publicly says founding pricing closes September 7 and that the date won't move.
It's `noindex` right now on purpose; the research says index it *after* the window closes.

On Sep 7: let it close, then change `/system`'s robots meta to `index, follow`.

If the date slides, that mechanic is spent permanently — it's the only real urgency the
site has.

---

## 6. Two decisions I left for you

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
- **`/track-record` still shows the backtest figure** in its body, wrapped in the "here's
  what's wrong with this number" framing. It's gone from every hero, meta title and social
  card. Want zero occurrences anywhere? Say so.
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
