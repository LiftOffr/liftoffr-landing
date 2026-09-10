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
