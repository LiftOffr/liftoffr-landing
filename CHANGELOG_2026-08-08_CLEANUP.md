# CHANGELOG — outstanding-items pass (night of 2026-08-07)

Clears the open items from `CHANGELOG_2026-08-07_PIPELINE.md`,
`BOT_FLEET_AUDIT_2026-08-07.md` (in `~/liftoffr-course/`) and
`REVENUE_REVIEW_2026-08-07.md`. Everything below is executed and verified live
unless the line says otherwise. What still needs Torin is at the bottom — it is
shorter than last time, but item 1 there is the important one.

---

## 0 · Correction to the premise: git auth was never broken

The handoff said the osxkeychain helper had no credential stored and that the
push needed the old plaintext `ghp_dYP7…` PAT recovered from session
transcripts.

**That is not what was wrong.** A non-interactive `git ls-remote`, then
`git push --dry-run`, then the real push all completed with exit 0 from this
session using the credential already in the keychain. The earlier session's
diagnosis ("the helper hangs when called from a non-interactive process") did
not reproduce.

So **the leaked token was not read, not used, and not needed.** It still needs
rotating — see must-do #1 — but nothing in this pass depended on it.

## 1 · The public doc leak is closed

Six commits pushed to `main` (`794675e..c48841c`). Vercel redeployed.

Verified live *after* the deploy — these returned **200** before it and **404** now:

| File | Before | After |
|---|---|---|
| `LIFTOFFR_MASTER_PLAN.md` | 200 | **404** |
| `REVENUE_REVIEW_2026-08-07.md` | 200 | **404** |
| `RATE_CARD.md` | 200 | **404** |
| `PIVOT_DECISION_2026-08-02.md` | 200 | **404** |
| `STRATEGY_REDESIGN_2026-08.md` | 200 | **404** |
| `CLAUDE.md`, `WHOP_LISTING_COPY.md` | 200 | **404** |

`.vercelignore` now ignores `*.md` / `**/*.md` by default, so new docs are
private on creation rather than public until someone remembers the list. This
file is covered by that rule and will not deploy.

All public pages re-checked after the deploy: `/`, `/plan`, `/free`,
`/playbook`, `/system`, `/links`, `/terms`, `/cycle`, `/track-record` — all 200.

## 2 · Playbook price: the page now matches what the card is charged

Confirmed against the live Whop API, not inferred:
`plan_uIpPdsPTSHdTp` → `plan_type: one_time`, `initial_price: "497.0"`, USD.

The page said **$997 in five places**. Every Playbook buyer read $997 and was
charged $497. Pricing is locked, and the Whop plan is a payment surface, so the
**page was aligned to the charge** rather than the other way round — the reverse
fix (raising the plan to $997) is still open and is yours, not a code change.

Changed to $497: five display prices on `/playbook`, the `/links` ladder anchor,
the `/terms` offer list, and the plan label in `api/whop-webhook.js`.

Two things found on the way:

- **`api/whop-webhook.js` was reporting phantom revenue.** The GA4 purchase
  fallback was `plan_uIpPdsPTSHdTp: 997` — so any paid event where Whop reported
  `$0 collected` logged a **$997** purchase for a $497 sale. Now 497.
- **"Or 2 payments of $549"** sat under the price box. At $497 that is more than
  the product costs. Replaced with "Or split it into 2 payments — just ask" —
  no invented number, and the offer survives.

GA4 CTA label `playbook_997` → `playbook_497` so the funnel report doesn't split
across two names.

Verified on the live page: **0** occurrences of `$997`, 5 of `$497`, 0 of `$549`.

## 3 · `/system` no longer 404s

`/system` returned 404 while `/welcome-plan`'s bridge block pointed at it and
the week-2 soft open (Aug 10) was about to make that visible.

**Checked first, because the handoff's framing was off:** there is no D3
plan-buyer email in the codebase yet. `api/cron-welcome-followups.js` runs one
live sequence — the free nurture, D1/3/5/7/18 — and its D3 step links to `/` and
`/plan`, never `/system`. The only `/system` reference anywhere was a `TODO`
comment. So nobody was being sent to a 404 yet; the trap was armed, not sprung.

Both halves are now handled:

- **Shipped `/system/index.html`** — an honest pre-launch page, not a sales page.
  The System has no Whop plan yet (`CLAUDE.md`: "Whop plan TBD"), so the page has
  **no checkout**: it states what's in it, the $197 / $147-founding / 50-seat
  structure from the master plan, that it opens **Aug 24**, that a $29 buyer is
  already on the list that gets the invite, and routes to what can actually be
  bought today (`/plan`, `/free`, `/playbook`). `noindex` — the master plan is
  explicit that the System is never the first ask to cold traffic. No countdown,
  no fabricated proof, no fake scarcity, disclaimer in the footer. GA4 + Clarity
  wired per `CLAUDE.md`. No new serverless function: the repo is **at** the
  12-function cap.
- **`/welcome-plan`'s bridge now points at `/system`** instead of `href="#"`.
  It stays `display:none` — unhiding it is your week-2 call — but it is no longer
  a dead link waiting to go live.

## 4 · `auto_captioner` V29.mov loop — fixed at the root, not renamed

It re-downloaded a large `.mov` every 15 minutes from 21:12 onward. The
suggested fix was renaming the sidecar. That would have cleared V29 and left the
actual defect in place, so both got fixed.

**Root cause: every failure path `continue`d without recording the file.** The
loop only skips a video if it is in `posted`, in `captioned`, or has an exact
sidecar. The oversize gate and the caption-failure gate each alert once and then
`continue` — so the file stays unrecorded, and the next run re-downloads it in
full to fail exactly the same way. Forever. Nothing in the logs looked wrong
because nothing *was* erroring.

Three changes in `src/auto_captioner.py`:

1. **The size gate now runs before the download.** `MAX_BYTES` was 300 MB
   pre-download while the real Drive→Instagram ceiling (50 MB) was only checked
   *after* downloading. Both are 50 MB now, checked against Drive metadata — an
   oversize file is a permanent condition, so downloading it to measure it was
   pure waste. The post-download check stays as a safety net.
2. **A persistent `skipped` set.** Anything parked on a permanent condition is
   never reconsidered. A re-export gets a new Drive file id, so a genuine fix
   still flows through.
3. **Caption failures are bounded** — `caption_runs` counts attempts per file and
   parks it after 3, instead of retrying a large download indefinitely. The alert
   now tells you how to unblock it by hand.

Separately, the sidecar match now tolerates a resolution suffix, which is the
V29 case specifically: `V29.mov` is satisfied by `V29_1080.txt`. Deliberately
*not* a bare glob — `0719*.txt` would let `0719(1).txt` satisfy `0719.mov` and
post the wrong caption. Verified: `V29` → `V29_1080.txt`, `0719` → no match.

**Verified by running it:** exit 0, no download attempted, no new
`captioning: V29.mov` line, `captioned` went 8 → 9.

Downstream effect: `drive_to_instagram` now sees **6** queued videos (it was down
to 2), correctly holding its 2-hour pacing floor.

## 5 · `telegram_bridge` and the gem-call bot are the same process

They were two rows in the audit and one program. `src/telegram_bridge.py`
forwards a Telegram memecoin group into `#gem-radar` — the Aug 6 09:27
`$MEOWSHI` forward in its log is the same event the audit filed under
"gem-call auto-buy". There is no second bot.

**Diagnosis of the non-zero exit: not a fault.** `telegram_bridge.err` is
Telethon reconnect noise end to end — `Connection reset by peer`, `Broken pipe`,
`Server resent the older message … ignoring`. No traceback, no unhandled
exception. `KeepAlive` restarted it each time, which is what produced the exit=1.
The bridge was working. The reason to stop it is what it was publishing.

**Resolved by stopping it, not redirecting it.** Ruling 9 killed gem calls as a
liability shape; there is no correct destination for third-party memecoin calls
published under the Mission Control bot on a Bitcoin-education brand, so
"redirect" had no honest target. A previous session had already unloaded it —
but left `com.liftoffr.telegram_bridge.plist` in place with `RunAtLoad=true`, so
it would have come back at the next login. Renamed to `.plist.disabled`,
matching the existing house convention (`gate-leaky`, `tier-watch-ping`).
Confirmed: not in `launchctl list`, no process, will not return at login.
Reversible by renaming the file back.

**One latent hazard fixed while in there.** `main()` ended with:

```python
discord_channel = CHANNELS.get("gem_radar") or CHANNELS.get("market_intel")
```

That fallback was harmless when `#market-intel` sat in Archive. It was moved out
to the **public** Free Market Feed earlier the same day. So the obvious way to
retire this bridge — drop `gem_radar` from `config.py` — would have silently
redirected memecoin calls onto a public channel. It now fails closed: no
`gem_radar`, no bridge, with a log line saying why.

The auto-buy path was already behind Torin's 2026-07-26 kill switch
(`AUTO_BUY_ENABLED = False`) and is untouched.

## 6 · Fleet health check

**26 LaunchAgents loaded, every one exit 0.** The only non-zero exit in the
fleet was `telegram_bridge`, which is now intentionally disabled.

Three error logs carry non-fatal signatures, all transient, all recovered:

| Bot | Signature | Read |
|---|---|---|
| `drive-buffer` | `ConnectionResetError` on SSL read | transient Drive hiccup |
| `supply-gap` | DNS `nodename nor servname provided` | transient resolver failure |
| `drive-instagram` | HTTP 400 `code 9 / 2207078` — "User is performing too many actions" | **Instagram actually rate-limited the account.** Happened once. This is the 10-posts-on-Aug-6 burst the revenue review warned about, landing. The 2-hour pacing floor is the mitigation and it is working — the bot is currently holding rather than posting. |

Cowen bot (`youtube-intel`): loaded, exit 0, and its push path is
`git push origin main` from `~/liftoffr-landing` — the same repo and the same
credential this session pushed through twice. **Its hourly push works.**

Worth knowing for must-do #1: `liftoffr-landing` is the **only** repo on this
machine with a remote. `liftoffr-reels`, `liftoffr-course`, `liftoffr-video`
have no origin, and `discord-rebuild` is not a git repo at all. No plaintext
`ghp_` remains in any `.git/config`.

## 7 · Discord permission audit — the problem was the opposite of a leak

Audited all 126 channels and 32 roles against ruling 8, computing **effective**
view permission per tier rather than eyeballing the sidebar.

**Method note, because it changes the answer.** Channels do *not* inherit their
category's overwrites when Discord computes permissions — only the channel's own
`permission_overwrites` count, and "syncing" works by *copying* the category's
overwrites onto the channel. This server also runs `@everyone` **without**
`VIEW_CHANNEL` at guild level, so a channel is public only if it explicitly
allows view. Reading the categories alone gives the wrong answer in both
directions; I computed per-tier visibility from the raw permission bits.

### No leaks — the free/paid boundary is intact

A free member sees exactly **21 channels**: welcome/rules/start-here, the four
Community channels, the four Free Market Feed channels, the four
`🔒 Locked · Paid Access` sales channels (public on purpose — they're the "here's
what you're missing" surface), Info, Verify, Help/Support, and the two ticker
voice channels. **No course lesson, no signals channel, no staff channel and no
archived channel is visible to a free member.** `#plan-updates` is correctly
restricted to `@Plan` plus the grandfathered roles, exactly as the 2026-08-02
advisor ruling specified. Archive, Staff Area, Server Logs and Ticket Logs are
invisible to every customer tier.

### The real fault: five paid channels nobody could read

`⚡・urgent-alerts`, `📡・btc-signals`, `🔥・trade-setups`,
`⚙️・indicator-readings` and `🪙・altcoin-radar` were visible to **nobody** —
not free, not Plan, not System, not Founding Circle, not Pro, not Elite. Admins
only.

Each carried a single `@everyone` overwrite denying `SEND_MESSAGES` and
`MENTION_EVERYONE` — the read-only-announcement pattern — and **no view grant for
any role**. Their categories grant view to Elite/Pro/Founding Circle/LiftOffr
Life, but a category grant does nothing for a de-synced child. So the channels
were sealed.

**Four bots have been posting into them on schedule the whole time.**
`price-alerts` → `#btc-signals` (Aug 5), `cipher-analysis` → `#trade-setups`,
`weekly-indicators` → `#indicator-readings` (Jul 26),
`altcoin-watchlist` → `#altcoin-radar` (Jul 26). The fleet audit marked all four
"Healthy" because they exit 0 — they do. This is the same failure the Cowen bot
had when it published into an archived channel for five weeks, and it is the
shape you asked me to look for. It just landed on the paid side: these are
headline `$197` System deliverables, and no paying member could open them.

Granted `VIEW_CHANNEL + READ_MESSAGE_HISTORY` (mask 66560, the same one
`#plan-updates` already used) to the intended roles on all five. The
`@everyone` send-denies are untouched — they stay bot-broadcast channels.

### `@System` was missing everywhere it mattered

Ruling 8: *"@System ($197 buyers + all grandfathered paid + Founding Circle) →
course channels **+ #signals**."* `@System` had the course, but was absent from
the Signals & Alerts and Market Intelligence categories **and** from all five
channels above. The System launches Aug 24; buyers would have paid $197, received
the course, and found the signals feed missing. Added to both categories and all
five channels.

Also added `@System` to `#plan-updates`. **Flagging this one as an inference**:
ruling 8 lists `@Plan` and the grandfathered roles for that channel and doesn't
mention System. But the ladder is cumulative and "your $29 counts toward the
System", so a $197 buyer being locked out of a $29 channel is a launch-day
support ticket. One `PUT` to reverse if you disagree.

### Per-tier permission map (verified live after the changes)

| Tier | Channels | What it unlocks over the tier below |
|---|---|---|
| **Free** (`@everyone`) | **21** | Welcome ×3, Community ×4, Free Market Feed ×4 (daily-brief, cbbi-pi-cycle, macro-watch, market-intel), Locked·Paid-Access ×4, Info, Verify, Help ×2, tickers ×2 |
| **`@Plan`** ($29) | **22** | `+ 📈・plan-updates` |
| **`@System`** ($197) | **80** | `+` Signals & Alerts ×3, Market Intelligence ×2, LIFTOFFR-HUB ×5, Modules 1–6 ×48 |
| **Founding Circle** (56 comped) | **81** | `+ 🧠・mindset` (archived) |
| **Pro** (grandfathered) | **81** | same as Founding Circle |
| **Elite** (grandfathered) | **83** | `+ 💎・elite-lounge`, `+ ⏰・book-your-1-on-1` |
| **Playbook** ($497) | — | No Discord role. 1:1 delivery, no channel. |

Six channels changed, every one in the grant-access-to-people-who-paid
direction. Re-computed after the writes: the free member's surface is still
exactly those 21 channels — **nothing was widened for `@everyone`.**

### Two things I did not change

- **`📚 Studying` grants full course access** — all 48 lesson channels plus the
  HUB, sitting alongside the paid roles. **0 members hold it**, so there is no
  live exposure, but if it is self-assignable anywhere (reaction roles, ProBot),
  it is a free key to the $197 course. Worth checking how someone gets it; I
  didn't strip it across 50+ channels on a guess.
- **`📰・daily-market-brief` carries a stray `Core` allow.** Harmless — the
  channel is public to `@everyone` anyway — just a leftover from the pre-pivot
  gating. Cosmetic.

---

## What still needs Torin

### 1. 🔑 Rotate the PAT — and it is a smaller job than it looked

Still unrotated, still the highest-priority open item, and I did not do it.

**Why I didn't:** creating a token means handling the live secret value —
reading it off the screen and writing it into the keychain — which I don't do
with credentials. And revoking the current one without installing the
replacement in the same sitting would break the Cowen bot's hourly push and the
deploy path with it.

**The scope is one repo,** which the earlier docs didn't establish:
`liftoffr-landing` is the only checkout with a remote, and the only automated
pusher is `youtube_intel.py`. A fine-grained token needs **Contents: Read and
write on `LiftOffr/liftoffr-landing` only** — nothing else on the machine pushes
anywhere.

```sh
# 1. github.com/settings/tokens → revoke the classic ghp_dYP7… token
# 2. github.com/settings/personal-access-tokens/new
#    Repository access: Only select repositories → LiftOffr/liftoffr-landing
#    Permissions → Repository permissions → Contents: Read and write
# 3. clear the old credential, then store the new one on the next push:
printf 'protocol=https\nhost=github.com\n\n' | git credential-osxkeychain erase
cd ~/liftoffr-landing && git push origin main     # prompts once; username = LiftOffr, password = the new token
# 4. confirm the bot's path works with the new credential:
cd ~/liftoffr-landing && git ls-remote origin -h refs/heads/main
```

The Cowen bot picks it up automatically — same checkout, same helper, no code
change. Its next hourly run is the live test.

### 2. 💵 $497 or $997 — the page now says $497, and that is reversible

I aligned the page to what the card is actually charged, because showing a price
you don't honour is the one option that is wrong under every reading.

But **the direction is still yours**, and it's the $2,000/month question the
revenue review raised. If the Playbook should be a $997 product, the fix is one
edit in the Whop dashboard (`plan_uIpPdsPTSHdTp` → 997) and then reverting this
commit's display changes. If $497 is the real price, nothing further is needed —
the site, the terms page, the link hub and the GA4 revenue numbers now agree
with it.

Worth deciding before the next Playbook sale rather than after.

### 3. 🚦 Two week-2 switches, both yours

- **Unhide the `/system` bridge** on `/welcome-plan` (`display:none` → remove)
  whenever you want the soft open live. The link now works.
- **Build The Cycle System in Whop** before **Aug 24**. `/system` currently tells
  visitors the truth — that it opens Aug 24 and can't be bought yet — which is
  honest but only holds until that date. Once the plan exists, the page needs the
  checkout wired and the "why you can't buy it today" section removed.

### 4. 📉 The Instagram rate-limit is real, not theoretical

`drive_to_instagram` took a genuine `too many actions` rejection from the Graph
API. The pacing floor caught it, but the 10-post Aug 6 burst is what earned it.
Queue depth is healthy again (6 clips), so there's no pressure to burst.

### 5. 📚 Check how someone gets the `📚 Studying` Discord role

It opens all 48 course lesson channels. Nobody holds it today, so nothing is
exposed right now — but if a reaction-role or ProBot self-assign is wired to it,
it's a free key to the $197 product the day the System launches. Either confirm
it's admin-assigned only, or tell me and I'll strip it from the course channels.

### 6. Unchanged from the earlier pass, still open

Kalshi API keys still live on a concluded project (`~/kalshi-btc-buckets`, its
`paper.live_engine` daemon is still running); the GCP service-account key is
untouched since May 8; the whole fleet still depends on `com.liftoffr.caffeinate`
holding one laptop awake with no failover.
