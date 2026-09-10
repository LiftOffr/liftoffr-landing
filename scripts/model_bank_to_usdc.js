#!/usr/bin/env node
// Bank-leg-down / USDC-leg-up allocation shapes, per Torin's stated preference:
// "more money from my usdc stack and less from the bank reoccuring buy, but it
// all needs to align with cowen and all the buys we've missed".
//
//   node scripts/model_bank_to_usdc.js
//
// Companion to model_usdc_split.js, which models shaving the LADDER into the
// daily rate. This one models shifting the BANK LEG onto the USDC stack.
//
// Not a recommendation and not a forecast. Every price path is a STATED
// ASSUMPTION printed next to its result. Torin decides; this file multiplies.
//
// ─────────────────────────────────────────────────────────────────────────────
// READ THIS BEFORE THE NUMBERS — it is the whole finding
// ─────────────────────────────────────────────────────────────────────────────
// A first draft of this file reported BTC accumulated on the USDC leg only, and
// it made V0/V1/V2 look like three different outcomes. They are not. At a fixed
// COMBINED daily rate, moving money from the bank leg to the USDC leg buys the
// EXACT SAME Bitcoin at the EXACT SAME average price. $60 bank + $110 USDC and
// $0 bank + $170 USDC are the same $170 of BTC per day. The only thing that
// changes is which account pays — and therefore how fast a finite pile drains.
//
// So the split decision and the rate decision are two different decisions:
//
//   SPLIT (V0 → V1 → V2)  changes WHO PAYS. Zero effect on BTC accumulated.
//                         Cost: the stack depletes faster. Benefit: no reliance
//                         on remembering to update a recurring buy by hand.
//   RATE  (V2 → V4)       changes HOW MUCH BTC. This is the only lever that
//                         actually accumulates more. Cost: the stack depletes
//                         faster still, and $250/day is a hard ceiling.
//   TIMING (V3)           changes WHEN. Only lever that can beat the others on
//                         average entry, and only if the timing is right.
//
// Every BTC and average-entry figure below therefore counts BOTH LEGS.
// ─────────────────────────────────────────────────────────────────────────────

const TODAY     = "2026-09-10";
const HORIZON   = "2026-12-31";   // BUY_PLAN phase 2 ends here
const SPOT      = 78389;          // Coinbase BTC-USD spot, 2026-09-10
const MA50W     = 80243;          // Cowen's bull/bear line. spot/50W = 0.977
const MA200W    = 64980;

// Cowen's stated bottom window, from the transcript archive (api/_cowen-data.js):
// 2026-08-10 "late August through October, with October viewed as the most
// likely month"; 2026-08-13 "mid-to-late October ... potentially into November";
// 2026-08-30 "in the last three cycles the low did not form until after the
// midterm election". US midterms are 2026-11-03.
const WINDOW_START = "2026-10-20";
const WINDOW_END   = "2026-11-10";

const USDC_PILE = 74498.31;       // REAL balance, read from the Coinbase app 2026-09-10.
                                  // Supersedes the ~$82,000 inferred from the weekly-rewards
                                  // series, which was ~$7.5k too high. The inference method
                                  // landed at the very bottom edge of its own stated range.
const PILE_LO   = 74498.31;
const PILE_HI   = 74498.31;

const CAP = 250;                  // DCA_MAX_QUOTE_SIZE in api/cron-weekly-score.js.
                                  // placeMarketBuy THROWS above this — it does not clip.

// Missed daily DCA 2026-05-28 → 2026-09-09.
// NOTE: only the USDC portion is a claim on the stack. The $180 bank portion is
// income-funded, so charging all $5,970 to the stack overstates the draw.
const MISSED_USDC  = 5790;
const MISSED_BANK  = 180;
const MISSED_GROSS = MISSED_USDC + MISSED_BANK;   // 5970

const BANK_NOW = 40;              // what the Coinbase recurring buy actually reads today

const d = (s) => Date.parse(s + "T00:00:00Z");
const days = Math.round((d(HORIZON) - d(TODAY)) / 864e5) + 1;
const windowDays = Math.round((d(WINDOW_END) - d(WINDOW_START)) / 864e5) + 1;
const dateAfter = (n) => new Date(d(TODAY) + n * 864e5).toISOString().slice(0, 10);

// Open ladder after the waterfall. IMMEDIATE/T1/T2 are filled ($58,000) and
// T3a is partially filled ($2,606). Triggers are the post-fix effective
// triggers from _buy-plan.js + accepted Cowen clusters.
const LADDER = [
  { tier: "T3b", open: 20600, trigger: 56500 },
  { tier: "T3a", open: 17994, trigger: 55000 },
  { tier: "T4a", open: 10000, trigger: 50000 },
  { tier: "T4b", open: 10000, trigger: 48000 },
  { tier: "T5a", open:  4000, trigger: 40000 },
  { tier: "T5b", open:  4000, trigger: 38000 },
];
const LADDER_OPEN = LADDER.reduce((s, t) => s + t.open, 0);   // 66,594

const BEAR_FLOOR   = 55000;
const BEAR_DAILYPX = (SPOT + BEAR_FLOOR) / 2;   // straight-line walk assumption
const BULL_AVGPX   = 88000;
const WINDOW_PX_BEAR = 57000;   // between T3b ($56.5k) and T3a ($55k)

const fmt  = (n) => "$" + Math.round(n).toLocaleString();
const btcF = (n) => n.toFixed(4) + " BTC";
const inWindow = (iso) => iso >= WINDOW_START && iso <= WINDOW_END;

// ── versions ────────────────────────────────────────────────────────────────
// usdc/bank are functions of the day index so V3 can shape itself.
const VERSIONS = [
  { key: "V0", name: "PLAN AS WRITTEN", combined: 170,
    bank: () => 60, usdc: () => 110,
    note: "Baseline. Needs the Coinbase recurring buy raised $40 → $60 by hand." },
  { key: "V1", name: "TRIM", combined: 170,
    bank: () => 20, usdc: () => 150,
    note: "Recurring buy cut $40 → $20. Same BTC as V0; more of it paid from the stack." },
  { key: "V2", name: "SHIFT", combined: 170,
    bank: () => 0, usdc: () => 170,
    note: "Recurring buy cancelled. Same BTC as V0; all of it paid from the stack." },
  { key: "V4", name: "LIFT", combined: 250, capTarget: true,
    bank: () => 0, usdc: (i, c) => CAP - c,
    note: "Recurring buy cancelled, USDC leg run at the $250 cap. The only version\n" +
          "     here that actually buys more BTC. Also the fastest drain." },
  { key: "V3", name: "WINDOW", combined: null, windowed: true, capTarget: true,
    bank: () => 0,
    usdc: (i, c) => (inWindow(dateAfter(i)) ? CAP - c : 110),
    note: "Recurring buy cancelled. USDC held at $110 while BTC is 0.98x the 50W,\n" +
          "     then run at the $250 cap through Cowen's window." },
];

// Catch-up modes. All versions are run through all three so the comparison is
// clean — an earlier draft ran V3 in one mode and its rivals in another, which
// handed V3 the result twice.
const MODES = [
  { key: "SPREAD",      label: `${fmt(MISSED_GROSS)} added evenly across the ${days} remaining days` },
  { key: "LUMP-NOW",    label: `${fmt(MISSED_GROSS)} in one manual order today at spot` },
  { key: "LUMP-WINDOW", label: `${fmt(MISSED_GROSS)} held back, executed manually inside Cowen's window` },
];

console.log(`\nBTC ${fmt(SPOT)}  ·  50W MA ${fmt(MA50W)} (spot = ${(SPOT / MA50W).toFixed(3)}x)  ·  200W MA ${fmt(MA200W)}`);
console.log(`Horizon ${TODAY} → ${HORIZON} = ${days} days · Cowen window ${WINDOW_START} → ${WINDOW_END} = ${windowDays} days`);
console.log(`USDC stack ${fmt(USDC_PILE)} (REAL, read from the Coinbase app 2026-09-10)`);
console.log(`Open ladder ${fmt(LADDER_OPEN)} = ${fmt(69200)} gross less ${fmt(2606)} already filled into T3a`);
console.log(`Shallowest rung ${fmt(56500)} = ${(((SPOT - 56500) / SPOT) * 100).toFixed(0)}% below spot`);
console.log(`Missed DCA ${fmt(MISSED_GROSS)} = ${fmt(MISSED_USDC)} USDC leg (claim on the stack) + ${fmt(MISSED_BANK)} bank leg (income)`);
console.log(`Per-order cap ${fmt(CAP)} — placeMarketBuy THROWS above it, it does not clip\n`);

const rows = [];

for (const mode of MODES) {
  console.log("#".repeat(80));
  console.log(`CATCH-UP: ${mode.key}  —  ${mode.label}`);
  console.log("#".repeat(80));

  for (const v of VERSIONS) {
    const perDayCatch = mode.key === "SPREAD" ? MISSED_GROSS / days : 0;
    const usdcDaily = Array.from({ length: days }, (_, i) => v.usdc(i, perDayCatch) + perDayCatch);
    const bankDaily = Array.from({ length: days }, (_, i) => v.bank(i));
    const usdcSum = usdcDaily.reduce((a, b) => a + b, 0);
    const bankSum = bankDaily.reduce((a, b) => a + b, 0);
    const peak = Math.max(...usdcDaily);
    const over = peak > CAP;

    // Lump handling. Only the USDC share is a claim on the stack.
    const lumpUsd    = mode.key === "SPREAD" ? 0 : MISSED_GROSS;
    const lumpOnStack = mode.key === "SPREAD" ? 0 : MISSED_USDC;
    const lumpPxBear = mode.key === "LUMP-WINDOW" ? WINDOW_PX_BEAR : SPOT;
    const lumpPxBull = mode.key === "LUMP-WINDOW" ? BULL_AVGPX     : SPOT;

    // Stack accounting. SPREAD charges MISSED_USDC/days of the daily rate to
    // the stack; the bank share of the spread is notionally income, but it is
    // being paid out of USDC in every version where bank < plan, so charge it.
    const stackDraw = usdcSum + lumpOnStack;
    const committed = stackDraw + LADDER_OPEN;

    // Depletion by CUMULATIVE SIMULATION, not by average rate. V3 is front-
    // loaded into the window, so an average-rate estimate understates how early
    // it exhausts its free float — by 8 days, landing inside the window.
    const freeFloat = USDC_PILE - LADDER_OPEN - lumpOnStack;
    let run = 0, breachDay = null, dryDay = null;
    for (let i = 0; i < 3650; i++) {
      run += usdcDaily[Math.min(i, days - 1)];
      if (breachDay === null && run > freeFloat) breachDay = i;
      if (dryDay === null && run > USDC_PILE - lumpOnStack) { dryDay = i; break; }
    }

    // Branch outcomes — BOTH LEGS counted.
    const dailyTotal = usdcSum + bankSum;
    const firedRungs = LADDER.filter((t) => t.trigger >= BEAR_FLOOR);
    const rungUsd = firedRungs.reduce((s, t) => s + t.open, 0);
    const rungBtc = firedRungs.reduce((s, t) => s + t.open / t.trigger, 0);

    const bearBtc = rungBtc + dailyTotal / BEAR_DAILYPX + lumpUsd / lumpPxBear;
    const bearUsd = rungUsd + dailyTotal + lumpUsd;
    const bullBtc = dailyTotal / BULL_AVGPX + lumpUsd / lumpPxBull;
    const bullUsd = dailyTotal + lumpUsd;

    console.log("═".repeat(80));
    console.log(`${v.key} — ${v.name}`);
    console.log(`    ${v.note}`);
    console.log(`    bank ${v.windowed || v.combined === null ? "$0" : "$" + v.bank(0)}/day` +
      `   ·   USDC ${v.windowed ? `$110 / $${CAP} in-window` : "$" + Math.round(v.usdc(0, perDayCatch) + perDayCatch)}/day` +
      (perDayCatch ? (v.capTarget ? ` (catch-up absorbed under the cap)` : ` incl. $${perDayCatch.toFixed(2)} catch-up`) : "") +
      `   ·   peak order ${fmt(peak)} ${over ? `⛔ OVER CAP — those days buy NOTHING` : "✓"}`);
    console.log(`    deployed over the horizon: ${fmt(dailyTotal + lumpUsd)}  ` +
      `(stack ${fmt(stackDraw)} · bank/income ${fmt(bankSum)})`);
    console.log(`    claim on the stack incl. full ladder ${fmt(committed)} vs ${fmt(USDC_PILE)}` +
      (committed > USDC_PILE ? `  ⛔ SHORT ${fmt(committed - USDC_PILE)}` : `  ✓ spare ${fmt(USDC_PILE - committed)}`));
    console.log(`    free float above the ladder reserve ${fmt(Math.max(0, freeFloat))}`);
    console.log(`    → starts eating ladder money ${breachDay !== null ? dateAfter(breachDay) : "never"}` +
      (breachDay !== null && inWindow(dateAfter(breachDay)) ? "  ⚠ INSIDE Cowen's window" : "") +
      `   ·   stack dry ${dryDay !== null ? dateAfter(dryDay) : "beyond 10y"}`);
    console.log(`    BEAR (walk to ${fmt(BEAR_FLOOR)}): ${fmt(bearUsd)} → ${btcF(bearBtc)} @ ${fmt(bearUsd / bearBtc)}`);
    console.log(`    BULL (avg ${fmt(BULL_AVGPX)}, no rung fires): ${fmt(bullUsd)} → ${btcF(bullBtc)} @ ${fmt(bullUsd / bullBtc)}\n`);

    rows.push({ mode: mode.key, key: v.key, bearBtc, bearEntry: bearUsd / bearBtc,
                bullBtc, stackDraw, breach: breachDay !== null ? dateAfter(breachDay) : "-", over });
  }
}

// ── the comparison that matters ─────────────────────────────────────────────
console.log("═".repeat(80));
console.log("\nBEAR-BRANCH BTC, BOTH LEGS COUNTED — this is the apples-to-apples table\n");
console.log("  mode          " + VERSIONS.map((v) => v.key.padStart(9)).join(""));
for (const m of MODES) {
  const r = VERSIONS.map((v) => {
    const x = rows.find((z) => z.mode === m.key && z.key === v.key);
    return x.bearBtc.toFixed(4).padStart(9);
  }).join("");
  console.log("  " + m.key.padEnd(14) + r);
}
console.log("\n  Read the V0/V1/V2 columns across: identical, to four decimals, in every");
console.log("  mode. That is not a rounding coincidence — they deploy the same $170/day.");
console.log("  The split decision does not accumulate Bitcoin. It only decides who pays.\n");

console.log("BEAR-BRANCH AVERAGE ENTRY\n");
console.log("  mode          " + VERSIONS.map((v) => v.key.padStart(9)).join(""));
for (const m of MODES) {
  const r = VERSIONS.map((v) => {
    const x = rows.find((z) => z.mode === m.key && z.key === v.key);
    return ("$" + Math.round(x.bearEntry).toLocaleString()).padStart(9);
  }).join("");
  console.log("  " + m.key.padEnd(14) + r);
}

console.log("\nDRAW ON THE FINITE STACK (the cost of shifting)\n");
console.log("  mode          " + VERSIONS.map((v) => v.key.padStart(9)).join(""));
for (const m of MODES) {
  const r = VERSIONS.map((v) => {
    const x = rows.find((z) => z.mode === m.key && z.key === v.key);
    return ("$" + Math.round(x.stackDraw / 1000) + "k").padStart(9);
  }).join("");
  console.log("  " + m.key.padEnd(14) + r);
}

console.log(`
${"═".repeat(80)}

NOTES THAT TRAVEL WITH THESE NUMBERS

  · V0, V1 and V2 buy the same Bitcoin. Choosing between them is choosing how
    much of a NON-RENEWING pile to spend in place of renewable income, and
    whether you trust yourself to keep a manual recurring buy in step with the
    schedule. It is an operational choice, not an accumulation one.

  · V4 is the only version that accumulates more, because it is the only one
    that raises the combined rate. It draws ${fmt(CAP * days)} from the stack over the
    horizon and it is capped — $250/day is the ceiling, so this is the most the
    cron can ever deploy.

  · V3's advantage, where it has one, is a TIMING assumption: that the catch-up
    lump gets executed near ${fmt(WINDOW_PX_BEAR)}. Priced at spot like every other
    version's lump, V3's edge over V2 largely disappears. The LUMP-NOW and
    LUMP-WINDOW rows are printed side by side so that assumption is visible
    rather than buried.

  · The bank leg CANNOT be automated from this repo. placeV2Buy() and
    findBankPaymentMethodId() exist in cron-weekly-score.js but nothing calls
    them — the v2 buys endpoint 404s under CDP/JWT auth. Changing the bank leg
    means editing the recurring buy in the Coinbase app, by hand. That is the
    same manual step that has now slipped twice.

  · $250 is a PER-ORDER cap and there is one order a day, so it is effectively a
    $250/day ceiling. Above it placeMarketBuy throws and that day buys nothing
    at all — it does not clip to $250. A ${fmt(MISSED_GROSS)} lump cannot go through the
    cron; it is a manual Advanced Trade order either way.

  · Every version is short against the stack once the full ladder is counted at
    face value. The model does not resolve that — it does not decide whether
    rungs get truncated or the daily leg stops. That is a real unresolved
    conflict, not a rounding issue, and it is why the shortfall line is printed.

  · Straight-line price paths. A path that hovers near spot until December and
    then drops buys far less BTC than the bear column shows.
`);
