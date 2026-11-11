# 2026-11-11 (later): no visible disclaimers

Torin: "drop the regulatory bullshit from everything or the warnings or not financial
advice none of the other influencers on ig do that." Supersedes the disclose-once rule
from earlier the same day. Rule: BRAND_VOICE.md 6a.

## What stays
- /terms and /disclaimer (legal pages), linked as a plain "Terms" link in the footer.
- "(affiliate)" next to an affiliate link once it is live (/stack script, map email 5).
- 18+ enforced at checkout: Whop Settings > Terms now has /terms uploaded
  (LiftOffr-Terms.pdf, section 0 Eligibility 18+) and "Require terms and conditions
  acceptance" ON. Verified: the $29 checkout shows "I agree to all terms and conditions."
- Email footer: entity, mailing address, contact, unsubscribe (CAN-SPAM). No disclaimer.
- /receipts and /track-record: factual backtest methodology lines only.

## Removed (landing b00a9bf)
- Footer disclaimer block on 42 pages + home (now a Terms link where none existed);
  "Disclaimer" footer link on home.
- Checkout lines on /plan, /system; 18+ on /plan, /map/thanks.
- Indicator pages (11 + generator + /when-will-bitcoin-bottom): "Read this first" block,
  "Is this financial advice?" FAQ.
- Blog: 8 Disclaimer boxes, hedge paragraphs, "including the ones that went the wrong way".
- FAQ, quiz, playbook, score, links, proof, 404, about: NFA FAQs, "misses/losers included",
  coin-flip stats paragraphs, apologetic About paragraph.
- Emails: DISCLOSURE removed from api/_disclosure.js and zone alerts; welcome Day 5 rewritten
  ("check my work", was "don't trust my backtest"); "went the wrong way", "not a forecast",
  "not instructions" lines; affiliate label now "(affiliate)".
- Discord /score bot footer (api/cycle-score.js), "Nobody knows" bottom answer.
- PDFs: read-the-cycle (page edits in place, "Using this guide" page deleted, "Where it has
  been wrong" page rewritten as "How the exit zone played out in 2025"), bitcoin-cycle-map
  (re-rendered), retired checklist/buy-zone PDFs. READ-THE-CYCLE.md synced.
- llms.txt disclaimer line.

## Outside this repo
- Discord bot posts and DMs (workspace 49a3b99): urgent alerts, weekly CBBI, engage posts,
  YouTube intel, Telegram bridge, embed footer, onboarding DMs (18+ removed; day-14 line
  "some links pay me a commission" removed as untrue, none are live). daily_reel.py and
  daily_signal.py edited but uncommitted (shared with another session's IG work).
- ManyChat CYCLE map DM: "18+." removed (saved, re-read after reload).
- Whop business description: removed "including the ones that went the wrong way" and
  "Educational only"; kept "18+." there (checkout-side).
- Bio suggestion (liftoffr-video LOGS/viral_playbook*.json): "charts + history, not
  financial advice" -> "one daily number for where we are in the cycle".

## Not touched
- Paid deliverables (Plan PDF, Course lessons) still carry their own disclaimer sections.
- IG captions/on-screen text: done by a parallel Claude session (AGENT_BOARD 07:27 MT).
