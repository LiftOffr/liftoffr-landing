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

// CBBI publishes a null for a component on days it has no reading for it. Measured
// against the live series on 2026-08-20: Woobull has exactly 1 null in 5,533 points
// and it is the NEWEST date, which is the leading-edge gap before CBBI computes that
// day. Interior nulls are commoner than expected elsewhere -- PiCycle has 349 and
// Puell 20 -- so this gate matters for ?history= and the zone-change cron as much as
// for today's number. (An earlier version of this comment said Woobull nulls
// "routinely"; that was wrong and is corrected here.) Number(null) is 0 and
// isFinite(0) is true, so a null used to sail past the guard in scoreAt/computeAll
// and get averaged in as a genuine reading of ZERO. On 2026-08-20 that alone
// understated the published Score by 1.8 points: 34.5 shown against 36.3 correct.
//
// That is the worst possible bug for this product specifically, because the entire
// pitch is "pull the same data and recompute the number yourself" -- anyone who did
// it correctly would skip the null, get a different answer, and conclude the site
// was wrong. They would have been right.
//
// isReading() is the single gate. A component with no reading is EXCLUDED, and
// weightUsed renormalises over the components that do have one. The published
// weights do not change; the divisor does. That is also what an honest recomputer
// would do by hand, which is the point.
function isReading(v) {
  return v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
}

// Strictly the newest point. If the newest point has no reading this returns null
// and the caller excludes the component -- it deliberately does NOT walk back to an
// older reading. Carrying yesterday's value forward would silently substitute data
// from a different date into a number we tell people to reproduce, and they would
// have no way to know we had done it.
function latestEntry(series) {
  if (!series || typeof series !== "object") return null;
  const keys = Object.keys(series).sort((a, b) => Number(b) - Number(a));
  if (!keys.length) return null;
  const raw = series[keys[0]];
  if (!isReading(raw)) return null;
  return { ts: Number(keys[0]), value: Number(raw) };
}

// Entry at offset N days back from the newest point (0 = latest).
// Offsets index the raw series so the 7-day trend still compares like with like;
// a null at that offset yields null and the component drops out of that day's score.
function entryAt(series, offset) {
  if (!series || typeof series !== "object") return null;
  const keys = Object.keys(series).sort((a, b) => Number(b) - Number(a));
  if (offset >= keys.length) return null;
  const raw = series[keys[offset]];
  if (!isReading(raw)) return null;
  return { ts: Number(keys[offset]), value: Number(raw) };
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

// Rewritten 2026-08-20 for the publisher/adviser line. The previous strings were
// instructions to the reader -- "Tier-A V7 exits warranted", "let it run", "Continue
// weekly DCA" -- and this one function feeds the weekly email to the whole free list,
// the homepage Score widget, /cycle, and the Discord bot. A timely, instrument-specific
// instruction to subscribers is the thing no disclaimer cures.
//
// The rule, from the audit's Part 6: describe what the zone HAS historically meant, in
// the past tense, or say what Torin is doing. Never tell the reader what to do. "What
// I'm doing" is a disclosure; "what you should do" is advice, and the gap between those
// two sentences is the whole compliance position.
//
// Do not reintroduce: "warranted", "should", "continue", "let it run", "buy", "sell",
// "entry", "exit price", "target", or any imperative verb aimed at the reader.
function commentary(score, trendDir) {
  if (score >= 85) return "Exit zone. Every cycle top since 2013 occurred with the Score in this band — and the Score has also sat here for months without a top, and crossed in and out of it six times between Nov 2024 and Oct 2025.";
  if (score >= 70) return "Warning band. Historically this band has preceded exit-zone readings, though not every time, and some readings have fallen back to neutral without going higher.";
  if (score >= 50) return "Mid-cycle. Historically the least informative band — the record shows roughly as many moves up from here as down.";
  if (score >= 30) return "Re-accumulation band. Historically this band has resolved upward more often than not over a 180-day window, which is a description of the record and not a forecast.";
  if (score >= 15) return "Accumulation zone. Historically among the lower readings in a cycle. The 2022 signals in this band were both still underwater 180 days later.";
  return "Deep accumulation. The lowest band the Score produces. The 2018 crossing here was +102% at 180 days; that is one instance, not a pattern.";
}

// Single implementation of "what does the CBBI payload say right now", shared
// by the JSON API and the Discord commands. Two copies of this arithmetic is
// how the bot and the site end up quoting different numbers on the same day.
function computeAll(data) {
  const components = {};
  // Components with no reading for the newest date. Surfaced in the API response and
  // labelled on /score, /indicators and the homepage arithmetic, so a reader
  // recomputing by hand knows which ones to leave out and what divisor to use.
  const excluded = [];
  let weightedSum = 0, weightUsed = 0, asOfTs = 0;

  for (const [name, weight] of Object.entries(WEIGHTS)) {
    const e = latestEntry(data[name]);
    if (!e || !isFinite(e.value)) { excluded.push({ name, weight }); continue; }
    const v100 = Math.max(0, Math.min(100, e.value * 100));
    components[name] = { value: Math.round(v100 * 10) / 10, weight, asOf: e.ts };
    weightedSum += v100 * weight;
    weightUsed += weight;
    if (e.ts > asOfTs) asOfTs = e.ts;
  }

  const conf = latestEntry(data.Confidence);
  if (conf) components._cbbi_confidence = { value: Math.round(conf.value * 100 * 10) / 10, asOf: conf.ts };
  const price = latestEntry(data.Price);
  if (price) components._btc_price = { value: Math.round(price.value), asOf: price.ts };

  const score = weightUsed === 0 ? null : Math.round((weightedSum / weightUsed) * 10) / 10;
  // weightUsed is the divisor and is < 1 whenever something was excluded. Publishing
  // it means the arithmetic on the page adds up for a reader checking it by hand.

  let trend = "flat", trendDelta = 0;
  try {
    const rhodl = data.RHODL || {};
    const keys = Object.keys(rhodl).sort((a, b) => Number(b) - Number(a));
    const idx = Math.min(7, keys.length - 1);
    const delta = (Number(rhodl[keys[0]]) - Number(rhodl[keys[idx]])) * 100;
    trendDelta = Math.round(delta * 10) / 10;
    if (delta > 0.5) trend = "rising";
    else if (delta < -0.5) trend = "falling";
  } catch (_) {}

  return { score, zone: score === null ? null : zone(score), trend, trendDelta,
           components, asOfTs, weightUsed, excluded };
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCORD SLASH COMMANDS
//
// This endpoint doubles as the Discord interactions receiver. It lives here
// rather than in its own api/discord.js for one hard reason: the project is AT
// Vercel's 12-serverless-function cap (CLAUDE.md), and every api/*.js counts.
// It is also the natural home — the commands answer questions about the Score,
// which is exactly what this file already computes.
//
// GET behaviour is untouched. Only a signed POST is treated as Discord.
//
// Discord signs every request with Ed25519 over (timestamp + body) and REQUIRES
// that unsigned requests get a 401 — it verifies that during endpoint setup and
// will refuse the URL otherwise.
// ═══════════════════════════════════════════════════════════════════════════

import { createPublicKey, verify as cryptoVerify } from "node:crypto";

// The application's public key. Public by definition — it verifies Discord's
// signature, it does not create one. Hard-coded so the endpoint has no env
// dependency that could silently break command handling on a redeploy.
// Env wins when set, so the key can be rotated (or a test key substituted)
// without a redeploy.
const DISCORD_PUBLIC_KEY =
  process.env.DISCORD_PUBLIC_KEY ||
  "4c5fb780547535f4cc5ade18c1fa40ed56d6a4bbd10885e88c0255b49762edb6";

const ZONE_INT = { // embed colours, matching ZONE_COLORS above
  exit: 0xef4444, warning: 0xf97316, neutral: 0xfbbf24,
  accumulation: 0x22c55e, "deep-accumulation": 0x16a34a,
};

// slug + one-line "what it is", mirroring the /indicators pages so the bot and
// the site can never say different things about the same indicator.
const IND_META = {
  RHODL:       ["rhodl-ratio",           "RHODL Ratio",            "Coins moved this week vs coins last moved 1-2 years ago. Spikes when new money buys what old holders sell."],
  Puell:       ["puell-multiple",        "Puell Multiple",         "Daily miner revenue against its own 365-day average. Low means miners are earning very little."],
  Trolololo:   ["rainbow-chart",         "Rainbow band",           "Where price sits inside a log regression of Bitcoin's whole history."],
  MVRV:        ["mvrv-z-score",          "MVRV Z-Score",           "Unrealised profit across the entire supply, in standard deviations."],
  PiCycle:     ["pi-cycle-top",          "Pi Cycle Top",           "111-day MA vs 2x the 350-day MA. Landed within days of three cycle tops, missed the 2025 one."],
  "2YMA":      ["2-year-ma-multiplier",  "2-Year MA Multiplier",   "Price against its own two-year average. Under the line has been accumulation territory every cycle."],
  ReserveRisk: ["reserve-risk",          "Reserve Risk",           "Holder conviction against the price being offered to sell."],
  Woobull:     ["woobull-top-cap",       "Woobull Top Cap",        "Price as a fraction of a long-run modelled ceiling."],
  RUPL:        ["rupl",                  "NUPL",                   "What share of the supply is sitting in profit."],
};

function verifyDiscord(req, rawBody) {
  const sig = req.headers["x-signature-ed25519"];
  const ts = req.headers["x-signature-timestamp"];
  if (!sig || !ts) return false;
  try {
    // Wrap the raw 32-byte Ed25519 key in SPKI DER so node:crypto accepts it.
    const der = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      Buffer.from(DISCORD_PUBLIC_KEY, "hex"),
    ]);
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    return cryptoVerify(null, Buffer.from(ts + rawBody), key, Buffer.from(sig, "hex"));
  } catch (_) {
    return false;
  }
}

async function readRawBody(req) {
  // Vercel parses JSON bodies, but the signature covers the RAW bytes, so the
  // parsed object cannot be re-stringified and checked — key order and spacing
  // would differ and every request would fail verification.
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

const FOOTER = { text: "LiftOffr · education, not financial advice · liftoffr.com" };

function scoreEmbed(score, z, trend, trendDelta, components, asOfTs) {
  const btc = components._btc_price?.value;
  const arrow = trend === "rising" ? "▲" : trend === "falling" ? "▼" : "◆";
  const sign = trendDelta >= 0 ? "+" : "";
  const ranked = Object.entries(IND_META)
    .filter(([k]) => components[k])
    .sort((a, b) => components[b[0]].value - components[a[0]].value);
  return {
    title: `LiftOffr Score — ${score.toFixed(1)} / 100`,
    url: "https://liftoffr.com/cycle",
    description:
      `**${ZONE_LABELS[z] || z}** · ${arrow} ${sign}${trendDelta} over 7 days` +
      (btc ? ` · BTC $${btc.toLocaleString("en-US")}` : "") +
      `\n${commentary(score, trend)}`,
    color: ZONE_INT[z] || 0x8793a8,
    fields: [
      {
        name: "Hottest right now",
        value: ranked.slice(0, 3)
          .map(([k]) => `\`${components[k].value.toFixed(0).padStart(3)}\` ${IND_META[k][1]}`)
          .join("\n") || "—",
        inline: true,
      },
      {
        name: "Coldest right now",
        value: ranked.slice(-3).reverse()
          .map(([k]) => `\`${components[k].value.toFixed(0).padStart(3)}\` ${IND_META[k][1]}`)
          .join("\n") || "—",
        inline: true,
      },
      {
        name: "​",
        value: "[Full gauge →](https://liftoffr.com/cycle) · " +
               "[All 9 indicators →](https://liftoffr.com/indicators) · " +
               "[Receipts →](https://liftoffr.com/receipts.html)",
      },
    ],
    footer: FOOTER,
    timestamp: new Date(asOfTs * 1000).toISOString(),
  };
}

function indicatorEmbed(key, components, asOfTs) {
  const meta = IND_META[key];
  const v = components[key]?.value;
  if (!meta || v === undefined) return null;
  const [slug, name, blurb] = meta;
  const band = v >= 70 ? "hot — late-cycle territory"
             : v <= 35 ? "cold — early-cycle territory"
             : "middle of its range";
  return {
    title: `${name} — ${v.toFixed(0)} / 100`,
    url: `https://liftoffr.com/indicators/${slug}`,
    description: `${blurb}\n\nReading is **${band}**. Weighted ` +
      `**${(components[key].weight * 100).toFixed(0)}%** of the LiftOffr Score.`,
    color: v >= 70 ? 0xef4444 : v <= 35 ? 0x22c55e : 0xfbbf24,
    fields: [{
      name: "​",
      value: `[What it read at every cycle top since 2013, and where it has been wrong →](https://liftoffr.com/indicators/${slug})`,
    }],
    footer: FOOTER,
    timestamp: new Date(asOfTs * 1000).toISOString(),
  };
}

function ladderEmbed() {
  return {
    title: "What LiftOffr actually sells",
    description:
      "No subscriptions. Every rung is a one-time payment, and each one credits toward the next.",
    color: 0xe63946,
    fields: [
      { name: "Free — forever", value: "The live Score, the daily brief, all 9 indicator pages, every timestamped receipt, and this Discord.\n[liftoffr.com/free](https://liftoffr.com/free)" },
      { name: "$29 · My Bear Market Buy Plan", value: "The nine-tier ladder I'm actually executing. Every level, what has to be true at each one, a receipt when it fires, and the `#plan-updates` channel.\n[liftoffr.com/plan](https://liftoffr.com/plan)" },
      { name: "$197 · The Cycle System", value: "Why those levels — all nine weighted indicators, the method, and the exit ladder.\n[liftoffr.com/system](https://liftoffr.com/system)" },
      { name: "$497 · The Cycle Playbook", value: "A private 90-minute session where we build your ladder against your actual portfolio. 4 a month.\n[liftoffr.com/playbook](https://liftoffr.com/playbook)" },
    ],
    footer: FOOTER,
  };
}

function reply(res, embeds, { ephemeral = false } = {}) {
  return res.status(200).json({
    type: 4,
    data: { embeds, flags: ephemeral ? 64 : 0 },
  });
}

export default async function handler(req, res) {
  // ── Discord interactions (POST, Ed25519-signed) ──
  if (req.method === "POST") {
    const raw = await readRawBody(req);
    if (!verifyDiscord(req, raw)) {
      // Must be 401 — Discord tests this before accepting the endpoint URL.
      return res.status(401).send("invalid request signature");
    }
    let body;
    try { body = JSON.parse(raw); } catch (_) { return res.status(400).send("bad json"); }

    if (body.type === 1) return res.status(200).json({ type: 1 }); // PING

    if (body.type === 2) {
      const name = body.data?.name;
      if (name === "ladder") return reply(res, [ladderEmbed()]);

      let data;
      try {
        const r = await fetch(CBBI_URL, { headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(`upstream ${r.status}`);
        data = await r.json();
      } catch (_) {
        return reply(res, [{
          title: "Data source is unreachable right now",
          description: "The upstream indicator feed didn't answer. Try again in a few minutes — " +
                       "[the site](https://liftoffr.com/cycle) serves a cached reading meanwhile.",
          color: 0x8793a8, footer: FOOTER,
        }], { ephemeral: true });
      }

      const { score, zone: z, trend, trendDelta, components, asOfTs } = computeAll(data);

      if (name === "score") return reply(res, [scoreEmbed(score, z, trend, trendDelta, components, asOfTs)]);

      if (name === "indicator") {
        const key = body.data?.options?.[0]?.value;
        const e = indicatorEmbed(key, components, asOfTs);
        return e ? reply(res, [e]) : reply(res, [{
          title: "Unknown indicator",
          description: "Pick one from the list — the autocomplete has all nine.",
          color: 0x8793a8, footer: FOOTER,
        }], { ephemeral: true });
      }

      if (name === "bottom") {
        return reply(res, [{
          title: "When will Bitcoin bottom?",
          url: "https://liftoffr.com/when-will-bitcoin-bottom",
          description:
            "**Nobody knows the date, and anyone who gives you one is guessing.**\n\n" +
            "What can be measured: the last three bear markets bottomed **363-410 days** after " +
            "their cycle top, with drawdowns of **76-84%** — and every drawdown has been " +
            "shallower than the one before it, so applying an old percentage understates the floor.\n\n" +
            `The Score reads **${score.toFixed(1)}** today (${ZONE_LABELS[z] || z}). Past cycle ` +
            "bottoms printed composite readings in the low teens.",
          color: ZONE_INT[z] || 0x8793a8,
          fields: [{
            name: "​",
            value: "[The full table — every previous bear, measured →](https://liftoffr.com/when-will-bitcoin-bottom)",
          }],
          footer: FOOTER,
        }]);
      }

      return reply(res, [{
        title: "Unknown command", color: 0x8793a8, footer: FOOTER,
      }], { ephemeral: true });
    }

    return res.status(400).send("unhandled interaction type");
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const r = await fetch(CBBI_URL, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      return res.status(502).json({ error: `CBBI upstream ${r.status}` });
    }
    const data = await r.json();

    const { score, components, asOfTs, trend, trendDelta, weightUsed, excluded } = computeAll(data);

    if (weightUsed === 0) {
      return res.status(502).json({ error: "No CBBI components parsed" });
    }

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
      // Published so the arithmetic on the page reconciles for anyone checking it.
      // weightUsed is the divisor; it is 1 on a normal day and less whenever a
      // component had no reading. excluded names those components and their weight.
      weightUsed: Math.round(weightUsed * 100) / 100,
      excluded,
      asOf: new Date(asOfTs * 1000).toISOString(),
      source: "CBBI components, V7-weighted",
    });
  } catch (err) {
    console.error("cycle-score error", err);
    return res.status(500).json({ error: err.message });
  }
}
