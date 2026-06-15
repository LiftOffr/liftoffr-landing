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
const SUBJECT_E2 = "How to actually use the Score (and what 60+ members do daily)";
const SUBJECT_PROOF = "$50/week became $1.88M — the backtest";
const SUBJECT_E3 = "Last welcome email — what happens next";
const SUBJECT_REENGAGE = "We're in the buy zone — here's the play";

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
    <p style="margin:0 0 16px;">But if you'd rather have it <em>done for you</em> — the daily briefs, live dashboard, real-time signal alerts when triggers fire, 6-module course, and private Discord community — start a <strong>7-day free trial (no card)</strong>, then keep it from $49/mo.</p>
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
    <p style="margin:18px 0 0;font-size:13px;color:#888;">P.S. Want to try it first? Start a 7-day free trial — no card, nothing charged automatically.</p>
  </div>
  <div style="padding:0 28px 32px;">
    <a href="https://liftoffr.com/start" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">Start 7 days free — no card →</a>
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
    "But if you'd rather have it done for you — daily briefs, live dashboard, real-time signal alerts, 6-module course, and private Discord — start a 7-day free trial (no card), then keep it from $49/mo.",
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
    "https://liftoffr.com/start",
    "",
    "P.S. Try it free for 7 days — no card. Plans at liftoffr.com/#pricing.",
  ].join("\n");
}

// ── Day 1: Quick win (activation → live dashboard) ──
function quickWinHTML() {
  return shell("Welcome · Day 1",
    `<p style="margin:0 0 16px;">Yesterday you grabbed the Checklist — the 9 indicators that flag a cycle top.</p>
     <p style="margin:0 0 16px;">Reading all 9 yourself takes about 15 minutes a week. Here's the shortcut: the live dashboard weights all 9 into <strong>one number, 0–100</strong>, updated daily.</p>
     <p style="margin:0 0 16px;">Open it and you'll see exactly where the cycle stands today — color-coded buy zone, neutral, or top zone. Ten seconds, no charts to decode.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "See today's Score →", "https://liftoffr.com/links?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day1_quickwin");
}
function quickWinText() {
  return ["Yesterday you grabbed the Checklist — the 9 indicators that flag a cycle top.","",
    "Reading all 9 yourself takes ~15 min a week. The shortcut: the live dashboard weights all 9 into one number, 0–100, updated daily.","",
    "Open it and you'll see exactly where the cycle stands today — buy zone, neutral, or top zone. Ten seconds.","",
    "See today's Score: https://liftoffr.com/links?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day1_quickwin","","— Torin"].join("\n");
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
     <p style="margin:0 0 16px;">Receipts are timestamped. Dec 15, 2018: buy signal at $3.2K. BTC ran 21× to $69K.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "See the full backtest →", "https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day5_proof");
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
    "See the full backtest: https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day5_proof","","— Torin"].join("\n");
}

// ── Day 18: Re-engagement (timely buy-zone angle → trial) ──
function reengageHTML() {
  return shell("LiftOffr · checking in",
    `<p style="margin:0 0 16px;">I went quiet after the welcome series on purpose — no daily spam. But this one's worth a nudge.</p>
     <p style="margin:0 0 16px;">Right now the cycle's in the <strong>accumulation zone</strong> — the boring, scary part that quietly decides how the next bull plays out. It's the easy part to ignore and the expensive part to get wrong.</p>
     <p style="margin:0 0 16px;">If you'd rather not freelance it, the done-for-you version is still open free for 7 days — daily brief, live signal alerts, and the exact buy-ladder I'm running. No card, nothing charged.</p>
     <p style="margin:0 0 16px;">If now's not the time, no worries — you'll still get the Score every Sunday.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "Start 7 days free — no card →", "https://liftoffr.com/start");
}
function reengageText() {
  return ["I went quiet after the welcome series on purpose — no daily spam. But this one's worth a nudge.","",
    "Right now the cycle's in the accumulation zone — the boring, scary part that decides how the next bull plays out. Easy to ignore, expensive to get wrong.","",
    "If you'd rather not freelance it, the done-for-you version is open free for 7 days — daily brief, live signal alerts, the exact buy-ladder I'm running. No card, nothing charged.","",
    "If now's not the time, no worries — you'll still get the Score every Sunday.","",
    "Start 7 days free: https://liftoffr.com/start","","— Torin"].join("\n");
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
    "Open the dashboard →", "https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=trial&utm_content=day1");
}
function trial1Text() {
  return ["You're in — no card, no catch. Full access for 7 days, so let's make this week count.","",
    "People who poke around for 20 min and leave never convert. People who actually USE it figure out fast whether it's worth keeping. Your 10-minute first session:","",
    "1. Discord -> #how-to-use-this-course, read the 3 pins",
    "2. Check the live dashboard — today's Score and zone",
    "3. Read the 8am daily brief. That's the whole product in 3 min/day.","",
    "Do those three today and you'll know by Wednesday.","","— Torin (I read every reply)",
    "https://liftoffr.com/track-record"].join("\n");
}

function trial2HTML() {
  return trialShell("Trial · Day 3",
    `<p style="margin:0 0 16px;">Halfway through your trial. Quick gut-check.</p>
     <p style="margin:0 0 16px;">If you've been reading the daily brief, you've already seen the thing most people pay to learn the hard way: <strong>the read changes, and you don't have to guess.</strong></p>
     <p style="margin:0 0 16px;">If you <em>haven't</em> opened it yet — that's the whole product. One post, 8am MT, every weekday: here's the Score, here's the zone, here's what it means today. Three minutes. No charts to stare at, no Twitter to doom-scroll.</p>
     <p style="margin:0 0 16px;">The backtest is public if you want the proof: $50/wk run through this framework since 2017 turned $24,450 of contributions into $1.88M — vs $217K just buying and holding. 100% win rate vs DCA across 417 start dates.</p>
     <p style="margin:24px 0 0;">Four days left. Use them.</p>
     <p style="margin:18px 0 0;">— Torin</p>`,
    "See the full backtest →", "https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=trial&utm_content=day3");
}
function trial2Text() {
  return ["Halfway through your trial. Quick gut-check.","",
    "If you've read the daily brief, you've seen the thing most people pay to learn the hard way: the read changes, and you don't have to guess.","",
    "If you haven't opened it — that's the product. One post, 8am MT, weekdays: Score, zone, what it means today. Three minutes.","",
    "Proof is public: $50/wk through this framework since 2017 = $1.88M vs $217K buy-and-hold. 100% win rate vs DCA across 417 start dates.","",
    "Four days left. Use them.","— Torin","https://liftoffr.com/track-record"].join("\n");
}

function trial3HTML() {
  return trialShell("Trial · Day 6 · ends tomorrow",
    `<p style="margin:0 0 16px;">Straight with you: <strong>tomorrow your free week ends and access just switches off.</strong> No card on file, so nothing gets charged — it simply lapses unless you choose to keep it. Two options:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.7;color:#333;">
       <div style="margin-bottom:10px;"><strong>1. Keep it.</strong> Keep everything you've had this week — daily briefs, dashboard, live alerts, signals, community — with <strong>Pro at $99/mo</strong>. Want lighter? Core is $49/mo. Button below.</div>
       <div><strong>2. Let it lapse.</strong> Do nothing and access ends tomorrow. Nothing charged, no clawback, no hard feelings — that's the deal I promised.</div>
     </div>
     <p style="margin:18px 0 16px;">No trick, no auto-charge waiting to bite you. But if the daily read has been worth three minutes of your morning this week — keep it before it ends.</p>
     <p style="margin:24px 0 0;">— Torin<br/><em style="color:#999;">Founder, LiftOffr</em></p>`,
    "Keep my access — go Pro →", TRIAL_CHECKOUT);
}
function trial3Text() {
  return ["Straight with you: tomorrow your free week ends and access just switches off. No card on file, so nothing gets charged — it simply lapses unless you keep it. Two options:","",
    "1. KEEP IT — keep everything from this week with Pro ($99/mo; or Core $49 for the lighter set):",
    "   " + TRIAL_CHECKOUT,
    "2. LET IT LAPSE — do nothing, access ends tomorrow. Nothing charged, no hard feelings.","",
    "No trick, no auto-charge waiting to bite you. But if the daily read's been worth 3 minutes of your morning — keep it before it ends.","","— Torin, Founder LiftOffr"].join("\n");
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
  // Preview mode — render any email as HTML (no auth, no send). For QA/review.
  const _url = new URL(req.url, "http://localhost");
  const preview = _url.searchParams.get("preview");
  if (preview) {
    const map = {
      qw: quickWinHTML, e2: email2HTML, proof: proofHTML, e3: email3HTML, reengage: reengageHTML,
      t1: trial1HTML, t2: trial2HTML, t3: trial3HTML, t4: trial4HTML,
    };
    const fn = map[preview];
    if (!fn) return res.status(400).json({ error: "unknown preview", options: Object.keys(map) });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(fn());
  }

  // Auth guard
  const expected = process.env.CRON_SECRET;
  const got = req.headers["authorization"] || "";
  const force = (req.query?.force || new URL(req.url, "http://localhost").searchParams.get("force")) === "1";
  if (expected && got !== `Bearer ${expected}` && !force) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const contacts = await fetchContacts();
    const results = { qw_sent: 0, e2_sent: 0, proof_sent: 0, e3_sent: 0, reengage_sent: 0, qw_failed: 0, e2_failed: 0, proof_failed: 0, e3_failed: 0, reengage_failed: 0, skipped: 0, errors: [] };

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
      // Day 18 — re-engagement (18.0–19.0)
      if (age >= 18.0 && age < 19.0) { await fire(c, SUBJECT_REENGAGE, reengageText(), reengageHTML(), "welcome-reengage", "day18", "reengage_sent", "reengage_failed"); continue; }
      results.skipped++;
    }

    // ── Trial nurture (only if the trial audience is configured) ──
    const trialAud = process.env.RESEND_TRIAL_AUDIENCE_ID;
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
      trial,
    });
  } catch (err) {
    console.error("cron-welcome-followups error", err);
    return res.status(500).json({ error: err.message });
  }
}
