#!/usr/bin/env node
// Arithmetic behind the three USDC allocation options. Not a recommendation and
// not a forecast — every price path below is a STATED ASSUMPTION, printed next
// to its result so the assumption travels with the number.
//
//   node scripts/model_usdc_split.js
//
// Torin decides the allocation. This file only does the multiplication.

const TODAY      = "2026-09-09";
const HORIZON    = "2026-12-31";
const SPOT       = 78196;   // BTCUSDT close, Binance.US, 2026-09-10 candle
const MA200W     = 64980;   // 1400d SMA
const MA50W      = 80243;   // 350d SMA — Cowen's bull/bear line. spot/50wMA = 0.974
const REALIZED   = 52760;   // bitcoin-data.com realized price, 2026-09-08
const CBBI       = 0.444;   // 2026-09-08

const USDC_PILE  = 82000;   // INFERRED, not a balance read. Verify before acting.
const DAILY_BASE = 110;     // Phase 2 USDC leg, per BUY_PLAN.dcaSchedule

const days = Math.round((Date.parse(HORIZON) - Date.parse(TODAY)) / 864e5);

// Effective ladder triggers after the resistance/key-mapping fix, from
// api/_buy-plan.js + the aggregated Cowen clusters (see check_buy_plan.js).
const LADDER = [
  { tier: "T3b", target: 20600, trigger: 56500 },
  { tier: "T3a", target: 20600, trigger: 55000 },
  { tier: "T4a", target: 10000, trigger: 50000 },
  { tier: "T4b", target: 10000, trigger: 48000 },
  { tier: "T5a", target: 4000,  trigger: 40000 },
  { tier: "T5b", target: 4000,  trigger: 38000 },
];
const LADDER_TOTAL = LADDER.reduce((s, t) => s + t.target, 0);

// The daily leg has to be funded out of the same pile, so it is not "idle
// capital" — it is already spoken for.
const DAILY_COMMITTED = DAILY_BASE * days;

// Shave the ladder from the DEEPEST rung upward. Deep rungs need the biggest
// drawdown to ever fire, so cutting there costs the least expected deployment.
function shaveLadder(amount) {
  const out = LADDER.map((t) => ({ ...t }));
  let left = amount;
  for (let i = out.length - 1; i >= 0 && left > 0; i--) {
    const cut = Math.min(out[i].target, left);
    out[i].target -= cut;
    left -= cut;
  }
  return out.filter((t) => t.target > 0);
}

const fmt = (n) => "$" + Math.round(n).toLocaleString();
const btcFmt = (n) => n.toFixed(4) + " BTC";

// Bear branch: price walks from spot down to `floor`. Tiers with a trigger at or
// above `floor` fire at their trigger. The daily leg averages the midpoint of
// the walk — a straight-line assumption, stated as such.
function bearBranch(ladder, dailyRate, floor) {
  const fired = ladder.filter((t) => t.trigger >= floor);
  const ladderUsd = fired.reduce((s, t) => s + t.target, 0);
  const ladderBtc = fired.reduce((s, t) => s + t.target / t.trigger, 0);
  const dailyAvgPx = (SPOT + floor) / 2;
  const dailyUsd = dailyRate * days;
  const dailyBtc = dailyUsd / dailyAvgPx;
  const totalUsd = ladderUsd + dailyUsd;
  const totalBtc = ladderBtc + dailyBtc;
  return {
    fired: fired.map((t) => t.tier), ladderUsd, ladderBtc, dailyUsd, dailyBtc, dailyAvgPx,
    totalUsd, totalBtc, avgEntry: totalBtc > 0 ? totalUsd / totalBtc : 0,
    undeployed: ladder.reduce((s, t) => s + t.target, 0) - ladderUsd,
  };
}

// Bull branch: 50W MA breaks with a higher high and price never revisits the
// shallowest rung. No ladder tier fires. The daily leg averages `avgPx`.
function bullBranch(ladder, dailyRate, avgPx) {
  const dailyUsd = dailyRate * days;
  const dailyBtc = dailyUsd / avgPx;
  return {
    fired: [], ladderUsd: 0, ladderBtc: 0, dailyUsd, dailyBtc, dailyAvgPx: avgPx,
    totalUsd: dailyUsd, totalBtc: dailyBtc, avgEntry: avgPx,
    undeployed: ladder.reduce((s, t) => s + t.target, 0),
  };
}

const OPTIONS = [
  { key: "A", name: "HOLD",  moved: 0,     note: "Ladder untouched. Daily leg stays on the published schedule." },
  { key: "B", name: "SPLIT", moved: 20000, note: "Retire T5b, T5a, T4b and $2K of T4a into the daily rate." },
  { key: "C", name: "TILT",  moved: 40000, note: "Retire T5b, T5a, T4b, T4a and $12K of T3b into the daily rate." },
];

console.log(`\nBTC ${fmt(SPOT)}  ·  50W MA ${fmt(MA50W)} (spot = ${(SPOT / MA50W).toFixed(3)}x)  ·  200W MA ${fmt(MA200W)}`);
console.log(`Realized price ${fmt(REALIZED)}  ·  CBBI ${CBBI}`);
console.log(`Horizon ${TODAY} → ${HORIZON} = ${days} days\n`);
console.log(`USDC pile (inferred) ${fmt(USDC_PILE)}`);
console.log(`  already committed to the daily leg at $${DAILY_BASE}/day  ${fmt(DAILY_COMMITTED)}`);
console.log(`  reserved against the ladder (T3b→T5b)                   ${fmt(LADDER_TOTAL)}`);
console.log(`  unallocated remainder                                   ${fmt(USDC_PILE - DAILY_COMMITTED - LADDER_TOTAL)}`);
console.log(`\nShallowest rung ${fmt(56500)} is ${(((SPOT - 56500) / SPOT) * 100).toFixed(0)}% below spot.\n`);

for (const o of OPTIONS) {
  const ladder = shaveLadder(o.moved);
  const dailyRate = DAILY_BASE + o.moved / days;
  const ladderLeft = ladder.reduce((s, t) => s + t.target, 0);

  console.log("═".repeat(74));
  console.log(`${o.key} — ${o.name}   (${fmt(o.moved)} moved from ladder to daily rate)`);
  console.log(`    ${o.note}`);
  console.log(`    Daily rate through Dec 31 : $${dailyRate.toFixed(0)}/day  (vs $${DAILY_BASE} today)`);
  console.log(`    Capital still reserved    : ${fmt(ladderLeft)} across ${ladder.map((t) => t.tier).join(", ") || "nothing"}`);

  const bear = bearBranch(ladder, dailyRate, 55000);
  console.log(`\n    BEAR — Cowen base case, BTC works down to ${fmt(55000)}`);
  console.log(`      tiers fired      ${bear.fired.join(", ") || "none"}  →  ${fmt(bear.ladderUsd)} = ${btcFmt(bear.ladderBtc)}`);
  console.log(`      daily leg        ${fmt(bear.dailyUsd)} @ avg ${fmt(bear.dailyAvgPx)} = ${btcFmt(bear.dailyBtc)}`);
  console.log(`      TOTAL DEPLOYED   ${fmt(bear.totalUsd)}  →  ${btcFmt(bear.totalBtc)}  @ avg entry ${fmt(bear.avgEntry)}`);
  console.log(`      still undeployed ${fmt(bear.undeployed)}`);

  const bull = bullBranch(ladder, dailyRate, 88000);
  console.log(`\n    BULL — 50W MA breaks with a higher high; no rung is revisited`);
  console.log(`      assumed avg price over the window ${fmt(88000)}`);
  console.log(`      daily leg        ${fmt(bull.dailyUsd)} = ${btcFmt(bull.dailyBtc)} @ ${fmt(bull.avgEntry)}`);
  console.log(`      TOTAL DEPLOYED   ${fmt(bull.totalUsd)}  →  ${btcFmt(bull.totalBtc)}`);
  console.log(`      still undeployed ${fmt(bull.undeployed)}  (${((bull.undeployed / USDC_PILE) * 100).toFixed(0)}% of the pile)`);

  const bullSpot = bullBranch(ladder, dailyRate, SPOT);
  console.log(`      [sensitivity] if it instead averages ${fmt(SPOT)}: ${btcFmt(bullSpot.dailyBtc)}`);
  console.log();
}

console.log("═".repeat(74));
console.log("\nWHAT EACH ONE GIVES UP");
console.log("  A  If the 50W MA breaks upward, ~" + fmt(LADDER_TOTAL) + " never deploys this year.");
console.log("     You keep every deep rung, so a flush to $38-48K is fully funded.");
console.log("  B  Buys back some bull-branch participation. Costs the $38-50K tranche:");
console.log("     if BTC does wick that low you have " + fmt(20000) + " less aimed at it.");
console.log("  C  Roughly doubles what deploys in the bull branch. Costs the whole");
console.log("     sub-$50K ladder plus half of T3b — a deep flush is largely unfunded.");
console.log("\nAll three leave the bank leg alone. None of them change BUY_PLAN.dcaSchedule.");
console.log("Nothing here is advice; the price paths are assumptions, printed above.\n");
