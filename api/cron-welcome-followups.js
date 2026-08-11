// Welcome sequence follow-up cron — Day 3 and Day 7 emails.
//
// Vercel cron config (vercel.json) calls this DAILY (Hobby plan: 1 run/day). We compute each contact's
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

import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const FROM_ADDRESS = "Torin from LiftOffr <torin@liftoffr.com>";
const REPLY_TO     = "torin.christianson@gmail.com";

function unsubUrl(email) {
  const t = crypto.createHmac("sha256", process.env.CRON_SECRET || "liftoffr")
    .update((email || "").toLowerCase()).digest("hex").slice(0, 16);
  return `https://liftoffr.com/api/subscribe?u=1&e=${encodeURIComponent(email)}&t=${t}`;
}

const SUBJECT_QW = "See today's Bitcoin cycle Score in 10 seconds";
const SUBJECT_E2 = "How to actually use the Score (3-minute habit, every Sunday)";
const SUBJECT_PROOF = "$50/week became $1.88M — the backtest";
// Was: "7 days of the full system — free, no card (last welcome email)" — a
// leftover from the 7-day trial, which was retired 2026-08-02. The body pitches
// the $29 plan and has never mentioned a trial; the subject was promising a
// product that no longer exists.
const SUBJECT_E3 = "The shortcut, if you want it (last welcome email)";
const SUBJECT_REENGAGE = "We're in the buy zone — here's the play";

// ── Plan-buyer sequence (LIFTOFFR_MASTER_PLAN.md §5) ──
// Audience: Resend "LiftOffr Plan Buyers", populated by api/whop-webhook.js on
// the $29 purchase. Dormant until RESEND_PLAN_AUDIENCE_ID is set in Vercel —
// the audience has to exist before anything can be sent to it, and sending the
// free-list sequence to buyers would be worse than sending nothing.
//
// Shape, and the reason for it: D0 and D1 are pure delivery with zero pitch.
// You earn the right to pitch by making the thing work first; a buyer who gets
// upsold in the receipt email learns the $29 was the bait.
const PSUBJECT_0  = "You're in — your plan + the one thing to do tonight";
const PSUBJECT_1  = "How to actually place the ladder (10 minutes)";
const PSUBJECT_3  = "The plan is a snapshot. Here's the camera.";
const PSUBJECT_7  = "The 2021 miss that built this — and the receipts since";
const PSUBJECT_14 = "Where the founding window stands";

function planShell(eyebrow, bodyHTML, ctaText, ctaHref) {
  return trialShell(eyebrow, bodyHTML, ctaText, ctaHref);
}

function plan0HTML() {
  return planShell("Plan · Day 0",
    `<p style="margin:0 0 16px;">You're in. Thank you — genuinely.</p>
     <p style="margin:0 0 16px;">Three things, then I'll leave you alone:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.8;color:#333;">
       <div><strong>1.</strong> Your plan document is in Whop, under your purchases. Lifetime access, and it updates in place.</div>
       <div><strong>2.</strong> Join the Discord and check <strong>#plan-updates</strong> — that's where a tier firing gets announced, with the receipt.</div>
       <div><strong>3.</strong> Tonight, do the worksheet. Twenty minutes. Your stack size in, your own nine levels out.</div>
     </div>
     <p style="margin:18px 0 16px;"><strong>Do number three tonight.</strong> Not this weekend. The entire value of a written plan is that it was written before anything was happening — and right now, nothing is happening. That's the window.</p>
     <p style="margin:0 0 16px;">No pitch in this email and none in the next one. Reply if anything's unclear; I read all of them.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "Open the Discord →", "https://liftoffr.com/welcome-plan");
}
function plan0Text() {
  return ["You're in. Thank you — genuinely.","","Three things, then I'll leave you alone:","",
    "1. Your plan document is in Whop, under your purchases. Lifetime access, updates in place.",
    "2. Join the Discord and check #plan-updates — a tier firing gets announced there, with the receipt.",
    "3. Tonight, do the worksheet. Twenty minutes. Your stack size in, your own nine levels out.","",
    "Do number three tonight, not this weekend. The whole value of a written plan is that it was written before anything was happening — and right now nothing is. That's the window.","",
    "No pitch in this email and none in the next one. Reply if anything's unclear; I read all of them.","",
    "https://liftoffr.com/welcome-plan","","— Torin"].join("\n");
}

function plan1HTML() {
  return planShell("Plan · Day 1",
    `<p style="margin:0 0 16px;">Execution, since that's where written plans die.</p>
     <p style="margin:0 0 14px;"><strong>Place the ladder as limit orders, not reminders.</strong> A limit order at your tier price executes whether or not you're awake, calm, or looking. A note in your phone requires you to be all three on the worst day of the year.</p>
     <p style="margin:0 0 14px;"><strong>The fallback rule matters more than the tiers.</strong> If price never reaches your levels, you don't get to sit in cash for two years feeling clever. The doc has the DCA fallback — read that section twice.</p>
     <p style="margin:0 0 14px;"><strong>Every fill ends the same way.</strong> Off the exchange, onto hardware, same week. An unexecuted custody step is how a good entry becomes someone else's Bitcoin.</p>
     <p style="margin:0 0 16px;">That's the whole mechanic. Tools I use for the alerts and the custody are listed here if you need them: <a href="https://liftoffr.com/stack?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d1_stack" style="color:#e63946;">liftoffr.com/stack</a> — commission status disclosed on every link.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "", "");
}
function plan1Text() {
  return ["Execution, since that's where written plans die.","",
    "1. Place the ladder as LIMIT ORDERS, not reminders. A limit order executes whether or not you're awake, calm, or looking. A note in your phone needs you to be all three on the worst day of the year.","",
    "2. The fallback rule matters more than the tiers. If price never reaches your levels you don't get to sit in cash for two years feeling clever. Read that section twice.","",
    "3. Every fill ends the same way: off the exchange, onto hardware, same week.","",
    "Tools I use for alerts and custody: https://liftoffr.com/stack?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d1_stack — commission status disclosed on every link.","","— Torin"].join("\n");
}

function plan3HTML() {
  return planShell("Plan · Day 3",
    `<p style="margin:0 0 16px;">First time I'll mention this, and then it's in the footer where you can ignore it.</p>
     <p style="margin:0 0 16px;">The plan you bought is a <em>snapshot</em>: nine levels, priced off where the cycle is now. It answers "what am I buying and at what price."</p>
     <p style="margin:0 0 16px;">It doesn't answer the other two questions, and both cost more than the first one:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.8;color:#333;">
       <div><strong>Why those levels</strong> — the eight indicators, how each one has failed, and how the weighted Score turns them into one number</div>
       <div><strong>When to sell</strong> — the exit ladder. Deliberately not in the $29, because scaling out is the half that actually made the difference in the backtest</div>
     </div>
     <p style="margin:18px 0 16px;"><strong>The Cycle System is $197, one payment.</strong> Founding price <strong>$147</strong> for the first 50 seats. Your $29 counts toward it either way — during the window and after it closes.</p>
     <p style="margin:0 0 16px;">If the plan alone is what you wanted, that's a complete purchase. Nothing in it expires and nothing is held back.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "Claim a founding seat — $147 →", "https://whop.com/checkout/plan_3SEycpErj9Zk7");
}
function plan3Text() {
  return ["First time I'll mention this, then it lives in the footer where you can ignore it.","",
    "The plan you bought is a snapshot: nine levels, priced off where the cycle is now. It answers 'what am I buying and at what price.'","",
    "It doesn't answer the other two questions, and both cost more than the first:","",
    "  • WHY those levels — the eight indicators, how each one has failed, and how the weighted Score turns them into one number",
    "  • WHEN TO SELL — the exit ladder. Deliberately not in the $29, because scaling out is the half that made the difference in the backtest.","",
    "The Cycle System is $197, one payment. Founding price $147 for the first 50 seats. Your $29 counts toward it either way — during the window and after it closes.","",
    "If the plan alone is what you wanted, that's a complete purchase. Nothing in it expires and nothing is held back.","",
    "https://whop.com/checkout/plan_3SEycpErj9Zk7","","— Torin"].join("\n");
}

function plan7HTML() {
  return planShell("Plan · Day 7",
    `<p style="margin:0 0 16px;">The thing that makes this plan worth anything isn't the wins. It's that the losses are on the same page.</p>
     <p style="margin:0 0 16px;">In 2021 my own indicators told me to scale out. I didn't. I round-tripped roughly <strong>$30,000</strong> — the entire gain — because I had conviction and no written exit.</p>
     <p style="margin:0 0 16px;">Everything I've built since exists so that decision gets made while I'm calm instead of while I'm euphoric. October 6, 2025: DCA'd out at <strong>$124,824</strong>. Not because I got smarter — because it was already written down.</p>
     <p style="margin:0 0 16px;">All of it is public and checkable, including the misses: <a href="https://liftoffr.com/receipts.html?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_receipts" style="color:#e63946;">the receipts</a> and <a href="https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_track" style="color:#e63946;">the full backtest</a>.</p>
     <p style="margin:0 0 16px;">One ask, and it is not a condition of anything: if the plan has been worth the $29, an honest review on Whop takes two minutes and does more for this than any ad I could run. If it hasn't, reply and tell me that instead — I'd rather have the correction.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "See the receipts →", "https://liftoffr.com/receipts.html?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_cta");
}
function plan7Text() {
  return ["The thing that makes this plan worth anything isn't the wins. It's that the losses are on the same page.","",
    "In 2021 my own indicators told me to scale out. I didn't. I round-tripped roughly $30,000 — the entire gain — because I had conviction and no written exit.","",
    "Everything since exists so that decision gets made while I'm calm instead of euphoric. October 6, 2025: DCA'd out at $124,824. Not because I got smarter — because it was already written down.","",
    "Public and checkable, misses included:",
    "  https://liftoffr.com/receipts.html?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_receipts",
    "  https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_track","",
    "One ask, not a condition of anything: if the plan's been worth $29, an honest Whop review takes two minutes and does more for this than any ad I could run. If it hasn't, reply and tell me instead.","","— Torin"].join("\n");
}

function plan14HTML() {
  return planShell("Plan · Day 14 · last dedicated email",
    `<p style="margin:0 0 16px;">Last email in this sequence. After today you're just on the Sunday Score with everyone else.</p>
     <p style="margin:0 0 16px;">Two things worth knowing before I stop:</p>
     <p style="margin:0 0 14px;"><strong>1. The founding window on The Cycle System.</strong> 50 seats at $147, and a written close date — no timer, no countdown, no "spots going fast" theatre. After it closes the price is $197 and your $29 still credits, permanently. That is the entire offer.</p>
     <p style="margin:0 0 14px;"><strong>2. If you'd rather I just do it with you.</strong> The Cycle Playbook is a private 90-minute session where we build your ladder and your exit ladder against your actual portfolio, and you leave with the document and the recording. Four a month, because it's my calendar. <a href="https://liftoffr.com/playbook?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d14_playbook" style="color:#e63946;">Details here.</a></p>
     <p style="margin:0 0 16px;">And if the answer to both is no — that's a normal outcome and the plan you already have keeps updating for the rest of this bear regardless. Nothing behind a second paywall.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "Claim a founding seat — $147 →", "https://whop.com/checkout/plan_3SEycpErj9Zk7");
}
function plan14Text() {
  return ["Last email in this sequence. After today you're on the Sunday Score with everyone else.","",
    "1. THE FOUNDING WINDOW on The Cycle System: 50 seats at $147 and a written close date — no timer, no countdown, no 'spots going fast' theatre. After it closes the price is $197 and your $29 still credits, permanently.","",
    "2. IF YOU'D RATHER I DID IT WITH YOU: the Cycle Playbook is a private 90-minute session where we build your ladder and your exit ladder against your actual portfolio. You leave with the doc and the recording. Four a month.",
    "   https://liftoffr.com/playbook?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d14_playbook","",
    "If the answer to both is no, that's a normal outcome — the plan you have keeps updating for the rest of this bear regardless. Nothing behind a second paywall.","",
    "https://whop.com/checkout/plan_3SEycpErj9Zk7","","— Torin"].join("\n");
}

function email2HTML() {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;supported-color-schemes:light only}</style></head><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
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
    <p style="margin:0 0 16px;">The eight indicators the Score is built from are all public, each with today's reading and what it read at every cycle top since 2013. No signup, nothing gated.</p>
    <p style="margin:24px 0 0;">— Torin</p>
  </div>
  <div style="padding:0 28px 32px;">
    <a href="https://liftoffr.com/indicators?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day3_indicators" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">See every indicator, live →</a>
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
    "The eight indicators behind the Score are all public — today's reading for each, plus what every one read at every cycle top since 2013:",
    "https://liftoffr.com/indicators?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day3_indicators",
    "",
    "— Torin",
  ].join("\n");
}

function email3HTML() {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;supported-color-schemes:light only}</style></head><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
  <div style="background:#080808;padding:28px;text-align:center;">
    <div style="display:inline-block;background:#e63946;color:#fff;padding:5px 12px;border-radius:4px;font-family:Helvetica,sans-serif;font-style:italic;font-size:22px;font-weight:900;letter-spacing:-0.5px;">lift<span style="color:#000;">offr</span></div>
    <div style="margin-top:14px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Welcome · Day 7 · final</div>
  </div>
  <div style="padding:32px 28px;color:#222;font-size:15px;line-height:1.65;">
    <p style="margin:0 0 16px;">Last email in the welcome sequence.</p>
    <p style="margin:0 0 16px;">From now on you'll get one email from me every Sunday morning — the LiftOffr Score, the zone, and a one-line read on what it means this week. That's the ongoing relationship. No daily spam, no sales sequences, no recycled Twitter takes.</p>
    <p style="margin:0 0 16px;">You can absolutely DIY this. Read the Score each Sunday, run the Checklist yourself, build your own discipline. That alone puts you ahead of 99% of crypto investors.</p>
    <p style="margin:0 0 16px;">But if you want the shortcut — <strong>My Bear Market Buy Plan</strong> is the exact nine-tier ladder I'm executing with my own money, with a timestamped receipt on every fire. It's <strong>$29, once</strong>. No subscription.</p>
    <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.7;color:#333;">
      <div>• Nine buy tiers — the exact levels I'm executing</div>
      <div>• Timestamped receipts on every fire</div>
      <div>• #plan-updates Discord channel — every move, live</div>
      <div>• Updated for the rest of this bear</div>
      <div>• Your $29 always counts toward The Cycle System</div>
    </div>
    <p style="margin:18px 0;">Either way — see you Sunday.</p>
    <p style="margin:18px 0 0;">— Torin<br/><em style="color:#999;">Founder, LiftOffr</em></p>
    <p style="margin:18px 0 0;font-size:13px;color:#888;">P.S. Not ready for $29? The scoreboard stays free — Discord + the Sunday Score: https://liftoffr.com/free</p>
  </div>
  <div style="padding:0 28px 32px;">
    <a href="https://liftoffr.com/plan" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">Get the plan — $29 once →</a>
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
    "But if you want the shortcut — My Bear Market Buy Plan is the exact nine-tier ladder I'm executing with my own money, receipts on every fire. $29, once. No subscription.",
    "",
    "  • Nine buy tiers — the exact levels I'm executing",
    "  • Timestamped receipts on every fire",
    "  • #plan-updates Discord channel — every move, live",
    "  • Updated for the rest of this bear",
    "  • Your $29 always counts toward The Cycle System",
    "",
    "Either way — see you Sunday.",
    "— Torin",
    "Founder, LiftOffr",
    "",
    "https://liftoffr.com/plan",
    "",
    "P.S. Not ready for $29? The scoreboard stays free: https://liftoffr.com/free",
  ].join("\n");
}

// ── Day 1: Quick win (activation → live dashboard) ──
function quickWinHTML() {
  return shell("Welcome · Day 1",
    `<p style="margin:0 0 16px;">Yesterday you grabbed the Checklist — the 8 indicators that flag a cycle top.</p>
     <p style="margin:0 0 16px;">Reading all 8 yourself takes about 15 minutes a week. Here's the shortcut: the live dashboard weights all 8 into <strong>one number, 0–100</strong>, updated daily.</p>
     <p style="margin:0 0 16px;">Open it and you'll see exactly where the cycle stands today — color-coded buy zone, neutral, or top zone. Ten seconds, no charts to decode.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "See today's Score →", "https://liftoffr.com/cycle?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day1_quickwin");
}
function quickWinText() {
  return ["Yesterday you grabbed the Checklist — the 8 indicators that flag a cycle top.","",
    "Reading all 8 yourself takes ~15 min a week. The shortcut: the live dashboard weights all 8 into one number, 0–100, updated daily.","",
    "Open it and you'll see exactly where the cycle stands today — buy zone, neutral, or top zone. Ten seconds.","",
    "See today's Score: https://liftoffr.com/cycle?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day1_quickwin","","— Torin"].join("\n");
}

// ── Day 5: Proof (the backtest + timestamped calls) ──
function proofHTML() {
  return shell("Welcome · Day 5",
    `<p style="margin:0 0 16px;">Most people don't believe this the first time — so here's the math, public and checkable.</p>
     <p style="margin:0 0 16px;">Run <strong>$50/week</strong> through this framework from 2017 to today:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.8;">
       <div>$24,450 contributed → <strong>$1.88M</strong></div>
       <div>Same $50/wk just buying &amp; holding → $217K</div>
       <div><strong>+7,602%</strong> over plain DCA</div>
       <div>100% win rate across 417 different start dates</div>
     </div>
     <p style="margin:0 0 16px;">It isn't magic. It's scaling <em>out</em> by the Score instead of guessing the top — and scaling <em>in</em> when everyone's scared.</p>
     <p style="margin:0 0 16px;">Receipts are timestamped. Dec 15, 2018: buy signal at $3.2K. BTC ran 21× to $69K. <a href="https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day5_proof" style="color:#e63946;font-weight:700;">Full backtest here →</a></p>
     <p style="margin:0 0 16px;">Want the plan built on those indicators — the exact nine-tier ladder I'm executing right now, receipts included? It's $29, once.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "Get the plan — $29 once →", "https://liftoffr.com/plan?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day5_plan");
}
function proofText() {
  return ["Most people don't believe this the first time — so here's the math, public and checkable.","",
    "Run $50/week through this framework from 2017 to today:",
    "  • $24,450 contributed -> $1.88M",
    "  • Same $50/wk buy-and-hold -> $217K",
    "  • +7,602% over plain DCA",
    "  • 100% win rate across 417 start dates","",
    "It isn't magic. It's scaling out by the Score instead of guessing the top — and scaling in when everyone's scared.","",
    "Receipts are timestamped. Dec 15, 2018: buy at $3.2K. BTC ran 21x to $69K.","",
    "Full backtest: https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day5_proof","",
    "Want the plan built on those indicators — the exact ladder I'm executing, receipts included? $29, once:",
    "https://liftoffr.com/plan?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day5_plan","","— Torin"].join("\n");
}

// ── Day 9: The stack (goodwill + the affiliate layer) ──
// Non-buyers are the majority forever, and this is the one email that earns
// from them without asking them for anything. Affiliate status is disclosed on
// the page itself, per link, and the email says so before the click.
const SUBJECT_STACK = "The 5 tools I actually run this on";
function stackHTML() {
  return shell("LiftOffr · the stack",
    `<p style="margin:0 0 16px;">Most-asked question in my DMs, and it isn't about Bitcoin's price. It's "what do you actually use?"</p>
     <p style="margin:0 0 16px;">Five tools. That's the whole operation:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.8;color:#333;">
       <div><strong>Two hardware wallets</strong> — every tier that fires ends with coins off the exchange, same week</div>
       <div><strong>Two tax tools</strong> — because a year of laddered buys is unreconstructable in April</div>
       <div><strong>One charting app</strong> — for drawing my tier levels and setting alerts. Nothing else.</div>
     </div>
     <p style="margin:18px 0 16px;">What's <em>not</em> on the list matters more: no exchange referrals, no trading bots, no leverage platforms. Exchange sign-ups pay the best commissions in this niche and I turned them down — they'd pay me more the more you trade, and this whole thing argues you should trade less.</p>
     <p style="margin:0 0 16px;">Full page has what each one is for, roughly what it costs, and where I'd tell you to skip it. Some links earn me a commission and every one says so underneath it.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "See the stack →", "https://liftoffr.com/stack?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day9_stack");
}
function stackText() {
  return ["Most-asked question in my DMs, and it isn't about Bitcoin's price. It's 'what do you actually use?'","",
    "Five tools. That's the whole operation:",
    "  • Two hardware wallets — every tier that fires ends with coins off the exchange, same week",
    "  • Two tax tools — a year of laddered buys is unreconstructable in April",
    "  • One charting app — for drawing tier levels and setting alerts. Nothing else.","",
    "What's NOT on the list matters more: no exchange referrals, no trading bots, no leverage platforms. Exchange sign-ups pay the best commissions in this niche and I turned them down — they'd pay me more the more you trade, and this whole thing argues you should trade less.","",
    "Full page has what each is for, roughly what it costs, and where I'd tell you to skip it. Some links earn me a commission and every one says so underneath it:",
    "https://liftoffr.com/stack?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day9_stack","","— Torin"].join("\n");
}

// ── Day 18: Re-engagement (timely buy-zone angle → trial) ──
function reengageHTML() {
  return shell("LiftOffr · checking in",
    `<p style="margin:0 0 16px;">I went quiet after the welcome series on purpose — no daily spam. But this one's worth a nudge.</p>
     <p style="margin:0 0 16px;">Right now the cycle's in the <strong>accumulation zone</strong> — the boring, scary part that quietly decides how the next bull plays out. It's the easy part to ignore and the expensive part to get wrong.</p>
     <p style="margin:0 0 16px;">If you'd rather not freelance it, the exact buy-ladder I'm running — nine tiers, timestamped receipts on every fire — is $29, once. No subscription.</p>
     <p style="margin:0 0 16px;">If now's not the time, no worries — you'll still get the Score every Sunday.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "Get the plan — $29 once →", "https://liftoffr.com/plan");
}
function reengageText() {
  return ["I went quiet after the welcome series on purpose — no daily spam. But this one's worth a nudge.","",
    "Right now the cycle's in the accumulation zone — the boring, scary part that decides how the next bull plays out. Easy to ignore, expensive to get wrong.","",
    "If you'd rather not freelance it, the exact buy-ladder I'm running — nine tiers, timestamped receipts — is $29, once. No subscription.","",
    "If now's not the time, no worries — you'll still get the Score every Sunday.","",
    "Get the plan ($29, once): https://liftoffr.com/plan","","— Torin"].join("\n");
}

// ─────────────────────────────────────────────────────────────────────────
// TRIAL NURTURE — for members inside the 7-day CARDLESS free trial.
// Fed by the Whop webhook (begin_trial → adds contact to the trial audience).
// The trial takes NO card and charges NOTHING — Whop just auto-revokes access
// at day 7. So the goal is to get them active fast, then earn an *active*
// upgrade decision (keep it on a paid tier) before access lapses.
// Feature-flagged: dormant unless RESEND_TRIAL_AUDIENCE_ID is set.
// ─────────────────────────────────────────────────────────────────────────
const TSUBJECT_1 = "You're in — here's exactly where to start";
const TSUBJECT_2 = "Day 3: are you actually using this?";
const TSUBJECT_3 = "Your trial ends tomorrow (here's what happens)";

const TRIAL_CHECKOUT = "https://whop.com/checkout/plan_JnWiKWtwzlTVR?utm_source=resend&utm_medium=email&utm_campaign=trial&utm_content=keep_pro";

function trialShell(eyebrow, bodyHTML, ctaText, ctaHref) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;supported-color-schemes:light only}</style></head><body style="margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
  <div style="background:#080808;padding:28px;text-align:center;">
    <div style="display:inline-block;background:#e63946;color:#fff;padding:5px 12px;border-radius:4px;font-family:Helvetica,sans-serif;font-style:italic;font-size:22px;font-weight:900;letter-spacing:-0.5px;">lift<span style="color:#000;">offr</span></div>
    <div style="margin-top:14px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">${eyebrow}</div>
  </div>
  <div style="padding:32px 28px;color:#222;font-size:15px;line-height:1.65;">${bodyHTML}</div>
  ${ctaText ? `<div style="padding:0 28px 32px;"><a href="${ctaHref}" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">${ctaText}</a></div>` : ""}
  <div style="padding:20px 28px 4px;border-top:1px solid #eee;font-size:13px;color:#666;line-height:1.7;">
    <p style="margin:0 0 6px;font-weight:700;color:#444;">Whenever you're ready, 3 ways I can help:</p>
    <p style="margin:0 0 2px;">1. <a href="https://liftoffr.com/cycle?utm_source=resend&utm_medium=email&utm_campaign=nurture&utm_content=menu_cycle" style="color:#e63946;">Check the live cycle dashboard</a> — free, always current</p>
    <p style="margin:0 0 2px;">2. <a href="https://liftoffr.com/plan?utm_source=resend&utm_medium=email&utm_campaign=nurture&utm_content=menu_plan" style="color:#e63946;">Get My Bear Market Buy Plan</a> — $29, once</p>
    <p style="margin:0 0 14px;">3. <a href="https://liftoffr.com/playbook?utm_source=resend&utm_medium=email&utm_campaign=nurture&utm_content=menu_playbook" style="color:#e63946;">Build your exact cycle plan with me</a> — the Cycle Playbook</p>
  </div>
  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6;">
    Backtested 2017–2026. Past performance does not guarantee future results.<br/>
    LiftOffr · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
  </div>
</div></body></html>`;
}

const shell = trialShell; // shared branded template, also used by the new free-list emails above
function trial1HTML() {
  return trialShell("Trial · Day 1",
    `<p style="margin:0 0 16px;">You're in — no card, no catch. Full access for 7 days, so let's make this week count.</p>
     <p style="margin:0 0 16px;">Here's the honest truth: people who poke around for 20 minutes and leave never convert, and they shouldn't. People who actually <em>use</em> it figure out fast whether it's worth keeping. So here's your 10-minute first session:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.8;">
       <div>1. Open Discord → <strong>#how-to-use-this-course</strong>, read the 3 pins</div>
       <div>2. Check the live dashboard — see today's Score and what zone we're in</div>
       <div>3. Read the 8am daily brief. That's the whole product in 3 minutes a day.</div>
     </div>
     <p style="margin:18px 0 16px;">That's it. Do those three things today and you'll know by Wednesday whether this belongs in your routine.</p>
     <p style="margin:24px 0 0;">— Torin<br/><em style="color:#999;">I read every reply. Hit me with questions.</em></p>`,
    "Join the Discord →", "https://liftoffr.com/discord");
}
function trial1Text() {
  return ["You're in — no card, no catch. Full access for 7 days, so let's make this week count.","",
    "People who poke around for 20 min and leave never convert. People who actually USE it figure out fast whether it's worth keeping. Your 10-minute first session:","",
    "1. Discord -> #how-to-use-this-course, read the 3 pins",
    "2. Check the live dashboard — today's Score and zone",
    "3. Read the 8am daily brief. That's the whole product in 3 min/day.","",
    "Do those three today and you'll know by Wednesday.","","— Torin (I read every reply)",
    "Join the Discord: https://liftoffr.com/discord"].join("\n");
}

function trial2HTML() {
  return trialShell("Trial · Day 3",
    `<p style="margin:0 0 16px;">Halfway through your trial. Quick gut-check.</p>
     <p style="margin:0 0 16px;">If you've been reading the daily brief, you've already seen the thing most people pay to learn the hard way: <strong>the read changes, and you don't have to guess.</strong></p>
     <p style="margin:0 0 16px;">If you <em>haven't</em> opened it yet — that's the whole product. One post, 8am MT, every weekday: here's the Score, here's the zone, here's what it means today. Three minutes. No charts to stare at, no Twitter to doom-scroll.</p>
     <p style="margin:0 0 16px;">The backtest is public if you want the proof: $50/wk run through this framework since 2017 turned $24,450 of contributions into $1.88M — vs $217K just buying and holding. 100% win rate vs DCA across 417 start dates.</p>
     <p style="margin:24px 0 0;">Four days left. And if you already know it's a keeper, don't wait for the day-6 reminder — lock in your founder rate now. It holds whether you do it today or Friday.</p>
     <p style="margin:18px 0 0;">— Torin</p>`,
    "Lock in my membership →", TRIAL_CHECKOUT);
}
function trial2Text() {
  return ["Halfway through your trial. Quick gut-check.","",
    "If you've read the daily brief, you've seen the thing most people pay to learn the hard way: the read changes, and you don't have to guess.","",
    "If you haven't opened it — that's the product. One post, 8am MT, weekdays: Score, zone, what it means today. Three minutes.","",
    "Proof is public: $50/wk through this framework since 2017 = $1.88M vs $217K buy-and-hold. 100% win rate vs DCA across 417 start dates.","",
    "Four days left. If you already know it's a keeper, lock in your founder rate now — it holds whether you do it today or Friday:",
    TRIAL_CHECKOUT,"","— Torin"].join("\n");
}

function trial3HTML() {
  return trialShell("Trial · Day 6 · ends tomorrow",
    `<p style="margin:0 0 14px;">Straight with you: <strong>tomorrow your free week ends and access just switches off.</strong> No card on file, so nothing gets charged — it simply lapses unless you choose to keep it.</p>
     <p style="margin:0 0 8px;">Tomorrow you lose access to:</p>
     <div style="background:#fff5f5;border:1px solid #f3c0c5;border-radius:10px;padding:16px 20px;margin:0 0 16px;font-size:14px;line-height:1.8;color:#333;">
       <div>✕ The daily 8am market brief</div>
       <div>✕ The live cycle dashboard + Score</div>
       <div>✕ Real-time signal alerts</div>
       <div>✕ The 36-lesson course</div>
       <div>✕ The private Discord community</div>
     </div>
     <p style="margin:0 0 8px;">Two options:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:0 0 16px;font-size:14px;line-height:1.7;color:#333;">
       <div style="margin-bottom:10px;"><strong>1. Keep it.</strong> Keep all of the above — <strong>Pro at $99/mo</strong>, or Core at $49/mo if you mostly want the daily read. Button below.</div>
       <div><strong>2. Let it lapse.</strong> Do nothing and access ends tomorrow. Nothing charged, no clawback, no hard feelings — that's the deal I promised.</div>
     </div>
     <p style="margin:18px 0 16px;">No trick, no auto-charge waiting to bite you. But if the daily read has been worth three minutes of your morning this week — keep it before it ends.</p>
     <p style="margin:24px 0 0;">— Torin<br/><em style="color:#999;">Founder, LiftOffr</em></p>
     <p style="margin:18px 0 0;font-size:13px;color:#888;">P.S. Want to go deeper than the membership? The <a href="https://liftoffr.com/playbook" style="color:#e63946;">Cycle Playbook</a> is a private 1:1 session where we build your full buy + sell plan together.</p>`,
    "Keep my access — go Pro →", TRIAL_CHECKOUT);
}
function trial3Text() {
  return ["Straight with you: tomorrow your free week ends and access just switches off. No card on file, so nothing gets charged — it simply lapses unless you keep it.","",
    "Tomorrow you lose: the daily 8am brief, the live dashboard + Score, real-time signal alerts, the 36-lesson course, and the private Discord.","",
    "1. KEEP IT — keep all of it with Pro ($99/mo; or Core $49 if you mostly want the daily read):",
    "   " + TRIAL_CHECKOUT,
    "2. LET IT LAPSE — do nothing, access ends tomorrow. Nothing charged, no hard feelings.","",
    "No trick, no auto-charge waiting to bite you. But if the daily read's been worth 3 minutes of your morning — keep it before it ends.","","— Torin, Founder LiftOffr","",
    "P.S. Want to go deeper? The Cycle Playbook — a private 1:1 session: https://liftoffr.com/playbook"].join("\n");
}

const TSUBJECT_4 = "Your LiftOffr access just lapsed";
function trial4HTML() {
  return shell("Trial · ended",
    `<p style="margin:0 0 16px;">Your free week's up, so access switched off — exactly as promised. No card, nothing charged.</p>
     <p style="margin:0 0 16px;">If you got busy and meant to keep it, the door's still open. Pick up right where you left off:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.7;color:#333;">
       <div><strong>Pro — $99/mo:</strong> daily brief, live dashboard, signal alerts, full course, community.</div>
       <div style="margin-top:8px;"><strong>Core — $49/mo:</strong> the lighter set if you just want the read.</div>
     </div>
     <p style="margin:0 0 16px;">Cancel anytime, 30-day refund. One honest heads-up: founder pricing holds for now, but it goes up as we add tiers — reactivating today locks your rate.</p>
     <p style="margin:24px 0 0;">— Torin<br/><em style="color:#999;">Founder, LiftOffr</em></p>`,
    "Reactivate my access →", TRIAL_CHECKOUT);
}
function trial4Text() {
  return ["Your free week's up, so access switched off — exactly as promised. No card, nothing charged.","",
    "If you got busy and meant to keep it, the door's still open:",
    "  • Pro $99/mo — daily brief, dashboard, signal alerts, course, community",
    "  • Core $49/mo — the lighter set if you just want the read","",
    "Cancel anytime, 30-day refund. Heads-up: founder pricing goes up as we add tiers — reactivating today locks your rate.","",
    "Reactivate: " + TRIAL_CHECKOUT,"","— Torin, Founder LiftOffr"].join("\n");
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

async function fetchAudience(aud) {
  const key = process.env.RESEND_API_KEY;
  const r = await fetch(`https://api.resend.com/audiences/${aud}/contacts`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const data = await r.json();
  return (data.data || []).filter((c) => c.email && !c.unsubscribed);
}

async function sendResend({ to, subject, text, html, idempotencyKey, tag, campaign = "welcome" }) {
  // Real one-click unsubscribe: replace the literal {{{RESEND_UNSUBSCRIBE_URL}}}
  // token (Resend only substitutes it for Broadcasts, not transactional sends)
  // and set List-Unsubscribe headers (RFC 8058).
  const uu = unsubUrl(to);
  html = (html || "").replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, uu);
  text = (text || "") + `\n\nUnsubscribe: ${uu}`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "User-Agent": "liftoffr-welcome-followup/1.0",
      "List-Unsubscribe": `<${uu}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      reply_to: REPLY_TO,
      subject,
      text,
      html,
      tags: [
        { name: "campaign", value: campaign },
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
  const expected = process.env.CRON_SECRET;
  const got = req.headers["authorization"] || "";
  const authed = !expected || got === `Bearer ${expected}`;

  // Preview mode — render any email as HTML (no send). For QA/review.
  // Was unauthenticated, which published every template — including the retired
  // trial emails and their dead $99/mo + $49/mo pricing — on a public URL that
  // contradicted the live one-time-purchase pricing everywhere else. Same auth
  // as the send path now.
  const _url = new URL(req.url, "http://localhost");
  const preview = _url.searchParams.get("preview");
  if (preview) {
    if (!authed) return res.status(401).json({ error: "Unauthorized" });
    const map = {
      qw: quickWinHTML, e2: email2HTML, proof: proofHTML, e3: email3HTML,
      stack: stackHTML, reengage: reengageHTML,
      p0: plan0HTML, p1: plan1HTML, p3: plan3HTML, p7: plan7HTML, p14: plan14HTML,
      t1: trial1HTML, t2: trial2HTML, t3: trial3HTML, t4: trial4HTML,
    };
    const fn = map[preview];
    if (!fn) return res.status(400).json({ error: "unknown preview", options: Object.keys(map) });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(fn());
  }

  // Auth guard
  // `?force=1` used to bypass this check entirely, which left a public endpoint
  // that sends email to the whole list callable by anyone who knew the URL.
  // Auth is now unconditional; force only exists to skip the once-per-window
  // guard for an authorised manual run.
  if (!authed) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const contacts = await fetchContacts();
    const results = { qw_sent: 0, e2_sent: 0, proof_sent: 0, e3_sent: 0, stack_sent: 0, reengage_sent: 0, qw_failed: 0, e2_failed: 0, proof_failed: 0, e3_failed: 0, stack_failed: 0, reengage_failed: 0, skipped: 0, errors: [] };

    // Fire one email for a contact, dedupe via idempotency key, then pace 600ms.
    const fire = async (c, subject, text, html, key, tag, okCounter, badCounter) => {
      try {
        await sendResend({ to: c.email, subject, text, html, idempotencyKey: `${key}-${c.id}`, tag });
        results[okCounter]++;
      } catch (e) {
        results[badCounter]++;
        results.errors.push({ id: c.id, step: tag, err: String(e).slice(0, 200) });
      }
      await new Promise((r) => setTimeout(r, 600));
    };

    for (const c of contacts) {
      const age = ageDays(c.created_at);
      // Day 1 — quick win (1.0–2.0)
      if (age >= 1.0 && age < 2.0) { await fire(c, SUBJECT_QW, quickWinText(), quickWinHTML(), "welcome-qw", "day1", "qw_sent", "qw_failed"); continue; }
      // Day 3 — how to use the Score (3.0–4.0)
      if (age >= 3.0 && age < 4.0) { await fire(c, SUBJECT_E2, email2Text(), email2HTML(), "welcome-e2", "day3", "e2_sent", "e2_failed"); continue; }
      // Day 5 — proof / backtest (5.0–6.0)
      if (age >= 5.0 && age < 6.0) { await fire(c, SUBJECT_PROOF, proofText(), proofHTML(), "welcome-proof", "day5", "proof_sent", "proof_failed"); continue; }
      // Day 7 — conversion / founder pitch (7.0–8.0)
      if (age >= 7.0 && age < 8.0) { await fire(c, SUBJECT_E3, email3Text(), email3HTML(), "welcome-e3", "day7", "e3_sent", "e3_failed"); continue; }
      // Day 9 — the stack (goodwill + affiliate layer) (9.0–10.0)
      if (age >= 9.0 && age < 10.0) { await fire(c, SUBJECT_STACK, stackText(), stackHTML(), "welcome-stack", "day9", "stack_sent", "stack_failed"); continue; }
      // Day 18 — re-engagement (18.0–19.0)
      if (age >= 18.0 && age < 19.0) { await fire(c, SUBJECT_REENGAGE, reengageText(), reengageHTML(), "welcome-reengage", "day18", "reengage_sent", "reengage_failed"); continue; }
      results.skipped++;
    }

    // ── Plan-buyer sequence (master plan §5). Dormant until the audience exists.
    const planAud = process.env.RESEND_PLAN_AUDIENCE_ID || null;
    let planSeq = null;
    if (planAud) {
      planSeq = { p0_sent: 0, p1_sent: 0, p3_sent: 0, p7_sent: 0, p14_sent: 0, failed: 0, skipped: 0, total: 0, errors: [] };
      const buyers = await fetchAudience(planAud);
      planSeq.total = buyers.length;
      const steps = [
        { lo: 0.0,  hi: 1.0,  subj: PSUBJECT_0,  html: plan0HTML,  text: plan0Text,  key: "p0",  k: "p0_sent" },
        { lo: 1.0,  hi: 2.0,  subj: PSUBJECT_1,  html: plan1HTML,  text: plan1Text,  key: "p1",  k: "p1_sent" },
        { lo: 3.0,  hi: 4.0,  subj: PSUBJECT_3,  html: plan3HTML,  text: plan3Text,  key: "p3",  k: "p3_sent" },
        { lo: 7.0,  hi: 8.0,  subj: PSUBJECT_7,  html: plan7HTML,  text: plan7Text,  key: "p7",  k: "p7_sent" },
        { lo: 14.0, hi: 15.0, subj: PSUBJECT_14, html: plan14HTML, text: plan14Text, key: "p14", k: "p14_sent" },
      ];
      for (const c of buyers) {
        const age = ageDays(c.created_at);
        const step = steps.find((s) => age >= s.lo && age < s.hi);
        if (!step) { planSeq.skipped++; continue; }
        try {
          await sendResend({
            to: c.email,
            subject: step.subj,
            text: step.text(),
            html: step.html(),
            idempotencyKey: `plan-${step.key}-${c.id}`,
            tag: step.key,
            campaign: "plan",
          });
          planSeq[step.k]++;
        } catch (e) {
          planSeq.failed++;
          planSeq.errors.push({ id: c.id, step: step.key, err: String(e).slice(0, 200) });
        }
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    // ── Trial nurture — RETIRED 2026-08-02. The 7-day trial is dead (LIFTOFFR_MASTER_PLAN.md).
    // Hard-disabled regardless of env: RESEND_TRIAL_AUDIENCE_ID may still exist in Vercel.
    const trialAud = null;
    let trial = null;
    if (trialAud) {
      trial = { t1_sent: 0, t2_sent: 0, t3_sent: 0, t4_sent: 0, failed: 0, skipped: 0, total: 0, errors: [] };
      const trialContacts = await fetchAudience(trialAud);
      trial.total = trialContacts.length;
      const steps = [
        { lo: 0.0, hi: 1.0, subj: TSUBJECT_1, html: trial1HTML, text: trial1Text, key: "t1", k: "t1_sent" },
        { lo: 3.0, hi: 4.0, subj: TSUBJECT_2, html: trial2HTML, text: trial2Text, key: "t2", k: "t2_sent" },
        { lo: 5.5, hi: 6.5, subj: TSUBJECT_3, html: trial3HTML, text: trial3Text, key: "t3", k: "t3_sent" },
        { lo: 8.0, hi: 9.5, subj: TSUBJECT_4, html: trial4HTML, text: trial4Text, key: "t4", k: "t4_sent" },
      ];
      for (const c of trialContacts) {
        const age = ageDays(c.created_at);
        const step = steps.find((s) => age >= s.lo && age < s.hi);
        if (!step) { trial.skipped++; continue; }
        try {
          await sendResend({
            to: c.email,
            subject: step.subj,
            text: step.text(),
            html: step.html(),
            idempotencyKey: `trial-${step.key}-${c.id}`,
            tag: step.key,
            campaign: "trial",
          });
          trial[step.k]++;
        } catch (e) {
          trial.failed++;
          trial.errors.push({ id: c.id, step: step.key, err: String(e).slice(0, 200) });
        }
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    return res.status(200).json({
      ts: new Date().toISOString(),
      total_contacts: contacts.length,
      results,
      plan: planSeq,
      trial,
    });
  } catch (err) {
    console.error("cron-welcome-followups error", err);
    return res.status(500).json({ error: err.message });
  }
}
