# TRACKING.md — what the data can and cannot tell you

**Written 20 Aug 2026.** This is the honest inventory: every event, where it fires, and —
more usefully — the list of questions your analytics **cannot** answer, so you stop asking
them of a dataset that does not contain the answer.

`MEASUREMENT.md` is the other half of this: it holds the baselines and the review cadence.
This file holds the plumbing.

---

## 1. The three systems, and which one is authoritative

| System | ID | What it is for | Consent-gated? |
|---|---|---|---|
| **GA4** | `G-015PKWM24J` | All on-site behaviour. Inline `gtag` on every public page, **not** via GTM. | Yes |
| **GTM** | `GTM-K5B4BX46` | The Whop pixel, and nothing else. | **No** — see §3 |
| **Microsoft Clarity** | `wl50cvbc1c` | Session replay and heatmaps. | Yes — only starts after Allow |
| **Vercel Analytics** | — | Pageviews only, on a subset of pages. | No |
| **Resend** | — | The email list. Each contact carries `utm_*` at signup. | n/a |
| **Whop** | — | Orders. Records `utm_*` params against the membership. | n/a |

**The authoritative record of revenue is Whop, and the authoritative record of a purchase
inside GA4 is the server-side `purchase` event** fired from `api/whop-webhook.js` off the
Whop webhook. That event is the reliable one precisely because it does not depend on a
browser, an ad blocker, or a consent choice. Never add a client-side `purchase` event
alongside it.

---

## 2. The event inventory

Everything below routes through `window.track(name, params)`, which calls
`gtag('event', …)` and mirrors the event name into Clarity. One wrapper, defined
identically on every page.

### Client-side

| Event | Fires on | Notes |
|---|---|---|
| `page_view` | every public page | automatic from `gtag('config')` |
| `utm_landing` | `/`, `/links`, `/receipts`, `/track-record`, `/indicator-history`, `/blog` + 9 posts | only when a `utm_source` is present. Largely redundant with GA4's own campaign capture. |
| `scroll_depth` | `/`, `/proof`, `/receipts`, `/track-record`, `/indicator-history`, `/blog` + 9 posts | fires at 25/50/75/90% |
| `cta_clicked` | see §5 — coverage is **partial** | `{cta_text, cta_position, destination, page}` |
| `begin_checkout` | `/plan`, `/system`, `/playbook`, `/welcome-plan` | **new, 20 Aug.** Fires when someone clicks through to a Whop checkout. `{item_id, plan_id, page, cta_position, utm_*}`. Carries no price on purpose — see §6. |
| `checkout_confirmed` | `/welcome`, `/welcome-plan` | the post-purchase landing. This is the only client-side event that can be joined to a purchase. |
| `lead_magnet_submit` / `lead_captured` | `/`, `/score`, `/free`, `/quiz` | submit fires on click, captured fires on a successful `/api/subscribe` |
| `quiz_started` / `quiz_answer` / `quiz_completed` | `/quiz` | |
| `section_viewed`, `faq_opened`, `exit_intent_shown`, `exit_intent_dismissed` | `/` only | |
| `page_not_found` | `404.html` | `{missing_path, referrer}` — use it to find dead inbound links |

### Server-side

| Event | Source | Notes |
|---|---|---|
| `purchase` | `api/whop-webhook.js` → GA4 Measurement Protocol | `{transaction_id, value, currency, items[item_id], source, medium, campaign, content}` |
| `subscription_event` | same | churn/renewal reporting |

### First-touch attribution (not an event)

`js/attribution.js` writes a `lo_attr` record to localStorage on the visitor's **first**
landing and never overwrites it. First-touch is deliberate: someone who arrives from
Instagram, reads for a week and returns direct is an Instagram acquisition, and last-touch
would relabel them "(direct)" and understate every channel that actually works.

That record is now read in three places:

1. **The outbound Whop URL** — `decorate()` appends the visitor's real `utm_source/medium/
   campaign` at click time, plus `utm_term=ft_<first-seen-date>`, so the source reaches the
   Whop order record.
2. **`begin_checkout`** — reports the same values that are going to Whop.
3. **The email signup payload** — `window.loLeadSource()` in `js/track.js`. Before 20 Aug the
   forms read only the *current page's* query string, so anyone who landed on one page and
   subscribed on another went into Resend as `source=liftoffr`.

`js/attribution.js` is now on **every** public page, including 404. It has to be on landing
pages, not just pages with checkout links — the original rollout selected pages by grepping
for `whop.com` and silently skipped `/score`, `/free` and `/quiz`, the three main free
entry points.

---

## 3. Consent — what fires before a choice is made

Consent Mode v2 defaults are set by an **inline snippet in every page's `<head>`**, before
the Google tags load. `analytics_storage` defaults to **denied**. `/js/consent.js` renders
the Accept/Decline banner. Choice is stored in localStorage under `liftoffr_consent_v1`.

- **Decline (or no choice yet):** Clarity never loads. GA4 runs in consent-denied mode —
  no analytics cookie, so hits are not stitched into a user or a session in the normal way.
  Treat declined traffic as **effectively invisible in standard reports.**
- **Allow:** Clarity starts, GA4 behaves normally.

**This is the single biggest limit on everything below.** Your GA4 numbers are not "traffic";
they are "traffic that pressed Allow". Until you know the accept rate you cannot scale any
GA4 figure up to reality. Nothing in the current setup measures the accept rate — see §7.

**One thing is not gated: GTM.** The `GTM-K5B4BX46` container loads on every page regardless
of consent, and the Whop pixel inside it appends a `_swuid` parameter to outbound checkout
links carrying screen size, timezone, OS and device type. Consent Mode governs Google's own
tags, not what a third-party tag inside the container does. `/privacy` names GA4, Vercel
Analytics and Clarity by name; it does not name this. That is a gap worth closing, and it is
a legal surface, so it is flagged rather than edited.

---

## 4. The chain from entry point to purchase

```
   tagged link  ──►  landing page  ──►  internal navigation  ──►  /plan  ──►  Whop  ──►  webhook
   /ig /r/:id        page_view            cta_clicked           begin_checkout    purchase
                     lo_attr written      (partial, §5)                           (server-side)
                                                                 utm_* appended
                                                                 to the outbound URL
```

**What survives the whole way:** the first-touch `utm_source/medium/campaign`. It is written
to localStorage on landing, appended to the Whop checkout URL at click time, recorded by Whop
against the membership, and read back by the webhook into the GA4 `purchase` event. Verified
end to end in a browser on 20 Aug for all three free entry points: landing on
`/score?utm_source=instagram`, navigating internally to `/plan`, and clicking the buy button
produces
`whop.com/checkout/plan_MntgjXJaQnGsW?utm_source=instagram&utm_medium=bio&utm_campaign=links&utm_content=ig_bio&utm_term=ft_2026-08-21`.

**What does not survive:** the link between that purchase and the browsing session that
produced it. See §6.

---

## 5. `cta_clicked` coverage — read this before trusting a click number

`cta_clicked` is the metric you would naturally use for "how many people moved toward the
offer". It does not fire everywhere. Audited 20 Aug by dispatching real clicks in a browser
and reading what reached `dataLayer` — not by reading the source, because the source looks
correct on the pages where it is broken.

It was badly broken on 20 Aug and is now nearly complete. Where it was broken, the handler
was bound to `closest('a[href*="whop.com/"]')` on pages containing no Whop anchor, or to
`a[href$="/plan"]`, which matches a bare `/plan` and misses every tagged one, or to
`a[data-dest]` on a page where only the primary button carried the attribute. Repaired the
same evening.

**How this was audited, because the method is the point.** Reading the handlers is not
enough: every broken one reads correctly, and one page had a listener that attaches, works,
and is bound to a single destination nobody cares about. The reliable method is to load each
page, enumerate every offer anchor on it, dispatch a real click at each, and count how many
reach `dataLayer`. Do it that way or the number is a guess.

**Live coverage, measured that way after the last deploy:**

| Page | fired / offer anchors |
|---|---|
| `/system` | 8 / 8 |
| `/playbook` | 9 / 9 |
| `/free` | 4 / 4 |
| `/stack` | 5 / 5 |
| `/indicators` and each of its nine subpages | 4 / 4 |
| `/when-will-bitcoin-bottom` | 4 / 4 |
| `/score` | 4 / 4 |
| `/quiz` | 5 / 5 |
| `/receipts` | 5 / 5 |
| `/proof` | 7 / 7 |
| `/blog` and the nine posts | 7 / 7 |
| `/links` | 11 / 11 |
| `/cycle` | 4 / 4 |
| `/faq` | 7 / 7 |
| `/track-record` | 8 / 8 |
| `/indicator-history` | 5 / 5 |
| **`/`** | **0 / 29** |
| **`/about`** | **0 / 5** |
| `/plan` | 12 / 18 |
| `/welcome-plan` | 3 / 4 |

**The homepage is the one that matters.** Its listener attaches and works; it is bound to
`a[href*="whop.com/"], a[href$="/start"], a[href$="/founder"]`, none of which exist on that
page, plus a second one for `/track-record`, which does fire. So the homepage measures
exactly one thing: clicks on the Track Record link. All 29 offer links, 7 to `/plan`,
3 to `/system`, 2 to `/playbook`, 3 to `/score`, 1 to `/free`, 11 to `/receipts`, are silent.
**Do not compare pages on click volume until this is fixed.** The homepage will read as the
worst-performing page on the site and it is simply not reporting.

`/plan`'s 6 misses and `/welcome-plan`'s 1 are secondary links without `data-dest`; the
primary CTAs on both are tracked.

### A trap worth naming: a hardcoded destination under a widened selector

When a selector is broadened, any `destination` that was hardcoded becomes a lie. This
happened live for part of 20 Aug: `/receipts` widened its selector, kept
`destination: sl==='plan' ? 'plan' : 'whop_checkout'`, and began logging its two `/score`
clicks as **checkout clicks on a page that has no Whop anchor at all**. Fabricated events are
worse than silence, because `begin_checkout ÷ purchase` is the checkout-abandonment ratio and
phantom checkout clicks poison it invisibly. Every handler now derives `destination` from the
href when no `data-dest` is set, and the sweep above confirms zero `whop_checkout` events on
pages with no Whop anchor.

---

## 6. Questions your data cannot answer, and why

### "Which channel produced this purchase?" — **partly**

Whop has it, because the outbound URL carries it. GA4's `purchase` event has it too, but as
**custom parameters** named `source`/`medium`/`campaign`, not GA4's reserved traffic-source
fields. Unless those have been registered as custom dimensions in GA4 Admin, they do not
appear in any standard GA4 report — the purchase shows as Direct. **Check Whop's order
records, not GA4's acquisition report.**

### "Which landing page produced this purchase?" — **no**

`api/whop-webhook.js` sends the GA4 `purchase` with `client_id` set to the **Whop user id**.
GA4's `client_id` has to be the visitor's `_ga` cookie value to join a Measurement Protocol
event to a browsing session. A Whop `user_…` id creates a brand-new GA4 user for every
purchase, so the purchase is a fresh, session-less, Direct user with no history. You can
count purchases and you can see their UTM parameters; you cannot walk backwards from one to
the pages the buyer read. A fix is proposed — carry the real `_ga` client id through the
checkout URL in the currently-unread `utm_term` slot and parse it back in the webhook.

### "What was the real acquisition source of this GA4 session?" — **no, and this is the big one**

**55 internal links on the site carry `utm_source=liftoffr`**, plus five `vercel.json`
redirects (`/checklist`, `/buyzone`, `/start`, `/join`, `/founder`). Those parameters were
added as *placement labels* — `utm_medium=score`, `utm_content=score_midpage` — and that is
how `js/attribution.js` treats them, deliberately overriding them with the visitor's real
source before the URL reaches Whop.

GA4 has no such override. Tagging an internal link with `utm_*` overwrites the session's
source/medium/campaign with those values. Two industry references disagree on the exact
mechanism — whether the corruption lands on the current session or is inherited by the next
one — but both are unambiguous that it corrupts acquisition reporting and that internal links
should never be tagged
([Analytics Mania](https://www.analyticsmania.com/post/utm-parameters-in-google-analytics-4/),
[Sanoop Balan](https://www.sanoopbalan.com/blog/utm-parameters-internal-links-ga4-gtm-tracking)).

**Practically: every path from a free entry point into `/plan` passes through at least one
tagged internal link.** So in GA4, essentially every session that reaches the checkout has
had its source rewritten to `liftoffr`. That is why "did those checkouts come from Instagram
or Whop Discover" was unanswerable *even with GA4 working*, and it is why the localStorage
first-touch layer had to be built at all. The first-touch layer is a workaround for a
self-inflicted wound, and it only covers the Whop URL and the email signup — not GA4.

**The fix is mechanical**: rename the internal parameters to something GA4 ignores
(`?from=score_midpage`), keep the placement information, and read that name where the code
currently reads `utm_content`. It touches ~20 files, so it is proposed, not shipped.

### "What is my consent accept rate?" — **no**

Nothing records the choice. Without it you cannot scale any GA4 number to reality. Two lines
in `js/consent.js` would fix it — see §7.

### "How many people reached a Whop checkout and did not buy?" — **now yes, from today**

`begin_checkout` ÷ `purchase`, split by `item_id`. This is new; there is no history. It
carries **no price**, deliberately: revenue already comes from the server-side `purchase`
using the amount Whop actually charged, and a second hardcoded price on the client would be
a duplicate source of truth for money — the exact failure mode `COPY_SWEEP_NOTES.md`
documents. What was missing was a count, and a count is what it sends.

### "Where do people stop reading?" — **only on some pages**

`scroll_depth` is on the blog, `/receipts`, `/track-record`, `/proof`, `/indicator-history`
and the homepage. It is **not** on `/score`, `/free`, `/quiz`, `/plan`, `/system` or
`/playbook` — the six pages where the question matters most. On `/score`, the first CTA sits
4.5 screens down on a 375px phone; whether anyone gets there is currently unknowable.

### "Did the Discord join happen?" — **no**

`/free`'s Discord button fires `cta_clicked` with `destination: discord`, which measures the
click. Whether they joined, and whether they were the same person, is not observable from the
site. Discord member count is the only proxy.

### "Which email produced a purchase?" — **partly**

Resend links carry `utm_*`, so an email-sourced visit is tagged on arrival and becomes the
first touch. It survives to Whop. But `utm_source=resend` is also what the *lead magnet PDF
links* carry, so email-sourced traffic and PDF-sourced traffic are the same value in the data.

---

## 7. The short list of things that would close the biggest gaps

Ordered by how much they unlock per unit of work.

1. **Stop tagging internal links with `utm_*`.** Rename to `?from=`. Unlocks GA4 acquisition
   reporting for the entire funnel. ~20 files, mechanical.
2. **Record the consent choice — but only the Allow branch.** One line in `decide()` in
   `js/consent.js`: fire `consent_choice` when `granted` is true and not otherwise. Firing an
   analytics event at the moment someone presses Decline is technically permitted under
   Consent Mode's cookieless pings and is still the wrong thing to do on a site whose banner
   says "nothing loads until you choose". The Allow count alone is enough: compare it against
   the same day's `page_view` count for a usable accept-rate floor. **Not shipped tonight** —
   it is a change to the consent surface, and those get proposed, never assumed.
3. **Pass the real GA4 `client_id` to the webhook** so purchases join to sessions. Touches
   `js/attribution.js` and `api/whop-webhook.js`.
4. **Register `source`/`medium`/`campaign` as GA4 custom dimensions** so the parameters
   already on the `purchase` event become reportable. Admin-only, no code.
5. **Fix `cta_clicked` on the homepage.** 0 of 29 offer links fire; the listener is bound to
   selectors that match nothing on that page. Every other page on the site is now at or near
   100%, which makes the homepage's zero actively misleading rather than merely missing.
   `/about` is 0 of 5 for the same reason. Selector change only, and it is the single
   highest-traffic page.
6. **Add `scroll_depth` to `/score`, `/free`, `/plan`, `/system`, `/playbook`.** Answers
   "does anyone reach the offer" on the pages where the offer is deep.

---

## 8. Rules for anyone changing tracking here

1. **Sweep by component, not by page.** Every tracking bug found on this site — the missing
   `attribution.js`, the dead `cta_clicked` listeners, the un-gated generator template — was
   a shared block rolled out to a subset of pages by grepping for the wrong thing. Grep the
   whole repo, then verify in a browser.
2. **Verify by dispatching a click and reading `dataLayer`, not by reading the source.**
   Every dead listener on this site reads correctly.
3. **Generated pages are generated.** `scripts/build_indicator_pages.py` rewrites
   `/indicators/*` and `/when-will-bitcoin-bottom` from `com.liftoffr.indicator-refresh` at
   07:20 MT daily. A hand edit there is reverted on the next successful run. Put it in the
   template.
4. **Nothing new may fire before consent.** Route everything through `window.track()`; it is
   already gated. Do not add a transport of your own.
5. **Never add a client-side `purchase`.** The server-side one is authoritative.
6. **After any deploy, re-verify the Apple Pay file and the four checkout links.** 200, 228
   bytes, `application/octet-stream`, sha256 `5d3b5ece…4def4c`; all four `plan_*` checkouts
   resolve 200 after the trailing-slash 308.
