# Day 7 attribution test — did the 60 failed checkouts come from Instagram or Whop Discover?

Status: instrumentation **was broken**, is now **fixed and verified end to end** (20 Aug 2026).
The plan's method for answering the question **will not work**. A method that will is below.

---

## 1. What the plan says to do, and why it won't answer the question

Part 5, Day 7 makes the test conditional and manual:

> **0 sales AND you completed a successful test purchase on Day 1:** … send DM-3 to all 60
> failed checkouts tonight, individually. Their response rate is your answer.

Four problems, in order of severity:

1. **It measures the wrong thing.** Response rate to a cold DM is a measure of DM response
   rate. Non-response is uninformative — it is equally consistent with "clipper who never
   wanted the product" and "buyer who moved on". You cannot separate the two hypotheses
   from silence, and silence will be the overwhelming majority of the outcomes.
2. **It is gated on an unrelated outcome.** The test only fires if Day 7 shows *zero* sales.
   At 1–2 sales the plan says "continue, do not change the offer" and the attribution
   question simply never gets asked — even though it is exactly as open as it was before.
   Whether the 60 were clippers is independent of whether three strangers bought this week.
3. **The respondents are selected against.** If the clipper reading is right, a clipper has
   no incentive to reply "I was trying to join the clipping thing" to the operator whose
   programme they applied to. The people most likely to reply are the ones who genuinely
   wanted the product — which biases the sample toward the answer that flatters the channel.
4. **It cannot be instrumented.** The 60 checkouts happened 8–13 August. Nothing built today
   can retroactively tag a past event. Any honest answer about *those* 60 has to come from
   data that already exists, or from asking people. The plan chose asking people; the data
   already exists and is better.

**Keep DM-3, but not as the test.** It is a good reactivation message — 60 people with a
known, now-fixed reason for failing to pay is the warmest list in the business. Send it for
the revenue. Just don't treat the replies as measurement.

---

## 2. What was actually broken (found by checking, not assuming)

The site had what *looked* like attribution and wasn't:

| Layer | State before 20 Aug |
|---|---|
| Shortlinks `/ig`, `/yt`, `/tt`, `/clip` → `/links?utm_source=…` | **Worked.** Landing was correctly tagged. |
| Carrying the tag across an internal click (`/links` → `/plan`) | **Broken.** UTMs were read from `location.search` only. One internal navigation and the source was gone. |
| Appending the source to the outbound `whop.com` URL | **Broken.** The click handler fired a GA4 event and never touched the href. Nothing reached Whop. |
| Coverage of the click handler | **Broken.** Of the five pages carrying checkout links, only the homepage had it. `/plan`, `/system`, `/playbook`, `/welcome-plan` had none. |
| `/playbook` checkout links | **Actively wrong.** Hardcoded `utm_source=liftoffr` — a placement label occupying the field that should hold the acquisition source. |
| `api/whop-webhook.js` reading `data.utm_source` | Present and correct — but never receiving anything. |

Net effect: **a visitor who arrived from Instagram and bought produced a Whop order with no
source on it.** The question "where did this buyer come from" was structurally unanswerable,
which is why the audit could only mark the clipper reading "Not proven".

## 3. What is fixed now

`js/attribution.js`, deployed on all 24 pages carrying a Whop link (all five checkout pages):

- Records **first-touch** UTMs in `localStorage` on landing. First touch, deliberately —
  someone who arrives from Instagram, reads for a week and returns direct is an Instagram
  acquisition. Last-touch would relabel them `(direct)` and understate every channel that works.
- Falls back to the referrer hostname when untagged; marks genuine direct as `direct`.
- Appends the stored source to `whop.com` links **at click time**. Whop records `utm_*`
  against the membership (keys must start with `utm_`), so it lands on the order record.
- Preserves a link's own `utm_content` (placement) while overriding a hardcoded
  `utm_source` — placement and source are different fields and were being conflated.

**Verified end to end in a browser, not assumed:**

```
/ig  →  /links?utm_source=instagram&utm_medium=bio&utm_campaign=links&utm_content=ig_bio
        stored: {utm_source: instagram, utm_medium: bio, first_seen: 2026-08-20}

then internal navigation to /plan (the step that previously destroyed attribution):
  before: https://whop.com/checkout/plan_MntgjXJaQnGsW
  after:  https://whop.com/checkout/plan_MntgjXJaQnGsW?utm_source=instagram&utm_medium=bio
          &utm_campaign=links&utm_content=ig_bio&utm_term=ft_2026-08-20

/playbook, where a hardcoded utm_source=liftoffr previously overwrote the truth:
  before source: liftoffr   →   after source: instagram   (utm_content=hero preserved)
```

From today, **the question cannot recur**: every order carries its own answer.

---

## 4. The method that will actually settle the 60

It rests on one structural fact:

> **Whop Discover buyers never load liftoffr.com. Instagram buyers must.**

The two hypotheses therefore make opposite, checkable predictions about 8–13 August:

| | If the 60 came from **Instagram** | If the 60 came from **Whop Discover** |
|---|---|---|
| Outbound checkout clicks from liftoffr.com | ~60 | ~0 |
| Sessions with `utm_source=instagram` | ≥60 | unrelated to the 60 |
| Whop checkout sessions with a site UTM | most | none |
| Whop funnel / Discover source on those sessions | absent | present |

### Check these, in this order

**1. Whop — the decisive one (5 minutes, no waiting on replies).**
Open the 60 failed checkout sessions. Whop stores, per membership/checkout session: a
`ch_***` session id, `utm_source/medium/campaign/term/content`, and its own `trackingLinkId`,
`funnelId` and `source`. You are looking for one thing: **do these 60 carry a Discover /
funnel source and no site UTM?** If yes, they are Discover traffic and the question is closed
on direct evidence. This needs no one to reply to anything.

**2. GA4 — the corroborating check.**
Count outbound checkout clicks for 8–13 Aug: the `cta_clicked` event.

```
curl -u liftoffr:<DASHBOARD_PASSWORD> \
  "https://liftoffr.com/api/analytics?src=ga4&report=events&from=2026-08-08&to=2026-08-13"
```

Explicit `from`/`to` were added on 20 Aug — the endpoint previously only took a relative
`days=N`, which cannot express a window that has already closed. If the call returns a
credential error, **`GA4_CREDENTIAL_SETUP.md`** is the two-minute fix list.

> **State this caveat when you use it.** In that window the click handler existed **only on
> the homepage**, so this figure undercounts by an unknown amount and cannot prove the
> Instagram case. It can only *disconfirm* it: if it reads ~0 while 60 checkouts existed in
> Whop, those checkouts did not come through the site. A low number is evidence; a zero is
> close to conclusive. This is a one-directional test and should be reported as one.

**3. The corroborating facts already in the audit.**
350 Whop users with clipper usernames joined in the same window at $0.00 spend, the $29
product was "Live on Discover", and Reel link taps were ~0 across the period. None of these
is decisive alone; together with (1) they are.

### What to conclude

- **Discover confirmed** → stop counting Whop Discover users as demand. They are not buyer
  traffic. The 6,068 Instagram followers remain entirely unvalidated as a channel, and
  Phase B is the first real test of them.
- **Instagram confirmed** → the checkout fix was the whole constraint and the audit's
  Finding 2 is wrong; say so and re-plan around a channel that already converts.
- **Mixed / unreadable in Whop** → then, and only then, send DM-3 as a tiebreak, and treat
  the replies as weak evidence rather than an answer.

---

*Written 20 Aug 2026. Instrumentation verified live the same day. Step 2 needs the
`DASHBOARD_PASSWORD` and possibly the two GA4 env vars, none of which this document's
author holds — see `GA4_CREDENTIAL_SETUP.md`. Everything else here is already done.*
