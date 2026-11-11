# 2026-11-10: Cycle Map follower-to-buyer funnel

Torin, verbatim: "Yeah do what we need to do man don't stop till it's done". Ladder: Free / $29 Plan / $197 Course (no $497, no $997).
Docs for Torin (PDF): `~/Documents/liftoffr-funnel-2026-11-10/` (01 what's live + to-do, 02 affiliates, 06 India test + INR Plan spec, 07 emails as sent).
Shared board: `~/liftoffr-video/LOGS/AGENT_BOARD.md` jobs J18-J24.

| # | Change | Where | Verified |
|---|---|---|---|
| 1 | Free one-page Bitcoin Cycle Map PDF: Coinbase BTC-USD daily closes (UTC), halving block schedule, live Score 47.1 (9 Nov 2026). No price/date predictions, no income claims, no biography. Source `scripts/cycle_map/map.html` (not deployed); re-render when the Score band changes. | `lead-magnet/bitcoin-cycle-map.pdf`, `img/cycle-map-preview.webp` | 200 in prod |
| 2 | `/map` landing: live Score + days since the Oct 2025 top, email capture to `/api/subscribe` with `magnet: "map"`, then `/map/thanks`. | `map/index.html` | 200, iPhone UA, no horizontal scroll |
| 3 | `/map/thanks`: direct PDF download + $29 Plan offer (copy matches /plan: "$29 at checkout, plus tax where it applies. 30-day refund."). noindex. | `map/thanks/index.html` | 200 |
| 4 | Map welcome email (Day 0) and contact marker. Resend is capped at 3 audiences/segments (creating a 4th returned "Your plan includes 3 segments"), so map sign-ups stay in Free with contact property `lead_magnet=map`. | `api/subscribe.js` | Live test to delivered@resend.dev: delivered, property set; test contact deleted |
| 5 | Map emails 1-3 (days 1/3/5) offering the $197 Course; map contacts skip the generic free sequence; failed property read skips the contact (fail closed); held without LIFTOFFR_MAILING_ADDRESS. Previews `?preview=m1..m3`. | `api/cron-welcome-followups.js` | Prod previews render; dry run OK; `scripts/test_map_sequence.mjs` 5/5 |
| 6 | Shared nurture footer menu: removed the hidden $497 tier link ("4 ways" -> "3 ways"). | `api/cron-welcome-followups.js` | Test asserts no Playbook in any nurture email |
| 7 | `/bio` -> `/map?utm_source=instagram&utm_medium=bio&utm_campaign=cycle_map&utm_content=bio_link`. | `vercel.json` | 307, 1 hop, 200 on iPhone UA (apex and www) |
| 8 | ManyChat "CYCLE map | November 2026" LIVE: any post/reel, keyword CYCLE, public reply, opener "Send me the map", DM 2 button "Get the Cycle Map" -> `/map?utm_medium=dm`. | ManyChat (Chrome) | Live in list; needs a test comment from a second account |

Not changed: prices, plans, Whop products, the consent banner. Affiliate forms: nothing entered (Ledger behind Cloudflare; Trezor needs Torin's login, address, agreements). India: recommendation only.

## Scope change (same day, Torin)
"we need to stay on track and not have me doing other jobs to make money. Liftoffr needs to make money, not me making an editing agency."
- Editing-services offer DROPPED: board J23 closed with that reason; draft portfolio, rate sheet and outreach PDFs deleted.
- Ledger/Trezor affiliates (J22) reframed as LiftOffr revenue: after approval, links go only inside LiftOffr content (Cycle Map, emails, /stack, self-custody reels), each with "Paid link, I earn a commission." No links added yet.
- India recommendation (06 PDF) now also specs an INR-priced edition of the $29 Plan: hidden INR plan on the same Whop product, India-only display, and the 4 code paths that hard-code the Plan ID. Torin decides pricing; nothing created.

## Round 3 (same day): Torin "Do what you think is best"

| # | Change | Verified |
|---|---|---|
| 9 | **INR edition of the Plan, ₹799** (Torin approved; ₹499 comparison later). Whop variant `plan_5oqMUKkQjazTX`: hidden, INR, UPI + card, on the Plan product so it inherits the Plan document and Plan Discord experience. Base ₹760.95 so checkout shows ₹799 before tax (same 5% fee convention as $27.62 -> $29). 18+ in its description. USD plan unchanged. | Whop readback; checkout page shows UPI; USD plan diff empty |
| 10 | Code (b5bfec0): `PLAN_EDITIONS` in `api/_plan-credit.js` (USD $29 credit, INR $8 credit, rounded down from ₹799 at ₹93.93/USD); credit email states the amount; webhook role/label/GA4 maps; checkout attribution lists; `js/local-price.js` swaps price text and Plan checkout links for India-timezone visitors on /, /plan, /system, /map/thanks (`?price=inr|usd` for QA). Worker (workspace bc67d34): `PLAN_CURRENCIES`. | `scripts/test_inr_plan.mjs` 6/6 incl. signed webhook + fulfillment end to end on fixtures; all existing suites pass; prod ?price=inr shows 19x ₹799, 0x $29, 4 INR links; default prod unchanged |
| 11 | Montage captions lead with "comment CYCLE for the free bitcoin cycle map." on every reel (montage engine in ~/liftoffr-video). Codex auto-captioner change specified on the board (J19). | 96/96 captions pass checks; 34/34 tests |
| 12 | ManyChat CYCLE flow checked in preview; DM link resolves. Ledger + Trezor applications pre-filled (business fields only) in Chrome tabs. | — |

Still open (Torin): one real ₹799 purchase + refund to prove live delivery; first real CYCLE comment; finishing the two affiliate forms.
