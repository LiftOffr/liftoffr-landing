# Discord tree — DONE, 21 August 2026

**Status: executed and verified by reading the guild channel list back. Zero orphaned text
channels.** This file was previously a spec-to-be-done-by-hand, on a diagnosis that was wrong.

---

## The bug was mine, not Discord's

I spent several rounds concluding that the Discord API "silently ignores category assignment",
tested it three ways, wrote it up here and in `HANDOVER.md`, and proposed handing over 26 manual
drags.

**The tool parameter is `parentCategory`. I was passing `category`** — not a valid parameter on
`edit-channel`, so it was dropped and the rest of the call succeeded. That is exactly what a
silently-ignored field looks like from the outside, which is why my three "tests" all reproduced
it: they were the same mistake three times, not three independent probes.

The tell I missed: **an unrecognised argument and an ignored one are indistinguishable by
observation.** I never re-read the tool schema, because I was confident I already knew it. The
fix was one word.

Corrected 21 Aug. All 26 reparenting operations then succeeded first time, verified by reading the
tree back rather than by the return value — that part of the method was right and stays right.

---

## The tree, as read back from the API

```
━━・START HERE
    🎉・welcome
    📑・rules
    ✅・verification            ← was its own category
    🚀・start-here
    🔗・official-links          ← was ━━・Info
    📢・announcements           ← was LIFTOFFR-HUB
    👑・liftoffr                ← was LIFTOFFR-HUB

━━・📡 FREE · MARKET FEED
    📰・daily-market-brief
    🌡️・cbbi-pi-cycle
    🌍・macro-watch
    📺・market-intel
    🪙・altcoin-radar           ← was Market Intelligence
    ⚡・urgent-alerts           ← was Signals & Alerts. Score band changes only.

〡━━・Community
    🗣️・general-chat · ❓・questions-daily · 🙋🏼‍♂️・introductions · 🏆・wins-progress

━━・🔒 WHAT'S PAID, AND WHY          (the shop window — visible to everyone)
    🧭・whats-locked-and-why
    💵・the-29-buy-plan
    🎓・the-cycle-system
    🎯・1-on-1-playbook
    ⏰・book-your-1-on-1        ← was its own category

━━・🔓 YOUR PAID CHANNELS            (NEW — what you get after paying)
    🤔・how-to-use-this-course  ← was LIFTOFFR-HUB
    📈・plan-updates            ← was Signals & Alerts. $29 deliverable.
    🧰・course-resources        ← was LIFTOFFR-HUB
    ❓・elite-qna               ← was LIFTOFFR-HUB

〡━━・Module 1     7 lessons + overview + assessment
〡━━・Module 2     7 lessons + overview + assessment   (m2-l7 added)
〡━━・Module 3     5 lessons + overview + assessment
〡━━・Module 4    15 lessons + overview + assessment   (5 m4-score-*, m4-l1..l10)
〡━━・Module 5     7 lessons + overview + assessment   (m5-l1..l7)
〡━━・Module 6     5 lessons + overview + assessment

〡━━・Help/Support      🎫︱create-ticket · 💡︱suggestions
〡━━・📦 Archive        + ⚙️・indicator-readings (retired panel)
〡━━・Staff Area · Server Logs · Ticket Logs · AFK · Server Stat     (private, unchanged)
```

**Deleted, once emptied:** `〡━━・Verify` · `━━・Info` · `━━・Signals & Alerts` ·
`━━・Market Intelligence` · `〡━━・LiftOffr Life Package` · `〡━━・LIFTOFFR-HUB`.
Sixteen categories became **eleven**.

**The point of the change:** the free/paid boundary is now readable from the sidebar alone.
`📈・plan-updates` is a $29 deliverable and used to sit among free feeds; `course-resources`,
`elite-qna` and `how-to-use-this-course` are paid and used to sit beside free `announcements`.

### Two things deliberately left

- **`🟡 Score 36 · RE-ACCUM` and `₿ BTC $77.7K`** sit outside any category. They are live voice
  tickers and Discord renders them at the top of the server by design. Correct as-is.
- **`〡━━・1on1 Tickets` is empty but kept.** The ticket flow for the $497 product may create
  channels under it on demand. Deleting an empty category is trivial; breaking the ticket flow for
  the highest-priced product is not. **Check the ticket bot's config before removing it.**

### Ordering within categories

`edit-channel` sets the parent but not the position, so newly-parented channels land at the end of
their category. Within Module 4 the reading order is `m4-score-1…5` → `m4-l1…l9` → `m4-l10`, and
the channel names encode that, but the sidebar may not show them in that order. **Both the module
overview and the course map state the order explicitly**, so a reader is never guessing. Fixing
the sidebar order needs the bulk positions endpoint, which this tool does not expose — a handful
of drags if it bothers you, purely cosmetic if it doesn't.
