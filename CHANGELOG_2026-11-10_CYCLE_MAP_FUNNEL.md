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
