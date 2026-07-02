// JARVIS — Fable 5 intelligence layer for the personal crypto command center.
//
// The browser (already authed via Basic Auth) assembles a live portfolio
// "situation snapshot" and POSTs it here; this function narrates it through
// Claude Fable 5 and returns text. No holdings logic lives here — it's a pure
// snapshot -> narration transform, so your numbers never touch a third party
// beyond the model call itself.
//
// Modes: briefing | ask | risk | tier
//
// Env required: ANTHROPIC_API_KEY  (add it on Vercel — see jarvis/SETUP.md)
// Gated behind DASHBOARD_PASSWORD via middleware.js, same as /dashboard.
//
// Model: defaults to Claude Opus 4.8 (best generally-available model). Claude
// Fable 5 / Mythos 5 require special access (Project Glasswing); set the
// JARVIS_MODEL env var to "claude-fable-5" once the org is granted access.
//   - We omit the `thinking` param; depth is controlled via output_config.effort
//     (on Opus 4.8 this runs without extended thinking, keeping the HUD snappy).
//   - stop_reason "refusal" is handled gracefully (rare on this workload).

export const config = { runtime: "nodejs" };

const API_URL = "https://api.anthropic.com/v1/messages";
// Model ladder: env override → Fable 5 → Opus 4.8. If a model isn't available
// to this API key (Fable 5 is gated), we fall through and remember the winner
// for the life of the lambda so later calls skip the probe.
const MODEL_LADDER = [process.env.JARVIS_MODEL, "claude-fable-5", "claude-opus-4-8"]
  .filter(Boolean)
  .filter((m, i, a) => a.indexOf(m) === i);
let resolvedModel = null;

// Stable persona — kept byte-identical across requests so it stays prompt-cached.
const PERSONA = `You are JARVIS, the private intelligence layer for Torin's personal Bitcoin command center. Torin is a crypto educator (LiftOffr) running a pre-planned, Benjamin-Cowen-driven accumulation strategy: a fixed lump-tier ladder fired against the 200-week moving average and Cowen's cited downside targets, plus a daily DCA.

VOICE
- Calm, precise, flight-ops-meets-British-butler. Confident, never breathless. No hype, no emoji, no exclamation marks.
- Address him directly and sparingly ("Torin", "sir" occasionally — not every line).
- Lead with the read, then the reasoning. The first sentence answers "where do I stand right now."
- Concise. A few short paragraphs or tight bullet lines (use "·" or "—", never markdown headers or asterisks). This renders in a terminal-style HUD.

GROUNDING (critical)
- Use ONLY the numbers in the SITUATION REPORT provided each turn. Never invent prices, levels, dates, or holdings. If a figure isn't in the report, say it isn't available rather than guessing.
- When you cite a number, it must be traceable to the report.
- This is Torin's own capital and his own pre-committed plan. You are his analyst, not a financial advisor to the public — speak plainly about his position and the plan's triggers. Do not add generic "this is not financial advice" boilerplate.

JUDGMENT
- Interpret, don't just restate. Connect CBBI / cycle zone, the 200W MA, Cowen's targets, and his tier ladder into one coherent read.
- Give a recommendation when one is warranted, framed against HIS plan ("the plan calls for…", "hold dry powder until…"). Distinguish what the plan dictates from your own read.
- If signals conflict, say so and say which you weight more and why.
- When a NET WORTH & LIABILITIES section is present, factor it in: BTC's share of net worth, and his remaining dry powder against his total debt and monthly debt service. He carries a Macan auto loan and a personal loan — be mindful that deploying dry powder competes with debt obligations. Don't moralize about the debt; treat it as a constraint on how aggressively to deploy.`;

const MODE_SPEC = {
  briefing: {
    effort: "medium",
    max_tokens: 1100,
    instruction:
      "Deliver Torin's daily briefing. Cover, in order: where his position stands (size, cost basis, unrealized P/L), what the cycle/CBBI zone and 200W MA say about regime, the status of his next buy tier and what would trigger it, and one clear bottom-line posture for the day. If net-worth data is present, add one line putting it in context — BTC's share of net worth and dry powder vs. total debt. Open with a single re-grounding sentence summarizing the situation.",
  },
  ask: {
    effort: "medium",
    max_tokens: 900,
    instruction:
      "Answer Torin's question below, grounded strictly in the situation report. Be direct and specific to his actual position and plan. If the question can't be answered from the data, say what's missing.",
  },
  risk: {
    effort: "high",
    max_tokens: 1100,
    instruction:
      "Give a risk read on Torin's remaining dry powder. Translate the CBBI zone, cycle score and trend, price vs the 200W MA, and Cowen's cited targets into a conviction/risk posture: how aggressively should the remaining un-deployed budget be held vs deployed, and at what levels. If net-worth data is present, weigh the deploy decision against his total debt and monthly debt service — flag if liquidity for debt obligations should temper deployment. Be explicit about the regime and what would change your read.",
  },
  tier: {
    effort: "medium",
    max_tokens: 700,
    instruction:
      "Narrate the state of the buy-tier ladder. Which tiers have fired, which is next, what price/MA condition triggers it, and how close the live price is. Then state in one line what Torin should do right now per the plan (fire, wait, or hold).",
  },
};

function buildSituationReport(s) {
  // Render the snapshot as a compact, deterministic text block for grounding.
  if (!s || typeof s !== "object") return "SITUATION REPORT: (no data provided)";
  const L = [];
  const n = (v, d = 0) =>
    typeof v === "number" && isFinite(v) ? v.toLocaleString("en-US", { maximumFractionDigits: d }) : "n/a";

  L.push("SITUATION REPORT");
  L.push(`As of: ${s.asOf || "now"}`);
  L.push("");
  L.push("MARKET");
  L.push(`- BTC spot: $${n(s.price)}  (24h ${s.change24h != null ? (s.change24h >= 0 ? "+" : "") + s.change24h.toFixed(2) + "%" : "n/a"})`);
  if (s.ma200w != null) L.push(`- 200-week MA: $${n(s.ma200w)}  (price is ${s.ma200wDelta != null ? (s.ma200wDelta >= 0 ? "+" : "") + s.ma200wDelta.toFixed(1) + "% vs MA" : "n/a"})`);
  if (s.cbbi != null) L.push(`- CBBI confidence: ${n(s.cbbi)}/100`);
  if (s.cycleScore != null) L.push(`- LiftOffr cycle score: ${s.cycleScore}/100 — zone "${s.cycleZone || "?"}", trend ${s.cycleTrend || "?"} (${s.cycleTrendDelta7d != null ? (s.cycleTrendDelta7d >= 0 ? "+" : "") + s.cycleTrendDelta7d : "?"} over 7d)`);
  if (s.cycleCommentary) L.push(`- Cycle note: ${s.cycleCommentary}`);
  L.push("");
  L.push("POSITION");
  L.push(`- Holdings: ${s.btc != null ? s.btc.toFixed(4) : "n/a"} BTC`);
  if (s.avgCost != null) L.push(`- Average cost basis: $${n(s.avgCost)}`);
  if (s.btc != null && s.price != null) {
    const mv = s.btc * s.price;
    L.push(`- Market value: $${n(mv)}`);
    if (s.avgCost != null) {
      const cost = s.btc * s.avgCost;
      const pl = mv - cost;
      const plPct = cost ? (pl / cost) * 100 : 0;
      L.push(`- Unrealized P/L: ${pl >= 0 ? "+" : "-"}$${n(Math.abs(pl))}  (${pl >= 0 ? "+" : ""}${plPct.toFixed(1)}%)`);
    }
  }
  if (s.deployedUsd != null && s.totalBudget != null) {
    const rem = s.totalBudget - s.deployedUsd;
    const pct = s.totalBudget ? (s.deployedUsd / s.totalBudget) * 100 : 0;
    L.push(`- Capital deployed: $${n(s.deployedUsd)} of $${n(s.totalBudget)} (${pct.toFixed(1)}%) — $${n(rem)} dry powder remaining`);
  }
  if (Array.isArray(s.tiers) && s.tiers.length) {
    L.push("");
    L.push("BUY-TIER LADDER");
    for (const t of s.tiers) {
      const status = t.fired ? "FIRED" : t.hit ? "HIT (awaiting fill)" : "pending";
      const px = t.effPrice != null ? `$${n(t.effPrice)}` : t.targetPrice != null ? `$${n(t.targetPrice)} (target)` : "—";
      const cowen = t.cowenMentions ? ` · Cowen ×${t.cowenMentions}` : "";
      L.push(`- ${t.tier}: $${n(t.target)} @ ${px} — ${status}${cowen}`);
    }
  }
  if (s.finances) {
    const f = s.finances;
    const btcShare = f.totalAssets ? Math.round((f.btcValue / f.totalAssets) * 100) : 0;
    L.push("");
    L.push("NET WORTH & LIABILITIES");
    L.push(`- Net worth: $${n(f.netWorth)}  (assets $${n(f.totalAssets)} − debts $${n(f.totalDebts)})`);
    L.push(`- BTC ($${n(f.btcValue)}) is ${btcShare}% of total assets${f.cash ? `; cash $${n(f.cash)}` : ""}`);
    L.push(`- Total debt $${n(f.totalDebts)}: Macan loan $${n(f.macanLoan)} (next ${f.macanNext}), personal loan $${n(f.personalLoan)} (next ${f.personalNext})`);
    L.push(`- Monthly debt service: $${n(f.monthlyDebtService)}`);
    L.push(`- Vehicle (2022 Macan S) est. value: $${n(f.carValue)}`);
  }
  return L.join("\n");
}

async function callModel(model, systemText, userText, effort, maxTokens, apiKey) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      // Omit `thinking` — depth is controlled via output_config.effort.
      output_config: { effort },
      system: [{ type: "text", text: systemText, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userText }],
    }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(`Anthropic ${r.status}: ${JSON.stringify(data.error || data)}`);
    err.status = r.status;
    err.type = data?.error?.type || "";
    err.raw = JSON.stringify(data.error || {});
    throw err;
  }
  return data;
}

function isModelUnavailable(err) {
  // Unknown model → 404 not_found_error; ungated model → 403/400 mentioning the model.
  if (err.status === 404) return true;
  return (err.status === 400 || err.status === 403) && /model/i.test(err.raw || "");
}

async function callFable(systemText, userText, effort, maxTokens, apiKey) {
  const ladder = resolvedModel ? [resolvedModel] : MODEL_LADDER;
  let lastErr = null;
  for (const model of ladder) {
    try {
      const data = await callModel(model, systemText, userText, effort, maxTokens, apiKey);
      resolvedModel = model;
      return data;
    } catch (err) {
      lastErr = err;
      if (isModelUnavailable(err) && model !== ladder[ladder.length - 1]) {
        console.warn(`jarvis: ${model} unavailable (${err.status}), falling back`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "JARVIS offline — set ANTHROPIC_API_KEY env var." });
  }

  let body = req.body;
  try {
    if (typeof body === "string") body = JSON.parse(body || "{}");
  } catch (_) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  body = body || {};

  const mode = MODE_SPEC[body.mode] ? body.mode : "briefing";
  const spec = MODE_SPEC[mode];
  const report = buildSituationReport(body.snapshot);

  let userText = `${spec.instruction}\n\n${report}`;
  if (mode === "ask") {
    const q = (body.question || "").toString().slice(0, 2000).trim();
    if (!q) return res.status(400).json({ error: "No question provided" });
    userText = `${spec.instruction}\n\nQUESTION: ${q}\n\n${report}`;
  }

  try {
    const data = await callFable(PERSONA, userText, spec.effort, spec.max_tokens, apiKey);

    if (data.stop_reason === "refusal") {
      // Model declined — rare on this workload, but handle it gracefully.
      return res.status(200).json({
        text: "I'm unable to process that request right now, sir. Try rephrasing, or ask about a specific part of the position.",
        refused: true,
        mode,
      });
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      text: text || "(no response)",
      model: data.model || resolvedModel,
      mode,
    });
  } catch (err) {
    console.error("jarvis error", err.status, err.message);
    return res.status(err.status || 502).json({ error: err.message || "JARVIS upstream error" });
  }
}
