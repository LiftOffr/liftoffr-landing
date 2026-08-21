# Messages to delete in the Discord web client — 21 August 2026

**54 messages across 10 channels.** All authored by **Mission Control#3685** — no human-written
content is at risk.

**In every channel the rule is the same: keep the bottom-most message, delete everything above it.**
The one exception (`how-to-use-this-course`) keeps the bottom **two**, and is marked.

---

## What was fixed without you, and how

Every **course lesson channel** now holds its lesson and nothing else. That was done by deleting
each channel and recreating it — the only destructive operation this tooling exposes — then
posting the lesson as a single message with its navigation footer merged in.

All fifteen Module 4 channels were rebuilt this way. Two genuine defects went with them:

- **`m4-l9`** carried a second navigation footer whose "Next" link pointed at a deleted channel.
- **`m4-l8`** told readers the divisor rule was in "Module 1, lesson 4" — a channel that has never
  existed under that name. It now links to `m4-score-4-the-divisor-rule`.

## Why these ten channels were not fixed the same way

They are **original channels from May**, and unlike the lesson channels they are pointed at by
`<#id>` mentions from content I cannot read or repair — the Module 1, 3 and 6 lesson embeds, which
the bot API returns as empty. Recreating them changes their IDs. If any of those original embeds
links to a module overview or the course map, recreating it breaks that link **permanently**, with
no way for me to detect or repair the damage.

`how-to-use-this-course` is also hardcoded in `api/whop-webhook.js` as the channel every new buyer
is pointed to in their welcome DM.

Deleting 54 messages carries none of that risk. That is the only reason this list exists.

---

## Course channels — 36 messages

### 1 · `🤔・how-to-use-this-course` — delete 16, **keep the bottom two**

The course map is a two-part message. Keep both parts at the very bottom and **pin the first of
them**. Everything above goes, including the earlier 46-lesson map — its Module 4 links now point
at deleted channels.

⚠️ **Four messages here open "🗺️ The LiftOffr course — full map".** Only the bottom pair survives.

Also delete: "Map update — 21 August 2026, later" · "Course map — updated 21 August 2026" ·
"Course map — updated 20 August 2026" · "Six old Module 4 lessons are in the 📦 Archive category" ·
"**Module 5 · The Record** — read this before deciding whether to trust any of it" ·
"One module a week beats one weekend of everything" · "# The Cycle System — course map …
Thirty-six lessons" · and five embeds with no text (7 Aug and 12 May).

⚠️ **Highest priority in the server.** The "Module 5 · The Record" message (21 Aug, 09:39 UTC)
tells members the bot "cannot set a channel's category, and it reports success when it silently
fails to." That was my diagnosis and it was wrong — the parameter was `parentCategory`. It also
tells members to skip channels named `retired-*`, which no longer exist.

### 2 · `🔍︱m4-overview` — delete 7, keep the bottom 1

Keep the newest: "# Module 4 · The Score / **Fifteen lessons.**"

⚠️ **Three messages here open "Module 4 · The Score".** Only the bottom one has working links —
the other two point at channels deleted in the rebuild. Everything above the newest goes,
including "Module 4 now starts five lessons earlier", "Module 4 has been rebuilt", "Every lesson
publishes the same four things", and two 1 July embeds.

### 3 · `🔍︱m5-overview` — delete 5, keep the bottom 1

Keep: "# Module 5 · The Record / **Seven lessons.**"
⚠️ Delete the near-identical one that says **Six lessons**, plus "Module 5 is now seven lessons",
"Module 5 has been rebuilt", and two 1 July embeds.

### 4 · `🔍︱m2-overview` — delete 3, keep the bottom 1

Keep: "# Module 2 · The Wealth Engine / **Seven lessons.**"
Delete "One lesson added to Module 2" and two 12 May embeds.

### 5 · `📓︱m4-assessment` — delete 2, keep the bottom 1

Keep: "# Module 4 assessment" (nine questions).
Delete "This assessment is out of date" and the 12 May embed (the old eight-indicator assessment).

### 6 · `📓︱m5-assessment` — delete 3, keep the bottom 1

Keep: "# Module 5 assessment" (ten questions).
Delete "This assessment is out of date" and two 12 May embeds.

---

## Entry and sales channels — 18 messages

Each of these now ends with clean standalone copy. Everything above it is either stale or a
correction referring to a message that is about to be deleted.

### 7 · `✅・verification` — delete 2, keep the bottom 1

Keep: "# Getting your paid access". **Pin it.**
Delete "Correction to the pinned message above" and the 12 May embed.

⚠️ **Highest operational priority.** The old pin says verification is automatic. It is not, and
that has cost people access they paid for.

### 8 · `🚀・start-here` — delete 6, keep the bottom 1

Keep: "# Start here / This server is built around one number…"
Delete "The free layer — all of it", "Start here — corrected 21 August 2026", and four embeds
(7 Aug ×2, 21 Jul, 1 Jul). One of the 7 Aug embeds contains the false claim *"I called the top on
Oct 6 2025"*.

### 9 · `🧭・whats-locked-and-why` — delete 5, keep the bottom 1

Keep the newest: "# What's locked, and why".
⚠️ **Two messages here open "# What's locked, and why".** The older one links to a deleted channel.
Also delete "$197 — The Cycle System / Not an 8-indicator framework", "corrected 21 August 2026",
and two 7 Aug embeds.

### 10 · `🎓・the-cycle-system` — delete 5, keep the bottom 1

Keep the newest: "# The Cycle System — $197 / **46 lessons across six modules**".
⚠️ **Two messages open "# The Cycle System — $197".** The older says 45 lessons and links to a
deleted channel. Also delete "Two things the old message claimed", and two 7 Aug embeds — one is
the "8-indicator phase matrix / 36 lessons" sales copy.

---

## Do NOT delete yet — a real sequencing dependency

### `⚡・urgent-alerts` → "What this channel is for, from 21 August 2026"

Delete **only after** the old price-move / Fear & Greed bot is stopped in the agent fleet. Until
then this notice is the only thing explaining why the channel changed character, and it accounts
for the eight-in-twelve-days Extreme Fear run still visible above it.

**Order: stop the fleet bot → confirm no new posts for a few days → delete the notice.**

### `⚙️・indicator-readings` → the pinned retirement notice

Delete **only after** the weekly panel generator is stopped and the remaining panels are gone. The
**16 August** panel still sits above the notice, and both panels landed on a **Sunday near 17:00
UTC** — if that generator is still scheduled it will post again.

**Order: stop the generator → delete the panels → delete the notice.**

---

## Where a lesson is more than one message

Three lessons exceed Discord's 2,000-character limit and are published as contiguous parts. This
is a platform limit, not leftover material — there is no correction, no supersession and no
archaeology in any of them, and each part follows directly from the one above it.

| Channel | Parts | Why |
|---|---|---|
| `m4-l10-context-zero-weight` | 2 | 2,252 chars after tight editing. Cutting further would remove one of the four indicators' reasoning or the October 2025 evidence. |
| `m5-l5-the-whipsaw` | 2 | The transition table plus the 2021 counterpart account. |
| `m5-l6-what-the-number-asks-of-you` | 2 | The argument plus the five-point checklist. |
| `m5-l7-build-your-exit-ladder` | 5 | The method plus a six-step worksheet and override log. |
| `m2-l7-portfolio-rebalancing` | 2 | The method plus the worked arithmetic and tax treatment. |

Every other course lesson is exactly one message.
