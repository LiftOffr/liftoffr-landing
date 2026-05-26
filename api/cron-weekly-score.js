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

export default async function handler(req, res) {
  // Day-of-week guard — only Sunday (0)
  const now = new Date();
  const day = now.getUTCDay();
  const force = (req.query?.force || new URL(req.url, "http://localhost").searchParams.get("force")) === "1";
  if (day !== 0 && !force) {
    return res.status(200).json({ skipped: true, reason: `day=${day}, only sends on Sunday (UTC)`, ts: now.toISOString() });
  }

  // Auth guard
  const expected = process.env.CRON_SECRET;
  const got = req.headers["authorization"] || req.headers["Authorization"] || "";
  if (expected && got !== `Bearer ${expected}` && !force) {
    return res.status(401).json({ error: "Unauthorized — missing/wrong cron secret" });
  }

  try {
    // Build absolute URL for internal cycle-score fetch
    const host = req.headers["x-forwarded-host"] || req.headers["host"];
    const proto = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = `${proto}://${host}`;

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
      await new Promise((r) => setTimeout(r, 600)); // ~1.6/sec — under Resend rate limit
    }

    return res.status(200).json({
      score: score.score,
      zone: score.zone,
      ts: now.toISOString(),
      results,
    });
  } catch (err) {
    console.error("cron-weekly-score error", err);
    return res.status(500).json({ error: err.message });
  }
}
