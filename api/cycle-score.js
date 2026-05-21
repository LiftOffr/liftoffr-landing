// LiftOffr Score — V7-weighted composite cycle indicator, 0-100.
//
// Pulls CBBI's latest.json (free, daily-updated) and applies LiftOffr's
// strategy weights. Each component is already 0-100 normalized by CBBI.
//
// Response: { score, components: {...}, asOf, trend, zone, commentary }
// Cached at edge for 1 hr.

export const config = { runtime: "nodejs" };

const CBBI_URL = "https://colintalkscrypto.com/cbbi/data/latest.json";

// V7 strategy weights — RHODL/Puell/Trolololo are LiftOffr's primary signals,
// others get smaller weight as supporting evidence.
const WEIGHTS = {
  RHODL:       0.20,
  Puell:       0.20,
  Trolololo:   0.15,
  MVRV:        0.15,
  PiCycle:     0.10,
  "2YMA":      0.05,
  ReserveRisk: 0.05,
  Woobull:     0.05,
  RUPL:        0.05,
};
// (Confidence is CBBI's own composite — we report alongside as reference.)

function latestEntry(series) {
  if (!series || typeof series !== "object") return null;
  const keys = Object.keys(series).sort((a, b) => Number(b) - Number(a));
  if (!keys.length) return null;
  return { ts: Number(keys[0]), value: Number(series[keys[0]]) };
}

function zone(score) {
  if (score >= 85) return "exit";
  if (score >= 70) return "warning";
  if (score >= 30) return "neutral";
  if (score >= 15) return "accumulation";
  return "deep-accumulation";
}

function commentary(score, trendDir) {
  if (score >= 85) return "Cycle top zone. Historic peaks land here. Tier-A V7 exits warranted.";
  if (score >= 70) return "Warning band. Confluence building. Watch for V7 trigger fires.";
  if (score >= 50) return "Mid-cycle. No exit signal yet — let it run.";
  if (score >= 30) return "Recovery / re-accumulation phase. Continue weekly DCA.";
  if (score >= 15) return "Accumulation zone. Capitulation amplifier window may open.";
  return "Deep accumulation. Historically the best risk-reward window in a cycle.";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const r = await fetch(CBBI_URL, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      return res.status(502).json({ error: `CBBI upstream ${r.status}` });
    }
    const data = await r.json();

    const components = {};
    let weightedSum = 0;
    let weightUsed = 0;
    let asOfTs = 0;

    for (const [name, weight] of Object.entries(WEIGHTS)) {
      const e = latestEntry(data[name]);
      if (!e || !isFinite(e.value)) continue;
      // CBBI components are already on a 0-1 scale (0.00 to 1.00). Multiply by 100.
      const v100 = Math.max(0, Math.min(100, e.value * 100));
      components[name] = { value: Math.round(v100 * 10) / 10, weight, asOf: e.ts };
      weightedSum += v100 * weight;
      weightUsed += weight;
      if (e.ts > asOfTs) asOfTs = e.ts;
    }

    // Also expose CBBI's own composite for reference
    const conf = latestEntry(data.Confidence);
    if (conf) components._cbbi_confidence = { value: Math.round(conf.value * 100 * 10) / 10, asOf: conf.ts };

    const price = latestEntry(data.Price);
    if (price) components._btc_price = { value: Math.round(price.value), asOf: price.ts };

    if (weightUsed === 0) {
      return res.status(502).json({ error: "No CBBI components parsed" });
    }

    const score = Math.round((weightedSum / weightUsed) * 10) / 10;

    // Compute 7-day trend (compare to value ~7 days back, using RHODL as proxy)
    let trend = "flat";
    let trendDelta = 0;
    try {
      const rhodlSeries = data.RHODL || {};
      const keys = Object.keys(rhodlSeries).sort((a, b) => Number(b) - Number(a));
      const dayAgoIdx = Math.min(7, keys.length - 1);
      const cur = Number(rhodlSeries[keys[0]]);
      const past = Number(rhodlSeries[keys[dayAgoIdx]]);
      const delta = (cur - past) * 100;
      trendDelta = Math.round(delta * 10) / 10;
      if (delta > 0.5) trend = "rising";
      else if (delta < -0.5) trend = "falling";
    } catch (_) {}

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({
      score,
      zone: zone(score),
      trend,
      trendDelta7d: trendDelta,
      commentary: commentary(score, trend),
      components,
      asOf: new Date(asOfTs * 1000).toISOString(),
      source: "CBBI components, V7-weighted",
    });
  } catch (err) {
    console.error("cycle-score error", err);
    return res.status(500).json({ error: err.message });
  }
}
