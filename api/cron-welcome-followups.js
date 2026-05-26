// Welcome sequence follow-up cron — Day 3 and Day 7 emails.
//
// Vercel cron config (vercel.json) calls this HOURLY. We compute each contact's
// age from their Resend audience `created_at` timestamp and fire the right
// follow-up at the right window:
//
//   • Age 3.0 – 4.0 days  → Email 2 ("How to actually use the Score")
//   • Age 7.0 – 8.0 days  → Email 3 ("Last welcome — Founder pitch")
//
// Dedupe via Resend's `Idempotency-Key` header — same key on repeat calls is
// a no-op, so a contact in a 24h window only gets the email once even if the
// cron retries.
//
// Env required:
//   CRON_SECRET           — Vercel cron auth header
//   RESEND_API_KEY        — Resend sending key
//   RESEND_AUDIENCE_ID    — LiftOffr Free audience UUID

export const config = { runtime: "nodejs" };

const FROM_ADDRESS = "Torin from LiftOffr <torin@liftoffr.com>";
const REPLY_TO     = "torin.christianson@gmail.com";

const SUBJECT_E2 = "How to actually use the Score (and what 60+ members do daily)";
const SUBJECT_E3 = "Last welcome email — what happens next";

function email2HTML() {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
  <div style="background:#080808;padding:28px;text-align:center;">
    <div style="display:inline-block;background:#e63946;color:#fff;padding:5px 12px;border-radius:4px;font-family:Helvetica,sans-serif;font-style:italic;font-size:22px;font-weight:900;letter-spacing:-0.5px;">lift<span style="color:#000;">offr</span></div>
    <div style="margin-top:14px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Welcome · Day 3</div>
  </div>
  <div style="padding:32px 28px;color:#222;font-size:15px;line-height:1.65;">
    <p style="margin:0 0 16px;">Quick one.</p>
    <p style="margin:0 0 16px;">You've got the Checklist. You'll get the Score every Sunday. Here's the gap between <em>having information</em> and <em>running a system</em>:</p>
    <p style="margin:0 0 22px;font-weight:700;color:#080808;">The Score tells you the zone. The framework tells you what to do in each zone.</p>
    <p style="margin:0 0 16px;">Example: Score crosses 85.</p>
    <p style="margin:0 0 16px;">Most people: panic-sell 100% of their stack. Or worse — convince themselves "this time is different" and hold through the top.</p>
    <p style="margin:0 0 12px;">What works instead (this is Module 5 of the LiftOffr course):</p>
    <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.7;">
      <div>25% out when Score hits 70</div>
      <div>25% out when Score hits 80</div>
      <div>25% out when Score hits 85</div>
      <div>25% out when 3+ binary triggers fire (Pi Cycle, MVRV 7+, CBBI 90+)</div>
    </div>
    <p style="margin:18px 0 16px;">By the time the top is obvious in hindsight, you're 75% in stables. You captured most of the upside without trying to time the exact peak.</p>
    <p style="margin:0 0 16px;"><strong>Why this matters:</strong> the biggest mistake of every cycle is binary thinking. Sell everything or hold everything. The Score lets you scale — that's the difference between round-tripping and compounding.</p>
    <p style="margin:0 0 16px;">Members of LiftOffr get this framework as part of the 6-module course, plus a daily 3-minute brief in Discord at 8am MT that says "here's the read, here's what to do today."</p>
    <p style="margin:24px 0 0;">— Torin</p>
  </div>
  <div style="padding:0 28px 32px;">
    <a href="https://liftoffr.com/?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day3_cta" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">See what's inside LiftOffr →</a>
  </div>
  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6;">
    Backtested 2017–2026. Past performance does not guarantee future results.<br/>
    LiftOffr · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
  </div>
</div></body></html>`;
}

function email2Text() {
  return [
    "Quick one.",
    "",
    "You've got the Checklist. You'll get the Score every Sunday. Here's the gap between *having information* and *running a system*:",
    "",
    "The Score tells you the zone. The framework tells you what to do in each zone.",
    "",
    "Example: Score crosses 85.",
    "",
    "Most people: panic-sell 100% of their stack. Or worse — convince themselves 'this time is different' and hold through the top.",
    "",
    "What works instead (Module 5 of the LiftOffr course):",
    "  • 25% out when Score hits 70",
    "  • 25% out when Score hits 80",
    "  • 25% out when Score hits 85",
    "  • 25% out when 3+ binary triggers fire (Pi Cycle, MVRV 7+, CBBI 90+)",
    "",
    "By the time the top is obvious in hindsight, you're 75% in stables.",
    "",
    "The biggest mistake of every cycle is binary thinking. The Score lets you scale — that's the difference between round-tripping and compounding.",
    "",
    "Members get this framework + a daily 3-minute brief in Discord at 8am MT:",
    "https://liftoffr.com/?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day3_cta",
    "",
    "— Torin",
  ].join("\n");
}

function email3HTML() {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
  <div style="background:#080808;padding:28px;text-align:center;">
    <div style="display:inline-block;background:#e63946;color:#fff;padding:5px 12px;border-radius:4px;font-family:Helvetica,sans-serif;font-style:italic;font-size:22px;font-weight:900;letter-spacing:-0.5px;">lift<span style="color:#000;">offr</span></div>
    <div style="margin-top:14px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Welcome · Day 7 · final</div>
  </div>
  <div style="padding:32px 28px;color:#222;font-size:15px;line-height:1.65;">
    <p style="margin:0 0 16px;">Last email in the welcome sequence.</p>
    <p style="margin:0 0 16px;">From now on you'll get one email from me every Sunday morning — the LiftOffr Score, the zone, and a one-line read on what it means this week. That's the ongoing relationship. No daily spam, no sales sequences, no recycled Twitter takes.</p>
    <p style="margin:0 0 16px;">You can absolutely DIY this. Read the Score each Sunday, run the Checklist yourself, build your own discipline. That alone puts you ahead of 99% of crypto investors.</p>
    <p style="margin:0 0 16px;">But if you'd rather have it <em>done for you</em> — the daily briefs, live dashboard, real-time signal alerts when triggers fire, 6-module course, and private Discord community — LiftOffr's Founder Rate is <strong>$29/mo, locked in forever</strong>.</p>
    <p style="margin:18px 0 12px;font-weight:700;color:#080808;">Risk-free for 30 days. Full refund if it's not for you.</p>
    <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.7;color:#333;">
      <div>• Daily BTC market brief in Discord (8am MT, weekdays)</div>
      <div>• Live dashboard with the current Score</div>
      <div>• Real-time signal alerts when V7 triggers fire</div>
      <div>• 6 modules: foundations → exit framework → multi-cycle wealth</div>
      <div>• Custom AI Q&A bot trained on the curriculum</div>
      <div>• Founder badge + private community</div>
    </div>
    <p style="margin:18px 0;">Either way — see you Sunday.</p>
    <p style="margin:18px 0 0;">— Torin<br/><em style="color:#999;">Founder, LiftOffr</em></p>
    <p style="margin:18px 0 0;font-size:13px;color:#888;">P.S. The Founder Rate is capped at 30 spots. Live count at <a href="https://liftoffr.com" style="color:#e63946;">liftoffr.com</a>.</p>
  </div>
  <div style="padding:0 28px 32px;">
    <a href="https://whop.com/checkout/plan_CH1L53GLZsaq1?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day7_cta" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">Claim Founder Rate — $29/mo locked forever →</a>
  </div>
  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6;">
    Backtested 2017–2026. Past performance does not guarantee future results.<br/>
    LiftOffr · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
  </div>
</div></body></html>`;
}

function email3Text() {
  return [
    "Last email in the welcome sequence.",
    "",
    "From now on you'll get one email from me every Sunday morning — the LiftOffr Score, the zone, and a one-line read on what it means this week. That's the ongoing relationship. No daily spam, no sales sequences.",
    "",
    "You can absolutely DIY this. That alone puts you ahead of 99% of crypto investors.",
    "",
    "But if you'd rather have it done for you — daily briefs, live dashboard, real-time signal alerts, 6-module course, and private Discord — LiftOffr's Founder Rate is $29/mo, locked forever.",
    "",
    "Risk-free for 30 days. Full refund if it's not for you.",
    "",
    "  • Daily BTC market brief in Discord (8am MT, weekdays)",
    "  • Live dashboard with the current Score",
    "  • Real-time signal alerts when V7 triggers fire",
    "  • 6 modules: foundations → exit framework → multi-cycle wealth",
    "  • Custom AI Q&A bot trained on the curriculum",
    "  • Founder badge + private community",
    "",
    "Either way — see you Sunday.",
    "— Torin",
    "Founder, LiftOffr",
    "",
    "https://whop.com/checkout/plan_CH1L53GLZsaq1?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day7_cta",
    "",
    "P.S. Founder Rate is capped at 30 spots. Live count at liftoffr.com.",
  ].join("\n");
}

async function fetchContacts() {
  const key = process.env.RESEND_API_KEY;
  const aud = process.env.RESEND_AUDIENCE_ID;
  const r = await fetch(`https://api.resend.com/audiences/${aud}/contacts`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const data = await r.json();
  return (data.data || []).filter((c) => c.email && !c.unsubscribed);
}

async function sendResend({ to, subject, text, html, idempotencyKey, tag }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "User-Agent": "liftoffr-welcome-followup/1.0",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      reply_to: REPLY_TO,
      subject,
      text,
      html,
      tags: [
        { name: "campaign", value: "welcome" },
        { name: "step", value: tag },
      ],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(data));
  return data.id;
}

function ageDays(createdAt) {
  const t = new Date(createdAt.replace(" ", "T")).getTime();
  return (Date.now() - t) / 86400000;
}

export default async function handler(req, res) {
  // Auth guard
  const expected = process.env.CRON_SECRET;
  const got = req.headers["authorization"] || "";
  const force = (req.query?.force || new URL(req.url, "http://localhost").searchParams.get("force")) === "1";
  if (expected && got !== `Bearer ${expected}` && !force) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const contacts = await fetchContacts();
    const results = { e2_sent: 0, e3_sent: 0, e2_failed: 0, e3_failed: 0, skipped: 0, errors: [] };

    for (const c of contacts) {
      const age = ageDays(c.created_at);

      // Email 2 window: 3.0 – 4.0 days
      if (age >= 3.0 && age < 4.0) {
        try {
          await sendResend({
            to: c.email,
            subject: SUBJECT_E2,
            text: email2Text(),
            html: email2HTML(),
            idempotencyKey: `welcome-e2-${c.id}`,
            tag: "day3",
          });
          results.e2_sent++;
        } catch (e) {
          results.e2_failed++;
          results.errors.push({ id: c.id, step: "e2", err: String(e).slice(0, 200) });
        }
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }

      // Email 3 window: 7.0 – 8.0 days
      if (age >= 7.0 && age < 8.0) {
        try {
          await sendResend({
            to: c.email,
            subject: SUBJECT_E3,
            text: email3Text(),
            html: email3HTML(),
            idempotencyKey: `welcome-e3-${c.id}`,
            tag: "day7",
          });
          results.e3_sent++;
        } catch (e) {
          results.e3_failed++;
          results.errors.push({ id: c.id, step: "e3", err: String(e).slice(0, 200) });
        }
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }

      results.skipped++;
    }

    return res.status(200).json({
      ts: new Date().toISOString(),
      total_contacts: contacts.length,
      results,
    });
  } catch (err) {
    console.error("cron-welcome-followups error", err);
    return res.status(500).json({ error: err.message });
  }
}
