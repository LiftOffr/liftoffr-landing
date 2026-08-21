# Messages to delete in the Discord web client — 21 August 2026

**50 messages across 11 channels.** Every one is authored by **Mission Control#3685** — there is no
human-authored content anywhere in this list, so nothing of Torin's own writing is at risk.

## Why this is a browser job

The Discord MCP available here exposes exactly seven tools: create-channel, delete-channel,
edit-channel, list-channels, list-servers, read-messages, send-message. **There is no
delete-message and no edit-message.** This is not a permissions problem — a bot can delete its own
messages with no Manage Messages permission at all, and almost all of this residue is the bot's
own. The endpoint simply is not reachable from here. Verified by enumerating the tool list, not by
inferring it from a failure.

**Delete-and-recreate was considered and rejected.** It is how every lesson channel was cleaned,
and it works — but each of these eleven channels is linked to by `<#id>` mentions from elsewhere.
Recreating one changes its ID and breaks every mention pointing at it, and repairing those means
posting *new* messages into channels that also cannot be cleaned. The dependency graph only closes
at "recreate all 50 course channels", which would churn every ID a third time and destroy the pins.
Deleting 50 messages by hand is the smaller, safer operation.

---

## The rule that covers 10 of the 11 channels

> **Keep only the newest message. Delete everything above it.**

In every channel below except `m4-l9`, the bottom-most message is clean, self-contained,
first-publication copy with working links. Everything above it is superseded. The one exception is
called out explicitly and comes last.

**Deleting a pinned message also removes it from the pin list** — no need to unpin first.

Timestamps below are **UTC**; Discord shows your local time. Use them as a cross-check, not as the
primary key — position in the channel is unambiguous and the timestamps are not.

---

## 1 · `🤔・how-to-use-this-course` — delete 14, keep the bottom 2

⚠️ **This is the only channel with two keepers.** The course map is a two-part message.

| Keep | UTC | Opens with |
|---|---|---|
| ❌ **KEEP** | 11:02:30 | "## Module 4 · The Score — …" *(part 2 of the map)* |
| ❌ **KEEP** | 11:02:11 | "# 🗺️ The LiftOffr course — full map … **46 lessons**" *(part 1 — pin this one)* |

Delete all fourteen above those:

| UTC / date | Opens with |
|---|---|
| 10:16:53 | "## Map update — 21 August 2026, later" |
| 10:00:52 | "## Module 4 · The Score — … Fifteen lessons, rebuilt 20–21 Aug" |
| 10:00:32 | "# 🗺️ The LiftOffr course — full map … **45 lessons**" |
| 09:39:25 | "**Module 5 · The Record** — read this before deciding whether to trust any of it" |
| 09:39:10 | "## Course map — updated 21 August 2026. This replaces every earlier map…" |
| 02:54:13 | "Six old Module 4 lessons are in the **📦 Archive** category…" |
| 02:54:04 | "## Course map — updated 20 August 2026. This supersedes the pinned map above." |
| 7 Aug 22:03:17 | *(embed, no text)* |
| 7 Aug 22:03:16 | "One module a week beats one weekend of everything…" |
| 7 Aug 22:03:14 | "…Sentiment case studies 2017 2021" *(old Module 3–6 index, lists Market Cipher)* |
| 7 Aug 22:03:13 | "# The Cycle System — course map … Thirty-six lessons" |
| 12 May 18:21:30 | *(embed, no text)* |
| 12 May 18:21:29 | *(embed, no text)* |
| 12 May 18:21:28 | *(embed, no text)* |

⚠️ **Three messages here open "🗺️ The LiftOffr course — full map".** Keep the pair at the very
bottom — the one saying **46 lessons**. The 45-lesson one and the 09:39:10 one both go.

⚠️ **The 09:39:25 message is the highest priority deletion in the server.** It publicly states
that the bot "cannot set a channel's category, and it reports success when it silently fails to."
That was my diagnosis and it was wrong — the parameter was `parentCategory`, not `category`. It
also tells members to skip channels named `retired-*`, which no longer exist.

## 2 · `🔍︱m4-overview` — delete 6, keep the bottom 1

Keep: **11:01:42** — "# Module 4 · The Score / **Fifteen lessons.**" (links to `m4-l10` work)

| UTC / date | Opens with |
|---|---|
| 09:59:50 | "# Module 4 · The Score / **Fifteen lessons.** …" ⚠️ *near-identical to the keeper; its `m4-l10` link is dead* |
| 09:39:40 | "## Module 4 now starts five lessons earlier — 21 August 2026" |
| 02:46:31 | "Every lesson publishes the same four things…" |
| 02:46:26 | "## Module 4 has been rebuilt — read this instead of the pinned overview above" |
| 1 Jul 21:38:49 | *(embed, no text)* |
| 1 Jul 21:38:48 | *(embed, no text)* |

⚠️ **The top two look almost the same.** Keep the bottom one. Tell them apart by the last line of
the "What carries no weight" block — the keeper reads *"CBBI, Fear & Greed, Google Trends,
proprietary tools"*; the one to delete reads *"CBBI, Fear & Greed, Google Trends"*.

## 3 · `🔍︱m5-overview` — delete 5, keep the bottom 1

Keep: **11:01:54** — "# Module 5 · The Record / **Seven lessons.**"

| UTC / date | Opens with |
|---|---|
| 10:16:43 | "## Module 5 is now seven lessons — updated 21 August 2026" |
| 10:00:02 | "# Module 5 · The Record / **Six lessons.**" ⚠️ *says Six* |
| 04:19:42 | "## Module 5 has been rebuilt — read this instead of the pinned overview above" |
| 1 Jul 21:38:52.9 | *(embed, no text)* |
| 1 Jul 21:38:52.0 | *(embed, no text)* |

⚠️ Keep the one that says **Seven lessons**. Delete the one that says **Six**.

## 4 · `🔍︱m2-overview` — delete 3, keep the bottom 1

Keep: **11:16:47** — "# Module 2 · The Wealth Engine / **Seven lessons.**"

| UTC / date | Opens with |
|---|---|
| 10:00:16 | "## One lesson added to Module 2 — 21 August 2026" |
| 12 May 02:54:38 | *(embed, no text — the old 6-lesson "Accumulation" overview)* |
| 12 May 00:56:28 | *(embed, no text)* |

## 5 · `📓︱m4-assessment` — delete 2, keep the bottom 1

Keep: **11:02:43** — "# Module 4 assessment" (nine questions)

| UTC / date | Opens with |
|---|---|
| 02:46:42 | "## This assessment is out of date — 20 August 2026" |
| 12 May 00:58:24 | *(embed, no text — the old 8-indicator assessment)* |

## 6 · `📓︱m5-assessment` — delete 3, keep the bottom 1

Keep: **11:02:57** — "# Module 5 assessment" (ten questions)

| UTC / date | Opens with |
|---|---|
| 04:19:57 | "## This assessment is out of date — 21 August 2026" |
| 12 May 01:06:16 | *(embed, no text)* |
| 12 May 01:06:15 | *(embed, no text)* |

## 7 · `✅・verification` — delete 2, keep the bottom 1

Keep: **the newest** — "# Getting your paid access"

| UTC / date | Opens with |
|---|---|
| 02:47:05 | "## Correction to the pinned message above — 20 August 2026" |
| 12 May 18:24:11 | *(embed, no text — the pin claiming verification is automatic)* |

⚠️ **Highest operational priority after the tree.** The old pin tells buyers nothing is required,
which is false and has cost people access they paid for. **Pin the new message** once the old
one is gone.

## 8 · `🚀・start-here` — delete 6, keep the bottom 1

Keep: **the newest** — "# Start here / This server is built around one number…"

| UTC / date | Opens with |
|---|---|
| 10:07:43 | "## The free layer — all of it, no card, no catch" |
| 10:07:28 | "# Start here — corrected 21 August 2026" |
| 7 Aug 21:51:23 | *(embed — contains "I called the top on Oct 6 2025")* |
| 7 Aug 21:51:22 | *(embed, no text)* |
| 21 Jul 19:58:51 | *(embed, no text)* |
| 1 Jul 21:50:19 | *(embed, no text)* |

## 9 · `🧭・whats-locked-and-why` — delete 4, keep the bottom 1

Keep: **the newest** — "# What's locked, and why / **The free layer tells you where the cycle is…**"

| UTC / date | Opens with |
|---|---|
| 10:07:14 | "## $197 — The Cycle System / **Not an \"8-indicator framework\"**" ⚠️ *says 45 lessons; links to a deleted channel* |
| 10:07:02 | "# What's locked, and why · corrected 21 August 2026" |
| 7 Aug 21:48:18 | *(embed, no text)* |
| 7 Aug 21:48:17 | *(embed, no text)* |

## 10 · `🎓・the-cycle-system` — delete 4, keep the bottom 1

Keep: **the newest** — "# The Cycle System — $197 / **46 lessons across six modules**"

| UTC / date | Opens with |
|---|---|
| 10:06:47 | "## Two things the old message claimed that I want to correct directly" |
| 10:06:34 | "# The Cycle System — $197 · rewritten 21 August 2026" ⚠️ *says 45 lessons* |
| 7 Aug 21:48:23 | *(embed — the "8-indicator phase matrix" / "36 lessons" sales copy)* |
| 7 Aug 21:48:21 | *(embed, no text)* |

## 11 · `m4-l9-rupl-5pct` — ⚠️ THE ONE EXCEPTION — delete only the middle message

**Do not apply the rule here.** This channel has three messages and the *lesson itself* is the
oldest one. Keep the top and bottom; delete only the middle.

| | UTC | Opens with |
|---|---|---|
| ❌ **KEEP** | 11:01:24 | "◀ **Previous:** … **Next:** …" — the footer whose Next link works |
| ✅ **DELETE** | 09:58:25 | "◀ **Previous:** … **Next:** …" — identical-looking; its Next link is dead |
| ❌ **KEEP** | 02:40:42 | "# Lesson 9 — RUPL / NUPL · 5% of the Score" — **the lesson. Do not delete.** |

The two footers are visually near-identical. The one to delete is **the upper of the two**, and
its **Next** link renders as a broken/unknown channel rather than `#m4-l10-context-zero-weight`.
If you hover both and one resolves to a real channel, that is the keeper.

---

## Do NOT delete yet — a real sequencing dependency

Two notices are archaeology **and are currently doing a job.** Removing them early leaves members
staring at retired content with no explanation. Both wait on a bot outside this repo.

### `⚡・urgent-alerts` → "What this channel is for, from 21 August 2026"

Delete **only after** the old price-move / Fear & Greed bot is stopped in the agent fleet. Until it
stops, this notice is the only thing telling members why the channel's character changed, and it
explains the eight-in-twelve-days Extreme Fear run still visible above it.

**Order: stop the fleet bot → confirm no new price-move posts for a few days → delete the notice.**

### `⚙️・indicator-readings` → the pinned retirement notice

Delete **only after** the weekly indicator-panel generator is stopped and the remaining panels are
gone. The panel dated **16 August** still sits above the notice, and both panels landed on a
**Sunday around 17:00 UTC** — if that generator is still scheduled it will post again, and the
notice will be needed again.

**Order: stop the panel generator → delete the remaining panels → delete the notice.**

---

## Nothing else

Every course *lesson* channel was rebuilt from clean copy rather than corrected in place, so no
lesson references a previous version. The eleven channels above are the only ones that could not be
rebuilt, because rebuilding them would have broken inbound `<#id>` links from across the server.
Verified by reading every one of them back through the API, not by trusting the send calls.
