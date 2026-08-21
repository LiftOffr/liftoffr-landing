# Discord — target tree, 21 August 2026

**Read this first: I could not execute any of it, and the reason is a tool limitation, not a
judgement call.**

`edit-channel` applies `name` and `topic` correctly and **silently ignores `category`**. Tested
three ways on `m2-l7-portfolio-rebalancing`, all returning `Edited`, all leaving `parentId: null`
when the channel list is read back:

| Attempt | Category passed as | Result |
|---|---|---|
| 1 | raw ID `1443375153055797270` | `Edited` · `parentId` unchanged |
| 2 | name `〡━━・Module 2` | `Edited` · `parentId` unchanged |
| 3 | name **plus a topic change in the same call** | `Edited` · **topic applied**, `parentId` unchanged |

Attempt 3 is the conclusive one: the call reached Discord and half of it took effect. The category
field is dropped. **Never trust the return value on a move — read the tree back.**

So this file is a spec to be executed by dragging in the Discord client. It is ordered so you can
work top to bottom. Everything else in this file is my recommendation, not something already done.

---

## The three problems worth fixing

1. **The free/paid boundary is not visible from the structure.** `📈・plan-updates` is a **$29
   deliverable** sitting in `Signals & Alerts` between free channels. `🧰・course-resources`,
   `❓・elite-qna` and `🤔・how-to-use-this-course` are **paid** and sit in `LIFTOFFR-HUB` next to
   free `📢・announcements`. A prospect cannot tell what they are buying by looking.
2. **Three categories do the same job.** `📡 Free Market Feed`, `Signals & Alerts` and
   `Market Intelligence` all carry market data, split by nothing a member would recognise.
3. **Twelve course channels sit outside any category**, and four categories hold one channel or
   none.

---

## Target tree

Categories in this order. Channels within each in this order.

### 1 · `━━・START HERE`   *(rename of `〡━━・Welcome`)*
```
🎉・welcome
📑・rules
✅・verification          ← from 〡━━・Verify  (then delete that category)
🚀・start-here
🔗・official-links        ← from ━━・Info      (then delete that category)
📢・announcements         ← from LIFTOFFR-HUB
👑・liftoffr              ← from LIFTOFFR-HUB
```

### 2 · `━━・📡 FREE — MARKET FEED`   *(rename of `━━・📡 Free Market Feed`)*
Everything free and automated, in one place.
```
📰・daily-market-brief
🌡️・cbbi-pi-cycle
🌍・macro-watch
📺・market-intel
🪙・altcoin-radar         ← from Market Intelligence
⚡・urgent-alerts         ← from Signals & Alerts. Now Score band changes only.
```
Then **delete `━━・Signals & Alerts` and `━━・Market Intelligence`** once emptied.

### 3 · `〡━━・COMMUNITY`   *(unchanged)*
```
🗣️・general-chat · ❓・questions-daily · 🙋🏼‍♂️・introductions · 🏆・wins-progress
```

### 4 · `━━・🔒 WHAT'S PAID, AND WHY`   *(rename of `━━・🔒 Locked · Paid Access`)*
The shop window — visible to everyone, which is the point.
```
🧭・whats-locked-and-why
💵・the-29-buy-plan
🎓・the-cycle-system
🎯・1-on-1-playbook
⏰・book-your-1-on-1      ← from 〡━━・LiftOffr Life Package (then delete that category)
```

### 5 · `━━・🔓 YOUR PAID CHANNELS`   *(NEW category — create it)*
Everything a member only sees after paying. This is the change that makes the boundary obvious.
```
🤔・how-to-use-this-course   ← from LIFTOFFR-HUB. The course map; entry point to the course.
📈・plan-updates             ← from Signals & Alerts. $29 deliverable.
🧰・course-resources         ← from LIFTOFFR-HUB. Phase Matrix lives here.
❓・elite-qna                ← from LIFTOFFR-HUB
```
`〡━━・LIFTOFFR-HUB` is empty after this — **delete it.**

### 6–11 · The six course modules, in numeric order
Categories already exist and are already in order. **Twelve orphans need dragging in.**

**NOTE, 21 Aug (later):** the course lesson channels were rebuilt from clean copy, so **14 more
channels are now orphans than when this list was first written** — the five `m4-score-*`, `m4-l10`,
all seven `m5-l*`, and `m2-l7`. `m4-l1` … `m4-l9` were left alone precisely because they are
already correctly placed and recreating them would have orphaned nine working channels to fix a
problem they did not have.

**`〡━━・Module 1`** — no change (7 lessons + overview + assessment, already correct).

**`〡━━・Module 2`** — one orphan, placed after `lesson-6-accumulation-mistakes`:
```
m2-l7-portfolio-rebalancing        ← ORPHAN
```

**`〡━━・Module 3`** — no change.

**`〡━━・Module 4`** — six orphans. Order matters here: the five `m4-score-*` go **above `m4-l1`**,
because the arithmetic has to precede the components.
```
🔍︱m4-overview
m4-score-1-what-the-score-is       ← ORPHAN
m4-score-2-the-six-bands           ← ORPHAN
m4-score-3-the-arithmetic          ← ORPHAN
m4-score-4-the-divisor-rule        ← ORPHAN
m4-score-5-reproduce-it-unaided    ← ORPHAN
m4-l1-rhodl-ratio-20pct  …  m4-l9-rupl-5pct     (already in place, in order)
m4-l10-context-zero-weight         ← ORPHAN, goes last
📓︱m4-assessment
```

**`〡━━・Module 5`** — seven orphans, the whole module:
```
🔍︱m5-overview
m5-l1-how-to-read-receipts             ← ORPHAN
m5-l2-why-35-of-64-is-not-a-hit-rate   ← ORPHAN
m5-l3-why-46pct-and-54pct-are-the-same ← ORPHAN
m5-l4-so-what-is-it-for                ← ORPHAN
m5-l5-the-whipsaw                      ← ORPHAN
m5-l6-what-the-number-asks-of-you      ← ORPHAN
m5-l7-build-your-exit-ladder           ← ORPHAN
📓︱m5-assessment
```

**`〡━━・Module 6`** — no change.

### 12 · `〡━━・Help/Support`   *(unchanged)*
```
🎫︱create-ticket · 💡︱suggestions
```

### 13 · `〡━━・📦 Archive`
Add one:
```
⚙️・indicator-readings   ← from Market Intelligence. The panel is retired and the notice is pinned.
```
Move the two voice channels **out** — `🔇︱AFK` belongs in `〡━━・AFK`, and `👥︱Members: 58` is a
live counter, not an archive item; it belongs with the other stat tickers.

### 14+ · Private — unchanged
`〡━━・Staff Area`, `〡━━・Server Logs`, `〡━━・Ticket Logs`, `〡━━・AFK`, `〡━━・Server Stat`.

**`〡━━・1on1 Tickets` is empty — delete it** (or leave it if the ticket bot creates channels
under it on demand; check before deleting).

---

## Categories to delete once emptied

`〡━━・Verify` · `━━・Info` · `━━・Signals & Alerts` · `━━・Market Intelligence` ·
`〡━━・LiftOffr Life Package` · `〡━━・LIFTOFFR-HUB` · `〡━━・1on1 Tickets` *(check first)*

Seven categories out, one in. Sixteen categories become ten.

---

## What is safe about doing this

**Nothing breaks.** Every cross-reference in the course — all 22 lesson footers, both module
overviews, the course map — uses `<#channel_id>` mentions, which are **name- and
category-independent**. Moving or renaming a channel does not break a single link. The same is
true of the channel IDs hardcoded in `api/whop-webhook.js`; those are IDs, not paths.

**The one thing to be careful of:** permissions. Channels usually inherit from their category, so
moving a paid channel into a category with different overwrites can change who sees it. Check
`📈・plan-updates` and the three `LIFTOFFR-HUB` channels after moving them into
`🔓 YOUR PAID CHANNELS` — those are the four where a permissions mistake would either leak paid
content or lock out buyers. The rest are free either way.

---

## Messages for Torin to delete (I have no delete-message tool)

Six channels are correctly categorised and hold Torin's own original content alongside mine, so I
could not rebuild them — recreating would have orphaned them and destroyed the originals. Each now
has clean copy posted **below** older messages of mine that talk about what the course used to be.
Those older ones need deleting by hand; the newest message in each is the keeper.

| Channel | Delete | Keep |
|---|---|---|
| `🔍︱m4-overview` | my "Module 4 has been rebuilt" posts | the newest "Module 4 · The Score" index |
| `🔍︱m5-overview` | my "Module 5 has been rebuilt" and "now seven lessons" posts | the newest "Module 5 · The Record" index |
| `🔍︱m2-overview` | my "One lesson added to Module 2" post | *(nothing of mine — Torin's original stands)* |
| `📓︱m4-assessment` | my "This assessment is out of date" post **and the original embed above it** | the newest "Module 4 assessment" |
| `📓︱m5-assessment` | my "This assessment is out of date" post **and the original embed above it** | the newest "Module 5 assessment" |
| `🤔・how-to-use-this-course` | every earlier map, including the original pin | the newest two-part "🗺️ The LiftOffr course — full map" |

Also worth deleting, in channels that were repurposed rather than rebuilt:

- `⚡・urgent-alerts` — the "What this channel is for, from 21 August 2026" notice explains what was
  removed and why. Once the old price-move bot is stopped in the fleet, that notice is archaeology
  too; delete it then, not before, or members will wonder why the channel went quiet.
- `⚙️・indicator-readings` — the pinned retirement notice. Same timing rule: it is doing a job while
  the old panel is still visible above it.

**Nothing else in the course mentions a previous version.** The lesson channels were rebuilt from
clean copy rather than corrected in place, so there is no residue in any of them.
