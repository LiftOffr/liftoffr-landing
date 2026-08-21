# Discord server sweep — 21 August 2026

Every category walked. Channels read through the **Discord web client**, not the bot API — the
API returns empty `content` for app-posted embeds, which is the blind spot that hid old Module 5
through three audits. Where a channel could not be read, that is stated rather than assumed empty.

Course channels are covered in `course/DELETED_2026-08-21.md`. This file is everything else.

---

## 1. `#🔥・trade-setups` — DELETED 21 Aug 2026 on Torin's instruction

**What it publishes.** Automated LONG and SHORT setups with **Entry, Stop, Target and R:R**,
generated from **VuManChu Cipher A & B** on the 4-hour chart — the same tool as Market Cipher,
deleted from the course on 20 Aug because it is proprietary, not reproducible from public data,
and was never a component of the Score.

**Blast radius, established without changing anything:**

| | |
|---|---|
| Channel ID | `1479911845585223731` |
| Category | `━━・Signals & Alerts` — alongside `#urgent-alerts`, `#btc-signals`, `#plan-updates` |
| Posting identity | **Mission Control#3685** — the same app that posts the course, not a separate bot |
| Cadence when active | every 4 hours, on the clock: 02:05 / 06:05 / 10:05 / 14:05 / 18:05 / 22:05 UTC |
| Observed range | 8 Mar 2026 → **4 Jun 2026** |
| Last post | **4 June 2026 — 78 days ago.** Dormant, not confirmed stopped. |
| Generator | Not in this repo and not in `vercel.json` crons. Belongs to the separate agent fleet; `CHANGELOG_2026-08-08_CLEANUP.md` names it `cipher-analysis`. **Cannot be stopped from here.** |

**It tracks and publishes its own outcomes.** On 9 Mar 2026 it posted seven consecutive
`❌ STOPPED OUT: SHORT` messages in one batch — −1.61%, −4.60%, −2.77%, −2.23%, −1.49%, −2.15%,
−2.73%. Later posts carry `Track record: 0% WR (0W/1L)`.

**Three things beyond the register problem:**

1. The 4 Jun post is **internally contradictory**. It opens a SHORT on the grounds that
   "WaveTrend crossed down from **oversold** territory (WT1: −79.5), RSI **oversold** at 11",
   then its own How-to-spot-this section says "RSI below 30 + WT cross = higher-probability
   **long** setup". It called a short on the configuration it describes as a long.
2. That short was entered at $61,702 with a stop at $74,161 — **20.2% risk** — targeting $36,784.
   BTC is around $77.5K today.
3. It footers "Module 3 covers Cipher B in full". Module 3 does not and never did; that was old
   Module 4's Market Cipher lesson, **deleted 20 Aug**. So the pointer is now dangling as well.

**Permissions: I could not verify these, and I am not inferring them.** The Discord MCP available
here exposes create / delete / edit-channel (name, topic, category), list-channels, read-messages
and send-message. **There is no tool that reads permission overwrites.** What is on record:
`CHANGELOG_2026-08-08_CLEANUP.md` found this channel and four siblings visible to **admins only**
— one `@everyone` overwrite denying SEND_MESSAGES, and no view grant for any paid role. Whether
that was changed after 8 Aug is not determinable from here. Checking it takes ten seconds in
Discord: right-click the channel → Edit Channel → Permissions.

**Why it mattered either way.** `#the-cycle-system` sold it as a $197 deliverable
("#trade-setups and #btc-signals — my setups with entry zones, invalidation, and reasoning").
If members could see it, the paid product published trade instructions. If they could not, the
paid product advertised a channel nobody could open.

### The decision, and why not "automate it on LiftOffr mechanics"

Torin's instruction: *"if we can't fully automate trade setups channel with LiftOffr's mechanics
then we should probably get rid of it."*

**Rebuilding it on the Score would have laundered the problem, not fixed it.** The Score is a
multi-month cycle-position instrument, and `#m5-l3-why-46pct-and-54pct-are-the-same` teaches that
its directional record is 21 of 46 at 30 days and 25 of 46 at 180 — neither distinguishable from
chance. Generating four-hourly entry/stop/target posts from it would mean using a deliberately
slow instrument to make fast calls and publishing them as signals, which `/disclaimer` says this
business does not do. A signal feed built on an instrument the course proves is no better than a
coin flip at that horizon is worse than one built on Cipher, not better: it would carry the
model's authority without the model's evidence.

**Deleted.** Content recorded above so the decision stays checkable.

**Advertising copy removed in the same pass:** `blog/mvrv-ratio-bitcoin-indicator.html` listed
"Community of traders sharing live trade setups" in its purchase box. No live page advertises
trade setups now. The `#the-cycle-system` message that sold the channel was already superseded
earlier today.

---

## 2. `#⚙️・indicator-readings` — the retirement notice is wrong, and the generator may still fire

The pinned retirement notice (posted 20 Aug 20:31, pinned by Torin 21:04 — correct pin) says
**"Last panel: 26 July 2026."**

**A panel ran on 16 August 2026.** Three weeks later. It is still in the channel, above the
notice, and it contains exactly what the notice says was retired: CBBI, Fear & Greed, Rainbow
Band and BTC Dominance presented as inputs, a `CURRENT MARKET THESIS — Outlook: BEARISH`, and
**`Levels: $60,000 · $62,000 · $63,000`**. It also footers "Module 4 covers every indicator above
in depth", which is now false, and links "All 9 indicators" while listing seven.

**Both panels landed on a Sunday at ~17:00.** The generator is not in this repo or the Vercel
crons. If it is still scheduled, **the next fire is Sunday 23 August** — which would republish
the retired framework directly beneath a pinned notice saying it is retired.

---

## 3. `#⚡・urgent-alerts` — KEPT and REPURPOSED, 21 Aug 2026

**Removed from it:** the 24-hour price-move alerts, and the Fear & Greed pings. Between 27 June
and 8 July it fired the *same* Extreme Fear alert **eight times in twelve days** — readings of 15,
18, 12, 15, 11, 19, 20, 20 with identical body text. Fear & Greed carries zero weight in the
Score, and an urgent channel that repeats daily trains people to ignore it.

**Not deleted, because unlike `#btc-signals` the channel had a legitimate job it was not doing.**
The honest LiftOffr-native urgent alert is a **Score band change**, and the code for it already
existed in `api/cron-weekly-score.js` — `runZoneChangeCheck()`, with a seven-day hold matching the
64-signal log, a freshness guard and per-contact idempotency. It emailed the free list and posted
nowhere.

**It now posts to Discord as well.** `postZoneChangeToDiscord()` states the band, what the record
says that band has meant, and that a crossing needs the seven-day hold. It explicitly does not say
what to do. No fallback destination, consistent with every other webhook in that file.

**Torin has two things to do for this to fire:**

1. **Create the webhook** on `#⚡・urgent-alerts` and set `DISCORD_ZONE_ALERTS_WEBHOOK` in Vercel.
   Until then the post is skipped with a logged warning and the email still sends.
2. **Stop the price-move / Fear & Greed bot in the fleet.** It is outside this repo, so deleting
   its output was not possible from here — the channel notice tells members what the channel is
   now, but the old bot will keep posting alongside it until the fleet is changed.

## 4. `#📡・btc-signals` — DELETED 21 Aug 2026

Full history read before deletion: **68 messages, 8 March to 20 August 2026.** My first pass
called this "milder still" on the strength of one post. That was wrong, and the full read is why.

**It is a moving-average and round-number crossing bot that flips its published directional bias
on moves of ±0.0–0.1%.** On **4 May 2026** it flipped seven times in about 21 hours around $80k:

```
02:56  BREAKOUT — $80k CLEARED   $80,227
06:56  BREAKDOWN — $80k LOST     $79,925
14:56  BREAKOUT — $80k CLEARED   $80,421
14:56  BREAKOUT — 7-day high     $80,421   (same second, duplicate)
15:56  BREAKDOWN — $80k LOST     $79,784
22:03  BREAKOUT — $80k CLEARED   $80,330
23:03  BREAKDOWN — $80k LOST     $79,985
```

On 10 March it posted the identical "$70k CLEARED" message **twice in the same second**
(02:38:00.381 and 02:38:00.446). On 19 August it went from *"Structural bull signal"* to
*"Structural caution — major level gone"* in four hours on a −0.0% cross.

**It also gave instructions**, which the register rule forbids outright:

- *"Wait for a 4hr close above before **sizing in**."*
- *"Watch for a retest of the breakout level on the next pullback **before adding size**."*
- *"**Stick to your DCA plan.** Bear market breakdowns are noise."*
- *"have your **exits ready** (Module 5)"* — pointing at a module deleted on 21 Aug.

**And one post was a forward-looking multiple claim on a zero-weight indicator:**
*"BTC DOMINANCE ALERT — BTC dominance dropped below 50.0% — altcoin season may be starting …
Historically this phase sees altcoins **2x-10x** vs BTC."* BTC Dominance carries no weight in the
Score. That post is also internally broken — its headline reads "6.0%" while its body reads
"below 50.0%" — and it points at `🪙・altcoin-watch`, a channel that does not exist.

**Why it could not be rehabilitated onto the LiftOffr framework.** The channel's whole premise is
that a price crossing a line is an event worth announcing. The Score is a multi-month
cycle-position instrument whose own course teaches that a threshold model flips around its
threshold and is only usable if you decided in advance what a crossing means. Rebuilding this on
the Score would produce the same whipsaw with better branding. The honest LiftOffr version of
"alert me when something changes" is a **Score band change with a seven-day hold**, which already
exists in `api/cron-weekly-score.js` — and that now feeds `#urgent-alerts` instead. See below.

**Deleted.** The generating bot (`price-alerts`, per the 8 Aug changelog) lives outside this repo
and will now error against a missing channel; that is Torin's fleet to clean up.

## 5. `#🪙・altcoin-radar` — active, mostly fine

Last post 16 Aug. Explicitly captioned **"Observations, not entries"**, which is the right
register. Two notes: it says *"Size very conservatively"*, which is a position-sizing instruction
however mild, and it footers "Module 6 covers alt rotation" — Module 6 lesson 3 is a
diversification framework, which is adjacent but not the same thing.

## 6. `#📈・plan-updates` — **empty**

Zero messages. This is the channel the $29 plan unlocks, and both `#whats-locked-and-why` and the
Day 0 buyer email describe it as the place "where every tier fire posts live". A buyer who
connects Discord and opens it finds nothing at all. Whether that is correct depends on whether any
tier has fired since the channel was created — but the channel does not say so, and an empty
channel behind a paywall reads as broken rather than as quiet.

---

## Fixed in this pass

- **`#🎓・the-cycle-system`** sold an "8-indicator phase matrix" naming Market Cipher, Fear &
  Greed and Google Trends, a "confluence score", and "36 lessons, ~47,000 words". Superseding
  post now describes the nine weighted components, the arithmetic and divisor rule, the record
  including the losses, and 45 lessons.
- **`#🧭・whats-locked-and-why`** — same "8-indicator framework" claim, and described `/receipts`
  as "every call I've made, timestamped". Corrected to the language `/receipts` and `/proof`
  actually use: a backtest, not a record of trades placed or calls published at the time.
- **`#🚀・start-here`** — *"I called the top on Oct 6 2025 at $124,824."* Removed. Torin exited
  **early** and every live surface says so. Same `/receipts` mischaracterisation, corrected.

All three were superseded by new posts rather than edited: **the bot API has no edit-message
tool.** Each correction says explicitly that it replaces the message above it.
