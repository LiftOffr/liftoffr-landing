# Content Rewards — campaign brief, ready to paste (2026-08-08)

**Status: app installed, campaign not created — the builder will not
authenticate in the automated browser.** Retried 2026-08-08 with three
workarounds; all failed. Details at the bottom under "Why I couldn't do it."

**You need to open it once yourself.** Fastest route is the Whop mobile app.
Steps are at the bottom. Then paste everything below into the form.

Everything below is what to put in the form. Copy-paste.

---

## Settings

| Field | Value | Why |
|---|---|---|
| Type | **Clipping** | You have a reel library. UGC campaigns need creators to shoot new footage; clipping uses what exists. |
| Rate | **$1.00 per 1,000 views** | Market range is $0.25-$5. $1 is the honest entry point and roughly 1/10th of Meta's CPM. |
| Total budget | **$500** to start | ≈500K views at $1 CPM. Enough to read a signal, small enough that a dud costs you a weekend, not a month. |
| Min payout | **$5** | Filters junk submissions that would eat your review time. |
| Max per video | **$250** | Caps a single viral clip from swallowing the budget. |
| Platforms | **TikTok, Instagram Reels, YouTube Shorts, X** | All four are supported and all four are places your format already works. |
| Approval | **Manual review before payout** | Do not leave this on auto-approve. See the compliance section. |
| Duration | Until budget is spent | No end date needed at this size. |

## Campaign title

> Clip LiftOffr — Bitcoin cycle content, $1 per 1K views

## Campaign description (paste this)

> I run a faceless Bitcoin cycle account: car-POV and lifestyle b-roll with
> burned-in text over it. No charts, no talking head, no hype. The whole brand
> is "write the plan down before you need it" — I sold the 2025 top at $124,824
> and I round-tripped $30,000 in 2022, and both are on the site with dates.
>
> Clip from my existing library and post it. I pay $1 per 1,000 verified views.
>
> **What I want:** short, quiet, confident. The hook lands in the first half
> second with no audio. The payoff is discipline, not money.
>
> **What gets rejected instantly:** anything implying returns, any "10x", any
> price prediction, any fake urgency, any watermark from another app, and
> anything that makes it look like I manage money or give personal advice. I'm
> education only and I stay that way.

## Content requirements (paste into the requirements field)

> **Must:**
> - Use LiftOffr footage or your own b-roll — no other creators' watermarked clips
> - 9:16, 1080p or better, no TikTok/CapCut watermark
> - Include `liftoffr.com` on screen or in the caption
> - Include "education only, not financial advice" in the caption
> - Disclose the paid relationship (#ad or "paid partnership") — this is not optional
>
> **Must not:**
> - State or imply any income, profit or return. Not "made me $X", not "10x",
>   not "life-changing money", not implied through lifestyle framing
> - Use "guaranteed", "risk-free", "can't lose", "passive income"
> - Give a specific Bitcoin price prediction as fact
> - Claim LiftOffr manages money, gives personal advice, or tells anyone what to buy
> - Use countdown timers, fake scarcity, or invented testimonials
>
> Rejected submissions aren't paid. If you're unsure whether something crosses
> the line, ask before you post — I'd rather answer than reject.

## What only you can do

1. **Open the app and create the campaign** (the builder wouldn't render for me).
2. **Fund it.** Whop's docs: *"you will not be charged until you set up your
   payments on Whop and deposit funds."* You'll get a payment popup after
   creating the campaign — choose a method and deposit. **$500** to start.
   Your Whop balance is currently **$26.54**, so this is a real card charge.
3. **Give clippers the footage.** Point the campaign at a public Google Drive
   folder or a Drive link with the approved library. Without source material a
   clipping campaign has nothing to clip.

---

## The honest caveat, stated once

`WHOP_LISTING_COPY.md` recommended holding off on clippers until one organic
reel clears the 0.1% views→site bar, and that reasoning hasn't changed:
**clippers multiply whatever the funnel already converts at.** Right now that's
0.013-0.034%. At $1 CPM, 500K bought views through the current funnel is a
realistic **65-170 site sessions** and **0-8 sales** — likely a net loss on the
$500, judged purely on direct revenue.

You asked for it and it's built, so here's the version where spending it is
still smart:

- **Treat the $500 as a measurement, not a customer-acquisition spend.** It buys
  a clean read on whether the offer converts *any* cold traffic at volume —
  which is the exact question the day-30 gate asks and can't currently answer,
  because there isn't enough traffic to judge.
- **Watch views→site, not sales.** If bought views convert at the same 0.02% as
  organic, the bottleneck is the offer/landing, not distribution, and no amount
  of reach fixes it. If they convert meaningfully better, clippers are a real
  channel and you scale.
- **Stop at $500 and read it** before funding more. One decision, one number.

Either outcome is worth $500. Spending it and *not* reading the number is the
only way this is wasted.


---

## Why I couldn't do it, and exactly what you tap

### What was tried (2026-08-08)

| Attempt | Result |
|---|---|
| Fresh reload of the app surface | Infinite spinner |
| Enter via sidebar click instead of direct URL | Same spinner |
| Grab the app iframe's URL and open it first-party | **No app iframe is ever created** — the only iframe on the page is a Stripe helper. The app fails before it inserts its own frame, so there is nothing to open directly. |
| `/dashboard/.../marketing/content-rewards/` | Redirects to dashboard home; route doesn't exist |
| `whop.com/joined/contentrewards/` | That's the clipper-facing community (473K members, Daniel Bitton's) — where clippers *find* campaigns, not where brands create them |

Console shows the actual fault:

```
[PAGE_VIEW.requested] /joined/liftoffr/ ; Expecting: bot_id
[WS:LOG] WebSocket connection established
[WS:LOG] WebSocket connection closed after 101 ms
[WS:ERROR] FORCE CLOSED: user_id_mismatch_client_some_server_none
```

"client some, server none" means the browser is sending a user id the server
can't match to a session. Every other part of Whop authenticates fine in this
browser — dashboard, products, affiliates all work — so it's specific to the
embedded-app layer. Most likely Brave blocking the cross-site cookie the embed
needs. I'm not going to lower your browser's security settings on my own.

### Do it on your phone — 6 taps

1. Open the **Whop app** (native — no iframe, no cookie problem). If you don't
   have it, App Store → "Whop".
2. Bottom bar → your **LiftOffr** whop.
3. Left sidebar / app list → **Content Rewards** (it's installed and waiting).
4. **Create campaign** → choose **Clipping**.
5. Fill it from the settings table above. The two that matter most:
   **$1.00 per 1,000 views** and **$500 total budget**.
6. Paste the description and content requirements from above.

Stop at the payment popup — that's the funding step and it's your card.

### If you're on desktop Brave instead

Tap the **lion icon** in the address bar → toggle **Shields DOWN** for
whop.com → reload the page. The app should render. Turn Shields back on
afterwards if you like; the campaign will already exist.

### Still stuck?

Whop support is in the dashboard sidebar under **Support chats**. Tell them:
*"Content Rewards app loads to an infinite spinner, console shows
`FORCE CLOSED: user_id_mismatch_client_some_server_none`."* That error string
will get you to the right engineer immediately.
