// Vercel serverless function: subscribe an email to Resend Audience +
// immediately send the consolidated Checklist + Score welcome email.
//
// Replaces the prior Beehiiv-backed signup. All subscriber storage now lives
// in Resend Audiences; the weekly Score cron (cron-weekly-score.js) reads
// from the same audience so welcome + ongoing are unified.
//
// Env required:
//   RESEND_API_KEY        – sending key with audience + send scope
//   RESEND_AUDIENCE_ID    – the "LiftOffr Free" audience UUID
//
// Vercel auto-routes this file to /api/subscribe (Node serverless).

export const config = { runtime: "nodejs" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM_ADDRESS = "Torin from LiftOffr <torin@liftoffr.com>";
const REPLY_TO     = "torin.christianson@gmail.com";

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return await new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}

function welcomeHTML({ score, zone, trendDelta7d, commentary }) {
  const trendArrow = trendDelta7d > 0 ? "▲" : trendDelta7d < 0 ? "▼" : "◆";
  const trendStr = `${trendArrow} ${trendDelta7d >= 0 ? "+" : ""}${trendDelta7d} over last 7 days`;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

  <div style="background:#080808;padding:32px 28px;text-align:center;">
    <div style="display:inline-block;background:#e63946;color:#fff;padding:5px 12px;border-radius:4px;font-family:Helvetica,sans-serif;font-style:italic;font-size:22px;font-weight:900;letter-spacing:-0.5px;">lift<span style="color:#000;">offr</span></div>
    <div style="margin-top:18px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Welcome · Checklist + Weekly Score</div>
  </div>

  <div style="padding:32px 28px;color:#222;font-size:15px;line-height:1.6;">
    <p style="margin:0 0 18px;">Hey,</p>
    <p style="margin:0 0 18px;">Two things in this email — the checklist you asked for, and a quick heads-up about what'll show up in your inbox every Sunday from now on.</p>

    <p style="margin:24px 0 8px;font-weight:700;color:#080808;">1. The BTC Cycle Top Checklist:</p>
    <p style="margin:0 0 18px;"><a href="https://liftoffr.com/lead-magnet/cycle-top-checklist.pdf?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=checklist_link" style="background:#e63946;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:800;">👉 Download the PDF</a></p>
    <p style="margin:0 0 18px;color:#555;">Print it. Stick it next to your screen. Run through the 8 indicators every Sunday and count how many are in the trigger zone. When 5+ flash at once, history says the cycle is near peak. Confluence is the signal — no single indicator is.</p>

    <p style="margin:32px 0 8px;font-weight:700;color:#080808;">2. The LiftOffr Score — every Sunday morning:</p>
    <p style="margin:0 0 14px;">Reading the checklist yourself takes ~15 min a week. The LiftOffr Score does it for you — a single 0–100 number that weights all 9 cycle indicators into one read.</p>

    <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;color:#333;line-height:1.5;">
      <div><strong>85+</strong> → historic top zone. Start scaling out.</div>
      <div><strong>60–85</strong> → late-cycle / warning. Tighten exits.</div>
      <div><strong>40–60</strong> → neutral. DCA continues.</div>
      <div><strong>20–40</strong> → accumulation. Buy more weekly.</div>
      <div><strong>Below 20</strong> → deep accumulation. Aggressive DCA.</div>
    </div>

    <div style="background:#080808;color:#fff;border-radius:10px;padding:22px;margin:20px 0;text-align:center;">
      <div style="font-size:11px;color:#999;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;">This week's Score</div>
      <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:64px;font-weight:700;line-height:1;letter-spacing:-2px;margin-top:8px;">${score.toFixed(1)}</div>
      <div style="margin-top:8px;font-size:13px;font-weight:700;color:#e63946;letter-spacing:1.5px;text-transform:uppercase;">${zone}</div>
      <div style="margin-top:6px;font-family:'JetBrains Mono',Menlo,monospace;font-size:12px;color:#888;">${trendStr}</div>
      <p style="margin-top:14px;font-size:14px;color:#ccc;font-style:italic;line-height:1.5;">${commentary}</p>
    </div>

    <p style="margin:18px 0;">You'll get a fresh read every Sunday morning. No fluff, no charts to interpret, no Twitter takes. Just the number, the zone, and what to do this week.</p>

    <p style="margin:28px 0 10px;color:#555;"><strong style="color:#080808;">Why I built this:</strong></p>
    <p style="margin:0 0 18px;color:#555;">In 2021 I watched friends ride BTC from $20k → $69k → $16k. Round trip. Zero profit. They didn't have a system — they had hopium. The Checklist + Score is the system I wish I'd had then.</p>

    <p style="margin:24px 0 0;">See you Sunday.</p>
    <p style="margin:6px 0 0;color:#555;">— Torin<br/><em style="color:#999;">Founder, LiftOffr</em></p>
  </div>

  <div style="padding:0 28px 28px;">
    <a href="https://liftoffr.com/dashboard?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=dashboard_cta" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">See the live Score dashboard →</a>
  </div>

  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6;">
    Backtested 2017–2026. Past performance does not guarantee future results.<br/>
    LiftOffr · You subscribed to the free Cycle Top Checklist + Weekly Score email.<br/>
    <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
  </div>

</div>
</body></html>`;
}

function welcomeText({ score, zone, trendDelta7d, commentary }) {
  return [
    "Hey,",
    "",
    "Two things in this email — the checklist you asked for, and a quick heads-up about what'll show up in your inbox every Sunday from now on.",
    "",
    "1. THE BTC CYCLE TOP CHECKLIST",
    "https://liftoffr.com/lead-magnet/cycle-top-checklist.pdf?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=checklist_link",
    "",
    "Print it. Stick it next to your screen. Run through the 8 indicators every Sunday and count how many are in the trigger zone. When 5+ flash at once, history says the cycle is near peak. Confluence is the signal.",
    "",
    "2. THE LIFTOFFR SCORE — EVERY SUNDAY MORNING",
    "",
    "Reading the checklist yourself takes ~15 min a week. The Score does it for you — a 0-100 number weighting all 9 cycle indicators.",
    "",
    "  85+    → historic top zone. Start scaling out.",
    "  60-85  → late-cycle / warning. Tighten exits.",
    "  40-60  → neutral. DCA continues.",
    "  20-40  → accumulation. Buy more weekly.",
    "  <20    → deep accumulation. Aggressive DCA.",
    "",
    `This week's Score: ${score.toFixed(1)} (${zone}) ${trendDelta7d >= 0 ? "+" : ""}${trendDelta7d} 7d`,
    commentary,
    "",
    "You'll get a fresh read every Sunday. No fluff. Just the number, the zone, and what to do this week.",
    "",
    "Why I built this: in 2021 I watched friends ride BTC from $20k → $69k → $16k. Round trip. Zero profit. The Checklist + Score is the system I wish I'd had then.",
    "",
    "See you Sunday.",
    "— Torin",
    "Founder, LiftOffr",
    "",
    "Live Score dashboard: https://liftoffr.com/dashboard?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=dashboard_cta",
    "",
    "Backtested 2017-2026. Past performance does not guarantee future results.",
  ].join("\n");
}

async function fetchScore(baseUrl) {
  try {
    const r = await fetch(`${baseUrl}/api/cycle-score`);
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    return r.json();
  } catch {
    return { score: 50, zone: "neutral", trendDelta7d: 0, commentary: "DCA continues — see the dashboard for the live read." };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audId) {
    console.error("subscribe: missing RESEND_API_KEY or RESEND_AUDIENCE_ID");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const body = await readJsonBody(req);
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const utm_source = (body.utm_source || "liftoffr").slice(0, 80);
  const utm_medium = (body.utm_medium || "site").slice(0, 80);
  const utm_campaign = (body.utm_campaign || "checklist").slice(0, 80);
  const utm_content = (body.utm_content || "").slice(0, 80);

  try {
    // Step 1 — add to Resend audience (idempotent: returns existing on dupe)
    const contactRes = await fetch(`https://api.resend.com/audiences/${audId}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "liftoffr-subscribe/1.0",
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    const contactData = await contactRes.json().catch(() => ({}));
    if (!contactRes.ok && contactRes.status !== 422) {
      console.error("subscribe: resend contact error", contactRes.status, contactData);
      return res.status(502).json({ error: "Subscription failed" });
    }

    // Step 2 — fetch current Score for personalization
    const host = req.headers["x-forwarded-host"] || req.headers["host"];
    const proto = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = `${proto}://${host}`;
    const score = await fetchScore(baseUrl);

    // Step 3 — send Welcome email immediately
    const subject = "Your Cycle Top Checklist + the Score you'll get every Sunday";
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "liftoffr-subscribe/1.0",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        reply_to: REPLY_TO,
        subject,
        text: welcomeText(score),
        html: welcomeHTML(score),
        tags: [
          { name: "campaign", value: "welcome" },
          { name: "utm_source", value: utm_source },
          { name: "utm_medium", value: utm_medium },
          { name: "utm_campaign", value: utm_campaign },
          { name: "utm_content", value: utm_content || "default" },
        ],
      }),
    });
    const sendData = await sendRes.json().catch(() => ({}));
    if (!sendRes.ok) {
      console.error("subscribe: resend send error", sendRes.status, sendData);
      return res.status(502).json({ error: "Welcome email failed", subscribed: true });
    }

    return res.status(200).json({
      ok: true,
      contact_id: contactData?.id || null,
      email_id: sendData?.id || null,
    });
  } catch (err) {
    console.error("subscribe: handler exception", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
