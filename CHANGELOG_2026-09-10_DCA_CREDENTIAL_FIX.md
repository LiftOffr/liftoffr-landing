# 2026-09-10 — DCA credential repointed to the key that actually exists

Deployed. This is the fix the 2026-09-09 writeup was building toward, plus a
correction to that writeup's reasoning.

## What was actually wrong

The daily USDC DCA read `COINBASE_TRADE_KEY_ID` / `COINBASE_TRADE_SECRET`. Those
have never existed in any Vercel environment (confirmed by `vercel env ls` across
production, preview, development on 2026-09-10 — a step the 09-09 session assumed
but never ran).

The credential that DOES exist is `COINBASE_API_KEY_ID` / `COINBASE_API_SECRET`.
Verified in the CDP portal on 2026-09-10: one secret key, **LiftOffrDCA**,
permissions **View + Trade + Transfer + Receive**, Primary portfolio, Ed25519.
It is the only key on the account. The "read-only sync key" the 08-20 audit was
protecting is fictional — there is nothing to keep separate from.

## Corrected history (the 09-09 writeup got this wrong)

- **2026-05-29 → 2026-08-20:** the code fell back to `COINBASE_API_*` and
  submitted a real BTC-USDC order every day. Coinbase **rejected** them. The
  throw was swallowed (`.catch` with no notify), so the reason was never read.
  The cause is **unknown** — and specifically *not* an unfunded wallet: Torin
  read the USDC balance from the Coinbase app on 2026-09-10 and it was
  **$74,498.31**. The rejection reason is the last real unknown; the fix below
  makes Coinbase's verbatim error visible on the next fire.
- **2026-08-20 (f846878) → 2026-09-10:** the fallback was removed on the belief
  that `COINBASE_API_*` was read-only. With `COINBASE_TRADE_*` unset, the DCA
  returned `{ skipped: true }` and genuinely placed nothing for ~3 weeks.

So it was two different failures, not "103 days of silent skip," and the key is
not read-only. Net effect on the USDC leg is still the same: zero BTC bought.

## Changes

- `runDailyDCA()` now prefers `COINBASE_TRADE_*` (both must be set) and otherwise
  falls back to `COINBASE_API_*`. The fallback is safe here (no read-only key
  exists to leak to) and is **announced on every fire** via
  `credentialSource: "api-fallback"` in the Discord post — never silent.
- The missing-credentials alert now names `COINBASE_API_*` as the primary
  credential and no longer tells you to make a new Trade key you don't need.
- Coinbase's rejection reason is surfaced (widened to 300 chars in the Discord
  line) so the thing nobody has read for 100+ days is now visible daily.
- Corrected the false comment block in `cron-weekly-score.js`, the `runDailyDCA`
  clause in `CLAUDE.md`, and added a correction banner to the 09-09 changelog.

## What fires next

The cron runs **15:00 UTC daily** (09:00 MT after the 2026-09-10 DST offset;
08:00 MT in winter). At the next 15:00 UTC it will attempt a real **$110**
BTC-USDC market buy (Phase 2 rate, per `BUY_PLAN.dcaSchedule`). If the USDC
wallet is funded it executes for real; if not, you'll get a Discord post with
Coinbase's exact refusal reason.

To hold instead of buying: unset `COINBASE_API_KEY_ID`/`COINBASE_API_SECRET` in
Vercel (breaks the dashboard balance read too), or gate the DCA task off. The
per-order cap is $250 and the product allowlist is BTC-USDC/BTC-USD only, so the
blast radius of a bug is one small BTC buy.

## Still open (not code)

- **USDC balance** — `model_usdc_split.js` assumes ~$82k but flags it inferred.
  A thin wallet fails even with a good key. Verify before relying on the leg.
- **Bank leg** — recurring buy still reads $40/day; schedule moved to $60 on
  09-01. Lives in the Coinbase app; only Torin can change it.
- **Key "last updated 2026-08-27"** — if Torin didn't touch it, worth
  understanding what changed. Not blocking.

---

## Follow-up (same day): make the automation observable and self-checking

The credential was fixed but the automation still wasn't trustworthy — it ran
103 days without anyone able to tell. Vercel Hobby exposes no cron-run or
runtime-log history, so "did it fire" was genuinely unanswerable. Closed that.

**Discord alerting via the bot (Option A, approved).** `sendDcaResultToDiscord`
no longer needs `DISCORD_BUY_ALERTS_WEBHOOK` (which was never set). It posts
through the existing `DISCORD_BOT_TOKEN` to **#auto-buy-log** (private Staff
channel, id in `api/_alerts.js`), matching how the rest of the stack posts.
Owner-DM stays as the fallback when a fatal result's channel post doesn't land.
Reconciliation divergences route to the same channel.

**1. Heartbeat.** Every DCA run now posts to #auto-buy-log — placed, duplicate,
skip, or rejection, with the amount and Coinbase's verbatim response. That
channel is bot-readable from outside the function, so "did the cron fire and
what did it decide" is now answerable without Vercel. Silence in that channel is
itself the signal.

**2. Absence alarm.** New watchdog in `cron-welcome-followups` (17:00 UTC —
a DIFFERENT cron from the 15:00 DCA). If the plan expects a daily USDC buy but no
BTC-USDC fill has cleared in `DCA_SILENT_DAYS` (3) days, it alerts to #auto-buy-log
and the owner DM. Because it lives in a separate cron, it fires even if
`cron-weekly-score` stops entirely — the exact failure mode that hid for 103 days.
Read-only; places nothing.

**3. Earlier session's fixes confirmed DEPLOYED**, not just committed: production
serves commit 2125568, which contains `reconcileDca` (intended-vs-cleared),
`classifyLevel`/support-resistance before the Cowen key mapping, and
`shouldEscalateOverdue` (overdue-tier escalation). Verified against the live HEAD.

**4. Config-time cap guard.** `DCA_MAX_QUOTE_SIZE` ($250) now lives in
`api/_buy-plan.js` (single source; `cron-weekly-score` imports it). A new
import-time guard throws if any scheduled USDC rate exceeds the cap — because the
v3 order path REJECTS an over-cap order (throws, buys nothing; no clamp). So an
unexecutable rate now fails loudly at deploy, not silently at 15:00. Verified the
guard throws on a simulated $300/day rate; `check_buy_plan.js` asserts it too.
Bank leg is exempt (it is a Coinbase-UI recurring buy, not placed by this code).

Dollar amounts in `dcaSchedule` unchanged. No Coinbase write calls. New file:
`api/_alerts.js` (shared bot-post + owner-DM helpers).

---

## Follow-up: human-triggered $10 test buy (Torin presses the button)

`scripts/test-dca-buy.js` places a small BTC-USDC buy through the EXACT
production path so the test proves the real chain, not a lookalike. To make that
faithful, these were exported from `cron-weekly-score.js` (no behavior change):
`resolveDcaCredential` (the one credential resolver, now used by both the cron
and the test), `placeMarketBuy` (gained an optional `clientOrderId`), `cbApi`,
`tradeJWT`, `sendDcaResultToDiscord`. The alert path is identical; a test post is
labelled "🧪 TEST" via a `test:true` flag on the result.

Safety: dry-run by default (prints the plan, places nothing); `--live` + a typed
amount confirmation to actually buy; hard $25 ceiling in the script (order cap is
$250); Coinbase's real per-product minimum is fetched and enforced (fails clearly
if the amount is below it). Credentials are read from env or prompted with echo
OFF — never written to disk (they are not on disk; only in Vercel, sensitive).

**State-pollution review of a $10 buy — checked all three:**
- **Ladder / tier fill:** safe. A lump fire needs `usd > dcaFillCeiling` (≈$220
  at the $110 schedule) in `runTierWatch`, and `>= $100` in the dashboard's
  `lumpFills()`. $10 is under both — it can never be read as a tier fill.
- **Absence watchdog:** FIXED. The watchdog now counts a day as "DCA cleared"
  only for a BTC-USDC fill ≥ 50% of the scheduled daily size (≥$55 at $110). A
  $10 test no longer falsely reassures it; a real $110 buy still does.
- **Idempotency:** FIXED. The test uses `liftoffr-dcatest-<product>-<ms>`, never
  the daily `liftoffr-dca-<product>-<date>`, so it cannot collide with the real
  daily order or dedupe against it.
- **Reconciliation:** FLAGGED (not corruption). The $10 is a real fill and
  reconciliation counts it as real USDC actual — impact is <1% of the 30-day
  window and rolls off. It could shorten a "leg-silent" streak by the one test
  day, but the size-gated watchdog (independent cron) is the authoritative
  absence alarm and is not fooled. Left reconcileDca (fixture-tested) unchanged.
