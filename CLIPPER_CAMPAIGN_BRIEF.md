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
| Total budget | **$1,000** | Whop's minimum. At $1/1K that's up to **1,000,000 views** of headroom. |
| Min payout | **$5** | Filters junk submissions that would eat your review time. |
| Max per video | **$250** | Caps a single viral clip from swallowing the budget. |
| Platforms | **TikTok, Instagram Reels, YouTube Shorts, X** | All four are supported and all four are places your format already works. |
| Approval | **Manual review before payout** | Do not leave this on auto-approve. See the compliance section. |
| Duration | Until budget is spent | No end date needed at this size. |

## Campaign title (paste)

```
Clip Bitcoin Content — $1 / 1K Views · Footage Provided
```

Rate goes in the title. Every high-submission campaign does this
("Fanatics UGC - $3 per 1,000 views") because clippers scan a grid and filter
on the number before they read a word.

## Thumbnail

`img/campaign/liftoffr-clipping-thumbnail.png` — 1920×1080 (Whop wants 16:9).
Re-render at a different rate/pool with:
`python3 scripts/make_campaign_thumb.py --rate 1.50 --pool 1000`

## Campaign description (paste this — written FOR CLIPPERS, not buyers)

> **$1 per 1,000 views. $1,000 pool. Footage handed to you.**
>
> You don't have to film anything, write anything, or know a single thing about
> Bitcoin. I hand you the library — car POV, night drives, travel, lifestyle
> b-roll already shot and colour-graded. You cut it, slap the hook on, post it.
>
> **Why this one is easy money:**
> ✅ **Footage provided** — no filming, no sourcing, no watermark scrubbing
> ✅ **$1 / 1K views**, every platform, stacked across all four
> ✅ **Reviewed fast** — I approve manually, usually same day. No two-week ghosting.
> ✅ **No face, no voice needed** — the whole brand is faceless. Text on b-roll.
> ✅ **Repost the same cut** to TikTok, Reels, Shorts and X — all four count
>
> **The niche nobody is clipping:** everyone's fighting over the same trading
> and hustle campaigns. This is Bitcoin cycle content with an actual receipt
> behind it — I called the 2025 top at $124,824 and I publicly ate a $30,000
> loss in 2022. Both are timestamped on the site. That's the story, and it's
> a story nobody else in this category can tell.
>
> **What performs:** quiet luxury b-roll + a hard text hook in the first half
> second. No screaming, no charts, no talking head. Think "everyone wants this,
> nobody wants the boring years first" over a night drive.
>
> Hook bank, caption formats and the full library drop in the campaign chat
> once you join. First submissions usually approved within 24h.
>
> **Read the requirements before you post** — I reject on compliance, not on
> taste, and rejected clips don't get paid. The rules are short and they're
> non-negotiable.

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
   creating the campaign — choose a method and deposit. **$1,000** — Whop's
   minimum, so there is no smaller option. Your Whop balance is **$26.54**, so
   this is a real card charge.
3. **Give clippers the footage.** Point the campaign at a public Google Drive
   folder or a Drive link with the approved library. Without source material a
   clipping campaign has nothing to clip.

---

## The honest caveat, stated once

`WHOP_LISTING_COPY.md` recommended holding off on clippers until one organic
reel clears the 0.1% views→site bar, and that reasoning hasn't changed:
**clippers multiply whatever the funnel already converts at.** Right now that's
0.013-0.034%.

**$1,000 at $1/1K buys up to 1,000,000 views.** Run through the current funnel
that's a realistic **130-340 site sessions** and, at 3-5% cold conversion,
**4-17 sales** — roughly **$116-$493** against $1,000 spent. On direct revenue
alone, expect a loss.

Whop's $1,000 minimum removes the "start smaller" option, so the question is
just whether the information is worth $1,000. It is, on one condition — you
actually read it:

- **Treat it as a measurement, not customer acquisition.** A million views is
  genuinely enough to answer the question the day-30 gate can't currently
  answer: does this offer convert *any* cold traffic at volume? Today there
  isn't enough traffic to judge, and that ambiguity is worth more than $1,000
  to remove.
- **Watch views→site, not sales.** If bought views convert at the same ~0.02%
  as organic, the bottleneck is the offer and the landing page — and no amount
  of reach fixes that. If they convert meaningfully better, clippers are a real
  channel and scaling is justified.
- **Stop at $1,000 and read the number before adding a cent more.** One
  decision, one number. Do not top up on momentum.
- **Watch the burn rate too.** A million views is a lot of headroom; if it
  drains in days you have a demand signal worth acting on, and if it barely
  moves in two weeks the problem is the campaign's attractiveness, not the
  funnel — raise the rate to $1.50 before topping up the pool.

Either outcome is worth the money. Spending it and *not* reading the number is
the only way this is wasted.

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
   **$1.00 per 1,000 views** and **$1,000 total budget** (Whop's minimum).
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

---

## Research: what actually works on Whop Content Rewards

Sources: Whop's own setup guide and docs, OpenClip's clipper guide, campaign
rate data from July-August 2026.

### The three numbers clippers filter on

They scan a grid and sort by **rate**, then check **remaining budget**, then
**competition**. Everything else — your story, your product, your brand — is
read *after* they've already decided the economics work. That's why the rate
belongs in the title and on the thumbnail.

### Real campaigns, for calibration

| Campaign | Rate / 1K | Budget | Read |
|---|---|---|---|
| Roobet | $1.50 | **$250,000** | "The textbook deep pool" — mid rate, enormous headroom. Clippers can earn for months. |
| Call of Duty MW4 | $1.50 | $120,000 | Same shape |
| Boxabl | $0.50 | $85,000 | Low rate survives on budget depth |
| Pacinos | $1.00 | $50,000 | Market-average rate |
| MUTUUM | **$6.00** | small | The cautionary tale: 4× the average "attracts a swarm of clippers who can drain a small pool in days" |

Marketplace average is **~$1/1K**. Most campaigns sit **$0.50–$1.50**. Full
range is $0.20–$6.

### ⚠️ The honest problem with our campaign

**Our $1,000 pool is still 1/50th to 1/250th the size of the campaigns we're
next to.** A clipper sorting by remaining budget sees $250K, $120K, $85K… and
$1,000. At market-average rate we're near the bottom of the page on the exact
metric they screen second. Whop's $1,000 minimum is the floor, so this is as
small as a campaign can be.

We cannot win on budget. So we have to win on the other two things clippers
actually respond to:

1. **Effort.** Nearly every clipping campaign says "clip our podcast/streams" —
   the clipper has to find, watch and cut long-form. **We hand over pre-shot,
   colour-graded b-roll.** That is a genuinely lower-effort offer and it is the
   single strongest thing we have. It leads the description for that reason.
2. **Competition.** The money/hustle categories are saturated. Faceless Bitcoin
   cycle content with public receipts is a thin category — less competition per
   view.

### The one change worth considering

At **$1.00/1K** we are average rate + smallest pool = easy to scroll past.
At **$1.50/1K** we'd match Roobet and CoD on rate, which is the number that
gets the click, and $1,000 still buys 667K views of headroom.

The trade is 1M potential views → 667K. But **1M views nobody clips is
worth zero**, and the real goal here is a *measurement*, which needs
submissions to exist at all. If the campaign sits dead for a week at $1, raise
it to $1.50 before adding budget.

Re-render the thumbnail for the new rate in one command:
`python3 scripts/make_campaign_thumb.py --rate 1.50 --pool 1000`

### Thumbnail design rules, from what the winners do

- **Bold text + money/lifestyle aesthetic**, readable at ~340px card width
- **The rate is the biggest element on the image** — bigger than the logo,
  bigger than the brand name
- High contrast, dark background, one accent colour
- A face or a car reads better than an abstract graphic at small size

Ours puts `$1 / 1K` at 190px type over the Urus shot with a green dollar sign
(money cue) and a `$1000 POOL` pill. Verified legible shrunk to 340×191.

### What we're deliberately NOT copying

Every "make money" campaign leads with income claims. We can't, and shouldn't:
the clipper-facing pitch can hype **their** earnings all it likes (that's a
factual rate), but the **clips themselves** must stay clean — no income claims,
disclosure required, education-only. That split is exactly how the description
and the requirements block are written.
