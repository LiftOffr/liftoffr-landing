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

import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM_ADDRESS = "Torin from LiftOffr <torin@liftoffr.com>";
const REPLY_TO     = "torin.christianson@gmail.com";

// Lead magnets — keyed by the `magnet` field the landing pages POST.
const MAGNETS = {
  checklist: {
    eyebrow: "Welcome · Checklist + Weekly Score",
    subject: "Your Cycle Top Checklist + the Score you'll get every Sunday",
    itemTitle: "1. The BTC Cycle Top Checklist:",
    itemTitleText: "1. THE BTC CYCLE TOP CHECKLIST",
    pdfUrl: "https://liftoffr.com/lead-magnet/cycle-top-checklist.pdf?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=checklist_link",
    howTo: "Print it. Stick it next to your screen. Run through the nine weighted indicators every Sunday and count how many are in the trigger zone. When 5+ flash at once, history says the cycle is near peak. Confluence is the signal — no single indicator is.",
    footerLine: "You subscribed to the free Cycle Top Checklist + Weekly Score email.",
  },
  buyzone: {
    eyebrow: "Welcome · Buy Zone Plan + Weekly Score",
    subject: "Your Bear Market Buy Zone Plan + the Score you'll get every Sunday",
    itemTitle: "1. The Bear Market Buy Zone Plan:",
    itemTitleText: "1. THE BEAR MARKET BUY ZONE PLAN",
    pdfUrl: "https://liftoffr.com/lead-magnet/bear-market-buy-zone.pdf?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=buyzone_link",
    howTo: "Read the 4 bands, pick your capital split, and pre-place the orders while the zone is open. The Score below tells you whether it still is — and you'll get a fresh read every Sunday.",
    footerLine: "You subscribed to the free Buy Zone Plan + Weekly Score email.",
  },
};

// ── QUIZ (magnet: "quiz") ────────────────────────────────────────────────────
// The cycle-position quiz at /quiz is the single free step in front of the $29
// plan. Its result is a segment tag, and that tag is what makes the 7-email
// sequence in api/cron-welcome-followups.js segmented rather than a newsletter.
//
// This lives inside subscribe.js on purpose: the project is AT Vercel's
// 12-function cap (see CLAUDE.md), so the quiz must not add an endpoint.
//
// This is EMAIL 1 of the sequence (Day 0, "the result"). Emails 2–7 are fired
// by the daily follow-up cron off the contact's age, same as every other
// sequence in this repo.
const SEGMENTS = {
  ROUNDTRIPPED: {
    label: "Round-tripped",
    oneLine: "you've held through a full cycle and given most of it back",
    angle:
      "You already know the part most people learn expensively: the problem was never the information. " +
      "You could see it, the moment arrived, and there was a convincing reason it was different this time. " +
      "That's exactly what happened to me: the indicators topped out in 2021, I did nothing, and it cost me through 2022.",
  },
  ACCUMULATING: {
    label: "Accumulating",
    oneLine: "you're buying consistently, with no written rule for getting out",
    angle:
      "Buying on a schedule is the half most people never manage, and you have. The other half is the one nobody " +
      "writes down — and you'll need it sooner than it currently feels necessary.",
  },
  SITTING: {
    label: "Sitting",
    oneLine: "you're holding without a written rule in either direction",
    angle:
      "Worth saying plainly: doing nothing is a position. It just doesn't feel like one, because you never had to " +
      "actively choose it — which means when the moment comes there's no rule to fall back on.",
  },
  NEW: {
    label: "Early",
    oneLine: "you're early enough to build the rule before you have anything at stake in it",
    angle:
      "Everyone else reading this has to unlearn a habit. You don't. And genuinely — don't spend money on any of " +
      "this yet. The free side has the score, the brief and the record, and it'll still be free in six months.",
  },
};

function normaliseSegment(raw) {
  const s = String(raw || "").toUpperCase().replace(/[^A-Z]/g, "");
  return SEGMENTS[s] ? s : null;
}

const L = (path, content) =>
  `https://liftoffr.com${path}?utm_source=resend&utm_medium=email&utm_campaign=quiz&utm_content=${content}`;

function quizHTML({ score, zone }, segKey) {
  const seg = SEGMENTS[segKey] || SEGMENTS.SITTING;
  const label = SEGMENTS[segKey] ? seg.label : "your cycle position";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;supported-color-schemes:light only}</style></head><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
  <div style="background:#080808;padding:28px;text-align:center;">
    <div style="display:inline-block;background:#e63946;color:#fff;padding:5px 12px;border-radius:4px;font-family:Helvetica,sans-serif;font-style:italic;font-size:22px;font-weight:900;letter-spacing:-0.5px;">lift<span style="color:#000;">offr</span></div>
    <div style="margin-top:14px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Your cycle position</div>
  </div>
  <div style="padding:32px 28px;color:#222;font-size:15px;line-height:1.7;">
    <p style="margin:0 0 16px;">You came out as <strong style="color:#080808;">${label}</strong>.</p>
    <p style="margin:0 0 16px;">What that means in one line: ${seg.oneLine}.</p>
    <p style="margin:0 0 20px;color:#555;">${seg.angle}</p>

    <div style="background:#080808;color:#fff;border-radius:10px;padding:22px;margin:20px 0;text-align:center;">
      <div style="font-size:11px;color:#999;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;">Today's Score</div>
      <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:56px;font-weight:700;line-height:1;letter-spacing:-2px;margin-top:8px;">${score.toFixed(1)}</div>
      <div style="margin-top:8px;font-size:13px;font-weight:700;color:#e63946;letter-spacing:1.5px;text-transform:uppercase;">${zone}</div>
    </div>

    <p style="margin:0 0 16px;">Above 85 the model reads as exit territory. Below 20, accumulation. In between it's telling you to do nothing, which is where it sits most of the time and which is the part people find hardest.</p>

    <p style="margin:24px 0 10px;font-weight:700;color:#080808;">Three things, all free, no card:</p>
    <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:0 0 18px;font-size:14px;line-height:1.8;color:#333;">
      <div><strong>The score</strong> — updated every morning, public, no account needed: <a href="${L("/cycle", "e1_cycle")}" style="color:#e63946;">liftoffr.com/cycle</a></div>
      <div><strong>The daily brief</strong> — 8am MT in the Discord: <a href="${L("/free", "e1_free")}" style="color:#e63946;">liftoffr.com/free</a></div>
      <div><strong>The receipts</strong> — every zone change the model has produced across fifteen years, including the ones that went the wrong way: <a href="${L("/receipts", "e1_receipts")}" style="color:#e63946;">liftoffr.com/receipts</a></div>
    </div>

    <p style="margin:0 0 16px;"><strong>Go look at the receipts page first.</strong> Read the label at the top of it. I'd rather you start there than anywhere else on the site.</p>
    <p style="margin:24px 0 0;">— Torin</p>
  </div>
  <div style="padding:0 28px 32px;">
    <a href="${L("/receipts", "e1_cta")}" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">Read the receipts →</a>
  </div>
  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6;">
    Educational content only. Not financial advice. Every dated signal on the site is a historical backtest, not a record of calls published at the time. Past performance does not predict future results.<br/>
    LiftOffr · You took the cycle-position quiz at liftoffr.com/quiz.<br/>
    <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
  </div>
</div></body></html>`;
}

function quizText({ score, zone }, segKey) {
  const seg = SEGMENTS[segKey] || SEGMENTS.SITTING;
  const label = SEGMENTS[segKey] ? seg.label : "your cycle position";
  return [
    `You came out as ${label}.`,
    "",
    `What that means in one line: ${seg.oneLine}.`,
    "",
    seg.angle,
    "",
    `Today's Score: ${score.toFixed(1)} (${zone})`,
    "",
    "Above 85 the model reads as exit territory. Below 20, accumulation. In between it's telling you to do nothing — where it sits most of the time, and the part people find hardest.",
    "",
    "THREE THINGS, ALL FREE, NO CARD:",
    `  The score, updated every morning: ${L("/cycle", "e1_cycle")}`,
    `  The daily brief, 8am MT in the Discord: ${L("/free", "e1_free")}`,
    `  The receipts — every zone change across fifteen years, including the ones that went the wrong way: ${L("/receipts", "e1_receipts")}`,
    "",
    "Go look at the receipts page first. Read the label at the top of it. I'd rather you start there than anywhere else on the site.",
    "",
    "— Torin",
    "",
    "Educational content only. Not financial advice. Every dated signal on the site is a historical backtest, not a record of calls published at the time.",
  ].join("\n");
}

function unsubUrl(email) {
  const t = crypto.createHmac("sha256", process.env.CRON_SECRET || "liftoffr")
    .update((email || "").toLowerCase()).digest("hex").slice(0, 16);
  return `https://liftoffr.com/api/subscribe?u=1&e=${encodeURIComponent(email)}&t=${t}`;
}

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

function welcomeHTML({ score, zone, trendDelta7d, commentary }, m = MAGNETS.checklist) {
  const trendArrow = trendDelta7d > 0 ? "▲" : trendDelta7d < 0 ? "▼" : "◆";
  const trendStr = `${trendArrow} ${trendDelta7d >= 0 ? "+" : ""}${trendDelta7d} over last 7 days`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;supported-color-schemes:light only}</style></head><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

  <div style="background:#080808;padding:32px 28px;text-align:center;">
    <div style="display:inline-block;background:#e63946;color:#fff;padding:5px 12px;border-radius:4px;font-family:Helvetica,sans-serif;font-style:italic;font-size:22px;font-weight:900;letter-spacing:-0.5px;">lift<span style="color:#000;">offr</span></div>
    <div style="margin-top:18px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">${m.eyebrow}</div>
  </div>

  <div style="padding:32px 28px;color:#222;font-size:15px;line-height:1.6;">
    <p style="margin:0 0 18px;">Hey,</p>
    <p style="margin:0 0 18px;">Two things in this email — the download you asked for, and a quick heads-up about what'll show up in your inbox every Sunday from now on.</p>

    <p style="margin:24px 0 8px;font-weight:700;color:#080808;">${m.itemTitle}</p>
    <p style="margin:0 0 18px;"><a href="${m.pdfUrl}" style="background:#e63946;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:800;">👉 Download the PDF</a></p>
    <p style="margin:0 0 18px;color:#555;">${m.howTo}</p>

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
    <p style="margin:0 0 18px;color:#555;">Through 2021 and 2022 I watched friends ride BTC from $20k → $69k → $16k. Round trip. Zero profit. They didn't have a system — they had hopium. The Checklist + Score is the system I wish I'd had then.</p>

    <p style="margin:24px 0 0;">See you Sunday.</p>
    <p style="margin:6px 0 0;color:#555;">— Torin<br/><em style="color:#999;">Founder, LiftOffr</em></p>
  </div>

  <div style="padding:0 28px 28px;">
    <a href="https://liftoffr.com/cycle?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=dashboard_cta" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">See the live Score dashboard →</a>
  </div>

  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6;">
    Backtested 2017–2026. Past performance does not guarantee future results.<br/>
    LiftOffr · ${m.footerLine}<br/>
    <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
  </div>

</div>
</body></html>`;
}

function welcomeText({ score, zone, trendDelta7d, commentary }, m = MAGNETS.checklist) {
  return [
    "Hey,",
    "",
    "Two things in this email — the download you asked for, and a quick heads-up about what'll show up in your inbox every Sunday from now on.",
    "",
    m.itemTitleText,
    m.pdfUrl,
    "",
    m.howTo,
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
    "Why I built this: through 2021 and 2022 I watched friends ride BTC from $20k → $69k → $16k. Round trip. Zero profit. The Checklist + Score is the system I wish I'd had then.",
    "",
    "See you Sunday.",
    "— Torin",
    "Founder, LiftOffr",
    "",
    "Live Score dashboard: https://liftoffr.com/cycle?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=dashboard_cta",
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

// ── Unsubscribe (folded in here to stay under Vercel's 12-function cap) ──
// One-click (RFC 8058): email footers + List-Unsubscribe headers point to
// /api/subscribe?u=1&e=<email>&t=<token>. POST = silent one-click; GET = page.
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
    } catch (_) {}
  }
}
function unsubPage(msg) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>LiftOffr</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#060910;color:#e9eef7;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;margin:0"><div style="max-width:440px;padding:30px"><div style="font-weight:900;font-size:22px;font-style:italic;letter-spacing:-.5px">lift<span style="color:#e63946">offr</span></div><p style="margin-top:20px;font-size:15px;line-height:1.65;color:#c9d2e3">${msg}</p></div></body></html>`;
}

export default async function handler(req, res) {
  // Unsubscribe branch — triggered by ?u=1 (any method)
  const uq = new URL(req.url, "http://localhost").searchParams;
  if (uq.get("u") === "1") {
    const email = (uq.get("e") || "").trim();
    if (req.method === "POST") { if (email) await markUnsubscribed(email); return res.status(200).send("unsubscribed"); }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    if (!email || !email.includes("@")) return res.status(400).send(unsubPage("That unsubscribe link looks incomplete — reply to any email and I'll remove you manually."));
    await markUnsubscribed(email);
    return res.status(200).send(unsubPage("You're unsubscribed — you won't get any more emails from LiftOffr.<br><br>Changed your mind? Just reply to any past email."));
  }

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

    // Step 3 — send Welcome email immediately (magnet-aware)
    // The quiz takes its own branch: different email, and it carries a segment
    // tag that the follow-up cron reads to pick emails 2-7.
    const isQuiz = body.magnet === "quiz";
    const segmentKey = isQuiz ? normaliseSegment(body.segment) : null;
    const magnetKey = isQuiz ? "quiz" : body.magnet === "buyzone" ? "buyzone" : "checklist";
    const magnet = MAGNETS[magnetKey] || MAGNETS.checklist;
    const subject = isQuiz ? "your cycle position" : magnet.subject;
    const uu = unsubUrl(email);

    // Segment routing. Each quiz segment can have its own Resend audience so the
    // sequence can address them separately; until those audiences exist in the
    // Resend dashboard the contact simply stays in the main free audience and
    // the segment travels as a Resend tag instead. See QUIZ_SETUP.md — this is
    // deliberately a no-op rather than an error when unconfigured, so nothing
    // in the live account has to change for the quiz to work.
    if (isQuiz && segmentKey) {
      const segAud = process.env[`RESEND_QUIZ_AUDIENCE_${segmentKey}`] || process.env.RESEND_QUIZ_AUDIENCE_ID;
      if (segAud) {
        try {
          await fetch(`https://api.resend.com/audiences/${segAud}/contacts`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "User-Agent": "liftoffr-subscribe/1.0",
            },
            body: JSON.stringify({ email, unsubscribed: false }),
          });
        } catch (e) {
          // Non-fatal: the welcome email still sends and the contact is already
          // in the main audience. Segment routing degrading must never cost a lead.
          console.error("subscribe: quiz segment audience add failed", segmentKey, String(e).slice(0, 200));
        }
      }
    }
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "liftoffr-subscribe/1.0",
        "List-Unsubscribe": `<${uu}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        reply_to: REPLY_TO,
        subject,
        text: (isQuiz ? quizText(score, segmentKey) : welcomeText(score, magnet) || "") + `\n\nUnsubscribe: ${uu}`,
        html: (isQuiz ? quizHTML(score, segmentKey) : welcomeHTML(score, magnet)).replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, uu),
        tags: [
          { name: "campaign", value: isQuiz ? "quiz" : "welcome" },
          { name: "magnet", value: magnetKey },
          { name: "segment", value: segmentKey || "none" },
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
