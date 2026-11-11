# 2026-11-11: disclose once, sell everywhere else

Torin: "all the disclaimers you give kill our credibility and shoot ourselves in the foot."
Rule now in BRAND_VOICE.md 6a, CLAUDE.md and COPY_SWEEP_NOTES.md.

## Where the disclaimer lives (and nowhere else)
- Site footer block, identical on 42 pages plus the home footer:
  "Education, not individualized financial advice. LiftOffr Score signals are backtests over
  public price and on-chain data, not records of live trades, and past performance doesn't
  guarantee future results. Paid products are 18+. LiftOffr LLC (Montana). Full terms."
- /disclaimer and /terms (full text, unchanged).
- Email footer: `api/_disclosure.js` DISCLOSURE (same wording) + entity, address, contact.
- One line at checkout on /plan and /system: "18+. Education, not individualized financial
  advice; past results don't guarantee future ones."
- Affiliate links: "(Paid link, I earn a commission.)" next to each link.
- 18+ next to paid offers (Plan, Course, thank-you checkout, DMs).

## Removed
- Second and third footer disclaimers on ~35 pages (indicators, blog, free, stack, quiz,
  proof, links, buyzone, playbook, 404, cycle, score, receipts, track-record...).
- /map: "History, not a forecast" (also meta/OG), "misses included", "what nobody knows
  yet", the "What it isn't" box, 18+ on the free form. Map PDF re-rendered (same changes).
- /plan: "What this is not" block, "Read this first" box, "Is this financial advice?" FAQ,
  "If you only want the crossings that worked I'm the wrong person", "if $29 matters don't
  spend it", "losers included", footer duplicate. Objections rewritten to confident answers.
- /system: "historical limitations"/"misses" framing, preview hedge, footer duplicate.
- Home: "inspect the misses", "got early or wrong", "not an expected result" line.
- Map emails 1-5: "history, not a forecast", "nobody knows", "every miss", "what it isn't".
  Email 3 subject now "three exit flags, one top".
- ManyChat CYCLE map DM: dropped "History, not a forecast. Education, not financial advice."
- Discord onboarding DMs: dropped three "18+. Education, not financial advice." sign-offs,
  "where it's been wrong", "Buy nothing if you don't need it", "My exact plan" (inaccurate).
- /playbook ($997) links removed from /plan, /system and the home footer (ladder rule).

## Not touched
- /receipts and /track-record keep their backtest methodology notes (that is the record).
- llms.txt one-line statement; terms; disclaimer.
- Montage/Codex IG caption "compliance line" (their lane; flagged on AGENT_BOARD).
- lead-magnet/ PDF sources other than the Cycle Map.

## Pinned-comment script (replaces the overnight one)
"Free Bitcoin Cycle Map: comment CYCLE and I'll DM it to you. Every halving cycle on one page."

## Verified
- Live: one footer disclaimer per page; /plan and /system add the checkout line only.
- Live email previews m1-m4: new copy, one disclaimer each.
- ManyChat saved and re-read after reload. Tests: all suites pass; CTA coverage now PASS
  (added /receipts to the /map selectors, a pre-existing failure).
