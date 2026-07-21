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

// Entry at offset N days back from the newest point (0 = latest).
function entryAt(series, offset) {
  if (!series || typeof series !== "object") return null;
  const keys = Object.keys(series).sort((a, b) => Number(b) - Number(a));
  if (offset >= keys.length) return null;
  return { ts: Number(keys[offset]), value: Number(series[keys[offset]]) };
}

// Weighted score at offset N days back. Returns null if no components parse.
function scoreAt(data, offset) {
  let weightedSum = 0, weightUsed = 0, asOfTs = 0;
  for (const [name, weight] of Object.entries(WEIGHTS)) {
    const e = entryAt(data[name], offset);
    if (!e || !isFinite(e.value)) continue;
    const v100 = Math.max(0, Math.min(100, e.value * 100));
    weightedSum += v100 * weight;
    weightUsed += weight;
    if (e.ts > asOfTs) asOfTs = e.ts;
  }
  if (weightUsed === 0) return null;
  return { score: Math.round((weightedSum / weightUsed) * 10) / 10, ts: asOfTs };
}

const ZONE_COLORS = {
  "exit": "#ef4444",
  "warning": "#f97316",
  "neutral": "#fbbf24",
  "accumulation": "#22c55e",
  "deep-accumulation": "#16a34a",
};
const ZONE_LABELS = {
  "exit": "EXIT ZONE",
  "warning": "WARNING",
  "neutral": "NEUTRAL",
  "accumulation": "ACCUMULATION",
  "deep-accumulation": "DEEP ACCUMULATION",
};

// Shields-style SVG badge: [ LiftOffr Score | 38.0 NEUTRAL ]
function badgeSVG(score, z) {
  const color = ZONE_COLORS[z] || "#999";
  const label = "LiftOffr Score";
  const value = `${score.toFixed(1)} · ${ZONE_LABELS[z] || z}`;
  const lw = 7 * label.length + 22;
  const vw = 7.2 * value.length + 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lw + vw}" height="28" role="img" aria-label="${label}: ${value}">
  <rect width="${lw}" height="28" rx="4" fill="#0b0f17"/>
  <rect x="${lw}" width="${vw}" height="28" rx="4" fill="${color}"/>
  <rect x="${lw}" width="4" height="28" fill="${color}"/>
  <g font-family="Verdana,Geneva,sans-serif" font-size="12" text-anchor="middle">
    <text x="${lw / 2}" y="18.5" fill="#e9eef7">${label}</text>
    <text x="${lw + vw / 2}" y="18.5" fill="#0b0f17" font-weight="bold">${value}</text>
  </g>
</svg>`;
}

// Self-contained embeddable widget (iframe target). Dark glass card, zone-colored
// score, links to liftoffr.com. No external assets — safe to embed anywhere.
function widgetHTML({ score, z, trend, trendDelta7d, asOf }) {
  const color = ZONE_COLORS[z] || "#999";
  const arrow = trend === "rising" ? "▲" : trend === "falling" ? "▼" : "◆";
  const sign = trendDelta7d >= 0 ? "+" : "";
  const dt = asOf ? new Date(asOf).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#060910;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.c{box-sizing:border-box;width:100%;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;text-align:center;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:linear-gradient(158deg,rgba(255,255,255,.055),rgba(255,255,255,.014))}
.e{font-size:9px;font-weight:800;letter-spacing:1.6px;color:#777;text-transform:uppercase;margin-bottom:8px}
.p{display:inline-block;width:6px;height:6px;background:#22c55e;border-radius:50%;margin-right:5px;vertical-align:middle;animation:p 2s infinite}@keyframes p{50%{opacity:.4}}
.n{font-family:ui-monospace,Menlo,monospace;font-size:44px;font-weight:700;letter-spacing:-2px;line-height:1;color:${color}}
.z{margin-top:6px;font-size:10px;font-weight:800;letter-spacing:1.8px;color:${color}}
.t{margin-top:7px;font-family:ui-monospace,Menlo,monospace;font-size:10.5px;color:#888}
a{margin-top:10px;font-size:10px;font-weight:800;color:#e63946;text-decoration:none}</style></head>
<body><div class="c"><div class="e"><span class="p"></span>Live · LiftOffr Score</div>
<div class="n">${score.toFixed(1)}</div><div class="z">${ZONE_LABELS[z] || z}</div>
<div class="t">${arrow} ${sign}${trendDelta7d} · 7d · ${dt}</div>
<a href="https://liftoffr.com/?utm_source=widget&utm_medium=embed&utm_campaign=score_widget" target="_blank" rel="noopener">liftoffr.com →</a></div></body></html>`;
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

    const q = req.query || {};

    // ?history=N — daily score series (newest first), for widgets + zone-change cron
    if (q.history) {
      const n = Math.max(1, Math.min(90, parseInt(q.history, 10) || 2));
      const series = [];
      for (let i = 0; i < n; i++) {
        const s = scoreAt(data, i);
        if (!s) break;
        series.push({ date: new Date(s.ts * 1000).toISOString().slice(0, 10), score: s.score, zone: zone(s.score) });
      }
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).json({ history: series });
    }

    // ?badge=1 — embeddable SVG badge (works in <img>, GitHub/Notion/blogs)
    if (q.badge) {
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).send(badgeSVG(score, zone(score)));
    }

    // ?widget=1 — self-contained live card for <iframe> embeds
    if (q.widget) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).send(widgetHTML({
        score, z: zone(score), trend, trendDelta7d: trendDelta,
        asOf: new Date(asOfTs * 1000).toISOString(),
      }));
    }

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
