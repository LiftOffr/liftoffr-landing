import { runFixedCashDca, FIXED_CASH_PLAN } from "./_fixed-cash-dca.js";
import { unsubscribeHeaders } from "./_email-preferences.js";
// Weekly LiftOffr Score email cron.
//
// Vercel cron config (vercel.json) calls this DAILY. We bail early on non-Sundays
// so the actual send only fires once a week. Sunday ~8am MT = 15:00 UTC.
//
// Flow:
//   1. Day-of-week guard (Sunday only)
//   2. Auth guard (CRON_SECRET header) so random callers can't fire sends
//   3. Pull LiftOffr Score from /api/cycle-score (internal)
//   4. Pull Resend audience contacts (LiftOffr Free)
//   5. Send a personalized email via Resend to each
//   6. Return summary
//
// Env required:
//   CRON_SECRET           — random string, must match the Vercel cron auth header
//   RESEND_API_KEY        — Resend sending key (audience + send scope)
//   RESEND_AUDIENCE_ID    — UUID of the "LiftOffr Free" audience

import crypto from "node:crypto";
import { disclosureHTML, disclosureText } from "./_disclosure.js";
import { BUY_PLAN, dcaForToday, dcaForDate, PLAN_START, effectiveTriggerPrice, DCA_MAX_QUOTE_SIZE,
  DCA_MODE, DCA_STACK_USDC, DCA_START, DCA_HORIZON_END, DCA_DAILY_FILL_MAX, ladderFunding } from "./_buy-plan.js";
import { postToChannel, AUTO_BUY_LOG_CHANNEL } from "./_alerts.js";

export const config = { runtime: "nodejs" };

const FROM_ADDRESS = "Torin from LiftOffr <torin@liftoffr.com>";
const REPLY_TO     = "contact.liftoffr@gmail.com";
const SUBJECT_BASE = "The LiftOffr Score this week";
// OWNER_DISCORD_ID env var — Torin's Discord user ID, kept out of source since
// this repo may be public. Tier-watch DMs go straight to him, not a channel.

async function sendOwnerDM(content) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const ownerId = process.env.OWNER_DISCORD_ID;
  if (!botToken) return { ok: false, reason: "no bot token" };
  if (!ownerId) return { ok: false, reason: "no OWNER_DISCORD_ID env var set" };
  const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST",
    headers: { "Authorization": `Bot ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: ownerId }),
  });
  if (!dmRes.ok) return { ok: false, reason: `open DM failed: ${dmRes.status}` };
  const dm = await dmRes.json();
  const sendRes = await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bot ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return { ok: sendRes.ok, status: sendRes.status };
}

function unsubUrl(email) {
  // No fallback: this HMAC signs unsubscribe tokens. It previously fell back to the
  // literal string "liftoffr", which would have made every token forgeable by anyone
  // who guessed the brand name. Fail loudly instead of signing with a known key.
  if (!process.env.CRON_SECRET) throw new Error("CRON_SECRET is not set — refusing to sign with a default");
  const t = crypto.createHmac("sha256", process.env.CRON_SECRET)
    .update((email || "").toLowerCase()).digest("hex").slice(0, 16);
  return `https://liftoffr.com/api/subscribe?u=1&e=${encodeURIComponent(email)}&t=${t}`;
}

function zoneLabel(zone) {
  return {
    exit:                "🟥 EXIT ZONE",
    warning:             "🟧 WARNING",
    "mid-cycle":         "🟨 MID-CYCLE",
    "re-accumulation":   "🟦 RE-ACCUMULATION",
    accumulation:        "🟩 ACCUMULATION",
    "deep-accumulation": "🟩 DEEP ACCUMULATION",
  }[zone] || zone.toUpperCase();
}

// The audit's standing template for this email asks for "what moved it". We don't get
// per-component week-ago values from /api/cycle-score, so rather than invent a delta we
// publish what is actually true and checkable: the three components contributing most
// to today's number, as weight x reading. That also reinforces the one claim this
// business owns -- that the reader can recompute the number themselves.
const COMPONENT_LABELS = {
  RHODL: "RHODL Ratio", Puell: "Puell Multiple", Trolololo: "Trolololo",
  MVRV: "MVRV Z-Score", PiCycle: "Pi Cycle Top", "2YMA": "2Y MA Multiplier",
  ReserveRisk: "Reserve Risk", Woobull: "Woobull Top Cap", RUPL: "RUPL",
};

function topContributors(components, n = 3) {
  if (!components) return [];
  return Object.entries(components)
    .filter(([k, c]) => COMPONENT_LABELS[k] && c && typeof c.value === "number" && typeof c.weight === "number")
    .map(([k, c]) => ({ label: COMPONENT_LABELS[k], value: c.value, weight: c.weight, contrib: c.value * c.weight }))
    .sort((a, b) => b.contrib - a.contrib)
    .slice(0, n);
}

function emailHTML({ score, zone, trend, trendDelta7d, commentary, components }) {
  const price = components?._btc_price?.value;
  const trendArrow = trend === "rising" ? "▲" : trend === "falling" ? "▼" : "◆";
  const trendStr = `${trendArrow} ${trendDelta7d >= 0 ? "+" : ""}${trendDelta7d} over last 7 days`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;supported-color-schemes:light only}</style></head><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

  <div style="background:#080808;padding:32px 28px;text-align:center;">
    <div style="display:inline-block;background:#e63946;color:#fff;padding:5px 12px;border-radius:4px;font-family:Helvetica,sans-serif;font-style:italic;font-size:22px;font-weight:900;letter-spacing:-0.5px;">lift<span style="color:#000;">offr</span></div>
    <div style="margin-top:18px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">The LiftOffr Score · Weekly</div>
  </div>

  <div style="padding:36px 28px;text-align:center;">
    <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:88px;font-weight:700;line-height:1;letter-spacing:-3px;color:#111;">${score.toFixed(1)}</div>
    <div style="margin-top:10px;font-size:13px;font-weight:800;letter-spacing:2px;color:#666;">${zoneLabel(zone)}</div>
    <div style="margin-top:14px;font-family:'JetBrains Mono',Menlo,monospace;font-size:13px;color:#888;">${trendStr}</div>
    <p style="margin-top:24px;font-size:15px;line-height:1.55;color:#333;font-style:italic;">${commentary}</p>
    ${price ? `<p style="margin-top:18px;color:#999;font-size:13px;">BTC: $${Number(price).toLocaleString()}</p>` : ""}
  </div>

  <div style="padding:0 28px 32px;font-size:14px;color:#444;line-height:1.6;">
    <p style="margin:0 0 12px;color:#666;font-size:13px;">The Score is a weighted composite of nine on-chain and market indicators. Above 85 has historically been where cycle tops occurred; below 15 is the lowest band it produces.</p>

    ${(() => { const t = topContributors(components); return t.length ? `
    <div style="margin:0 0 16px;padding:14px 16px;background:#fafafa;border:1px solid #eee;border-radius:8px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#888;margin-bottom:8px;">Carrying the number this week</div>
      <div style="font-family:Menlo,monospace;font-size:13px;color:#444;line-height:1.9;">
        ${t.map(c => `${c.label} &mdash; ${c.weight.toFixed(2)} &times; ${c.value.toFixed(1)}`).join("<br>")}
      </div>
      <div style="font-size:12px;color:#888;margin-top:10px;line-height:1.6;">All nine weights are published at <a href="https://liftoffr.com/indicators?utm_source=resend&utm_medium=email&utm_campaign=weekly_score&utm_content=recompute" style="color:#e63946;">liftoffr.com/indicators</a>. Pull the same free public data, run the same weights, and you should land on the number above.</div>
    </div>` : ""; })()}

    <p style="margin:0 0 12px;font-size:13px;color:#666;">Every signal this model has produced &mdash; all 64, including the ones that went the wrong way &mdash; is at <a href="https://liftoffr.com/receipts?utm_source=resend&utm_medium=email&utm_campaign=weekly_score&utm_content=receipts" style="color:#e63946;">liftoffr.com/receipts</a>.</p>

    <p style="margin:18px 0 0;">Want the exact plan I'm executing against this Score &mdash; nine buy tiers, the exit thresholds that put me on alert, and the whipsaw rule? It's $29, once. The Cycle System separately explains how to build your own exit ladder, with a worksheet for choosing your own fractions.</p>
  </div>

  <div style="padding:0 28px 32px;">
    <a href="https://liftoffr.com/plan?utm_source=resend&utm_medium=email&utm_campaign=weekly_score&utm_content=cta" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">Get the plan — $29 once →</a>
  </div>

  <div style="padding:20px 28px 4px;border-top:1px solid #eee;font-size:13px;color:#666;line-height:1.7;">
    <p style="margin:0 0 6px;font-weight:700;color:#444;">Whenever you're ready, 3 ways I can help:</p>
    <p style="margin:0 0 2px;">1. <a href="https://liftoffr.com/cycle?utm_source=resend&utm_medium=email&utm_campaign=weekly_score&utm_content=menu_cycle" style="color:#e63946;">Check the live cycle dashboard</a> — free, always current</p>
    <p style="margin:0 0 2px;">2. <a href="https://liftoffr.com/plan?utm_source=resend&utm_medium=email&utm_campaign=weekly_score&utm_content=menu_plan" style="color:#e63946;">Get My Bear Market Buy Plan</a> — $29, once</p>
    <p style="margin:0 0 14px;">3. <a href="https://liftoffr.com/playbook?utm_source=resend&utm_medium=email&utm_campaign=weekly_score&utm_content=menu_playbook" style="color:#e63946;">Build your exact cycle plan with me</a> — the Cycle Playbook</p>
  </div>

  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;">
    ${disclosureHTML("Sent because you subscribed to the free Cycle Score email.")}
    <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
  </div>

</div>
</body></html>`;
}

function emailText({ score, zone, trend, trendDelta7d, commentary, components }) {
  const price = components?._btc_price?.value;
  return [
    `LiftOffr Score this week: ${score.toFixed(1)} (${zoneLabel(zone)})`,
    `Trend: ${trend === "rising" ? "▲" : trend === "falling" ? "▼" : "◆"} ${trendDelta7d >= 0 ? "+" : ""}${trendDelta7d} over last 7 days`,
    price ? `BTC: $${Number(price).toLocaleString()}` : "",
    "",
    commentary,
    "",
    "The Score is a weighted composite of nine on-chain and market indicators. Above 85 has historically been where cycle tops occurred; below 15 is the lowest band it produces.",
    "",
    (() => { const t = topContributors(components); return t.length
      ? "CARRYING THE NUMBER THIS WEEK\n" + t.map(c => `  ${c.label} - ${c.weight.toFixed(2)} x ${c.value.toFixed(1)}`).join("\n") +
        "\n\nAll nine weights: https://liftoffr.com/indicators — pull the same free public data, run the same weights, and you should land on the number above."
      : ""; })(),
    "",
    "Every signal this model has produced - all 64, including the ones that went the wrong way: https://liftoffr.com/receipts",
    "",
    "Want the exact plan I'm executing against this Score? $29, once:",
    "https://liftoffr.com/plan?utm_source=resend&utm_medium=email&utm_campaign=weekly_score",
    "",
    "— Torin",
    "",
    disclosureText("Sent because you subscribed to the free Cycle Score email."),
  ].filter(Boolean).join("\n");
}

async function fetchResendAudienceContacts() {
  const key = process.env.RESEND_API_KEY;
  const aud = process.env.RESEND_AUDIENCE_ID;
  const r = await fetch(`https://api.resend.com/audiences/${aud}/contacts`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const data = await r.json();
  return (data.data || []).filter((c) => c.email && !c.unsubscribed);
}

async function fetchScore(baseUrl) {
  const r = await fetch(`${baseUrl}/api/cycle-score`);
  if (!r.ok) throw new Error(`cycle-score upstream ${r.status}`);
  return r.json();
}

// Fresh Claude-written weekly read (same premium treatment as the daily brief).
// Falls back to the API's formulaic commentary on any failure.
async function aiWeeklyRead(score) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return score.commentary;
  try {
    const facts = `LiftOffr Score ${score.score.toFixed(1)}/100, zone "${score.zone}", trend ${score.trend} (${score.trendDelta7d >= 0 ? "+" : ""}${score.trendDelta7d} over 7d). Components: ${Object.entries(score.components || {}).map(([k, v]) => `${k}=${v.value}`).join(", ")}. Score semantics (these are the ONLY bands; they match api/cycle-score.js zone() and commentary(), and the badge on the email): 85+ exit zone, 70-85 warning, 50-70 mid-cycle, 30-50 re-accumulation, 15-30 accumulation, below 15 deep accumulation. Use the band name for the score you are given and no other. Describe what the band has done historically; never tell the reader to buy, sell, reduce, take profits, scale out or DCA.`;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-5", max_tokens: 260,
        system: "You write the one-paragraph weekly read for LiftOffr's Sunday Score email (Bitcoin cycle education). Voice: calm analyst, direct, zero hype. Use ONLY the provided numbers. 3-4 sentences: what the Score says about cycle position, what changed this week, and one disciplined-posture sentence. Frame history as 'historically'. Never predict prices. No emoji, no headers.",
        messages: [{ role: "user", content: facts }],
      }),
    });
    if (!r.ok) return score.commentary;
    const d = await r.json();
    const text = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join(" ").trim();
    const verdict = validateWeeklyRead(text, score);
    if (!verdict.ok) {
      // Loud on purpose. A silent fallback looks identical to a good week, so a
      // model that drifted would be invisible until someone read a sent email.
      console.warn(`[weekly-score] AI read REJECTED (${verdict.reason}) — falling back to commentary. Text was: ${JSON.stringify(text.slice(0, 400))}`);
      return score.commentary;
    }
    return text;
  } catch {
    return score.commentary;
  }
}

// ── Post-generation validator for the AI weekly read ─────────────────────────
// WHY THIS EXISTS
// The weekly read is written by a model at send time and goes to the entire free
// list. The prompt forbids instruction verbs, pins the six bands, and says to use
// the band for the given score and no other. Until 21 Aug 2026 the only check on
// the returned text was `text.length > 80` — so the single rule this business
// rests on ("never tell the reader what to do with a position") was enforced on a
// weekly outbound surface by model compliance alone, with no human in the loop.
//
// A prompt is a request. This is the check. If the model drifts, the email still
// goes out — with score.commentary, which is deterministic and always correct.
// Prefer a duller true email over a livelier one that might not be.
//
// Deliberately conservative about numbers: the read may only contain figures that
// were in its input. That blocks invented prices, invented percentages and
// hallucinated hit rates in one rule, at the cost of occasionally rejecting a
// harmless rounding. That trade is the right way round.
const BANNED_INSTRUCTION = [
  // Second-person or imperative position instructions. The register rule in
  // COPY_SWEEP_NOTES.md, enforced rather than requested.
  /\b(buy|sell|reduce|trim|accumulate|deploy|exit|enter|hold|add|short|long)\s+(now|here|today|aggressively|the\s+dip)\b/i,
  /\byou\s+(should|ought\s+to|need\s+to|must|want\s+to)\s+(buy|sell|reduce|trim|take|scale|exit|enter|hold|add|deploy|accumulate|de-?risk)\b/i,
  /\b(take|taking)\s+profits?\b/i,
  /\bscal(e|ing)\s+(out|in)\b/i,
  /\bde-?risk(ing)?\b/i,
  /\b(start|stop|increase|decrease|pause|resume)\s+(your\s+)?dca\b/i,
  /\bdollar-cost\s+averag/i,
  /\b(time|timing)\s+to\s+(buy|sell|exit|enter)\b/i,
  /\b(get|move)\s+(in|out)\s+(now|here)\b/i,
  /\bposition\s+size|\bsize\s+(up|down)\b/i,
];

const ALL_BAND_NAMES = [
  "exit zone", "exit", "warning", "mid-cycle", "mid cycle",
  "re-accumulation", "re accumulation", "accumulation", "deep accumulation",
];

// The band a score actually falls in. Must stay in step with zone() in
// api/cycle-score.js and with the table in every course lesson.
function bandForScore(n) {
  if (n >= 85) return "exit";
  if (n >= 70) return "warning";
  if (n >= 50) return "mid-cycle";
  if (n >= 30) return "re-accumulation";
  if (n >= 15) return "accumulation";
  return "deep-accumulation";
}

function validateWeeklyRead(text, score) {
  if (!text || text.length <= 80) return { ok: false, reason: "too short or empty" };
  if (text.length > 1400) return { ok: false, reason: "implausibly long" };

  for (const re of BANNED_INSTRUCTION) {
    const m = text.match(re);
    if (m) return { ok: false, reason: `instruction verb: ${JSON.stringify(m[0])}` };
  }

  // The correct band may appear; no other band name may.
  const correct = bandForScore(score.score);
  const correctAliases = correct === "deep-accumulation"
    ? ["deep accumulation"]
    : correct === "mid-cycle" ? ["mid-cycle", "mid cycle"]
    : correct === "re-accumulation" ? ["re-accumulation", "re accumulation"]
    : correct === "exit" ? ["exit zone", "exit"]
    : [correct];
  const lower = text.toLowerCase();
  for (const name of ALL_BAND_NAMES) {
    if (correctAliases.includes(name)) continue;
    // "accumulation" is a substring of the other two; only flag it standalone.
    const re = name === "accumulation"
      ? /(^|[^-\w])accumulation\b/
      : new RegExp(`(^|[^-\\w])${name.replace(/[-\s]/g, "[-\\s]")}\\b`);
    if (re.test(lower)) {
      if (name === "accumulation" && (lower.includes("re-accumulation") || lower.includes("deep accumulation"))) {
        // The standalone match may be the tail of a compound we already allow.
        const stripped = lower.replace(/re-?\s?accumulation/g, "").replace(/deep\s?accumulation/g, "");
        if (!/(^|[^-\w])accumulation\b/.test(stripped)) continue;
      }
      return { ok: false, reason: `names band "${name}" but the score is ${score.score} (${correct})` };
    }
  }

  // Every number in the output must have been in the input.
  const allowed = new Set();
  const addNum = (v) => {
    if (v === null || v === undefined) return;
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    allowed.add(String(n));
    allowed.add(n.toFixed(1));
    allowed.add(String(Math.round(n)));
  };
  addNum(score.score);
  addNum(score.trendDelta7d);
  addNum(Math.abs(score.trendDelta7d));
  Object.values(score.components || {}).forEach((c) => addNum(c && c.value));
  [7, 30, 90, 180, 100, 0, 2013, 2015, 2017, 2018, 2021, 2022, 2025].forEach(addNum);
  ALL_BAND_NAMES.forEach(() => {});
  [85, 70, 50, 30, 15].forEach(addNum);   // the published band boundaries

  for (const m of text.matchAll(/\$?\d[\d,]*(?:\.\d+)?%?/g)) {
    const raw = m[0].replace(/[$,%]/g, "");
    if (raw === "") continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    if (allowed.has(String(n)) || allowed.has(n.toFixed(1)) || allowed.has(String(Math.round(n)))) continue;
    return { ok: false, reason: `number not in input: ${JSON.stringify(m[0])}` };
  }

  return { ok: true };
}

async function sendResend(to, subject, text, html, idempotencyKey) {
  const uu = unsubUrl(to);
  html = (html || "").replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, uu);
  text = (text || "") + `\n\nUnsubscribe: ${uu}`;
  const headers = {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
    "User-Agent": "liftoffr-weekly-score/1.0",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: FROM_ADDRESS,
      headers: unsubscribeHeaders(uu),
      to: [to],
      reply_to: REPLY_TO,
      subject,
      text,
      html,
      tags: [
        { name: "campaign", value: idempotencyKey ? "zone_change" : "weekly_score" },
      ],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(data));
  return data.id;
}

// ── Zone-change alert (daily check, stateless) ───────────────────────────────
// Compares the two newest daily Score zones from /api/cycle-score?history=7.
// Fires ONLY when the newest data point crossed into a new zone AND that point
// is fresh (≤2 days old). Resend Idempotency-Key makes re-runs safe.
const ZONE_HEADLINES = {
  "exit": "The Score just entered the EXIT ZONE",
  "warning": "The Score just entered the WARNING band",
  "mid-cycle": "The Score just crossed into MID-CYCLE",
  "re-accumulation": "The Score just crossed into RE-ACCUMULATION",
  "accumulation": "The Score just entered ACCUMULATION",
  "deep-accumulation": "The Score just entered DEEP ACCUMULATION",
};

function zoneChangeText({ from, to, score, date }) {
  return [
    `The LiftOffr Score crossed from ${zoneLabel(from)} into ${zoneLabel(to)} on ${date}.`,
    ``,
    `Score now: ${score.toFixed(1)} / 100`,
    ``,
    `Zone changes are rare — this is the signal the weekly email exists for. Members got the full read and what I'm doing about it in this morning's brief.`,
    ``,
    `See the live score: https://liftoffr.com/cycle?utm_source=email&utm_medium=zone_alert`,
    `The exact plan I'm executing — $29, once: https://liftoffr.com/plan`,
    ``,
    `— Torin`,
    ``,
    `Educational content only — not financial advice.`,
  ].join("\n");
}

function zoneChangeHTML(p) {
  const color = { "exit": "#ef4444", "warning": "#f97316", "mid-cycle": "#fbbf24", "re-accumulation": "#4d8df0", "accumulation": "#22c55e", "deep-accumulation": "#16a34a" }[p.to] || "#999";
  return `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#222;">
    <div style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#e63946;margin-bottom:14px;">LiftOffr · Zone change alert</div>
    <h1 style="font-size:21px;margin:0 0 14px;">${ZONE_HEADLINES[p.to] || "The Score changed zones"}</h1>
    <div style="background:#f7f7f8;border-radius:12px;padding:20px;text-align:center;margin:0 0 18px;">
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:44px;font-weight:700;color:${color};">${p.score.toFixed(1)}</div>
      <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:${color};">${zoneLabel(p.to)}</div>
      <div style="font-size:12px;color:#888;margin-top:6px;">was ${zoneLabel(p.from)} · crossed ${p.date}</div>
    </div>
    <p style="font-size:14.5px;line-height:1.6;">Zone changes are rare — this is the moment the framework exists for. Members got the full read and what I'm doing about it in this morning's brief.</p>
    <a href="https://liftoffr.com/plan?utm_source=email&utm_medium=zone_alert" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:9px;font-weight:800;font-size:15px;margin:18px 0 10px;">Get the plan — $29 once →</a>
    <p style="text-align:center;font-size:12px;"><a href="https://liftoffr.com/cycle?utm_source=email&utm_medium=zone_alert" style="color:#888;">or watch the live score →</a></p>
    <p style="font-size:11px;color:#999;margin-top:22px;">Educational content only — not financial advice. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a></p>
  </div>`;
}

async function runZoneChangeCheck(baseUrl) {
  // HOLD is the same rule /receipts publishes for the 64-signal log: "a crossing
  // counts only after the score holds the new zone for 7 straight days — the date
  // shown is the first day of that hold". This check used to compare today against
  // yesterday with no hold at all, so a Score touching a boundary for one day
  // emailed the whole free list about a crossing that would never appear in the
  // log. That matters more now: the band split at 50 sits in the middle of the
  // range the Score normally occupies.
  const HOLD = 7;
  const r = await fetch(`${baseUrl}/api/cycle-score?history=${HOLD + 7}`);
  if (!r.ok) throw new Error(`history fetch ${r.status}`);
  const { history } = await r.json();
  if (!history || history.length < HOLD + 1) return { skipped: true, reason: "insufficient history" };

  const today = history[0];
  const window = history.slice(0, HOLD);          // newest first
  const prior = history[HOLD];                     // the day before the hold began

  // Every day of the window must be the same zone, and the day before it must differ.
  const held = window.every((d) => d.zone === today.zone);
  if (!held) return { changed: false, zone: today.zone, score: today.score, reason: `zone not held ${HOLD}d` };
  if (prior.zone === today.zone) return { changed: false, zone: today.zone, score: today.score };

  // Freshness guard: judged on today's data point, not the crossing date, because
  // the crossing is by definition HOLD-1 days old once the hold completes.
  const ageDays = (Date.now() - new Date(today.date).getTime()) / 86400000;
  if (ageDays > 2) return { changed: true, skipped: true, reason: `stale data (${today.date})` };

  // The crossing date is the first day of the hold, matching the log.
  const crossedOn = window[window.length - 1].date;
  const payload = { from: prior.zone, to: today.zone, score: today.score, date: crossedOn };
  const subject = `${ZONE_HEADLINES[today.zone] || "LiftOffr Score zone change"} — ${today.score.toFixed(1)}`;
  const text = zoneChangeText(payload);
  const html = zoneChangeHTML(payload);
  const subs = await fetchResendAudienceContacts();

  const results = { sent: 0, failed: 0, total: subs.length };
  for (const s of subs) {
    try {
      // Idempotency: one send per contact per crossing, even if the cron re-runs.
      await sendResend(s.email, subject, text, html, `zonechg-${crossedOn}-${today.zone}-${s.id || s.email}`);
      results.sent++;
    } catch (e) {
      results.failed++;
    }
    await new Promise((rr) => setTimeout(rr, 600));
  }
  const discord = await postZoneChangeToDiscord(payload).catch((e) => ({ error: String(e).slice(0, 120) }));
  await sendOwnerDM(`🚨 Zone change: ${zoneLabel(payload.from)} → ${zoneLabel(payload.to)} at ${payload.score.toFixed(1)}. Alert emailed to ${results.sent}/${results.total} free subscribers.`).catch(() => {});
  return { changed: true, ...payload, results, discord };
}

// ── The only alert this business can honestly push ───────────────────────────
// #urgent-alerts used to carry a price-move feed and daily Fear & Greed pings,
// both from a bot outside this repo. Fear & Greed carries ZERO weight in the
// Score, and a 24h price move is not an event this model has a view on — it is
// built for cycle position over months. #btc-signals was deleted on 21 Aug for
// the same reason at a larger scale: it flipped published bias on ±0.0% crosses.
//
// A Score band change is the one thing that is genuinely urgent AND genuinely
// ours: it is the model's own output, it uses the same seven-day hold rule as
// the 64-signal log so a one-day boundary touch never fires, and it is already
// computed above for the email. This just sends it to Discord as well.
//
// Register: it states the band and what the record says that band has meant.
// It does not tell anyone what to do, and it must never start.
//
// No fallback destination, by design and consistent with every other webhook in
// this file. If DISCORD_ZONE_ALERTS_WEBHOOK is unset the post is skipped and the
// email still sends — a band change is not worth guessing a room for.
const ZONE_MEANING = {
  exit: "Every cycle top since 2013 printed with the Score in this band. It has also sat here for months with no top following. Both are true.",
  warning: "This band has preceded exit-zone readings, though not every time.",
  "mid-cycle": "Historically the least informative band.",
  "re-accumulation": "After a drawdown stops deepening, before the next expansion. Has resolved upward more often than not at 180 days.",
  accumulation: "Among the lower readings in a cycle.",
  "deep-accumulation": "The lowest band the Score produces.",
};

async function postZoneChangeToDiscord({ from, to, score, date }) {
  const url = process.env.DISCORD_ZONE_ALERTS_WEBHOOK;
  if (!url) {
    console.warn("DISCORD_ZONE_ALERTS_WEBHOOK not set — zone-change Discord post skipped (no fallback by design)");
    return { skipped: true, reason: "DISCORD_ZONE_ALERTS_WEBHOOK not set" };
  }
  const content = [
    `**THE SCORE CHANGED BANDS — ${zoneLabel(from)} → ${zoneLabel(to)}**`,
    "",
    `Score **${score.toFixed(1)}** · crossing dated **${date}**`,
    "",
    `${ZONE_MEANING[to] || "See the band table on liftoffr.com/score."}`,
    "",
    "A crossing counts only after the Score holds the new band for seven straight days, which is the same rule the 64-signal log uses — so this is not a one-day touch of a boundary.",
    "",
    "**This is a description of where the number is, not a suggestion about what to do with a position.** What a band change means for yours is yours to decide, ideally before it happens.",
    "",
    "Live number and all nine weights: <https://liftoffr.com/score> · The full record: <https://liftoffr.com/receipts>",
  ].join("\n");
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  return { status: r.status, ok: r.ok };
}

// ═══════════════════════════════════════════════════════════════════
// BUY-PLAN DAILY BRIEFING — fires every day at 15:00 UTC (8am MT).
// Hits Discord webhook with BTC + 200W MA + tier-ladder status.
// On Mondays, appends a DCA reminder.
// ═══════════════════════════════════════════════════════════════════

// BUY_PLAN now lives in ./_buy-plan.js and is imported at the top of this file.
// It used to be a hand-maintained copy here labelled "Mirror of dashboard PLAN
// config — keep in sync", which is how api/btc-price.js ended up hardcoding tier
// names that no longer existed.

async function fetchBtcAnd200wMA(baseUrl) {
  const r = await fetch(`${baseUrl}/api/btc-price?ma200w=1`);
  if (!r.ok) throw new Error(`btc-price ${r.status}`);
  return r.json();
}

function daysUntil(iso) {
  const target = new Date(iso + "T00:00:00Z");
  const now = new Date();
  return Math.ceil((target - now) / (24 * 3600 * 1000));
}

function fmtUsd(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function tierLine(t, btcPrice, ma200w, funding = null) {
  const triggerPx = t.maMultiple && ma200w ? ma200w * t.maMultiple : t.targetPrice;
  let badge = "⚪"; let action = "";
  if (t.tier === "IMMEDIATE") {
    badge = "🔴"; action = "FIRE TODAY @ market";
  } else if (triggerPx) {
    const delta = ((btcPrice - triggerPx) / triggerPx) * 100;
    if (delta <= 0)      { badge = "🟢"; action = "PRICE HIT — fire now"; }
    else if (delta < 5)  { badge = "🟡"; action = `${delta.toFixed(1)}% above — close`; }
    else                 { badge = "⚪"; action = `${delta.toFixed(1)}% above ${fmtUsd(triggerPx)}`; }
  }
  const fbDays = t.fallbackDate ? daysUntil(t.fallbackDate) : null;
  // Was a bare `⚠ overdue`, which read identically on day 1 and day 100 — the
  // reason T1's 2026-07-31 lapse sat unnoticed. Overdue states must carry a number.
  const fbStr = fbDays !== null
    ? (fbDays < 0 ? `${overdueSeverity(-fbDays).icon} ${-fbDays}d OVERDUE` : `${fbDays}d fallback`)
    : "";
  const fund = funding && funding[t.tier];
  const fundStr = fund && fund.status !== "funded"
    ? (fund.status === "unfunded" ? " · ⚠ UNFUNDED" : ` · ⚠ only ${fmtUsd(fund.funded)} funded`)
    : "";
  return `${badge} **${t.tier}** · ${fmtUsd(t.target)} · ${action}${fbStr ? ` · ${fbStr}` : ""}${fundStr}`;
}

function buildBriefingPayload({ btcPrice, change24h, ma200w, ma200wDelta, cbbi }, day) {
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
  const isMonday = day === 1;
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" });

  // Tier breakdown. Reserve does not fund the whole ladder — mark what's covered.
  const funding = ladderFunding();
  const lines = BUY_PLAN.tiers.map((t) => tierLine(t, btcPrice, ma200w, funding));

  // Anything actionable today?
  const actionable = BUY_PLAN.tiers.filter((t) => {
    if (t.tier === "IMMEDIATE") return true;
    const triggerPx = t.maMultiple && ma200w ? ma200w * t.maMultiple : t.targetPrice;
    return triggerPx && btcPrice <= triggerPx * 1.05;
  });

  const change = typeof change24h === "number"
    ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}% 24h`
    : "";
  const ma200wDeltaStr = typeof ma200wDelta === "number"
    ? `BTC ${ma200wDelta >= 0 ? "+" : ""}${ma200wDelta.toFixed(1)}% vs MA`
    : "";

  // CBBI zone label
  let cbbiStr = "";
  if (typeof cbbi === "number") {
    // The thresholds were already right; the labels were a retired scheme
    // ("TOP ZONE / hot / warm / mid / accum / BOTTOM") that appears nowhere else
    // on the site. These are the six published band names, and they must stay in
    // step with ZONE_INT in api/cycle-score.js and the table on /score.
    let zone;
    if (cbbi >= 0.85)      zone = "🔴 exit";
    else if (cbbi >= 0.70) zone = "🟠 warning";
    else if (cbbi >= 0.50) zone = "🟡 mid-cycle";
    else if (cbbi >= 0.30) zone = "🔵 re-accumulation";
    else if (cbbi >= 0.15) zone = "🟢 accumulation";
    else                   zone = "🟢 deep accumulation";
    cbbiStr = `  ·  **CBBI ${cbbi.toFixed(2)}** ${zone}`;
  }

  const heroLines = [
    `**₿ ${fmtUsd(btcPrice)}** ${change}  ·  **200W MA ${fmtUsd(ma200w)}** ${ma200wDeltaStr}${cbbiStr}`,
  ];

  let actionBlock = "";
  if (actionable.length > 0) {
    actionBlock = `\n\n🎯 **Action today**\n` + actionable.map((t) => {
      const triggerPx = t.maMultiple && ma200w ? ma200w * t.maMultiple : t.targetPrice;
      const fund = funding[t.tier];
      if (fund && fund.status === "unfunded")
        return `• ⚠ **${t.tier}** would trigger but is UNFUNDED — no reserve behind this rung (reserve covers ~through T2). Nothing to fire unless you fund it.`;
      const cap = fund && fund.status === "partial" ? fund.funded : t.target;
      if (t.tier === "IMMEDIATE")
        return `• Fire ${fmtUsd(cap)} at market — Coinbase Advanced Trade BTC-USD`;
      if (btcPrice <= triggerPx)
        return `• 🟢 **${t.tier} HIT** — Fire ${fmtUsd(cap)} at market now (BTC at ${fmtUsd(btcPrice)}, trigger ${fmtUsd(triggerPx)})${fund && fund.status === "partial" ? " (only this much is funded)" : ""}`;
      return `• 🟡 ${t.tier} within 5% — Ready ${fmtUsd(cap)} (trigger ${fmtUsd(triggerPx)})`;
    }).join("\n");
  }

  const todaySched = dcaForToday();
  const schedIdx = BUY_PLAN.dcaSchedule.indexOf(todaySched);
  const nextSched = BUY_PLAN.dcaSchedule[schedIdx + 1];
  const daysToNext = nextSched ? daysUntil(nextSched.start) : null;

  const dcaBlock = isMonday
    ? `\n\n🔁 **DCA reminder (Monday)**\n• \`$${todaySched.usdc}/day BTC-USDC\` from USDC wallet — cron auto-fires, no action needed\n• \`$${todaySched.bank}/day BTC\` from linked bank — you manage this one in the Coinbase app; confirm it still reads $${todaySched.bank}/day\nCombined ~$${todaySched.usdc + todaySched.bank}/day this phase.`
    : "";

  const tiltBlock = (daysToNext !== null && daysToNext >= 0 && daysToNext <= 7)
    ? `\n\n⚠️ **DCA tilt changes in ${daysToNext}d (${nextSched.start})** — bump the Coinbase recurring buy (bank leg) to \`$${nextSched.bank}/day\`. USDC leg re-tilts itself automatically, nothing to do there.`
    : "";

  // Fallback warnings (anything within 7 days)
  const fbWarnings = BUY_PLAN.tiers
    .filter((t) => t.fallbackDate)
    .map((t) => ({ tier: t.tier, days: daysUntil(t.fallbackDate), date: t.fallbackDate }))
    .filter((x) => x.days >= 0 && x.days <= 14);
  const fbBlock = fbWarnings.length > 0
    ? `\n\n⏰ **Fallback approaching**\n` + fbWarnings.map((w) => `• ${w.tier} force-deploy in ${w.days}d (${w.date})`).join("\n")
    : "";

  return {
    username: "LiftOffr Buy Plan",
    embeds: [{
      title: `Morning Briefing — ${date}`,
      description: heroLines.join("\n") + actionBlock + dcaBlock + tiltBlock + fbBlock + "\n\n**Tier Ladder**\n" + lines.join("\n"),
      color: actionable.length > 0 ? 0x34c759 : 0x4a4a4a,
      footer: { text: `liftoffr.com/dashboard · ${dayName} 8am MT` },
      timestamp: new Date().toISOString(),
    }],
  };
}

// NO FALLBACK, DELIBERATELY. This payload carries BUY_PLAN.totalBudget, every
// tier's dollar amount and "FIRE TODAY @ market" — Torin's personal capital
// position. It used to read `DISCORD_BUY_ALERTS_WEBHOOK || DISCORD_OPS_WEBHOOK`,
// so an unset variable silently redirected all of that to whatever ops pointed
// at. On 2026-08-20 buy-alerts did not exist while ops did, and two of the five
// webhooks in the Discord server point at #market-intel, which sits under the
// free-member-visible "Free Market Feed" category. Nothing appears to have
// leaked, but the fallback made it one config change away.
// If you add a destination, add a NEW named variable. Never `||` onto this one.
async function sendDiscordBriefing(payload) {
  const url = process.env.DISCORD_BUY_ALERTS_WEBHOOK;
  if (!url) {
    console.warn("DISCORD_BUY_ALERTS_WEBHOOK not set — briefing skipped (no fallback by design; this payload contains the budget and the full dollar ladder)");
    return { skipped: true, reason: "DISCORD_BUY_ALERTS_WEBHOOK not set" };
  }
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Discord ${r.status}: ${body.slice(0, 200)}`);
  }
  return { sent: true, status: r.status };
}

async function runDailyBriefing(baseUrl, day) {
  const data = await fetchBtcAnd200wMA(baseUrl);
  const payload = buildBriefingPayload({
    btcPrice: data.usd,
    change24h: data.change24h,
    ma200w: data.ma200w,
    ma200wDelta: data.ma200wDelta,
    cbbi: data.cbbi,
  }, day);
  return sendDiscordBriefing(payload);
}

// ═══════════════════════════════════════════════════════════════════
// DAILY DCA EXECUTION — places two market buys per day via Coinbase
// Advanced Trade API (lower fees than Simple Buy).
//
// Uses a CDP key with Trade permission. Prefers COINBASE_TRADE_KEY_ID /
// COINBASE_TRADE_SECRET if both are set (reserved for a future dedicated
// trade key); otherwise falls back to COINBASE_API_KEY_ID / COINBASE_API_SECRET.
// In this account there is exactly one CDP key (LiftOffrDCA, verified in the
// CDP portal 2026-09-10) and it carries View + Trade + Transfer, so the
// COINBASE_API_* pair IS a trading credential. There is no separate read-only
// sync key — the read/trade split the 2026-08-20 audit tried to preserve does
// not exist in this account.
//
// Safety:
//  - Hardcoded product allowlist (BTC-USDC / BTC-USD only, BUY only)
//  - Per-order cap ($250 — 3x normal size). Anything bigger errors out.
//  - client_order_id = `liftoffr-dca-{pair}-{YYYY-MM-DD}` so a duplicate
//    cron fire on the same day gets rejected by Coinbase, not re-placed.
//  - Discord notification on every fire (success or fail).
// ═══════════════════════════════════════════════════════════════════

const COINBASE_HOST = "api.coinbase.com";
const DCA_ALLOWED_PRODUCTS = new Set(["BTC-USDC", "BTC-USD"]);

export function tradeJWT(method, path, keyId, secretB64) {
  const secretBytes = Buffer.from(secretB64, "base64");
  if (secretBytes.length < 32) throw new Error("Coinbase trade secret too short (expected base64 Ed25519 private key)");
  const seed = secretBytes.subarray(0, 32);
  const pkcs8 = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    seed,
  ]);
  const privateKey = crypto.createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const header = { alg: "EdDSA", kid: keyId, typ: "JWT", nonce: crypto.randomBytes(16).toString("hex") };
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: keyId, iss: "cdp", nbf: now, exp: now + 120, uri: `${method} ${COINBASE_HOST}${path}` };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const signature = crypto.sign(null, Buffer.from(signingInput), privateKey);
  return `${signingInput}.${signature.toString("base64url")}`;
}

export async function cbApi(method, path, keyId, secret, body) {
  // Shared helper for Coinbase v2 + v3 requests using CDP/Ed25519 JWT.
  const jwt = tradeJWT(method, path, keyId, secret);
  const opts = {
    method,
    headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
  };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(`https://${COINBASE_HOST}${path}`, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const reason = data?.errors?.[0]?.message || data?.error || data?.message || JSON.stringify(data).slice(0, 200);
    const err = new Error(`Coinbase ${r.status}: ${reason}`);
    err.status = r.status;
    err.body = data;
    throw err;
  }
  return data;
}

// --- v2 Simple Buy path (bank-funded) ---
async function findBankPaymentMethodId(keyId, secret) {
  const data = await cbApi("GET", "/v2/payment-methods?limit=100", keyId, secret);
  const methods = data.data || [];
  // Prefer a verified ACH bank account.
  const bank = methods.find((m) =>
    (m.type === "ach_bank_account" || m.type === "fiat_account") &&
    m.allow_buy && m.verified
  ) || methods.find((m) => m.allow_buy && m.verified);
  if (!bank) throw new Error("No verified bank payment method found");
  return { id: bank.id, name: bank.name, type: bank.type };
}

async function findBtcAccountId(keyId, secret) {
  const data = await cbApi("GET", "/v2/accounts?limit=250", keyId, secret);
  const account = (data.data || []).find((a) => {
    const code = typeof a.currency === "string" ? a.currency : a.currency?.code;
    return code === "BTC";
  });
  if (!account) throw new Error("No BTC account found");
  return account.id;
}

async function placeV2Buy({ amount, dateIso, keyId, secret, btcAccountId, paymentMethodId }) {
  const cap = DCA_MAX_QUOTE_SIZE;
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0 || n > cap) {
    throw new Error(`v2 buy amount ${n} outside [0, ${cap}]`);
  }
  const path = `/v2/accounts/${btcAccountId}/buys`;
  const body = {
    amount: n.toFixed(2),
    currency: "USD",
    payment_method: paymentMethodId,
    commit: true,
    // Idempotency: 'idem' field tied to today's date keeps same-day retries safe.
    idem: `liftoffr-dca-v2-buy-${dateIso}`,
  };
  const data = await cbApi("POST", path, keyId, secret, body);
  const buy = data?.data || data;
  return {
    success: true,
    productId: "BTC-USD (v2 simple)",
    quoteSize: n,
    orderId: buy?.id,
    raw: data,
  };
}

export async function placeMarketBuy({ productId, quoteSize, dateIso, keyId, secret, clientOrderId }) {
  if (!DCA_ALLOWED_PRODUCTS.has(productId)) {
    throw new Error(`product ${productId} not in DCA allowlist`);
  }
  const amount = Number(quoteSize);
  if (!Number.isFinite(amount) || amount <= 0 || amount > DCA_MAX_QUOTE_SIZE) {
    throw new Error(`quote_size ${amount} outside [0, ${DCA_MAX_QUOTE_SIZE}]`);
  }
  const path = "/api/v3/brokerage/orders";
  const body = {
    // A caller may override the idempotency key (the manual test does, so a $10
    // test never collides with — or masquerades as — the real daily order).
    client_order_id: clientOrderId || `liftoffr-dca-${productId}-${dateIso}`,
    product_id: productId,
    side: "BUY",
    order_configuration: {
      market_market_ioc: { quote_size: amount.toFixed(2) },
    },
  };
  const jwt = tradeJWT("POST", path, keyId, secret);
  const r = await fetch(`https://${COINBASE_HOST}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.success === false) {
    const reason = data?.error_response?.error || data?.error || JSON.stringify(data).slice(0, 200);
    throw new Error(`Coinbase ${r.status}: ${reason}`);
  }
  return {
    success: true,
    productId,
    quoteSize: amount,
    orderId: data?.success_response?.order_id || data?.order_id,
    raw: data,
  };
}

// CREDENTIAL SELECTION. This function places real market buys. It prefers a
// dedicated trade key (COINBASE_TRADE_*) if BOTH of those vars are set, and
// otherwise uses COINBASE_API_* — which in this account (verified in the CDP
// portal 2026-09-10) is the one and only CDP key, LiftOffrDCA, carrying Trade
// permission. The fallback is safe here because there is no read-only key to
// fall back ONTO; the "sync key" the earlier audit guarded against is fictional
// in this account. If a dedicated trade key is ever added, set COINBASE_TRADE_*
// and it takes precedence automatically. The fallback is announced on every
// fire (credentialSource: "api-fallback") so the switchover is never silent.
//
// WHAT ACTUALLY HAPPENED (corrected 2026-09-10):
//   - 2026-05-29 → 2026-08-20: the code fell back to COINBASE_API_* and DID
//     submit a real BTC-USDC order every day. Coinbase REJECTED them. The reason
//     is UNKNOWN — the throw was swallowed, so nobody ever read it. (It was not
//     an unfunded wallet: the USDC balance was $74,498 on 2026-09-10.) It did
//     NOT silently skip.
//   - 2026-08-20 (f846878) → 2026-09-10: the fallback was removed on the belief
//     that COINBASE_API_* was read-only. With COINBASE_TRADE_* unset, the guard
//     returned { skipped: true } and it genuinely placed nothing for ~3 weeks.
//   The old "silent for 103 days" note conflated these two different failures
//   and was wrong on both counts (rejection vs skip; and the key is not
//   read-only). Zero BTC was bought on this leg across the whole span.
//
// LOUD, NOT SILENT. Any exit path that does not place the order MUST return
// notify:true, and Coinbase's actual rejection reason MUST be surfaced (it is,
// via results[].error → the Discord payload). That silence is what hid this.
// Credential resolution for the DCA order path — the ONE place that decides
// which key signs a live buy. Prefer a dedicated trade key (both COINBASE_TRADE_*
// set); otherwise fall back to COINBASE_API_* (the account's CDP key, which has
// Trade permission here). Never mix a key id from one pair with a secret from the
// other. Exported so the manual test proves the SAME resolution the cron uses.
export function resolveDcaCredential() {
  const hasTradePair = Boolean(process.env.COINBASE_TRADE_KEY_ID && process.env.COINBASE_TRADE_SECRET);
  const keyId = hasTradePair ? process.env.COINBASE_TRADE_KEY_ID : process.env.COINBASE_API_KEY_ID;
  const secret = hasTradePair ? process.env.COINBASE_TRADE_SECRET : process.env.COINBASE_API_SECRET;
  const credentialSource = hasTradePair ? "trade" : "api-fallback";
  // When neither pair is usable, name the primary credential (COINBASE_API_*),
  // not the optional trade override.
  const missing = [
    !keyId && "COINBASE_API_KEY_ID",
    !secret && "COINBASE_API_SECRET",
  ].filter(Boolean);
  return { keyId, secret, credentialSource, missing };
}

// ═══════════════════════════════════════════════════════════════════════════
// SPLIT-ORDER DCA (added 2026-09-12) — inert unless DCA_MODE="risk-weighted".
// The $250 per-order cap is a HARD THROW, not a clip, so a daily amount above
// $250 must be placed as several sub-$250 orders. This is what lets the stack
// deploy faster than $250/day and lets the risk weighting exceed $125/day base.
// ═══════════════════════════════════════════════════════════════════════════
const MAX_ORDERS_PER_DAY = 6;   // sanity ceiling; assertDcaSplitConfig enforces

// Config-time guard: fail at deploy if the chosen stack+horizon could ever need
// an order over the cap or more than MAX_ORDERS_PER_DAY.
if (DCA_MODE === "risk-weighted") assertDcaSplitConfig(DCA_STACK_USDC, DCA_HORIZON_END, DCA_START);

// Split a daily USDC amount into whole orders each <= the cap, summing exactly.
export function splitDcaIntoOrders(amountUsdc, cap = DCA_MAX_QUOTE_SIZE) {
  const amt = Math.round(Number(amountUsdc) * 100) / 100;
  if (!Number.isFinite(amt) || amt <= 0) return [];
  const n = Math.ceil(amt / cap);
  const base = Math.floor((amt / n) * 100) / 100;
  const orders = Array(n).fill(base);
  orders[n - 1] = Math.round((amt - base * (n - 1)) * 100) / 100;
  return orders;
}

// Risk weight: buy more when CBBI is low, less when high. weight(0.5)=1.0,
// clamped [0.25, 2.0]. (Mirrors _dca-risk-weighting.PROPOSED.js.)
export function dcaRiskWeight(risk) {
  if (!Number.isFinite(risk) || risk < 0 || risk > 1) return 1.0;
  return Math.min(2.0, Math.max(0.25, 1 + (0.5 - risk) * 2));
}

// Config-time assertion: fail at deploy, not at 15:00, if the chosen stack +
// horizon could ever demand an order over the cap or more than MAX_ORDERS_PER_DAY.
// Worst case is day one (whole stack over the fewest days) at max weight (2x).
export function assertDcaSplitConfig(stackUsdc, horizonEnd, todayIso) {
  const daysLeft = Math.max(1, Math.round((Date.parse(horizonEnd + "T00:00:00Z") - Date.parse(todayIso + "T00:00:00Z")) / 864e5) + 1);
  const worstDaily = (Number(stackUsdc) / daysLeft) * 2.0;      // day 1, 2x weight
  const orders = splitDcaIntoOrders(worstDaily);
  if (orders.length > MAX_ORDERS_PER_DAY) {
    throw new Error(`DCA split config: $${stackUsdc} over ${daysLeft}d at 2x = $${worstDaily.toFixed(0)}/day = ${orders.length} orders > MAX_ORDERS_PER_DAY (${MAX_ORDERS_PER_DAY}). Extend the horizon, lower the stack, or raise the ceiling deliberately.`);
  }
  if (orders.some((o) => o > DCA_MAX_QUOTE_SIZE)) {
    throw new Error(`DCA split config: an order exceeds the $${DCA_MAX_QUOTE_SIZE} cap — split math is wrong.`);
  }
  return { daysLeft, worstDaily: Math.round(worstDaily), worstOrders: orders.length };
}

// Place N sub-cap orders for one day. Indexed idempotency key so same-day orders
// do not collide (the old per-day key allowed exactly one). Sums ACTUAL filled
// sizes rather than assuming full fills. Returns ONE aggregate result so the
// heartbeat is a single line, not N Discord posts.
async function placeDcaOrders(orders, { dateIso, keyId, secret }) {
  const single = orders.length === 1;
  const placed = [];
  let filledUsd = 0, anyFail = null, dupAll = true;
  for (let i = 0; i < orders.length; i++) {
    const clientOrderId = single
      ? `liftoffr-dca-BTC-USDC-${dateIso}`               // preserve the historical single-order key
      : `liftoffr-dca-BTC-USDC-${dateIso}-${i}`;
    try {
      const r = await placeMarketBuy({ productId: "BTC-USDC", quoteSize: orders[i], dateIso, keyId, secret, clientOrderId });
      // Sum the real filled quote size when Coinbase reports it; fall back to the requested size.
      const got = Number(r?.raw?.success_response?.filled_value ?? r?.quoteSize ?? orders[i]);
      filledUsd += Number.isFinite(got) ? got : orders[i];
      placed.push({ i, ok: true, quoteSize: orders[i], orderId: r.orderId });
      dupAll = false;
    } catch (err) {
      const dup = /duplicate/i.test(err.message) || /already exists/i.test(err.message);
      if (!dup) { anyFail = err.message; dupAll = false; }
      placed.push({ i, ok: dup, quoteSize: orders[i], error: err.message, dup });
    }
  }
  const ok = placed.every((p) => p.ok);
  return {
    dca: "USDC", ok, productId: "BTC-USDC",
    quoteSize: Math.round(orders.reduce((s, o) => s + o, 0) * 100) / 100,
    orderCount: orders.length, filledUsd: Math.round(filledUsd * 100) / 100,
    orderId: placed.find((p) => p.orderId)?.orderId, error: anyFail || undefined,
    dup: dupAll && placed.length > 0,
  };
}

// Daily-DCA spend since the remap start, derived from Coinbase fills — the only
// stateless source on Vercel. ISOLATION: counts ONLY small BTC-USDC buys
// (usd < DCA_DAILY_FILL_MAX); a tier/manual fill ($4k+) is never counted as
// daily spend, and the cron never places anything but these small daily orders,
// so the daily leg cannot draw down the reserved ladder capital.
export function computeDcaSpentUsd(trades, startIso = DCA_START, fillMax = DCA_DAILY_FILL_MAX) {
  if (!Array.isArray(trades)) return 0;
  let sum = 0;
  for (const t of trades) {
    if ((t.type || "buy") !== "buy") continue;
    if (!String(t.notes || "").includes("BTC-USDC")) continue;
    const usd = Number(t.usd || 0);
    if (!(usd > 0) || usd >= fillMax) continue;           // exclude ladder/manual buys
    if (String(t.date || "").slice(0, 10) < startIso) continue;
    sum += usd;
  }
  return Math.round(sum * 100) / 100;
}

// Risk-weighted daily USDC amount, self-correcting on remaining stack so it lands
// on the horizon and can never exceed DCA_STACK_USDC. Degrades cleanly at the
// edges: after the horizon or once the stack is spent it returns usdc:0 with a
// stop reason (never negative, never divides by zero — daysLeft is floored at 1).
export function riskWeightedDailyUsdc({ trades, todayIso, cbbi = null, cbbiAsOf = null } = {}) {
  const spent = computeDcaSpentUsd(trades);
  const remaining = Math.max(0, Math.round((DCA_STACK_USDC - spent) * 100) / 100);
  if (todayIso > DCA_HORIZON_END) return { usdc: 0, orders: [], stop: "horizon-reached", spent, remaining };
  if (remaining <= 0)             return { usdc: 0, orders: [], stop: "stack-deployed", spent, remaining };

  const daysLeft = Math.max(1, Math.round((Date.parse(DCA_HORIZON_END + "T00:00:00Z") - Date.parse(todayIso + "T00:00:00Z")) / 864e5) + 1);
  const base = remaining / daysLeft;

  let weight = 1.0, reason = "no CBBI — flat remaining/day";
  if (Number.isFinite(cbbi)) {
    const age = cbbiAsOf ? Math.round((Date.parse(todayIso + "T00:00:00Z") - Date.parse(cbbiAsOf + "T00:00:00Z")) / 864e5) : 0;
    if (age > 3) reason = `CBBI ${age}d stale — flat remaining/day`;
    else { weight = dcaRiskWeight(cbbi); reason = `CBBI ${cbbi.toFixed(3)} x${weight.toFixed(2)} on $${base.toFixed(0)} base`; }
  }
  const daily = Math.min(remaining, Math.round(base * weight * 100) / 100);
  return { usdc: daily, orders: splitDcaIntoOrders(daily), base: Math.round(base * 100) / 100, weight, reason, spent, remaining, daysLeft };
}

async function runDailyDCA(baseUrl) {
  const dateIso = new Date().toISOString().slice(0, 10);
  const { keyId, secret, credentialSource, missing } = resolveDcaCredential();
  if (DCA_MODE === "fixed-cash") {
    const request = async (method, path, body) => {
      if (missing.length) throw new Error("DCA credentials missing");
      const token = tradeJWT(method, path.split("?")[0], keyId, secret);
      const response = await fetch(`https://${COINBASE_HOST}${path}`, {
        method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Coinbase HTTP ${response.status}; reconcile before retry`);
      return response.json();
    };
    const fixed = await runFixedCashDca({ day: dateIso, request,
      live: process.env.DCA_FIXED_CASH_LIVE === "true" });
    return { ...fixed, ts: new Date().toISOString(), credentialSource };
  }
  let usdcAmount = dcaForToday(dateIso).usdc;

  if (!keyId || !secret) {
    console.error(`DCA NOT PLACED — ${missing.join(" and ")} unset.`);
    return {
      ts: new Date().toISOString(),
      notify: true,
      fatal: true,
      reason: "credentials-missing",
      missing,
      intendedUsdc: usdcAmount,
      results: [],
    };
  }
  const results = [];

  // Risk-weighted sizing (Cowen method, approved 2026-09-12). Self-corrects on
  // the remaining non-ladder stack so it lands on DCA_HORIZON_END and can never
  // exceed DCA_STACK_USDC. Spend is read from Coinbase (stateless on Vercel).
  let dcaMeta = null;
  if (DCA_MODE === "risk-weighted") {
    let trades = null, cbbi = null, cbbiAsOf = null, syncOk = false;
    try {
      const r = await fetch(`${baseUrl}/api/coinbase-sync`, {
        headers: { Authorization: `Basic ${Buffer.from(`cron:${process.env.DASHBOARD_PASSWORD}`).toString("base64")}` },
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && Array.isArray(d.trades)) { trades = d.trades; syncOk = true; }
    } catch (e) { console.error("dca: coinbase-sync fetch failed", e.message); }
    try {
      const r = await fetch(`${baseUrl}/api/btc-price`);
      const d = await r.json().catch(() => ({}));
      if (Number.isFinite(d.cbbi)) { cbbi = d.cbbi; cbbiAsOf = d.cbbiTs ? new Date(d.cbbiTs * 1000).toISOString().slice(0, 10) : dateIso; }
    } catch (e) { console.error("dca: btc-price/cbbi fetch failed", e.message); }

    if (syncOk) {
      const w = riskWeightedDailyUsdc({ trades, todayIso: dateIso, cbbi, cbbiAsOf });
      if (w.stop) {
        console.log(`DCA ${w.stop} — spent $${w.spent} of $${DCA_STACK_USDC}; nothing placed`);
        return { ts: new Date().toISOString(), notify: true, fatal: false, reason: w.stop, credentialSource, intendedUsdc: 0, results: [], dcaMeta: w };
      }
      usdcAmount = w.usdc; dcaMeta = w;
    } else {
      // Sync unavailable: we cannot read spend, so we must NOT assume zero (that
      // would over-buy into the reserve). Fall back to the flat horizon rate x
      // weight — bounded by design, and warn.
      const totalDays = Math.max(1, Math.round((Date.parse(DCA_HORIZON_END + "T00:00:00Z") - Date.parse(DCA_START + "T00:00:00Z")) / 864e5) + 1);
      const base = DCA_STACK_USDC / totalDays;
      const weight = Number.isFinite(cbbi) ? dcaRiskWeight(cbbi) : 1.0;
      usdcAmount = Math.round(base * weight * 100) / 100;
      dcaMeta = { reason: `sync down — flat $${base.toFixed(0)} base x${weight.toFixed(2)}`, weight, fallback: true };
      console.warn("dca: coinbase-sync down — using flat fallback base");
    }
  }

  // DCA #1 — v3 Advanced Trade BTC-USDC from USDC wallet.
  // DCA #2 (bank-funded) runs as a Coinbase UI recurring buy — v2 buys API
  // returns 404 under CDP/JWT auth (appears deprecated). Sync picks up its
  // fills automatically via the v2 transactions endpoint.
  // Place the daily USDC buy, splitting into sub-$250 orders when the amount
  // exceeds the per-order cap. For the current calendar amount ($110) this is a
  // single un-suffixed order — behaviour identical to before. Amounts above
  // $250 (e.g. a risk-weighted or full-stack rate) fan out into indexed orders.
  const orders = splitDcaIntoOrders(usdcAmount);
  results.push(await placeDcaOrders(orders, { dateIso, keyId, secret }));

  // Log every outcome verbatim. With no buy-alerts webhook set, this console
  // line is the only place Coinbase's raw response is captured — and reading
  // that response is the entire point of this fix.
  for (const r of results) {
    if (r.ok && !r.dup) console.log(`DCA PLACED :: ${r.productId} $${r.quoteSize} order=${r.orderId} (credential=${credentialSource})`);
    else if (r.ok && r.dup) console.log(`DCA DUPLICATE (already placed today) :: ${r.productId} $${r.quoteSize}`);
    else console.error(`DCA REJECTED (verbatim Coinbase response) :: ${r.productId} $${r.quoteSize} :: ${r.error}`);
  }

  const failed = results.filter((r) => !r.ok);
  return {
    ts: new Date().toISOString(),
    // Successes are worth one line a day; failures must never be swallowed.
    notify: true,
    fatal: failed.length > 0,
    reason: failed.length > 0 ? "order-failed" : "ok",
    intendedUsdc: usdcAmount,
    credentialSource,
    dcaMeta,
    results,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TIER WATCH — hourly check for any buy tier crossing its trigger.
// Pings Discord with manual order details so the user knows to fire.
// Dedup is automatic via Coinbase sync — once the lump tier is filled,
// the alert stops firing.
// ═══════════════════════════════════════════════════════════════════

// Escalation cadence for a lapsed fallback date, in days-overdue. Deliberately
// stateless — there is no store to remember "did we already ping day 14?", so
// the schedule is a pure function of how overdue the tier is, evaluated once a
// day. Dense at first, then monthly forever: the point is that it never stops
// and never settles into background noise you can scroll past.
export function shouldEscalateOverdue(days) {
  if (!Number.isFinite(days) || days <= 0) return false;
  if (days <= 7) return true;              // first week: daily
  if (days <= 30) return days % 7 === 0;   // first month: weekly
  return days % 30 === 0;                  // thereafter: monthly, indefinitely
}

export function overdueSeverity(days) {
  if (days > 90) return { icon: "🟥", word: "THREE MONTHS OVERDUE" };
  if (days > 30) return { icon: "🟧", word: "OVER A MONTH OVERDUE" };
  if (days > 7)  return { icon: "🟨", word: "OVERDUE" };
  return { icon: "⏰", word: "fallback date passed" };
}

async function runTierWatch(baseUrl, { isDailySendHour = false } = {}) {
  const data = await fetchBtcAnd200wMA(baseUrl);
  if (!data || !Number.isFinite(data.usd) || !Number.isFinite(data.ma200w)) {
    return { skipped: true, reason: "no price/MA" };
  }

  // Fetch trades to figure out which tiers are already filled.
  // /api/coinbase-sync sits behind the dashboard's Basic Auth middleware — must
  // authenticate this internal call or it 401s and every tier looks unfilled.
  const sync = await fetch(`${baseUrl}/api/coinbase-sync`, {
    headers: { Authorization: `Basic ${Buffer.from(`cron:${process.env.DASHBOARD_PASSWORD}`).toString("base64")}` },
  });
  const syncData = await sync.json().catch(() => ({}));
  const trades = syncData.trades || [];
  // The filter here used to be `usd >= 100`. The Phase 2 USDC DCA leg is
  // $110/day, so once the DCA starts placing orders again every daily buy would
  // waterfall into IMMEDIATE/T1/T2 as if it were a lump tier fire — marking
  // tiers "done" with DCA money and silencing the alerts for them. Same
  // plan-relative test as reconciliation: above this leg's plausible daily DCA
  // size, it is a lump. (dashboard/index.html lumpFills() still uses the old
  // >= 100 rule and needs the same change — flagged for Torin, not done here,
  // because it changes what the dashboard displays.)
  const lumpBuys = trades
    .filter((t) => {
      if ((t.type || "buy") !== "buy") return false;
      const usd = Number(t.usd || 0);
      const date = String(t.date || "");
      if (date < PLAN_START) return false;
      return usd > dcaFillCeiling(dcaForDate(date.slice(0, 10))[legOf(t)]);
    })
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  // Waterfall fill into the lump tiers — single source of truth is BUY_PLAN.tiers.
  // Trigger resolution is shared with the dashboard via effectiveTriggerPrice().
  const cowenTiers = (data.cowen && data.cowen.tiers) || {};
  const TIERS = BUY_PLAN.tiers.map((t) => ({
    name: t.tier,
    target: t.target,
    label: t.trigger,
    fallbackDate: t.fallbackDate || null,
    triggerPx: effectiveTriggerPrice(t, {
      ma200w: data.ma200w,
      cowenPrice: cowenTiers[t.tier] ? cowenTiers[t.tier].price : null,
      spot: data.usd,
    }),
  }));

  let remaining = lumpBuys.reduce((s, t) => s + (t.usd || 0), 0);
  const tierStates = TIERS.map((t) => {
    const fillAmount = Math.min(t.target, Math.max(0, remaining));
    remaining = Math.max(0, remaining - fillAmount);
    const overdueDays = t.fallbackDate ? -daysUntil(t.fallbackDate) : null;
    return {
      ...t,
      filled: fillAmount,
      remaining: t.target - fillAmount,
      hit: Number.isFinite(t.triggerPx) && data.usd <= t.triggerPx,
      done: fillAmount >= t.target * 0.97,
      overdueDays: overdueDays !== null && overdueDays > 0 ? overdueDays : 0,
    };
  });

  const actionable = tierStates.filter((t) => t.hit && !t.done);

  // ── Overdue fallback escalation ──────────────────────────────────────────
  // A fallback date is the plan's own admission that "wait for the price" can
  // fail. Before this, runTierWatch ignored fallbackDate entirely and the only
  // trace of a lapsed one was the string "⚠ overdue" in the daily briefing —
  // static, undated, and identical on day 1 and day 100. T1's date passed on
  // 2026-07-31 and said exactly the same thing every day since.
  //
  // This escalates and it does NOT execute. Nothing in this file may place an
  // order for a lump tier; these are manual-execution pings by design, and an
  // overdue date is a prompt to make a decision (fire it, move the date, or
  // strike the tier), never an instruction to the machine to act.
  const overdue = tierStates.filter((t) => t.overdueDays > 0 && !t.done);
  const dueEscalation = overdue.filter((t) => shouldEscalateOverdue(t.overdueDays) && isDailySendHour);

  // On-chain bottom confluence (from btc-price ?ma200w=1 onchain block)
  const oc = data.onchain || {};
  const volCap = Number.isFinite(oc.volRatio) && oc.volRatio >= 3.5 && oc.volRed !== false;
  const bearWk = (Date.now() - Date.parse("2025-10-06")) / (7 * 864e5);
  const lit = [
    Number.isFinite(oc.realizedPrice) && data.usd < oc.realizedPrice,
    Number.isFinite(oc.mvrvZ) && oc.mvrvZ < 0,
    Number.isFinite(oc.puell) && oc.puell < 0.5,
    Number.isFinite(data.cbbi) && data.cbbi <= 0.20,
    bearWk >= 50,
    volCap,
    Number.isFinite(oc.weeklyRsi) && oc.weeklyRsi < 30,
  ].filter(Boolean).length;
  const ocLine = `📡 realized ${Number.isFinite(oc.realizedPrice) ? fmtUsd(oc.realizedPrice) : "—"} · MVRV-Z ${Number.isFinite(oc.mvrvZ) ? oc.mvrvZ.toFixed(2) : "—"} · Puell ${Number.isFinite(oc.puell) ? oc.puell.toFixed(2) : "—"} · vol ${Number.isFinite(oc.volRatio) ? oc.volRatio.toFixed(1) + "×" : "—"} · wk ${bearWk.toFixed(0)}/50–60 · **${lit}/7 bottom signals lit**`;

  if (actionable.length === 0 && !volCap && dueEscalation.length === 0) {
    return {
      skipped: true,
      reason: "no tier actionable",
      btcPrice: data.usd,
      bottomSignalsLit: lit,
      // Reported even when nothing is sent, so the cron response itself shows
      // the overdue state rather than only the Discord message showing it.
      overdue: overdue.map((t) => ({ name: t.name, days: t.overdueDays, remaining: t.remaining })),
    };
  }

  const lines = actionable.map((t) => {
    const expectedBtc = (t.remaining / data.usd).toFixed(4);
    return `**🟢 ${t.name} HIT** — ${t.label}\n` +
           `Fire **${fmtUsd(t.remaining)}** BTC-USDC market buy\n` +
           `Trigger ${fmtUsd(t.triggerPx)} · BTC now ${fmtUsd(data.usd)} · Expected ~${expectedBtc} BTC`;
  });
  if (volCap) {
    lines.unshift(
      `**🔻 VOLUME CAPITULATION** — 24h volume ${oc.volRatio.toFixed(1)}× its 30-day average on a red candle.\n` +
      `Every prior cycle bottom (2018 · 2020 · 2022) printed this signature. ` +
      (bearWk >= 50 ? `**Inside the 50–60wk time window too — this is the confluence the plan waits for.**` : `Time window (wk 50–60) opens later — could be a mid-bear flush.`) +
      `\n(repeats hourly while the spike persists)`
    );
  }

  for (const t of dueEscalation) {
    const sev = overdueSeverity(t.overdueDays);
    lines.push(
      `${sev.icon} **${t.name} — ${sev.word}** (${t.overdueDays}d past ${t.fallbackDate})\n` +
      `${fmtUsd(t.remaining)} of this tier is still unfilled and the date the plan set for deploying it anyway has passed. ` +
      `Trigger ${Number.isFinite(t.triggerPx) ? fmtUsd(t.triggerPx) : "—"} · BTC now ${fmtUsd(data.usd)}.\n` +
      `**Decide, don't ignore:** fire it manually, move the fallback date in \`api/_buy-plan.js\`, or strike the tier. ` +
      `Nothing is automated here — this alert repeats until the tier is filled or the date changes.`
    );
  }

  const header = actionable.length === 0 && volCap
    ? "🔻 **VOLUME CAPITULATION DETECTED** 🔻"
    : actionable.length === 0 && dueEscalation.length > 0
      ? `⏰ **${dueEscalation.length} TIER FALLBACK DATE${dueEscalation.length > 1 ? "S" : ""} OVERDUE** ⏰`
      : actionable.length === 1 ? "🚨 **BUY TIER HIT** 🚨" : `🚨 **${actionable.length} BUY TIERS HIT** 🚨`;

  const dmResult = await sendOwnerDM(
    `${header}\n\n${lines.join("\n\n")}\n\n${ocLine}\n\n` +
    `_Manual execute · Coinbase Advanced Trade BTC-USDC · liftoffr.com/dashboard_`
  ).catch((e) => ({ ok: false, reason: e.message }));

  return {
    ts: new Date().toISOString(),
    btcPrice: data.usd,
    volCap,
    bottomSignalsLit: lit,
    actionable: actionable.map((t) => ({ name: t.name, remaining: t.remaining, triggerPx: t.triggerPx })),
    overdue: overdue.map((t) => ({ name: t.name, days: t.overdueDays, remaining: t.remaining })),
    escalated: dueEscalation.map((t) => t.name),
    dm: dmResult,
  };
}

// ═══════════════════════════════════════════════════════════════════
// DCA RECONCILIATION — intended vs actually cleared.
//
// Nothing in this system ever compared the two. The dashboard's cadence() is
// the closest thing, and it is an *observation*, not a check: it infers the
// schedule from a 45-day median of fills, so it cannot notice a phase change
// for roughly six weeks, and because it takes the median of all fill SIZES it
// reads "$50/day" whether the bank leg is set to $40 or $60.
//
// The consequence was that a USDC leg placing exactly $0/day for 103 days
// looked, from every surface Torin actually reads, like a running DCA.
//
// This function is deliberately dumb and absolute: the plan says N dollars on
// day D; the exchange says M dollars cleared on day D; if N and M disagree,
// say so. It reads. It never places, modifies or cancels anything.
// ═══════════════════════════════════════════════════════════════════

// Separating a DCA fill from a lump tier fire cannot be done with a flat dollar
// threshold. The codebase used `>= $100 means lump` in two places — and the
// Phase 2 USDC DCA leg is $110/day. From 2026-09-01 every single daily DCA buy
// would have been counted as a lump tier fill, silently filling IMMEDIATE/T1/T2
// with dollar-cost-averaging money and switching off the tier alerts that
// depend on those tiers being unfilled. That never bit only because the DCA has
// not placed an order since it was written.
//
// So classify against the PLAN instead of against a magic number: a fill is DCA
// if it is plausibly this leg's scheduled daily amount for that date. Lump tiers
// in this ladder start at $4,000, so there is no overlap.
export function dcaFillCeiling(scheduledForLeg) {
  // Outside the plan window the schedule is zero. Falling through to a ceiling of
  // zero would classify every small buy as a lump tier fire, so a recurring buy
  // left running past 2027-03-31 would start filling tiers on its own. Hold the
  // old $100 floor there instead.
  if (!(scheduledForLeg > 0)) return 100;
  return Math.min(DCA_MAX_QUOTE_SIZE, Math.max(scheduledForLeg * 2, 100));
}
const RECON_LOOKBACK_DAYS = 30;
const RECON_TOLERANCE = 0.10;   // cumulative drift before it is called divergence
const RECON_SILENT_DAYS = 3;    // consecutive dry days on a leg before alarm

function isoAddDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function legOf(trade) {
  // v3 fills carry the product id in `notes`; v2 simple buys carry "simple-buy".
  const n = String(trade.notes || "");
  if (n.includes("BTC-USDC")) return "usdc";
  return "bank";
}

function median(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// Pure, so it can be tested against fixtures without a network or a clock.
export function reconcileDca({
  trades = [],
  todayIso,
  lookbackDays = RECON_LOOKBACK_DAYS,
  tolerance = RECON_TOLERANCE,
  silentDays = RECON_SILENT_DAYS,
} = {}) {
  // Yesterday is the last fully-settled day; today's buy may not have cleared.
  const end = isoAddDays(todayIso, -1);
  let start = isoAddDays(todayIso, -lookbackDays);
  if (start < PLAN_START) start = PLAN_START;
  if (end < start) return { skipped: true, reason: "window before plan start" };

  const days = [];
  for (let d = start; d <= end; d = isoAddDays(d, 1)) days.push(d);

  const intended = { usdc: 0, bank: 0 };
  for (const d of days) {
    const s = dcaForDate(d);
    intended.usdc += s.usdc;
    intended.bank += s.bank;
  }

  const byDay = { usdc: {}, bank: {} };
  const actual = { usdc: 0, bank: 0 };
  for (const t of trades) {
    if ((t.type || "buy") !== "buy") continue;
    const usd = Number(t.usd || 0);
    if (!(usd > 0)) continue;
    const date = String(t.date || "").slice(0, 10);
    if (date < start || date > end) continue;
    const leg = legOf(t);
    if (usd > dcaFillCeiling(dcaForDate(date)[leg])) continue;  // lump tier fire
    actual[leg] += usd;
    byDay[leg][date] = (byDay[leg][date] || 0) + usd;
  }

  const legs = ["usdc", "bank"].map((leg) => {
    const int = Math.round(intended[leg] * 100) / 100;
    const act = Math.round(actual[leg] * 100) / 100;
    const diff = Math.round((act - int) * 100) / 100;
    const pct = int > 0 ? diff / int : (act > 0 ? 1 : 0);

    // Trailing dry run: how many consecutive settled days had zero fills.
    let dry = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if ((byDay[leg][days[i]] || 0) > 0) break;
      dry++;
    }

    // Observed rate over the last 7 settled days vs what today's phase says it
    // should be. This is the part cadence() structurally cannot do: it compares
    // against the SCHEDULE, not against the recent past, so a phase change shows
    // up the day after it takes effect instead of half a median-window later.
    const recent = days.slice(-7);
    const observedRate = median(recent.map((d) => byDay[leg][d] || 0));
    const scheduledRate = dcaForDate(end)[leg];

    const flags = [];
    if (int > 0 && dry >= silentDays) flags.push("leg-silent");
    if (int > 0 && Math.abs(pct) > tolerance) flags.push("cumulative-divergence");
    if (scheduledRate > 0 && Math.abs(observedRate - scheduledRate) >= 1) flags.push("rate-mismatch");

    return { leg, intended: int, actual: act, diff, pct, dryDays: dry, observedRate, scheduledRate, flags };
  });

  const combined = {
    intended: Math.round((intended.usdc + intended.bank) * 100) / 100,
    actual: Math.round((actual.usdc + actual.bank) * 100) / 100,
  };
  combined.diff = Math.round((combined.actual - combined.intended) * 100) / 100;

  return {
    window: { start, end, days: days.length },
    legs,
    combined,
    ok: legs.every((l) => l.flags.length === 0),
  };
}

export function buildReconciliationPayload(rec) {
  const legName = { usdc: "USDC leg (API, automated)", bank: "Bank leg (Coinbase recurring buy)" };
  const explain = {
    "leg-silent": (l) => `**${l.dryDays} consecutive days with no fills at all.** The plan expected money to move on every one of them.`,
    "cumulative-divergence": (l) => `Cleared **${fmtUsd(l.actual)}** against an intended **${fmtUsd(l.intended)}** — **${l.diff < 0 ? "short by" : "over by"} ${fmtUsd(Math.abs(l.diff))}** (${(l.pct * 100).toFixed(1)}%).`,
    "rate-mismatch": (l) => `Running at **$${l.observedRate}/day**, schedule says **$${l.scheduledRate}/day**.` +
      (l.leg === "bank" ? " The bank leg is a recurring buy inside the Coinbase app — only you can change it." : ""),
  };

  const bad = rec.legs.filter((l) => l.flags.length);
  const lines = bad.map((l) =>
    `**${legName[l.leg]}**\n` + l.flags.map((f) => `• ${explain[f](l)}`).join("\n")
  );

  return {
    username: "LiftOffr DCA Bot",
    embeds: [{
      title: "🔎 DCA reconciliation — intent and reality disagree",
      description:
        `Window **${rec.window.start} → ${rec.window.end}** (${rec.window.days}d)\n` +
        `Intended **${fmtUsd(rec.combined.intended)}** · cleared **${fmtUsd(rec.combined.actual)}** · ` +
        `**${rec.combined.diff < 0 ? "short" : "over"} ${fmtUsd(Math.abs(rec.combined.diff))}**\n\n` +
        lines.join("\n\n"),
      color: 0xff9f0a,
      footer: { text: "Read-only check. Nothing was bought, changed or cancelled." },
      timestamp: new Date().toISOString(),
    }],
  };
}

async function runReconciliation(baseUrl) {
  const sync = await fetch(`${baseUrl}/api/coinbase-sync`, {
    headers: { Authorization: `Basic ${Buffer.from(`cron:${process.env.DASHBOARD_PASSWORD}`).toString("base64")}` },
  });
  const syncData = await sync.json().catch(() => ({}));
  if (!sync.ok || !Array.isArray(syncData.trades)) {
    // Cannot verify is not the same as verified-fine, and must not read as fine.
    return { error: true, reason: `coinbase-sync unavailable (${sync.status})`, notify: true };
  }

  const rec = reconcileDca({ trades: syncData.trades, todayIso: new Date().toISOString().slice(0, 10) });
  if (rec.skipped || rec.ok) return { ...rec, notify: false };

  const post = await postToChannel(AUTO_BUY_LOG_CHANNEL, { embeds: buildReconciliationPayload(rec).embeds })
    .catch((e) => ({ ok: false, error: e.message }));
  return { ...rec, notify: true, sent: post.ok };
}

// Same rule as sendDiscordBriefing: explicit destination only. This one reports
// real executed order sizes in dollars.
// The old version of this function opened with `if (dcaResult.skipped) return;`
// and the comment "don't spam if not configured". That single line is the root
// bug behind the whole 103-day outage: the one condition most worth shouting
// about was the one condition guaranteed to stay quiet. A DCA that cannot place
// an order alerts. Every day. There is no such thing as spam here — if the
// message is annoying, the fix is to make the DCA work, not to mute it.
export function buildDcaDiscordPayload(dcaResult) {
  if (dcaResult.mode === "fixed-cash") return {
    username: "LiftOffr DCA Bot",
    embeds: [{ title: dcaResult.ok ? "Fixed $600 cash DCA status" : "Fixed cash DCA paused; reconcile orders",
      description: [dcaResult.reason, dcaResult.error,
        ...dcaResult.results.map(r => r.skipped ? "Existing daily slot retained; no replacement sent"
          : `Submitted BTC-USDC quote $${r.quoteSize}; execution and fees require fill confirmation`)
      ].filter(Boolean).join("\n"), color: dcaResult.ok ? 0x34c759 : 0xff453a,
      timestamp: dcaResult.ts }],
  };
  if (dcaResult.reason === "credentials-missing") {
    return {
      username: "LiftOffr DCA Bot",
      embeds: [{
        title: "🚨 DAILY DCA DID NOT RUN — no trade credentials",
        description:
          `**No BTC was bought on the USDC leg today.** Intended: **$${dcaResult.intendedUsdc}** BTC-USDC.\n\n` +
          `Missing env var${dcaResult.missing.length > 1 ? "s" : ""}: ${dcaResult.missing.map((m) => `\`${m}\``).join(" · ")}\n\n` +
          "This is not a transient error and it will not fix itself. The primary credential " +
          "is `COINBASE_API_KEY_ID` / `COINBASE_API_SECRET` (the account's CDP key, which has Trade " +
          "permission); set those in Vercel Production, or set `COINBASE_TRADE_*` for a dedicated key.\n\n" +
          "_The bank-leg recurring buy is unaffected; it runs inside Coinbase, not here._",
        color: 0xff453a,
        footer: { text: "This alert repeats daily until the DCA can place an order." },
        timestamp: dcaResult.ts,
      }],
    };
  }

  const allOk = dcaResult.results.length > 0 && dcaResult.results.every((r) => r.ok);
  const lines = dcaResult.results.map((r) => {
    if (r.ok && !r.dup) return r.orderCount > 1
      ? `✅ ${r.productId} — placed $${r.quoteSize} across ${r.orderCount} orders${r.filledUsd ? ` (filled $${r.filledUsd})` : ""}`
      : `✅ ${r.productId} — placed $${r.quoteSize} buy (order ${(r.orderId || "").slice(0, 8)})`;
    if (r.ok && r.dup)  return `⚠ ${r.productId} — already placed today (duplicate idempotency key)`;
    return `❌ ${r.productId} — FAILED $${r.quoteSize}: ${(r.error || "").slice(0, 300)}`;
  });
  if (dcaResult.reason === "threw") {
    lines.push(`❌ DCA threw before placing anything: ${(dcaResult.error || "").slice(0, 200)}`);
  }
  if (dcaResult.credentialSource === "api-fallback") {
    lines.push("_credential: COINBASE_API_* (account CDP key, has Trade) — no dedicated COINBASE_TRADE_* key set_");
  }
  return {
    username: "LiftOffr DCA Bot",
    embeds: [{
      title: (dcaResult.test ? "🧪 TEST — " : "") + (allOk ? "Daily DCA fired" : "🚨 Daily DCA FAILED — no BTC bought"),
      description: lines.join("\n") || "No orders were attempted.",
      color: allOk ? 0x34c759 : 0xff453a,
      footer: { text: "Coinbase Advanced Trade · liftoffr.com/dashboard" },
      timestamp: dcaResult.ts,
    }],
  };
}

export async function sendDcaResultToDiscord(dcaResult) {
  // HEARTBEAT: every run reports here — placed, duplicate, skip, or rejection —
  // so #auto-buy-log is an external, bot-readable record of whether the cron
  // fired and what it decided. Silence in that channel is now itself the signal
  // (see the watchdog in cron-welcome-followups). Posts via the bot to a private
  // Staff channel, matching the rest of the stack; no webhook required.
  if (!dcaResult.notify) return { sent: false, reason: "nothing to report" };

  const payload = buildDcaDiscordPayload(dcaResult);
  const post = await postToChannel(AUTO_BUY_LOG_CHANNEL, { embeds: payload.embeds })
    .catch((e) => ({ ok: false, error: e.message }));

  // FALLBACK: on a fatal result whose channel post did not land, DM the owner so
  // a failed DCA can never go fully unseen. The DM carries Coinbase's verbatim
  // response, not just the reason code.
  if (dcaResult.fatal && !post.ok) {
    const detail =
      (dcaResult.results || []).filter((r) => !r.ok)
        .map((r) => `• ${r.productId} $${r.quoteSize}: ${r.error || "no detail"}`).join("\n")
      || (dcaResult.reason === "credentials-missing"
            ? `Missing: ${(dcaResult.missing || []).join(", ")}`
            : (dcaResult.error || dcaResult.reason));
    await sendOwnerDM(
      "🚨 **Daily DCA failed and the #auto-buy-log post did not land.**\n" +
      `Reason: \`${dcaResult.reason}\`\n${detail}\n\n` +
      "_(The line above is Coinbase's verbatim response.)_"
    ).catch(() => {});
  }
  return { sent: post.ok, channel: "auto-buy-log", status: post.status };
}

export default async function handler(req, res) {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  const force = (req.query?.force || new URL(req.url, "http://localhost").searchParams.get("force")) === "1";
  const tasksParam = req.query?.tasks || new URL(req.url, "http://localhost").searchParams.get("tasks");

  // Auth guard for cron. `force` overrides the HOUR GATE only — it is not an
  // auth bypass. It used to be: anyone who guessed this URL could append
  // ?force=1 and fire a real Coinbase buy, post to Discord, and (on Sundays)
  // email the entire Resend audience, all unauthenticated.
  const expected = process.env.CRON_SECRET;
  const got = req.headers["authorization"] || req.headers["Authorization"] || "";
  const authed = !expected || got === `Bearer ${expected}`;
  if (!authed) {
    return res.status(401).json({ error: "Unauthorized — missing/wrong cron secret" });
  }

  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const proto = req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${proto}://${host}`;

  const out = { ts: now.toISOString(), day, hour, tasks: {} };

  // The cron now runs hourly. Some tasks fire every hour, others gate on
  // the specific UTC hour to behave as if they were daily-only.
  const isDailySendHour = (hour === 15) || force; // 15:00 UTC = 8am MT

  // TASK 1 — Tier watch. Runs EVERY hour. Pings Discord with manual order
  // details whenever a buy tier is hit but not yet filled. Auto-dedups via
  // Coinbase sync (once you fire the lump buy, alert stops).
  const runWatch = DCA_MODE !== "fixed-cash" && (!tasksParam || tasksParam.includes("watch"));
  if (DCA_MODE === "fixed-cash") out.tasks.tierWatch = { reason: "manual-only", levels: FIXED_CASH_PLAN.manualLevels };
  if (runWatch) {
    try {
      out.tasks.tierWatch = await runTierWatch(baseUrl, { isDailySendHour });
    } catch (err) {
      console.error("tier watch error", err);
      out.tasks.tierWatch = { error: err.message };
    }
  }

  // TASK 2 — Daily DCA execution. Only fires at 15:00 UTC (8am MT).
  // Coinbase idempotency would block duplicate same-day fires anyway, but
  // we gate explicitly so we don't spam logs with rejection noise.
  const runDCA = (!tasksParam || tasksParam.includes("dca")) && isDailySendHour;
  if (runDCA) {
    // Every path out of here reports. A throw used to land in out.tasks.dca and
    // nowhere else, so a DCA that crashed looked identical to one that never ran.
    let dcaResult;
    try {
      dcaResult = await runDailyDCA(baseUrl);
    } catch (err) {
      console.error("dca error", err);
      dcaResult = {
        ts: new Date().toISOString(),
        notify: true, fatal: true, reason: "threw",
        error: err.message, results: [],
      };
    }
    out.tasks.dca = dcaResult;
    try {
      out.tasks.dcaNotice = await sendDcaResultToDiscord(dcaResult);
    } catch (e) {
      console.error("dca discord post failed", e.message);
      out.tasks.dcaNotice = { sent: false, error: e.message };
    }
    // Surface the failure in the HTTP response too, so Vercel's cron log shows a
    // non-200 instead of a cheerful 200 with a buried error field.
    if (dcaResult.fatal) out.dcaFatal = dcaResult.reason;
  }

  // TASK 2.5 — DCA reconciliation. Daily, and deliberately AFTER the DCA task so
  // today's fire is in the ledger before we compare. Read-only.
  const runRecon = DCA_MODE !== "fixed-cash" && (!tasksParam || tasksParam.includes("recon")) && isDailySendHour;
  if (DCA_MODE === "fixed-cash") out.tasks.reconciliation = { reason: "legacy-calendar-comparison-disabled", note: "Fixed mode checks daily order IDs; actual fills and fees require Coinbase readback." };
  if (runRecon) {
    try {
      out.tasks.reconciliation = await runReconciliation(baseUrl);
    } catch (err) {
      console.error("reconciliation error", err);
      out.tasks.reconciliation = { error: err.message };
    }
  }

  // TASK 3 — Daily buy-plan briefing (Discord). Only fires at 15:00 UTC.
  const runBriefing = (!tasksParam || tasksParam.includes("briefing")) && isDailySendHour;
  if (runBriefing) {
    try {
      out.tasks.briefing = await runDailyBriefing(baseUrl, day);
    } catch (err) {
      console.error("briefing error", err);
      out.tasks.briefing = { error: err.message };
    }
  }

  // TASK 3.5 — Zone-change alert. Daily check at the send hour; emails the
  // free audience only when the Score crosses into a new zone (rare, high-signal).
  const runZoneCheck = (!tasksParam || tasksParam.includes("zonecheck")) && isDailySendHour;
  if (runZoneCheck) {
    try {
      out.tasks.zoneChange = await runZoneChangeCheck(baseUrl);
    } catch (err) {
      console.error("zone-change check error", err);
      out.tasks.zoneChange = { error: err.message };
    }
  }

  // TASK 4 — Weekly LiftOffr Score email. Sundays at 15:00 UTC only.
  const runScore = (!tasksParam || tasksParam.includes("score")) && (day === 0) && isDailySendHour;
  if (runScore) {
    try {
      const [score, subs] = await Promise.all([
        fetchScore(baseUrl),
        fetchResendAudienceContacts(),
      ]);
      const subject = `${SUBJECT_BASE}: ${score.score.toFixed(1)} (${score.zone})`;
      score.commentary = await aiWeeklyRead(score);
      const text = emailText(score);
      const html = emailHTML(score);

      const results = { sent: 0, failed: 0, total: subs.length, errors: [] };
      for (const s of subs) {
        try {
          await sendResend(s.email, subject, text, html);
          results.sent++;
        } catch (e) {
          results.failed++;
          results.errors.push({ email: s.email.slice(0, 3) + "...", err: String(e).slice(0, 120) });
        }
        await new Promise((r) => setTimeout(r, 600));
      }
      out.tasks.score = { score: score.score, zone: score.zone, results };
    } catch (err) {
      console.error("score send error", err);
      out.tasks.score = { error: err.message };
    }
  } else if (!runScore && !tasksParam) {
    out.tasks.score = { skipped: true, reason: `day=${day} (only Sunday=0)` };
  }

  return res.status(200).json(out);
}
