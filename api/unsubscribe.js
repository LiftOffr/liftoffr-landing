// One-click unsubscribe endpoint (CAN-SPAM / RFC 8058).
// Email footers + the List-Unsubscribe header point here. Marks the contact
// unsubscribed in BOTH Resend audiences (free + trial). Token is an HMAC of the
// email so randos can't unsubscribe arbitrary addresses, but we still honor any
// valid-email request (honoring an unsubscribe is the compliance priority).
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

export function unsubToken(email) {
  return crypto.createHmac("sha256", process.env.CRON_SECRET || "liftoffr")
    .update((email || "").toLowerCase()).digest("hex").slice(0, 16);
}

async function markUnsubscribed(email) {
  const key = process.env.RESEND_API_KEY;
  const auds = [process.env.RESEND_AUDIENCE_ID, process.env.RESEND_TRIAL_AUDIENCE_ID].filter(Boolean);
  for (const a of auds) {
    try {
      await fetch(`https://api.resend.com/audiences/${a}/contacts/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ unsubscribed: true }),
      });
    } catch (_) { /* ignore per-audience failure */ }
  }
}

function page(msg) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>LiftOffr</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#060910;color:#e9eef7;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;margin:0">
<div style="max-width:440px;padding:30px">
<div style="font-weight:900;font-size:22px;font-style:italic;letter-spacing:-.5px">lift<span style="color:#e63946">offr</span></div>
<p style="margin-top:20px;font-size:15px;line-height:1.65;color:#c9d2e3">${msg}</p>
</div></body></html>`;
}

export default async function handler(req, res) {
  const u = new URL(req.url, "http://localhost");
  const email = (u.searchParams.get("e") || "").trim();

  // RFC 8058 one-click: email clients POST here — unsubscribe silently, 200.
  if (req.method === "POST") {
    if (email) await markUnsubscribed(email);
    return res.status(200).send("unsubscribed");
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!email || !email.includes("@")) return res.status(400).send(page("That unsubscribe link looks incomplete. Reply to any email and I'll remove you manually."));
  await markUnsubscribed(email);
  return res.status(200).send(page("You're unsubscribed — you won't get any more emails from LiftOffr.<br><br>Changed your mind? Just reply to any past email and I'll add you back."));
}
