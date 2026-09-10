// Single source of truth for the buy plan ladder + DCA schedule.
//
// Underscore prefix = not a Vercel function (stays under the 12-function Hobby cap),
// same convention as _cowen-data.js.
//
// WHY THIS FILE EXISTS
// --------------------
// This config used to be copy-pasted into api/cron-weekly-score.js with a comment
// reading "Mirror of dashboard PLAN config — keep in sync". It drifted, and the
// drift was expensive: api/btc-price.js separately hardcoded the tier slot names
// as ["T2","T3","T4","T5"], but the ladder had since been sub-divided into
// T3a/T3b/T4a/T4b/T5a/T5b. Every lookup of cowenTiers["T3"] returned undefined,
// so three of the four aggregated Cowen price clusters were silently discarded,
// and the one that *did* match (T2) matched the wrong thing — see COWEN_SLOT below.
//
// Anything that needs tier names must import them from here. Do not retype them.
//
// NOTE ON DOLLAR AMOUNTS: dcaSchedule amounts and tier targets are Torin's capital
// allocation. They are his to change, not the code's. Treat them as fixed input.

// Tiers whose trigger price may be overridden by the aggregated Cowen transcript
// levels. IMMEDIATE is a market order (no trigger) and T1 is a structural
// bear-band-fail trigger Cowen does not quote a number for, so neither is eligible.
export const COWEN_SLOT_TIERS = ["T2", "T3a", "T3b", "T4a", "T4b", "T5a", "T5b"];

export const BUY_PLAN = {
  totalBudget: 165182,
  // DCA leg amounts are date-tilted, not flat — see dcaSchedule + dcaForToday().
  // Only the USDC leg (v3 Advanced Trade) is API-automated; the bank leg is a
  // Coinbase-UI recurring buy Torin has to update by hand at each tilt date.
  dcaSchedule: [
    { start: "2026-05-28", end: "2026-08-31", usdc: 50,  bank: 40 },  // Phase 1 remainder — Cowen's flagged rally-trap, taper down
    { start: "2026-09-01", end: "2026-12-31", usdc: 110, bank: 60 },  // Phase 2 — capitulation window, ramp up (USDC carries it, bank stays light)
    { start: "2027-01-01", end: "2027-03-31", usdc: 50,  bank: 40 },  // Phase 3 — post-bottom, taper back down
  ],
  tiers: [
    { tier: "IMMEDIATE", target: 15000, maMultiple: null, targetPrice: 73000, fallbackDate: "2026-05-28", trigger: "Market today — Cowen-wrong hedge" },
    { tier: "T1",        target: 15000, maMultiple: 1.10, fallbackDate: "2026-07-31", trigger: "Bear-band fail follow-through" },
    { tier: "T2",        target: 28000, maMultiple: 0.97, fallbackDate: "2026-09-30", trigger: "2015-style touch + reclaim (Cowen base case)" },
    // T3-T5 sub-laddered into upper/lower tranches per the bottom-projection probability bands
    // (realized-price band 40%, wick-below band 25%, balance-price tail 12%) instead of one lump per tier.
    { tier: "T3a", target: 20600, targetPrice: 55000, fallbackDate: "2026-11-30", trigger: "Realized-price band, upper half ~$55K (40% bottom-odds band)" },
    { tier: "T3b", target: 20600, targetPrice: 52500, fallbackDate: "2026-11-30", trigger: "Realized-price band, lower half ~$52.5K (40% bottom-odds band)" },
    { tier: "T4a", target: 10000, targetPrice: 50500, fallbackDate: "2027-01-31", trigger: "Wick-below-realized, upper half ~$50.5K (25% band)" },
    { tier: "T4b", target: 10000, targetPrice: 48000, fallbackDate: "2027-01-31", trigger: "Wick-below-realized, lower half ~$48K (25% band)" },
    { tier: "T5a", target: 4000,  targetPrice: 40000, fallbackDate: "2027-03-31", trigger: "Balance-price flush, upper half ~$40K (12% tail band)" },
    { tier: "T5b", target: 4000,  targetPrice: 38000, fallbackDate: "2027-03-31", trigger: "Balance-price flush, lower half ~$38K (12% tail band)" },
  ],
};

// Guard: if a tier is renamed and COWEN_SLOT_TIERS is not updated, fail at import
// time rather than silently returning undefined at lookup time — which is exactly
// how the T3/T3a bug survived unnoticed.
{
  const known = new Set(BUY_PLAN.tiers.map((t) => t.tier));
  const orphans = COWEN_SLOT_TIERS.filter((n) => !known.has(n));
  if (orphans.length) {
    throw new Error(
      `_buy-plan.js: COWEN_SLOT_TIERS names no longer in BUY_PLAN.tiers: ${orphans.join(", ")}`
    );
  }
}

export function dcaForToday(nowIso) {
  const iso = nowIso || new Date().toISOString().slice(0, 10);
  return (
    BUY_PLAN.dcaSchedule.find((s) => iso >= s.start && iso <= s.end) ||
    BUY_PLAN.dcaSchedule[BUY_PLAN.dcaSchedule.length - 1]
  );
}

// Scheduled leg amounts for an arbitrary date. Returns zeros outside the plan
// window rather than clamping to the last phase — reconciliation must not invent
// intent for days the plan does not cover.
export function dcaForDate(iso) {
  const s = BUY_PLAN.dcaSchedule.find((p) => iso >= p.start && iso <= p.end);
  return s ? { usdc: s.usdc, bank: s.bank } : { usdc: 0, bank: 0 };
}

export const PLAN_START = BUY_PLAN.dcaSchedule[0].start;

// Maximum disagreement between a tier's own trigger and an aggregated Cowen
// cluster before the cluster is ignored.
export const COWEN_AGREEMENT_TOLERANCE = 0.10;

// The one place that decides what price a tier actually triggers at.
//
// Two bugs are fixed here relative to the logic this replaces:
//
//  1. The old rule was `if (cow && ma) {agreement check} else if (cow) {take cow}`.
//     The second branch had NO agreement check, so for every tier without a
//     maMultiple — T3a through T5b, six of the nine rungs — any Cowen number that
//     matched by name would override the tier's own target outright. That branch
//     was unreachable only because the names never matched. Fixing the names
//     without fixing this would have armed it on six tiers at once.
//
//  2. An OVERRIDE may never raise a trigger to or above spot. Note the asymmetry
//     that matters: a tier's OWN base trigger sitting above spot is legitimate —
//     it means price has fallen through that rung and the tier is genuinely hit.
//     What is never legitimate is a scraped level dragging a rung up to meet a
//     price we are currently trading at. Only the override is ceilinged.
export function effectiveTriggerPrice(tier, { ma200w = null, cowenPrice = null, spot = null } = {}) {
  const base = tier.maMultiple && Number.isFinite(ma200w)
    ? ma200w * tier.maMultiple
    : (tier.targetPrice ?? null);
  if (!Number.isFinite(base) || base <= 0) return null;

  const agrees =
    Number.isFinite(cowenPrice) && cowenPrice > 0 &&
    Math.abs(cowenPrice - base) / base <= COWEN_AGREEMENT_TOLERANCE;
  const belowSpot = !Number.isFinite(spot) || spot <= 0 || cowenPrice < spot;

  return agrees && belowSpot ? cowenPrice : base;
}
