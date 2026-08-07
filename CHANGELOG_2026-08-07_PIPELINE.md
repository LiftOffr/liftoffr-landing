# CHANGELOG — 2026-08-07 (evening pass: reel pipeline, SEO, attribution, Discord)

Follows `REVENUE_REVIEW_2026-08-07.md`. Everything below is executed and
verified unless a line says otherwise. Three things need Torin and are listed
at the bottom.

## 0 · Correction: I aimed at the wrong queue first

Torin's clarification: **the reels are faceless lifestyle footage — car POV,
night drives, travel — with burned-in on-screen text. No charts, no talking
head.** The Remotion reel factory renders animated chart/data reels. That
format cannot ship on this account no matter how well it renders.

So §1 and §2 below are real bug fixes to a real tool, but they were not the
bottleneck. `com.liftoffr.reels-refill` has been **unloaded and removed** —
rendering 3 chart reels a day would have burned ElevenLabs credits, CPU and
disk on output that never posts. `make refill` still works manually, and the
factory is functional again if a data reel is ever wanted for Stories, the
site, or a different channel. The 6 reels rendered tonight are in
`REVIEW/2026-08-07/`; treat them as optional, not queue.

**What actually feeds the queue** (traced tonight):
editor delivers a lifestyle clip → Drive → `auto_captioner.py` writes the
caption sidecar from the video frames → `drive_to_instagram` publishes on the
slot calendar. That pipeline is **healthy** — it captioned four clips at 23:15
tonight while I was working.

The real gap is one step earlier, and §2b is the fix.

## 1 · The reel factory was dead, not idle — root cause found and fixed

The queue has been empty since 2026-08-01. It was not a scheduling gap. Two
independent blockers, both silent, both failing on the very first reel:

| # | Blocker | Fix |
|---|---|---|
| 1 | `fetch_data.py` captions still said **"Comment SCORE"**. The pivot moved the reel CTA keyword to **PLAN** (master plan §10) and updated `EndCard.tsx` and `generate_script.py` — but not `fetch_data.py`. `lint_reel.py` BLOCKS any caption without PLAN, so all 6 templates died at step 2/6 with `missing PLAN comment keyword`. | All 6 captions now use the PLAN CTA verbatim from `generate_script.py`. PLAN is the keyword ManyChat already handles comment→DM end-to-end. |
| 2 | `faster_whisper` was not installed. `align_captions.py` raised `ModuleNotFoundError`, and `build_reel.sh` runs under `set -euo pipefail`, so step 4/6 killed the whole build. | Dependency installed **and** step 4/6 made non-fatal — a missing aligner now costs karaoke captions, not the reel. The props merge tolerates an absent captions file. |
| 3 | (found while testing) `data_market_take` omitted `indicators_mentioned` from `_numbers`, so any knowledge-base entry citing a numbered MA ("20-week moving average") failed number-traceability lint. | Indicator names now feed `text_numbers`. **48 of 50** knowledge-base entries pass lint; the 2 that fail trip the multiplier-hype rule and should stay blocked. |

Verified end-to-end: full renders with ElevenLabs VO, word-aligned karaoke
captions, −14 LUFS audio, and cover stills.

## 2 · Reel queue now auto-refills from the knowledge base

New `scripts/refill_queue.py`, `make refill`, and
`com.liftoffr.reels-refill` (**installed and loaded**, daily 07:15).

- Tops `REVIEW/` up to **6 fresh un-published reels**, capped at 3 builds per
  run so one invocation can't burn the TTS budget or the disk.
- Draws **2 of every 3** from unused entries in the 50-entry public-intel
  knowledge base, newest-first, so the queue fills with genuinely distinct
  market reads instead of the same latest-video take.
- Treats reels older than 10 days as **not** queue depth — every template
  renders live numbers, so a stale reel is not a postable reel. Without this
  the script would have read the July 27 folder as "queue full" over a dead
  queue.
- Records lint-blocked knowledge-base entries so it never retries them, and
  over-plans candidates so a blocked entry costs a candidate, not a reel.
- Recovers its own state from the props on disk if the state file is lost.
- **Renders only. Never posts.** `make publish REEL=...` is still the human gate.

**Queue went 0 → 6 tonight** (`REVIEW/2026-08-07/`): 4 market takes from
distinct knowledge-base entries, 1 score update, 1 myth bust.

Also installed: `anthropic` SDK, which was missing — `generate_script.py` was
silently falling back to deterministic copy on every build. The LLM copy layer
now actually runs.

## 2b · Hook packs — how the market read gets into a lifestyle clip

`auto_captioner` writes good captions, but it only sees the video frames. It
has no idea what the market is doing that week. And the **overlay text is
decided before the edit**, so it's the only place the current cycle read can
enter a faceless lifestyle clip at all.

New `src/hook_pack.py` + `com.liftoffr.hook-pack` (**installed and loaded**,
Sundays 07:00 MT — before the editor sits down). Each Sunday it writes
`~/liftoffr-video/CAPTIONS/hook_pack_<date>.md` with, per pack:

- **overlay** — the burned-in on-screen hook, 4–9 words, has to land in the
  first half second with no audio and no context
- **caption** — 2–4 lowercase lines in the house format
- **social** — the TikTok/YT/X one-liner with the link (comments don't work there)
- **lane** (EDU/LIFE/HYB) and **what footage it wants** ("night drive POV",
  "car walk-up") so the editor can match it to a clip

House rules from `caption_templates.md` are enforced **in code**, not just
asked for: keyword CTA capped 1-in-3 against `REEL_LEDGER.csv`, the ⸻ +
disclaimer block required whenever the keyword appears, overlay word-count
capped, and the same banned-language list `auto_captioner` uses plus the
reel-lint third-party-name rule. Packs that fail validation are logged and
dropped, not published.

The angle enters as a *feeling or timing cue*, never as data — "everyone's
waiting for green candles", not "the score is at 35". Never a chart, never a
price, never a named analyst.

**First pack written: 8 packs, 0 rejected**, in
`CAPTIONS/hook_pack_2026-08-07.md`. Two things surfaced by running it:

- The knowledge base carries gold and equities entries alongside BTC.
  Unfiltered, the three newest were BTC, gold, and *"the S&P is making new
  all-time highs"* — and it produced a new-highs hook tagged `#stockmarket` on
  a Bitcoin account, contradicting our own bear read. Now BTC-filtered with
  the emotional register and hashtag vocabulary pinned.
- A flat token budget truncated the JSON array mid-string at count=8 and lost
  the entire run. Budget now scales with count, and a truncated response
  salvages its complete objects rather than failing.

It never posts. It writes a file the editor reads.

## 3 · X threads now carry source attribution

`_X_INTEL_PROMPT` said, in as many words, *"No attribution to any analyst."*
The Discord embed got attribution via `_source_line`; the X thread did not, so
every posted thread summarised a named analyst's work off-platform as if it
were ours — the same liability shape ruling 9 killed, on a larger surface.

Tweet 3 now carries a mandatory verbatim credit line, and the prompt receives
the source title and channel to write it from. `_enforce_attribution()`
appends the line if the model drops it, so compliance does not depend on
prompt adherence. Kept at 3 tweets: a 4th post eats the ~17/day X free-tier
budget shared across all X agents.

## 4 · SEO / technical pass (committed — see blocker below)

| Surface | Before → After |
|---|---|
| `/plan` | `noindex` **while already listed in sitemap.xml** — a conflicting signal on the page every CTA on the site points at → `index, follow, max-image-preview:large` + full OG/Twitter cards + Product/Offer JSON-LD at $29 (price untouched) |
| `/free` | same `noindex`+sitemap conflict → indexable, full OG/Twitter |
| `/track-record` | no canonical, no OG at all → both added; description now leads with the $217K vs $1.88M contrast instead of generic framing |
| `receipts.html` | orphaned: no canonical, no OG, absent from sitemap → all three fixed |
| `index`, `/proof`, `/track-record`, `/links` | third-party testimonial avatars (dicebear, kym-cdn) loaded eagerly with no intrinsic size → `loading="lazy" decoding="async" width=80 height=80`; removes below-fold blocking requests and the CLS they caused |
| `sitemap.xml` | stale lastmod on touched pages → refreshed; `receipts.html` added |
| `/playbook` price box | bare "$997" with no anchor → anchored against the $29+$197 self-serve route and the documented $30K round-trip. No invented was-price. |

All JSON-LD validated as parseable; all edited pages pass an HTML structure
check. Pricing values unchanged everywhere, per the founder lock.

## 5 · Discord: a weekly reason to talk

`#general-chat`'s last member message is from **March 2026**. The free layer
gets seven kinds of bot content a day and has no conversation mechanism —
which is the shape of a leaky bucket, and membership went 72 → 58.

New `src/weekly_engage.py` + `com.liftoffr.weekly-engage`
(**installed and loaded**, Sundays 18:00 MT — deliberately offset from
weekly-indicators at 15:00). One message a week to `#general-chat`:

- what the Score actually did this week, from the live API (same source as
  the site and the reels),
- one question answerable in a single sentence, rotating weekly by ISO week
  so it isn't the same prompt every Sunday,
- a pointer to the free feed and to `#whats-locked-and-why`.

No `@everyone`, no hard CTA, one post a week. If the data fetch fails it skips
the week rather than posting a "week on the board" with no numbers in it.
**First post fires automatically Sunday 2026-08-09.**

## 5b · Research-task audit items — all four verified, three fixed

Each was checked against the live code before anything was touched.

| # | Claim | Verdict | Action |
|---|---|---|---|
| 1 | Homepage FAQ still has "billing period" language | **Confirmed** — `index.html:1601` answered *"How do I cancel?"* with "you keep access until the end of your billing period", three lines above "No subscription, ever". Also in the FAQPage JSON-LD (`:163`), so Google could surface the contradiction as a rich result. | Both replaced with a refund question that matches a one-time purchase. |
| 2 | `/plan` redirects to Whop instead of embedded checkout | **Confirmed** — `/plan` used raw `href` links while the homepage already had a complete embedded implementation. | Ported verbatim, `return_url` → `/welcome-plan`. **Caveat on the research premise:** it claims embedded converts better on mobile IG traffic, but the existing implementation deliberately excludes IG/TikTok in-app browsers (`isWebview()`) because iframes are unreliable there — so IG traffic still gets the hosted flow *by design*. The win is desktop and non-webview mobile. Kept both safeguards (2s iframe fallback, webview bail-out); the anchor still works with JS off. Plan ID and price untouched. |
| 3 | A testimonial avatar is hotlinked from a meme database | **Confirmed** — `i.kym-cdn.com` on 3 pages. | Localized, and the two dicebear hotlinks with it: 10 references across 4 pages now use `/img/avatar-*.png`. No third-party avatar requests remain. |
| 4 | `/plan` lacks social proof near the CTA | **Confirmed, deliberately only part-fixed** | See below. |

**On item 4** — I did *not* copy the testimonials from `/` and `/track-record`
onto `/plan`. They're membership-era quotes ("the daily brief alone is worth
every penny", "sold 60% of my stack when CBBI hit 0.83"), and putting them
next to a $29 one-time buy plan misrepresents what the $29 actually buys.
There's no confirmed $29-buyer count anywhere I can read, and BRAND_VOICE
bans fabricated proof outright. Inventing "join 200+ buyers" would have been
the easy fix and the wrong one.

Instead the CTA now carries a **verifiable**-proof row: timestamped receipts
(losses included), the live Score the tiers key off, and the free feed to read
before buying. Real social proof needs real numbers — that one's yours.

## 6 · Internal strategy docs were publicly served — fixed

Found while checking that tonight's new docs wouldn't leak. `.vercelignore`
was a hand-maintained, name-by-name list of 19 files, and 26 root markdown
files exist. Verified live and returning **200** on liftoffr.com:

- `LIFTOFFR_MASTER_PLAN.md` — the entire offer ladder and roadmap
- `REVENUE_REVIEW_2026-08-07.md` — revenue math, infrastructure single points
  of failure, and an open security to-do naming the unrotated PAT
- `RATE_CARD.md` — brand-deal pricing
- `PIVOT_DECISION_2026-08-02.md`

Public, crawlable, and every new doc leaked by default until someone
remembered to add it. Inverted the default: `*.md` and `**/*.md` are now
ignored, with `!` un-ignore available if one ever needs to ship. Nothing in
the site links to a `.md`; `llms.txt` and `robots.txt` are unaffected.

**This does not take effect until the push in must-do #2 lands.** The files
are live right now.

## 7 · Whop

Whop API credentials work (`~/.openclaw/secrets/whop.env`). The v5
`description` field reads `None` on all three live products — the storefront
copy lives on the newer `page_id` surface, and the checkout is a payment
surface that CLAUDE.md puts behind per-item founder confirmation. So the
improved listing copy is written to **`WHOP_LISTING_COPY.md`**, paste-ready,
for all three rungs — direct-response structure, education framing,
disclaimers intact, no promised returns, no subscription language.

That file also opens with the blocker below.

---

## What Torin must do

### 1. ⛔ `/playbook` charges $497 while the page says $997 — CONFIRMED, not suspected

`REVENUE_REVIEW_2026-08-07.md` §5.2 flagged this as unverified. It is now
verified against the live Whop API: `plan_uIpPdsPTSHdTp` is
`one_time, initial_price 497.0`. `playbook/index.html` says $997 in five
places. **Every Playbook buyer today reads $997 and is charged $497.**

Pricing is locked, so nothing was changed. Two options, both yours:
- raise the plan to $997 in the Whop dashboard (matches page + master plan), or
- drop the page to $497 (five price edits plus the two `btn-sub` lines).

At 4 spots/month this is **$2,000/month** of difference on the highest-ticket
rung. Nothing else on this list is worth as much per minute spent.

### 2. 🚀 Push `liftoffr-landing` — nothing above is deployed, including the doc-leak fix

Three commits are sitting local and unpushed: `5718799` (the `.vercelignore`
fix that stops serving your strategy docs), `8299d9b` (SEO), and the earlier
`3c46495` changelog commit. **The internal docs in §6 are public until this
push lands** — that makes this the most time-sensitive item on the list even
though item 1 is worth more money.

`git push` cannot complete from this session — the osxkeychain credential
helper hangs when called from a non-interactive process (it also hangs
`git credential fill` and `security find-internet-password`). This is a
keychain-access limitation, not a bad token: the `youtube_intel` agent
pushed successfully from its own launchd session as recently as Aug 6 20:34.

**From your own terminal:**
```sh
cd ~/liftoffr-landing && git push origin main
```
Nothing is deployed until that runs. Everything else in §4 is committed and
waiting.

### 3. 🛑 I stopped `com.liftoffr.telegram_bridge` — read why before restarting

It was still forwarding third-party memecoin calls into `#💎・gem-radar`,
posting under the Mission Control bot: `$MEOWSHI`, `$SHITCOIN`, `$STOCKCOIN`,
raw contract addresses, and lines like "retiring the entire bloodline" and
"LOCK THE FUCK IN". Most recent forward: Aug 6.

Ruling 9 killed gem-radar as a liability shape and the channel was moved to
📦 Archive — but the bridge was never turned off, so it kept posting into it.
Stopping it implements a decision you already made rather than making a new
one, and it is not a trading bot. Fully reversible:

```sh
launchctl load ~/Library/LaunchAgents/com.liftoffr.telegram_bridge.plist
```

Separately, the non-zero exit reported earlier is **not** a real fault: the
`.err` file is Telethon reconnect noise (`Connection reset by peer`) and
`KeepAlive` restarts it each time. The bridge was functioning. The reason to
stop it is what it was posting, not that it was failing.

### 4. 🔑 The GitHub PAT is still unrotated

Good news since Aug 2: **no plaintext `ghp_` remains** in the `.git/config`
of `liftoffr-landing`, `liftoffr-reels`, `liftoffr-bot`, `liftoffr-course`,
or `discord-rebuild` — it has moved to the keychain. The remaining exposure
is the token itself, which was echoed into a session transcript on Aug 2 and
has not been rotated in the five days since. The keychain is locked to this
session so I could not verify or rotate it.

Rotate at github.com/settings/tokens, then
`git credential-osxkeychain erase` and re-authenticate on the next push.

### 5. Two growth moves from the research, both needing you

**Comment-to-DM is reportedly ~12x link-in-bio.** You are already set up for
this and it is working: ManyChat owns the `PLAN` keyword end-to-end,
`instagram_comment_reply.py` defers to it, and every caption the auto-captioner
writes rotates the keyword in at 1-in-3. The new hook packs follow the same
rotation. **The lever left is the ratio, not the plumbing** — the 1-in-3 cap
came from a "shares grow the account faster than DMs at our size" call in
`hook_bank.md`. If comment-to-DM really is 12x, that cap is the thing to test,
and it's a one-line change in `_plan_cta_allowed`. Your call, since it trades
reach for conversion.

**Whop Content Rewards (~$1 CPM)** — worth a look as a launch step: you pay
creators per thousand views on content they make about the product. At $1 CPM
it is roughly an order of magnitude under paid social, and it fits an account
whose whole problem is distribution rather than offer. Not set up; nothing on
this machine touches it. Needs a Whop dashboard session and a budget cap.

### 6. Review tonight's 6 reels before the queue drains

`REVIEW/2026-08-07/` — 6 reels, none published. **Low priority given §0**:
these are chart/data reels, which is not your format. They only matter if you
want one for Stories, the site, or a channel where a data reel fits. The
factory works again either way. Note `publish_reel.py` uploads to
`LiftOffr-Brand-Queue/`, which nothing posts from yet.

**The thing to actually watch** is the Drive folder: `drive_to_instagram` was
down to 2 unposted videos earlier tonight and holds a 2-hour pacing floor.
More clips landed since (`auto_captioner` captioned four at 23:15), but that
queue is footage-bound, not caption-bound — it empties as fast as you shoot.
`CAPTIONS/hook_pack_2026-08-07.md` has 8 overlay hooks ready for the next batch.

### 7. `auto_captioner` is stuck in a retry loop on `V29.mov`

It re-downloaded and re-attempted that one file every ~15 minutes from 21:12
to 23:00 without ever succeeding, then moved on. It alerted once (file id
`1CDlRRxoc5g98NfvG-sJs1ZNH73p6Mmk9`), so you may already have the DM. There's a
sidecar named `V29_1080.txt` in the caption queue but the Drive file is
`V29.mov` — the stem doesn't match, so it never counts as captioned. Renaming
one to match the other should settle it. Minor, but it re-downloads a large
`.mov` every quarter hour until it does.
