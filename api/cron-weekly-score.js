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

export const config = { runtime: "nodejs" };

const FROM_ADDRESS = "Torin from LiftOffr <torin@liftoffr.com>";
const REPLY_TO     = "torin.christianson@gmail.com";
const SUBJECT_BASE = "The LiftOffr Score this week";

function zoneLabel(zone) {
  return {
    exit:                "🟥 EXIT ZONE",
    warning:             "🟧 WARNING",
    neutral:             "🟨 NEUTRAL",
    accumulation:        "🟩 ACCUMULATION",
    "deep-accumulation": "🟩 DEEP ACCUMULATION",
  }[zone] || zone.toUpperCase();
}

function emailHTML({ score, zone, trend, trendDelta7d, commentary, components }) {
  const price = components?._btc_price?.value;
  const trendArrow = trend === "rising" ? "▲" : trend === "falling" ? "▼" : "◆";
  const trendStr = `${trendArrow} ${trendDelta7d >= 0 ? "+" : ""}${trendDelta7d} over last 7 days`;

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
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
    <p style="margin:0 0 12px;color:#666;font-size:13px;">The Score is a V7-weighted composite of 9 on-chain + market indicators. Above 85 = historic top zones. Below 20 = accumulation windows.</p>
    <p style="margin:18px 0 0;">Want the daily brief, the live dashboard, and signal alerts when the Score crosses 70? Join LiftOffr at the Founder Rate.</p>
  </div>

  <div style="padding:0 28px 32px;">
    <a href="https://liftoffr.com/?utm_source=resend&utm_medium=email&utm_campaign=weekly_score&utm_content=cta" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">Join LiftOffr — $29/mo locked forever →</a>
  </div>

  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;">
    Backtested 2017–2026. Past performance does not guarantee future results.<br/>
    LiftOffr · Sent because you subscribed to the free Cycle Score email.
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
    "The Score is a V7-weighted composite of 9 on-chain + market indicators. Above 85 = historic top zones. Below 20 = accumulation windows.",
    "",
    "Want the daily brief + live dashboard + signal alerts? Join LiftOffr:",
    "https://liftoffr.com/?utm_source=resend&utm_medium=email&utm_campaign=weekly_score",
    "",
    "— Torin",
    "",
    "(Backtested 2017–2026. Past performance does not guarantee future results.)",
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

async function sendResend(to, subject, text, html) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "liftoffr-weekly-score/1.0",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      reply_to: REPLY_TO,
      subject,
      text,
      html,
      tags: [
        { name: "campaign", value: "weekly_score" },
      ],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(data));
  return data.id;
}

// ═══════════════════════════════════════════════════════════════════
// BUY-PLAN DAILY BRIEFING — fires every day at 15:00 UTC (8am MT).
// Hits Discord webhook with BTC + 200W MA + tier-ladder status.
// On Mondays, appends a DCA reminder.
// ═══════════════════════════════════════════════════════════════════

// Mirror of dashboard PLAN config — keep in sync.
const BUY_PLAN = {
  totalBudget: 145182,
  // Two automated daily DCAs via API:
  //  DCA #1: $71/day BTC-USDC via v3 Advanced Trade (USDC pile)
  //  DCA #2: $67/day BTC via v2 Simple Buy with bank as payment method
  dcaDailyUsdc: 71,
  dcaDailyBank: 67,
  dcaDailyCombined: 138,
  tiers: [
    { tier: "IMMEDIATE", target: 15000, maMultiple: null, targetPrice: 73000, fallbackDate: "2026-05-28", trigger: "Market today — Cowen-wrong hedge" },
    { tier: "T1",        target: 15000, maMultiple: 1.10, fallbackDate: "2026-07-31", trigger: "Bear-band fail follow-through" },
    { tier: "T2",        target: 20000, maMultiple: 0.97, fallbackDate: "2026-09-30", trigger: "2015-style touch + reclaim (Cowen base case)" },
    { tier: "T3",        target: 25000, maMultiple: 0.85, fallbackDate: "2026-11-30", trigger: "2019-style penetration (Cowen secondary)" },
    { tier: "T4",        target: 20000, maMultiple: 0.73, fallbackDate: "2027-01-31", trigger: "2020 COVID-style flash" },
    { tier: "T5",        target: 12182, maMultiple: 0.62, fallbackDate: "2027-03-31", trigger: "2022-style deep penetration" },
  ],
};

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

function buildBriefingPayload({ btcPrice, change24h, ma200w, ma200wDelta }, day) {
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

  const heroLines = [
    `**₿ ${fmtUsd(btcPrice)}** ${change}  ·  **200W MA ${fmtUsd(ma200w)}** ${ma200wDeltaStr}`,
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

  const dcaBlock = isMonday
    ? `\n\n🔁 **DCA reminder (Monday)** — API cron auto-fires both DCAs daily:\n• \`$${BUY_PLAN.dcaDailyUsdc}/day BTC-USDC\` from USDC wallet (v3 Advanced Trade)\n• \`$${BUY_PLAN.dcaDailyBank}/day BTC\` from linked bank (v2 Simple Buy)\nNo manual touches needed. Combined ~$${BUY_PLAN.dcaDailyCombined}/day · ~$38K total.`
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
      description: heroLines.join("\n") + actionBlock + dcaBlock + fbBlock + "\n\n**Tier Ladder**\n" + lines.join("\n"),
      color: actionable.length > 0 ? 0x34c759 : 0x4a4a4a,
      footer: { text: `liftoffr.com/dashboard · ${dayName} 8am MT` },
      timestamp: new Date().toISOString(),
    }],
  };
}

async function sendDiscordBriefing(payload) {
  const url = process.env.DISCORD_BUY_ALERTS_WEBHOOK || process.env.DISCORD_OPS_WEBHOOK;
  if (!url) {
    console.warn("No DISCORD_BUY_ALERTS_WEBHOOK or DISCORD_OPS_WEBHOOK — briefing skipped");
    return { skipped: true, reason: "no webhook configured" };
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

async function runDailyDCA() {
  const keyId = process.env.COINBASE_TRADE_KEY_ID || process.env.COINBASE_API_KEY_ID;
  const secret = process.env.COINBASE_TRADE_SECRET || process.env.COINBASE_API_SECRET;
  if (!keyId || !secret) {
    return { skipped: true, reason: "No Coinbase key configured" };
  }
  const dateIso = new Date().toISOString().slice(0, 10);
  const results = [];

  // DCA #1 — v3 Advanced Trade BTC-USDC from USDC wallet.
  try {
    const r = await placeMarketBuy({
      productId: "BTC-USDC",
      quoteSize: BUY_PLAN.dcaDailyUsdc,
      dateIso, keyId, secret,
    });
    results.push({ dca: "USDC", ok: true, productId: r.productId, quoteSize: r.quoteSize, orderId: r.orderId });
  } catch (err) {
    const dup = /duplicate/i.test(err.message) || /already exists/i.test(err.message);
    results.push({ dca: "USDC", ok: dup, productId: "BTC-USDC", quoteSize: BUY_PLAN.dcaDailyUsdc, error: err.message, dup });
  }

  // DCA #2 — v2 Simple Buy BTC from linked bank.
  try {
    const [btcAccountId, bank] = await Promise.all([
      findBtcAccountId(keyId, secret),
      findBankPaymentMethodId(keyId, secret),
    ]);
    const r = await placeV2Buy({
      amount: BUY_PLAN.dcaDailyBank,
      dateIso, keyId, secret, btcAccountId,
      paymentMethodId: bank.id,
    });
    results.push({ dca: "BANK", ok: true, productId: r.productId, quoteSize: r.quoteSize, orderId: r.orderId, bank: bank.name });
  } catch (err) {
    const dup = /idem/i.test(err.message) || /already exists/i.test(err.message);
    results.push({ dca: "BANK", ok: dup, productId: "BTC (v2 simple)", quoteSize: BUY_PLAN.dcaDailyBank, error: err.message, dup });
  }

  return { ts: new Date().toISOString(), results };
}

async function sendDcaResultToDiscord(dcaResult) {
  const url = process.env.DISCORD_BUY_ALERTS_WEBHOOK || process.env.DISCORD_OPS_WEBHOOK;
  if (!url) return;
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
  const force = (req.query?.force || new URL(req.url, "http://localhost").searchParams.get("force")) === "1";
  const tasksParam = req.query?.tasks || new URL(req.url, "http://localhost").searchParams.get("tasks");

  // Auth guard for cron — allow ?force=1 for manual testing
  const expected = process.env.CRON_SECRET;
  const got = req.headers["authorization"] || req.headers["Authorization"] || "";
  if (expected && got !== `Bearer ${expected}` && !force) {
    return res.status(401).json({ error: "Unauthorized — missing/wrong cron secret" });
  }

  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const proto = req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${proto}://${host}`;

  const out = { ts: now.toISOString(), day, tasks: {} };

  // TASK 1 — Daily DCA execution. Places two market buys via Advanced Trade
  // API. Idempotency keyed off today's date — duplicate fires are safely
  // rejected by Coinbase rather than re-placed.
  const runDCA = !tasksParam || tasksParam.includes("dca");
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

  // TASK 2 — Daily buy-plan briefing (Discord). Runs every day.
  const runBriefing = !tasksParam || tasksParam.includes("briefing");
  if (runBriefing) {
    try {
      out.tasks.briefing = await runDailyBriefing(baseUrl, day);
    } catch (err) {
      console.error("briefing error", err);
      out.tasks.briefing = { error: err.message };
    }
  }

  // TASK 3 — Weekly LiftOffr Score email. Sundays only.
  const runScore = (!tasksParam || tasksParam.includes("score")) && (day === 0 || force);
  if (runScore) {
    try {
      const [score, subs] = await Promise.all([
        fetchScore(baseUrl),
        fetchResendAudienceContacts(),
      ]);
      const subject = `${SUBJECT_BASE}: ${score.score.toFixed(1)} (${score.zone})`;
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
