// ═══════════════════════════════════════════════════════════════════════════
// PROPOSED — NOT WIRED IN. Nothing imports this file.
//
// This is the risk-metric-weighted alternative to the calendar-tilted DCA, put
// next to the live schedule so the two can be compared rather than argued about.
// To adopt it you would change ONE line in api/cron-weekly-score.js (shown at the
// bottom). Until then it is inert: BUY_PLAN.dcaSchedule remains the only thing
// that decides what gets bought.
//
// THE ARGUMENT FOR IT
//   The published schedule tilts on DATES: $50/day until Aug 31, $110/day from
//   Sept 1, $50/day from Jan 1. Those dates encode a forecast about when the
//   capitulation window falls. If the forecast is early or late, the ramp is in
//   the wrong place and the calendar has no way to find out.
//   A risk-weighted leg tilts on the market's own position in the cycle instead,
//   so it spends more when the composite says cheap and less when it says rich,
//   whenever that happens to be.
//
// THE ARGUMENT AGAINST IT
//   It hands the size of the daily buy to an upstream feed. CBBI is a third-party
//   composite that can restate, stall, or go offline, and a stale 0.9 would quietly
//   throttle the leg to its floor. Hence NEUTRAL_FALLBACK and the hard clamps.
//   The calendar version, whatever else is wrong with it, cannot be moved by
//   someone else's server.
// ═══════════════════════════════════════════════════════════════════════════

import { dcaForDate } from "./_buy-plan.js";

export const RISK_NEUTRAL = 0.50;   // at this risk reading, spend exactly the scheduled amount
export const WEIGHT_MIN   = 0.25;   // never throttle below a quarter of schedule
export const WEIGHT_MAX   = 2.00;   // never more than double it
export const NEUTRAL_FALLBACK = 1.0;

// Linear in risk, centred so that weight(0.5) === 1.0.
//   risk 0.00 → 2.00x     risk 0.44 → 1.12x  (today)
//   risk 0.25 → 1.50x     risk 0.75 → 0.50x
//   risk 0.50 → 1.00x     risk 1.00 → 0.25x  (clamped from 0.00)
//
// Budget property worth knowing: if risk averages RISK_NEUTRAL across the
// window, total spend equals the calendar plan exactly. The weighting changes
// WHEN money is spent, not HOW MUCH — unless the cycle genuinely spends the
// window on one side of neutral, which is the entire point.
export function riskWeight(risk) {
  if (!Number.isFinite(risk) || risk < 0 || risk > 1) return NEUTRAL_FALLBACK;
  const raw = 1 + (RISK_NEUTRAL - risk) * 2;
  return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, raw));
}

// Staleness guard: a frozen feed must degrade to the calendar amount, not to a
// number the market stopped confirming days ago.
export const MAX_RISK_AGE_DAYS = 3;

export function riskWeightedDca(iso, { risk = null, riskAsOf = null } = {}) {
  const scheduled = dcaForDate(iso);
  let weight = NEUTRAL_FALLBACK;
  let reason = "no risk reading — using calendar amount";

  if (Number.isFinite(risk)) {
    const ageDays = riskAsOf
      ? Math.round((Date.parse(iso + "T00:00:00Z") - Date.parse(riskAsOf + "T00:00:00Z")) / 864e5)
      : 0;
    if (ageDays > MAX_RISK_AGE_DAYS) {
      reason = `risk reading ${ageDays}d stale — using calendar amount`;
    } else {
      weight = riskWeight(risk);
      reason = `risk ${risk.toFixed(3)} → ${weight.toFixed(2)}x`;
    }
  }

  // Only the USDC leg is ours to size. The bank leg is a recurring buy inside
  // the Coinbase app; the cron cannot change it, so weighting it would only make
  // the reconciliation report a divergence that is not real.
  return {
    usdc: Math.round(scheduled.usdc * weight * 100) / 100,
    bank: scheduled.bank,
    weight,
    reason,
  };
}

// ── THE DIFF, IF ADOPTED ───────────────────────────────────────────────────
//
// api/cron-weekly-score.js, inside runDailyDCA():
//
// -  const { usdc: usdcAmount } = dcaForToday(dateIso);
// +  const risk = await fetchCbbiRisk(baseUrl).catch(() => ({}));   // { value, asOf }
// +  const { usdc: usdcAmount, weight, reason } =
// +    riskWeightedDca(dateIso, { risk: risk.value, riskAsOf: risk.asOf });
//
// and carry `weight`/`reason` into the Discord line so every buy states why it
// was that size.
//
// Note the interaction with the existing safety rail: placeMarketBuy() caps a
// single order at DCA_MAX_QUOTE_SIZE ($250). At the Phase 2 rate of $110/day a
// 2.00x weight is $220, which fits — but only just. Raise the schedule above
// $125/day and the cap starts silently clipping the weighting. If this is
// adopted, that cap needs to move with it, deliberately.

// ═══════════════════════════════════════════════════════════════════════════
// SPLIT-ORDER + HORIZON NORMALISATION (added 2026-09-12) — still inert.
//
// Two things the calendar version could not do, now expressible because the
// daily buy may be placed as several sub-$250 orders:
//   1. splitIntoOrders() — turn a daily USDC amount into N orders each <= the
//      per-order cap, summing EXACTLY to the amount (last order takes rounding).
//   2. horizonRiskWeightedDca() — size the daily buy from what is LEFT of the
//      stack over the days LEFT to the horizon, then tilt by the risk metric.
//      Because the base is (stack - spent) / remaining-days recomputed daily, the
//      stack lands on the horizon date whatever path risk takes — it changes WHEN
//      inside the window, not WHETHER it finishes on time. This is the
//      "average to the implied rate / don't drift" property, made exact.
// ═══════════════════════════════════════════════════════════════════════════

export const PER_ORDER_CAP = 250;      // must match DCA_MAX_QUOTE_SIZE in _buy-plan.js
export const MAX_ORDERS_PER_DAY = 6;   // sanity ceiling; config assertion enforces it

// Split an amount into whole orders each <= cap, summing to the amount to the cent.
export function splitIntoOrders(amountUsdc, cap = PER_ORDER_CAP) {
  const amt = Math.round(Number(amountUsdc) * 100) / 100;
  if (!Number.isFinite(amt) || amt <= 0) return [];
  const n = Math.ceil(amt / cap);
  const base = Math.floor((amt / n) * 100) / 100;   // even split, floored to cents
  const orders = Array(n).fill(base);
  // put the rounding remainder on the last order; it stays <= cap because base<=cap
  orders[n - 1] = Math.round((amt - base * (n - 1)) * 100) / 100;
  return orders;
}

// Horizon/stack-normalised, risk-weighted daily buy.
//   stackUsdc     total USDC earmarked for the daily leg (Torin's figure)
//   spentUsdc     cumulative USDC the daily leg has already placed
//   todayIso      YYYY-MM-DD
//   horizonEnd    YYYY-MM-DD (inclusive) — the "land it by" date
//   risk/riskAsOf CBBI Confidence and the date it was read (staleness guard)
export function horizonRiskWeightedDca(todayIso, {
  stackUsdc, spentUsdc = 0, horizonEnd, risk = null, riskAsOf = null,
} = {}) {
  const remaining = Math.max(0, Number(stackUsdc) - Number(spentUsdc));
  const dayMs = 864e5;
  const daysLeft = Math.max(1, Math.round((Date.parse(horizonEnd + "T00:00:00Z") - Date.parse(todayIso + "T00:00:00Z")) / dayMs) + 1);
  const base = remaining / daysLeft;

  let weight = NEUTRAL_FALLBACK, reason = "no risk reading — using flat remaining/day";
  if (Number.isFinite(risk)) {
    const ageDays = riskAsOf ? Math.round((Date.parse(todayIso + "T00:00:00Z") - Date.parse(riskAsOf + "T00:00:00Z")) / dayMs) : 0;
    if (ageDays > MAX_RISK_AGE_DAYS) reason = `risk ${ageDays}d stale — using flat remaining/day`;
    else { weight = riskWeight(risk); reason = `risk ${risk.toFixed(3)} x weight ${weight.toFixed(2)} on $${base.toFixed(0)} base`; }
  }
  // Never let one day spend more than what is left.
  const daily = Math.min(remaining, Math.round(base * weight * 100) / 100);
  const orders = splitIntoOrders(daily);
  return { usdc: daily, orders, orderCount: orders.length, base: Math.round(base * 100) / 100, weight, reason, remaining, daysLeft };
}
