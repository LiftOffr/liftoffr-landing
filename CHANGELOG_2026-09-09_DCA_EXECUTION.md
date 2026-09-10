# 2026-09-09 — The DCA has not bought anything since it was written

> **CORRECTION — 2026-09-10.** Two central claims below are wrong; see
> `CHANGELOG_2026-09-10_DCA_CREDENTIAL_FIX.md` for the verified account.
> (1) It did **not** silently skip for 103 days. From 2026-05-29 to 2026-08-20
> the code fell back to `COINBASE_API_*` and submitted a real order every day;
> Coinbase **rejected** them (reason never surfaced — likely an unfunded USDC
> wallet). Only after 2026-08-20 (when the fallback was removed) did it truly
> skip, for ~3 weeks. (2) `COINBASE_API_*` is **not** a read-only key. The CDP
> portal shows one key, LiftOffrDCA, with View+Trade+Transfer; there is no
> separate read-only sync key. The "create a new Trade key" instruction below
> was therefore unnecessary. The zero-BTC-bought conclusion still stands.

Not deployed. Review first.

Run `node scripts/check_buy_plan.js` (34 assertions, all passing) and
`node scripts/model_usdc_split.js` before reading further if you want the numbers
in front of you.

---

## The headline

The USDC DCA leg has placed **zero orders since 2026-05-29**, the day it was
written. That is **103 days**. Nothing alerted, because the one code path that
could have alerted was explicitly suppressed.

The bank leg, by contrast, has run perfectly — every single day, without a gap.
It runs inside the Coinbase app and never depended on any of this code.

### Independent confirmation, from outside the repo

The Gmail receipts settle it without reference to the source:

- `Your recurring buy for $40.00 of BTC is complete` — **every day**, unbroken,
  including all nine days of September.
- `Your BTC-USDC order was filled` — **four times in 180 days**: 2026-06-02,
  06-05, 06-25 (x2), 08-11. Sizes 0.2205, 0.4581, 0.0300, 0.0100, 0.0023 BTC.
  Irregular, large, manual. A $50/day automated leg would have produced ~100 of
  these. It produced none.

### The bank leg is also wrong right now

The receipts read **$40.00/day**. `BUY_PLAN.dcaSchedule` moved the bank leg to
**$60/day on 2026-09-01**. The Coinbase recurring buy was never updated. That is
a live $20/day gap, nine days old, and **only you can fix it** — it lives in the
Coinbase app, not in this repo.

### The arithmetic

| Leg | Intended 05-28 → 09-09 | Actual | Short |
|---|---|---|---|
| USDC (automated) | $5,790 | $0 | **$5,790** |
| Bank (recurring buy) | $4,380 | $4,200 | $180 |
| | | **Total** | **$5,970** |

Your note said ~$4,805. That figure looks like the USDC leg at a flat $50/day
through roughly Sept 1 — it misses the Phase 2 ramp to $110/day. The larger
number is the one the schedule actually asks for.

---

## 1. Execution path — fixed, but one thing needs you

**The credential does not exist, and the code was already correct.**

`runDailyDCA()` has read `COINBASE_TRADE_KEY_ID` / `COINBASE_TRADE_SECRET` since
`f846878` removed the read-only fallback on Aug 20. There was nothing to
"make it use" — it already does. The variables have simply never been set:

- No `.md` file in this repo mentions `COINBASE_TRADE` anywhere, and this repo
  documents everything.
- `scripts/set-coinbase-key.sh` sets only the read-only pair and says so in its
  header: *"View + Trade history, no Trade permission. It cannot place, modify,
  or cancel orders."*
- `a844e59` added the fallback **the same day the DCA was written**, with the
  message "if TRADE-specific key unset". It was unset from hour one.

I cannot read your Vercel environment from here — the token lives in
`~/.openclaw/secrets/vercel.env`, which is not mounted and which I would not read
anyway. **Confirm with `vercel env ls`.** If it shows nothing, this is what to do:

1. https://portal.cdp.coinbase.com/access/api → create a **new** key with
   **Trade** permission. Do not add Trade to the existing sync key; the read-only
   separation is deliberate and worth keeping.
2. Set `COINBASE_TRADE_KEY_ID` and `COINBASE_TRADE_SECRET` in Vercel
   **Production**.
3. Redeploy. Confirm with `?tasks=dca&force=1` and the cron secret.

**What changed in the code**

`runDailyDCA()` no longer returns a quiet `{ skipped: true }`. Every path that
does not place an order now returns `notify: true, fatal: true` and posts to
Discord — naming the missing variable and the dollar amount that did not get
bought.

The root bug was one line in `sendDcaResultToDiscord()`:

```js
if (dcaResult.skipped) return;   // don't spam if not configured
```

The single condition most worth shouting about was the one condition guaranteed
to stay silent. That is what hid 103 days. It is gone. Also fixed: a throw inside
`runDailyDCA()` used to land in the response body and nowhere else, and a failed
Discord post was swallowed by `.catch(console.warn)`. Both now report, and a
missing webhook on a *fatal* result escalates to the owner DM, which uses a
different credential.

The alert repeats daily until the DCA can place an order. If that is annoying,
the fix is to make the DCA work.

---

## 2. Resistance ingestion, then the key mismatch

Fixed in that order, because the second fix is dangerous without the first.

**What was actually happening on 2026-09-09.** With BTC at $78,196, the
aggregator's filter was `v >= currentPrice * 1.10 → skip`, which admits anything
up to 10% *above* spot. So Cowen's **$80,000** level — the 50-week moving average,
the level price is being *rejected at* — was ingested as a **downside buy trigger**
and mapped onto **T2, a $28,000 rung**. A T2 trigger of $80,000 against spot of
$78,196 reads as **HIT**.

It did not fire because a *separate* ±10% agreement check downstream happened to
reject it ($80,000 vs T2's real trigger of $63,031 is 26.9% apart). Two guards,
one of them wrong, and the survivor was luck. One correction to your note: it was
the **agreement** guard that saved it, not the ±10%-of-spot ingestion guard — the
ingestion guard is the one that let it through.

**And the mismatch was worse than "dead code".** The slots were hardcoded as
`["T2","T3","T4","T5"]` while the ladder had been sub-divided into
T3a/T3b/T4a/T4b/T5a/T5b. So `T2` matched — and was the *only* one that matched.
Result: the single worst cluster (1 mention, resistance, above spot) was the only
one that reached a live tier, and the three well-supported support clusters
($61,300 with 6 mentions, $70,700 with 3, $56,500 with 2) were all discarded.

**A third bug, found while fixing the second.** The old rule was:

```js
if (cow && maPx) { /* ±10% agreement check */ }
else if (cow)    { triggerPx = cow; }     // ← no check at all
```

The second branch has no agreement check. Six of the nine rungs (T3a→T5b) have no
`maMultiple`, so for all of them any name-matched number would have overridden the
tier's own target outright. That branch was unreachable *only* because the names
never matched. **Fixing the names without fixing this would have armed an
unguarded override on six tiers simultaneously.** Both dashboards had the same
bug in `effPrice()`.

**The fixes**

- `classifyLevel()` splits every level into support / resistance on price, with a
  2% buffer below spot. Resistance is still returned in the payload (it is useful
  on the dashboard) but can never become a trigger. Surfacing it is what stops
  someone widening the filter again to get it back.
- Tier names now come from the new `api/_buy-plan.js`, which throws at import time
  if `COWEN_SLOT_TIERS` names a tier that no longer exists. The mismatch cannot
  recur silently.
- Clusters are assigned to the tier they are **nearest in price**, not to a
  positional slot. Positional mapping is what put the highest surviving cluster on
  T2 regardless of whether the two numbers had anything to do with each other.
- `effectiveTriggerPrice()` in `_buy-plan.js` is now the single place that decides
  a trigger, with the agreement check applied on **every** tier, and a rule that an
  override may never be raised to or above spot. Note the asymmetry that matters:
  a tier's *own* base above spot is legitimate — it means price fell through the
  rung. Only the override is ceilinged. Both dashboards mirror it.

**Before and after, on today's real data**

| Tier | Before | After |
|---|---|---|
| T2 | **$80,000** (resistance, would read HIT) | $61,300 (6 mentions, 2.7% from base — accepted) |
| T3a | discarded | $70,700 offered, **28.5% off base → rejected**, keeps $55,000 |
| T3b | discarded | $56,500 (7.6% from base — accepted) |
| T4a | discarded | $50,000 (1.0% from base — accepted) |
| — | — | $80,000 / $90,000 → `resistance[]`, never actionable |

No tier reads HIT at $78,196.

Regression test: `check_buy_plan.js` §1 asserts an $80,000 level at spot $78,196
can never reach a tier.

---

## 3. Overdue fallback dates now escalate

`runTierWatch` gated purely on price and ignored `fallbackDate` entirely. The only
trace of a lapsed date was the string `⚠ overdue` in the briefing — static,
undated, identical on day 1 and day 100. T1's date passed **2026-07-31** and has
said the same thing every day for 40 days.

**Enforcement here means escalation, never execution.** These are manual-execution
pings by design and nothing in this file may place a lump order. An overdue date
is a prompt to make a decision — fire it, move the date, or strike the tier — and
the alert says exactly that.

`shouldEscalateOverdue()` is stateless (there is no store to remember what was
already sent), so the cadence is a pure function of days overdue: **daily for the
first week, weekly to day 30, monthly forever after.** Tested to never go quiet
for more than 30 days at any horizon, including a year out. The briefing line now
carries the day count and a severity colour instead of a bare warning.

---

## 4. Reconciliation

New: `reconcileDca()` — pure, fixture-tested, read-only. Runs daily after the DCA
task so the day's fire is in the ledger before comparing.

It compares the **plan** against the **exchange**, per leg, and flags:

- `leg-silent` — N consecutive settled days with no fills where the plan expected money to move
- `rate-mismatch` — observed daily rate vs today's scheduled rate
- `cumulative-divergence` — 30-day drift past 10%

Why `cadence()` could never do this: it infers the schedule *from the fills*, so
it has nothing to disagree with. It takes a 45-day median of gaps (a phase change
is invisible for ~6 weeks) and a median of fill *sizes* (it reads "$50/day"
whether the bank leg is $40 or $60). It is an observation, and the UI labels it as
one. This is a check.

Against today's real data it produces, on day one: USDC leg silent 30/30 days;
bank leg running $40/day against a scheduled $60. Test §5(b) asserts a phase
change is caught **one day** after it lands.

### A fourth bug this surfaced

The codebase used `usd >= 100` in two places to mean "this is a lump tier fire,
not DCA". **The Phase 2 USDC leg is $110/day.** From 2026-09-01, every daily DCA
buy would have waterfalled into IMMEDIATE/T1/T2 as a lump fill — marking tiers
"done" with dollar-cost-averaging money and switching off the tier alerts that
depend on those tiers being unfilled.

This has never bitten only because the DCA has never placed an order. **It would
have started corrupting the ladder the day you set the trade key** — the fix and
the bug would have landed together.

Classification is now plan-relative (`dcaFillCeiling()`): a fill is DCA if it is
plausibly that leg's scheduled daily size for that date. Lump tiers start at
$4,000, so there is no overlap. Fixed in `runTierWatch`.

**Still to do, deliberately left:** `dashboard/index.html` `lumpFills()` has the
same `>= 100` rule. I did not change it because it alters what the dashboard
displays, and that is your call. Marked with a comment at the fix site.

---

## Files

| File | |
|---|---|
| `api/_buy-plan.js` | **new** — single source of truth; import-time guard against name drift |
| `api/btc-price.js` | support/resistance classification; nearest-tier mapping |
| `api/cron-weekly-score.js` | loud DCA failure; overdue escalation; reconciliation; lump-fill fix |
| `dashboard/index.html`, `index-v2.html` | `effPrice()` agreement check + spot ceiling |
| `scripts/check_buy_plan.js` | **new** — 34 assertions, every one a bug that shipped |
| `scripts/model_usdc_split.js` | **new** — arithmetic for the allocation decision |
| `api/_dca-risk-weighting.PROPOSED.js` | **new, inert** — nothing imports it |
| `scripts/verify_money_path.sh` | runs the new checks |

`BUY_PLAN.dcaSchedule` dollar amounts are byte-for-byte unchanged. No Coinbase
write call was made. Nothing was deployed.
