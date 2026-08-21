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

export const config = { runtime: "nodejs" };

const FROM_ADDRESS = "Torin from LiftOffr <torin@liftoffr.com>";
const REPLY_TO     = "torin.christianson@gmail.com";
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

    <p style="margin:18px 0 0;">Want the exact plan I'm executing against this Score &mdash; nine buy tiers, the exit thresholds that put me on alert, and the whipsaw rule? It's $29, once. (The full exit ladder with the fractions is in The Cycle System, and the plan says so on the page rather than after you've paid.)</p>
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
    "List-Unsubscribe": `<${uu}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: FROM_ADDRESS,
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
  await sendOwnerDM(`🚨 Zone change: ${zoneLabel(payload.from)} → ${zoneLabel(payload.to)} at ${payload.score.toFixed(1)}. Alert emailed to ${results.sent}/${results.total} free subscribers.`).catch(() => {});
  return { changed: true, ...payload, results };
}

// ═══════════════════════════════════════════════════════════════════
// BUY-PLAN DAILY BRIEFING — fires every day at 15:00 UTC (8am MT).
// Hits Discord webhook with BTC + 200W MA + tier-ladder status.
// On Mondays, appends a DCA reminder.
// ═══════════════════════════════════════════════════════════════════

// Mirror of dashboard PLAN config — keep in sync.
const BUY_PLAN = {
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

function dcaForToday() {
  const iso = new Date().toISOString().slice(0, 10);
  return BUY_PLAN.dcaSchedule.find((s) => iso >= s.start && iso <= s.end) || BUY_PLAN.dcaSchedule[BUY_PLAN.dcaSchedule.length - 1];
}

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

function tierLine(t, btcPrice, ma200w) {
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
  const fbStr = fbDays !== null ? (fbDays < 0 ? `⚠ overdue` : `${fbDays}d fallback`) : "";
  return `${badge} **${t.tier}** · ${fmtUsd(t.target)} · ${action}${fbStr ? ` · ${fbStr}` : ""}`;
}

function buildBriefingPayload({ btcPrice, change24h, ma200w, ma200wDelta, cbbi }, day) {
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
  const isMonday = day === 1;
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" });

  // Tier breakdown
  const lines = BUY_PLAN.tiers.map((t) => tierLine(t, btcPrice, ma200w));

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
      if (t.tier === "IMMEDIATE")
        return `• Fire ${fmtUsd(t.target)} at market — Coinbase Advanced Trade BTC-USD`;
      if (btcPrice <= triggerPx)
        return `• 🟢 **${t.tier} HIT** — Fire ${fmtUsd(t.target)} at market now (BTC at ${fmtUsd(btcPrice)}, trigger ${fmtUsd(triggerPx)})`;
      return `• 🟡 ${t.tier} within 5% — Ready ${fmtUsd(t.target)} (trigger ${fmtUsd(triggerPx)})`;
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
// Requires a SEPARATE CDP key with Trade permission (not the read-only
// sync key). Env: COINBASE_TRADE_KEY_ID / COINBASE_TRADE_SECRET.
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
const DCA_MAX_QUOTE_SIZE = 250; // per-order USD/USDC cap

function tradeJWT(method, path, keyId, secretB64) {
  const secretBytes = Buffer.from(secretB64, "base64");
  if (secretBytes.length < 32) throw new Error("COINBASE_TRADE_SECRET too short");
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

async function cbApi(method, path, keyId, secret, body) {
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

async function placeMarketBuy({ productId, quoteSize, dateIso, keyId, secret }) {
  if (!DCA_ALLOWED_PRODUCTS.has(productId)) {
    throw new Error(`product ${productId} not in DCA allowlist`);
  }
  const amount = Number(quoteSize);
  if (!Number.isFinite(amount) || amount <= 0 || amount > DCA_MAX_QUOTE_SIZE) {
    throw new Error(`quote_size ${amount} outside [0, ${DCA_MAX_QUOTE_SIZE}]`);
  }
  const path = "/api/v3/brokerage/orders";
  const body = {
    client_order_id: `liftoffr-dca-${productId}-${dateIso}`,
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

// NO FALLBACK TO THE SYNC KEY. This function places real market buys. The
// header above requires a SEPARATE CDP key with Trade permission, precisely so
// the read-only sync credential can never place an order. The previous
// `COINBASE_TRADE_KEY_ID || COINBASE_API_KEY_ID` fallback defeated that
// separation silently: with the trade vars unset (as they were on 2026-08-20)
// it reached for the sync key instead. That fails today only because the sync
// key lacks Trade permission — grant it for any reason and this would start
// placing live orders with the wrong credential, with nothing in the logs
// saying so. Trade keys must be set explicitly or the DCA does not run.
async function runDailyDCA() {
  const keyId = process.env.COINBASE_TRADE_KEY_ID;
  const secret = process.env.COINBASE_TRADE_SECRET;
  if (!keyId || !secret) {
    console.warn("COINBASE_TRADE_KEY_ID / COINBASE_TRADE_SECRET not set — DCA skipped (no fallback to the read-only sync key by design)");
    return { skipped: true, reason: "COINBASE_TRADE_* not set" };
  }
  const dateIso = new Date().toISOString().slice(0, 10);
  const results = [];
  const { usdc: usdcAmount } = dcaForToday();

  // DCA #1 — v3 Advanced Trade BTC-USDC from USDC wallet.
  // DCA #2 (bank-funded) runs as a Coinbase UI recurring buy — v2 buys API
  // returns 404 under CDP/JWT auth (appears deprecated). Sync picks up its
  // fills automatically via the v2 transactions endpoint.
  try {
    const r = await placeMarketBuy({
      productId: "BTC-USDC",
      quoteSize: usdcAmount,
      dateIso, keyId, secret,
    });
    results.push({ dca: "USDC", ok: true, productId: r.productId, quoteSize: r.quoteSize, orderId: r.orderId });
  } catch (err) {
    const dup = /duplicate/i.test(err.message) || /already exists/i.test(err.message);
    results.push({ dca: "USDC", ok: dup, productId: "BTC-USDC", quoteSize: usdcAmount, error: err.message, dup });
  }

  return { ts: new Date().toISOString(), results };
}

// ═══════════════════════════════════════════════════════════════════
// TIER WATCH — hourly check for any buy tier crossing its trigger.
// Pings Discord with manual order details so the user knows to fire.
// Dedup is automatic via Coinbase sync — once the lump tier is filled,
// the alert stops firing.
// ═══════════════════════════════════════════════════════════════════

async function runTierWatch(baseUrl) {
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
  const PLAN_START = "2026-05-28";
  const lumpBuys = trades
    .filter((t) => (t.type || "buy") === "buy" && (t.usd || 0) >= 100 && (t.date || "") >= PLAN_START)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  // Waterfall fill into the lump tiers — single source of truth is BUY_PLAN.tiers.
  // Trigger = same rule as the dashboard's effPrice(): Cowen transcript aggregate
  // overrides the MA-derived trigger when the two agree within ±10%.
  const cowenTiers = (data.cowen && data.cowen.tiers) || {};
  const TIERS = BUY_PLAN.tiers.map((t) => {
    const maPx = t.maMultiple && data.ma200w ? data.ma200w * t.maMultiple : null;
    const cow = cowenTiers[t.tier] ? cowenTiers[t.tier].price : null;
    let triggerPx = maPx || t.targetPrice;
    if (cow && maPx && Math.abs(cow - maPx) / maPx <= 0.10) triggerPx = cow;
    else if (cow && !maPx) triggerPx = cow;
    return { name: t.tier, target: t.target, label: t.trigger, triggerPx };
  });

  let remaining = lumpBuys.reduce((s, t) => s + (t.usd || 0), 0);
  const tierStates = TIERS.map((t) => {
    const fillAmount = Math.min(t.target, Math.max(0, remaining));
    remaining = Math.max(0, remaining - fillAmount);
    return {
      ...t,
      filled: fillAmount,
      remaining: t.target - fillAmount,
      hit: data.usd <= t.triggerPx,
      done: fillAmount >= t.target * 0.97,
    };
  });

  const actionable = tierStates.filter((t) => t.hit && !t.done);

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

  if (actionable.length === 0 && !volCap) {
    return { skipped: true, reason: "no tier actionable", btcPrice: data.usd, bottomSignalsLit: lit };
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

  const header = volCap && actionable.length === 0
    ? "🔻 **VOLUME CAPITULATION DETECTED** 🔻"
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
    dm: dmResult,
  };
}

// Same rule as sendDiscordBriefing: explicit destination only. This one reports
// real executed order sizes in dollars.
async function sendDcaResultToDiscord(dcaResult) {
  const url = process.env.DISCORD_BUY_ALERTS_WEBHOOK;
  if (!url) {
    console.warn("DISCORD_BUY_ALERTS_WEBHOOK not set — DCA result notice skipped (no fallback by design)");
    return;
  }
  if (dcaResult.skipped) return; // don't spam if not configured

  const allOk = dcaResult.results.every((r) => r.ok);
  const color = allOk ? 0x34c759 : 0xff453a;
  const lines = dcaResult.results.map((r) => {
    if (r.ok && !r.dup) return `✅ ${r.productId} — placed $${r.quoteSize} buy (order ${(r.orderId || "").slice(0, 8)})`;
    if (r.ok && r.dup)  return `⚠ ${r.productId} — already placed today (duplicate idempotency key)`;
    return `❌ ${r.productId} — FAILED $${r.quoteSize}: ${(r.error || "").slice(0, 140)}`;
  });
  const payload = {
    username: "LiftOffr DCA Bot",
    embeds: [{
      title: allOk ? "Daily DCA fired" : "Daily DCA — partial failure",
      description: lines.join("\n"),
      color,
      footer: { text: "Coinbase Advanced Trade · liftoffr.com/dashboard" },
      timestamp: dcaResult.ts,
    }],
  };
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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
  const runWatch = !tasksParam || tasksParam.includes("watch");
  if (runWatch) {
    try {
      out.tasks.tierWatch = await runTierWatch(baseUrl);
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
    try {
      const dcaResult = await runDailyDCA();
      out.tasks.dca = dcaResult;
      await sendDcaResultToDiscord(dcaResult).catch((e) => console.warn("dca discord post", e.message));
    } catch (err) {
      console.error("dca error", err);
      out.tasks.dca = { error: err.message };
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
