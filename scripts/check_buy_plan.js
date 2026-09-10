#!/usr/bin/env node
// Regression tests for the buy-plan ladder, the Cowen level aggregator, and the
// DCA reconciliation. Plain node, no framework — same convention as the other
// scripts/check_*.js files. Exits non-zero on failure.
//
//   node scripts/check_buy_plan.js
//
// Every case in here is a bug that actually shipped, not a hypothetical.

import { BUY_PLAN, COWEN_SLOT_TIERS, effectiveTriggerPrice, dcaForDate } from "../api/_buy-plan.js";
import { parseCowenTargets, classifyLevel, SUPPORT_MAX_RATIO } from "../api/btc-price.js";
import { reconcileDca, shouldEscalateOverdue } from "../api/cron-weekly-score.js";

let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log(`  ✓ ${name}`); return; }
  failures++;
  console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
}
function section(t) { console.log(`\n${t}`); }

// Frozen numbers from 2026-09-09, the day the bug was found.
const SPOT = 78196;
const MA200W = 64980;

// ── 1. THE BUG: Cowen's 50-week MA ingested as a T2 buy trigger ─────────────
// On 2026-09-09 the aggregator pulled $80,000 — a level BTC was being rejected
// AT, i.e. resistance — out of a transcript and mapped it onto T2, a $28,000
// rung. Spot was $78,196, so a T2 trigger of $80,000 reads as HIT immediately.
// It did not fire only because a separate ±10% agreement check downstream
// happened to reject it. This test asserts it can never be ingested at all.
section("1. Resistance levels can never become buy triggers");
{
  const fixture = [{
    title: "Bitcoin Stalls at the 50 Week Moving Average",
    published: new Date().toISOString(),
    key_levels: [80000, 90000, 60000, 61000, 62000],
    outlook: "bearish",
  }];
  const out = parseCowenTargets(SPOT, MA200W, fixture);

  check("$80,000 (above spot) is classified as resistance",
    classifyLevel(80000, SPOT) === "resistance");
  check("$60,000 (below spot) is classified as support",
    classifyLevel(60000, SPOT) === "support");

  const mapped = Object.values(out.tiers).map((t) => t.price);
  check("no tier trigger is at or above spot",
    mapped.every((p) => p < SPOT), `got ${JSON.stringify(out.tiers)}`);
  check("$80,000 appears in no tier",
    !mapped.includes(80000), `tiers: ${JSON.stringify(out.tiers)}`);
  check("$90,000 appears in no tier", !mapped.includes(90000));
  check("resistance levels are still reported, not discarded",
    out.resistance.some((r) => r.price === 80000) && out.resistance.some((r) => r.price === 90000),
    JSON.stringify(out.resistance));
  check("supportCeiling is published for auditability",
    out.supportCeiling === Math.round(SPOT * SUPPORT_MAX_RATIO));
}

// ── 2. THE OTHER HALF: tier key mismatch ───────────────────────────────────
// btc-price.js hardcoded slots ["T2","T3","T4","T5"] while the ladder had been
// sub-divided into T3a/T3b/T4a/T4b/T5a/T5b. Every cowenTiers["T3"] lookup
// returned undefined, so three of four aggregated clusters were silently
// dropped and the tier ladder quietly stopped using the data it was fed.
section("2. Every emitted tier key exists in the ladder");
{
  const fixture = [{
    title: "Bitcoin: The Next 60 Days",
    published: new Date().toISOString(),
    key_levels: [63000, 60000, 56000, 50000, 52000, 48000],
    outlook: "bearish",
  }];
  const out = parseCowenTargets(SPOT, MA200W, fixture);
  const known = new Set(BUY_PLAN.tiers.map((t) => t.tier));

  check("aggregator produced at least one tier", Object.keys(out.tiers).length > 0);
  check("every emitted key is a real tier name",
    Object.keys(out.tiers).every((k) => known.has(k)),
    `emitted ${Object.keys(out.tiers)} / known ${[...known]}`);
  check("no emitted key is a retired lump name (T3/T4/T5)",
    !["T3", "T4", "T5"].some((k) => k in out.tiers));
  check("COWEN_SLOT_TIERS all exist in the ladder",
    COWEN_SLOT_TIERS.every((n) => known.has(n)));
}

// ── 3. The unguarded override branch ───────────────────────────────────────
// The old rule was: if (cow && ma) {check agreement} else if (cow) {take cow}.
// The second branch had no agreement check at all, so on the six tiers with no
// maMultiple any name-matched number would win outright. It was unreachable
// only because the names never matched — fixing the names without fixing this
// would have armed it on six rungs at once.
section("3. Cowen override is agreement-checked on every tier");
{
  const t3a = BUY_PLAN.tiers.find((t) => t.tier === "T3a");   // targetPrice 55000, no maMultiple
  check("wildly-off cluster is rejected on a tier with no maMultiple",
    effectiveTriggerPrice(t3a, { cowenPrice: 61300, spot: SPOT }) === 55000,
    `got ${effectiveTriggerPrice(t3a, { cowenPrice: 61300, spot: SPOT })}`);
  check("close cluster is accepted",
    effectiveTriggerPrice(t3a, { cowenPrice: 53000, spot: SPOT }) === 53000);

  const t2 = BUY_PLAN.tiers.find((t) => t.tier === "T2");     // 0.97 x 200W MA
  const base = MA200W * 0.97;
  check("MA-derived base is used when no cluster agrees",
    effectiveTriggerPrice(t2, { ma200w: MA200W, cowenPrice: 80000, spot: SPOT }) === base,
    `got ${effectiveTriggerPrice(t2, { ma200w: MA200W, cowenPrice: 80000, spot: SPOT })} want ${base}`);
  check("an override may never be raised to at-or-above spot",
    effectiveTriggerPrice(t2, { ma200w: SPOT / 0.97, cowenPrice: SPOT + 1, spot: SPOT }) !== SPOT + 1);
  check("a tier's OWN base above spot still counts as hit (price fell through it)",
    effectiveTriggerPrice(t2, { ma200w: 100000, cowenPrice: null, spot: SPOT }) === 97000);
}

// ── 4. Overdue fallback escalation ─────────────────────────────────────────
// runTierWatch gated purely on price, so T1's lapsed 2026-07-31 fallback just
// printed a static "⚠ overdue" forever. Escalation must never stop entirely.
section("4. Overdue fallback dates escalate and never go quiet");
{
  check("not overdue → no ping", shouldEscalateOverdue(0) === false);
  check("day 1 pings", shouldEscalateOverdue(1) === true);
  check("first week is daily", [1,2,3,4,5,6,7].every(shouldEscalateOverdue));
  check("second week is not daily", shouldEscalateOverdue(8) === false);
  check("weekly through the first month", shouldEscalateOverdue(14) && shouldEscalateOverdue(28));
  check("monthly thereafter", shouldEscalateOverdue(60) && shouldEscalateOverdue(90));
  check("still pinging at a year", shouldEscalateOverdue(360) === true);
  const anyInWindow = (a, b) => { for (let d = a; d <= b; d++) if (shouldEscalateOverdue(d)) return true; return false; };
  check("never silent for more than 30 days at any horizon",
    [40, 100, 200, 400, 800].every((d) => anyInWindow(d, d + 30)));
}

// ── 5. Reconciliation ──────────────────────────────────────────────────────
// The check that would have caught all of this on day two.
section("5. Reconciliation catches what cadence() structurally cannot");
{
  const today = "2026-09-09";
  const mkDays = (from, to, usd, notes) => {
    const out = [];
    for (let d = from; d <= to; d = new Date(Date.parse(d + "T00:00:00Z") + 864e5).toISOString().slice(0, 10)) {
      out.push({ date: d, type: "buy", usd, notes });
    }
    return out;
  };

  // (a) The real 2026-09-09 situation: bank leg running at $40 when the Sept 1
  //     phase change moved it to $60, and a USDC leg that has never fired.
  const real = mkDays("2026-08-10", "2026-09-08", 40, "simple-buy");
  const rec = reconcileDca({ trades: real, todayIso: today });
  const usdc = rec.legs.find((l) => l.leg === "usdc");
  const bank = rec.legs.find((l) => l.leg === "bank");

  check("silent USDC leg is flagged", usdc.flags.includes("leg-silent"), JSON.stringify(usdc));
  check("silent USDC leg shows full shortfall", usdc.actual === 0 && usdc.intended > 0);
  check("bank leg rate mismatch is caught", bank.flags.includes("rate-mismatch"),
    `observed ${bank.observedRate} scheduled ${bank.scheduledRate}`);
  check("bank observed rate is $40, scheduled $60",
    bank.observedRate === 40 && bank.scheduledRate === 60);
  check("overall result is not ok", rec.ok === false);

  // (b) A phase change must be caught the day after it lands, not ~6 weeks
  //     later the way a 45-day median would.
  const oneDayLate = reconcileDca({
    trades: mkDays("2026-08-05", "2026-09-01", 40, "simple-buy"),
    todayIso: "2026-09-02",
  });
  check("phase change detected one day in",
    oneDayLate.legs.find((l) => l.leg === "bank").flags.includes("rate-mismatch"));

  // (c) A correctly-running plan must stay quiet, or the alert is worthless.
  const good = [
    ...mkDays("2026-08-10", "2026-08-31", 50, "BTC-USDC"),
    ...mkDays("2026-09-01", "2026-09-08", 110, "BTC-USDC"),
    ...mkDays("2026-08-10", "2026-08-31", 40, "simple-buy"),
    ...mkDays("2026-09-01", "2026-09-08", 60, "simple-buy"),
  ];
  const clean = reconcileDca({ trades: good, todayIso: today });
  check("a healthy plan produces no flags", clean.ok === true,
    JSON.stringify(clean.legs.map((l) => [l.leg, l.flags, l.observedRate, l.scheduledRate])));

  // (d) Lump tier fires must not be counted as DCA, or a single $15,000 buy
  //     would paper over months of a dead daily leg.
  const withLump = reconcileDca({
    trades: [...real, { date: "2026-09-01", type: "buy", usd: 15000, notes: "BTC-USDC" }],
    todayIso: today,
  });
  check("a $15,000 lump buy does not mask the dead USDC leg",
    withLump.legs.find((l) => l.leg === "usdc").flags.includes("leg-silent"));
}

// ── 6. Schedule integrity ──────────────────────────────────────────────────
section("6. DCA schedule integrity");
{
  check("phases do not overlap and do not gap", (() => {
    const s = BUY_PLAN.dcaSchedule;
    for (let i = 1; i < s.length; i++) {
      const prevEnd = Date.parse(s[i - 1].end + "T00:00:00Z");
      const thisStart = Date.parse(s[i].start + "T00:00:00Z");
      if (thisStart - prevEnd !== 864e5) return false;
    }
    return true;
  })());
  check("dcaForDate returns zero outside the plan window",
    dcaForDate("2025-01-01").usdc === 0 && dcaForDate("2030-01-01").bank === 0);
  check("dcaForDate matches the Sept 2026 phase",
    dcaForDate("2026-09-09").usdc === 110 && dcaForDate("2026-09-09").bank === 60);
}

console.log(`\n${failures === 0 ? "BUY PLAN CHECKS: PASS" : `BUY PLAN CHECKS: *** ${failures} FAILED ***`}`);
process.exit(failures === 0 ? 0 : 1);
