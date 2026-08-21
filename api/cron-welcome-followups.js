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
import { disclosureHTML } from "./_disclosure.js";

export const config = { runtime: "nodejs" };

const FROM_ADDRESS = "Torin from LiftOffr <torin@liftoffr.com>";
const REPLY_TO     = "torin.christianson@gmail.com";

function unsubUrl(email) {
  // No fallback: this HMAC signs unsubscribe tokens. It previously fell back to the
  // literal string "liftoffr", which would have made every token forgeable by anyone
  // who guessed the brand name. Fail loudly instead of signing with a known key.
  if (!process.env.CRON_SECRET) throw new Error("CRON_SECRET is not set — refusing to sign with a default");
  const t = crypto.createHmac("sha256", process.env.CRON_SECRET)
    .update((email || "").toLowerCase()).digest("hex").slice(0, 16);
  return `https://liftoffr.com/api/subscribe?u=1&e=${encodeURIComponent(email)}&t=${t}`;
}

const SUBJECT_QW = "See today's Bitcoin cycle Score in 10 seconds";
const SUBJECT_E2 = "the six times it crossed, and the three that meant nothing";
const SUBJECT_PROOF = "don't trust my backtest";
// Was: "7 days of the full system — free, no card (last welcome email)" — a
// leftover from the 7-day trial, which was retired 2026-08-02. The body pitches
// the $29 plan and has never mentioned a trial; the subject was promising a
// product that no longer exists.
const SUBJECT_E3 = "The shortcut, if you want it (last welcome email)";
const SUBJECT_REENGAGE = "still here, and the number moved";

// ── Plan-buyer sequence (LIFTOFFR_MASTER_PLAN.md §5) ──
// Audience: Resend "LiftOffr Plan Buyers", populated by api/whop-webhook.js on
// the $29 purchase.
//
// STATUS, verified against Vercel 2026-08-20: RESEND_PLAN_AUDIENCE_ID IS SET in
// Production (added ~2 Aug 2026). This sequence is LIVE, not dormant. This comment
// previously read "dormant until RESEND_PLAN_AUDIENCE_ID is set", which was true
// when written and has been wrong for weeks -- it is why more than one person has
// believed $29 buyers were getting no onboarding at all. If the flag changes,
// change this paragraph in the same commit.
//
// Sending is age-banded: ageDays(contact.created_at) must fall inside one of the
// six one-day windows below, so enabling the flag on an audience full of older
// contacts does NOT blast them -- anyone outside a window is skipped. Sends carry
// an idempotencyKey of plan-<step>-<contactId>, so a re-run cannot duplicate.
//
// Shape, and the reason for it: D0, D1 and D3 are pure delivery with zero pitch.
// You earn the right to pitch by making the thing work first; a buyer who gets
// upsold in the receipt email learns the $29 was the bait.
//
// RESTRUCTURED 2026-08-20. D3 used to open the System pitch, which broke the rule
// this comment states. The first mention of anything paid now sits at D7, after a
// week of delivery. D3 became the whipsaw email -- the six exit-threshold crossings
// between Nov 2024 and Oct 2025 -- because a buyer who discovers that on their own
// feels misled, and a buyer who is told it on day three has been inoculated against
// every future whipsaw. It is the single most trust-building thing in the sequence
// and it costs nothing to send. Do not move a pitch earlier than D7.
const PSUBJECT_0  = "You're in — your plan, and the one thing to do tonight";
const PSUBJECT_1  = "How to actually place the ladder (10 minutes)";
const PSUBJECT_3  = "the six times my own model flipped";
const PSUBJECT_7  = "The 2022 round-trip that built this — and the receipts since";
const PSUBJECT_14 = "Where the founding window stands";
// Review request, D+21. Deliberately AFTER the last sales email so the ask is
// never bundled with a pitch. Asked of EVERY buyer, not a filtered happy subset
// — selectively soliciting positive reviews is the 16 CFR 255 problem that took
// the unattributed testimonials off /playbook. No incentive is offered, because
// an incentive conditioned on sentiment is the same problem wearing a hat.
const PSUBJECT_21 = "three weeks in — worth it or not?";

function planShell(eyebrow, bodyHTML, ctaText, ctaHref) {
  return trialShell(eyebrow, bodyHTML, ctaText, ctaHref);
}

function plan0HTML() {
  return planShell("Plan · Day 0",
    `<p style="margin:0 0 16px;">You're in. Thank you — genuinely.</p>
     <p style="margin:0 0 16px;">Four things, then I'll leave you alone:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:14px;line-height:1.8;color:#333;">
       <div><strong>1.</strong> <strong>Connect your Discord inside Whop first</strong> — Whop &rarr; account settings &rarr; Connect Discord. That is what grants the @Plan role. Without it you land in the server as an ordinary member and the plan channels stay invisible. Thirty seconds.</div>
       <div><strong>2.</strong> Your plan document is in Whop, under your purchases. Lifetime access, and it updates in place.</div>
       <div><strong>3.</strong> Then check <strong>#plan-updates</strong> — that's where a tier firing gets announced, with the receipt.</div>
       <div><strong>4.</strong> Tonight, do the worksheet in section 3 of the plan. Thirty minutes. Your stack size in, your own ladder out.</div>
     </div>
     <p style="margin:18px 0 16px;"><strong>Do number four tonight.</strong> Not this weekend. The entire value of a written plan is that it was written before anything was happening — and right now, nothing is happening. That's the window.</p>
     <p style="margin:0 0 16px;">No pitch in this email and none in the next one. Reply if anything's unclear; I read all of them.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "Open the Discord →", "https://liftoffr.com/welcome-plan");
}
function plan0Text() {
  return ["You're in. Thank you — genuinely.","","Four things, then I'll leave you alone:","",
    "1. CONNECT YOUR DISCORD INSIDE WHOP FIRST - Whop > account settings > Connect Discord. That grants the @Plan role. Without it you land in the server as an ordinary member and the plan channels stay invisible. Thirty seconds.",
    "2. Your plan document is in Whop, under your purchases. Lifetime access, updates in place.",
    "3. Then check #plan-updates - a tier firing gets announced there, with the receipt.",
    "4. Tonight, do the worksheet in section 3 of the plan. Thirty minutes. Your stack size in, your own ladder out.","",
    "Do number four tonight, not this weekend. The whole value of a written plan is that it was written before anything was happening — and right now nothing is. That's the window.","",
    "No pitch in this email and none in the next one. Reply if anything's unclear; I read all of them.","",
    "https://liftoffr.com/welcome-plan","","— Torin"].join("\n");
}

function plan1HTML() {
  return planShell("Plan · Day 1",
    `<p style="margin:0 0 16px;">Execution, since that's where written plans die.</p>
     <p style="margin:0 0 14px;"><strong>Place the ladder as limit orders, not reminders.</strong> A limit order at your tier price executes whether or not you're awake, calm, or looking. A note in your phone requires you to be all three on the worst day of the year.</p>
     <p style="margin:0 0 14px;"><strong>The fallback rule matters more than the tiers.</strong> If price never reaches your levels, you don't get to sit in cash for two years feeling clever. The doc has the DCA fallback — read that section twice.</p>
     <p style="margin:0 0 14px;"><strong>Every fill ends the same way.</strong> Off the exchange, onto hardware, same week. An unexecuted custody step is how a good entry becomes someone else's Bitcoin.</p>
     <p style="margin:0 0 16px;">That's the whole mechanic. Tools I use for the order placement and the custody are listed here if you need them: <a href="https://liftoffr.com/stack?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d1_stack" style="color:#e63946;">liftoffr.com/stack</a> — commission status disclosed on every link.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "", "");
}
function plan1Text() {
  return ["Execution, since that's where written plans die.","",
    "1. Place the ladder as LIMIT ORDERS, not reminders. A limit order executes whether or not you're awake, calm, or looking. A note in your phone needs you to be all three on the worst day of the year.","",
    "2. The fallback rule matters more than the tiers. If price never reaches your levels you don't get to sit in cash for two years feeling clever. Read that section twice.","",
    "3. Every fill ends the same way: off the exchange, onto hardware, same week.","",
    "Tools I use for order placement and custody: https://liftoffr.com/stack?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d1_stack — commission status disclosed on every link.","","— Torin"].join("\n");
}

function plan3HTML() {
  return planShell("Plan · Day 3",
    `<p style="margin:0 0 16px;">You will find this on your own eventually. Better you hear it from me first.</p>
     <p style="margin:0 0 16px;">Between 16 November 2024 and 21 October 2025, the Score <strong>entered the exit zone three times</strong> and dropped back out of it three times &mdash; six transitions in twelve months:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-family:Menlo,monospace;font-size:13px;line-height:1.9;color:#333;">
       <div>Nov 16 2024 &nbsp;&rarr; exit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$90,568</div>
       <div>Feb 18 2025 &nbsp;&rarr; warning &nbsp;&nbsp;&nbsp;$95,444</div>
       <div>May 08 2025 &nbsp;&rarr; exit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$103,070</div>
       <div>Jun 19 2025 &nbsp;&rarr; warning &nbsp;&nbsp;&nbsp;$104,710</div>
       <div>Jun 27 2025 &nbsp;&rarr; exit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$107,091</div>
       <div>Oct 21 2025 &nbsp;&rarr; warning &nbsp;&nbsp;&nbsp;$108,700</div>
     </div>
     <p style="margin:0 0 16px;">Six. In twelve months. And the top was <strong>6 October 2025</strong> — which means the model was still inside the exit zone when it happened, and only left fifteen days later.</p>
     <p style="margin:0 0 16px;">I'm telling you this on day three rather than letting you discover it, because a threshold model whipsawing is not a bug you found. <strong>It is how threshold models behave, and it will happen again in the next cycle.</strong></p>
     <p style="margin:0 0 16px;">The ladder in your document is built for exactly this. You act on a fraction at each crossing rather than all of it at once. You don't reverse on the way back. That's it, it's boring, and boring is the whole point — six crossings become six small decisions instead of six chances to panic.</p>
     <p style="margin:0 0 16px;">Every crossing above is in <a href="https://liftoffr.com/receipts?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d3_receipts" style="color:#e63946;">the log</a>, along with the ones that went the wrong way.</p>
     <p style="margin:0 0 16px;">No pitch in this one either.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "See every crossing →", "https://liftoffr.com/receipts?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d3_cta");
}
function plan3Text() {
  return ["You will find this on your own eventually. Better you hear it from me first.","",
    "Between 16 November 2024 and 21 October 2025, the Score entered the exit zone three times","and dropped back out of it three times - six transitions in twelve months:","",
    "  Nov 16 2024  -> exit      $90,568",
    "  Feb 18 2025  -> warning   $95,444",
    "  May 08 2025  -> exit      $103,070",
    "  Jun 19 2025  -> warning   $104,710",
    "  Jun 27 2025  -> exit      $107,091",
    "  Oct 21 2025  -> warning   $108,700","",
    "Six. In twelve months. And the top was 6 October 2025 — so the model was still inside the exit zone when it happened, and only left fifteen days later.","",
    "I'm telling you this on day three rather than letting you discover it, because a threshold model whipsawing is not a bug you found. It is how threshold models behave, and it will happen again in the next cycle.","",
    "The ladder in your document is built for exactly this. You act on a fraction at each crossing rather than all of it at once. You don't reverse on the way back. That's it, it's boring, and boring is the point — six crossings become six small decisions instead of six chances to panic.","",
    "Every crossing above is in the log, with the ones that went the wrong way:",
    "  https://liftoffr.com/receipts?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d3_receipts","",
    "No pitch in this one either.","","— Torin"].join("\n");
}

function plan7HTML() {
  return planShell("Plan · Day 7",
    `<p style="margin:0 0 16px;">The thing that makes this plan worth anything isn't the wins. It's that the losses are on the same page.</p>
     <p style="margin:0 0 16px;">In 2021 my own indicators told me to scale out. I didn't. Through 2022 I round-tripped roughly <strong>$30,000</strong> — the entire gain — because I had conviction and no written exit.</p>
     <p style="margin:0 0 16px;">Everything I've built since exists so that decision gets made while I'm calm instead of while I'm euphoric. In 2025 I laddered out early on a rule written months earlier, and being early cost me the last leg — I'm not going to put a personal number on that, because it's the one thing on this site you couldn't check.</p>
     <p style="margin:0 0 16px;">What you <em>can</em> check is the model, and I am giving it to you with the edges left on. It crossed into its exit zone on <strong>27 June 2025 at $107,091</strong>, more than three months before the $124,824 top, and it entered that zone <strong>three times</strong> in twelve months, dropping back out of it three times. In November 2017 it called exit at $7,729 and Bitcoin rose <strong>149% in the next thirty days</strong>.</p>
     <p style="margin:0 0 16px;">All of it is public and checkable, including the misses: <a href="https://liftoffr.com/receipts.html?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_receipts" style="color:#e63946;">the receipts</a> and <a href="https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_track" style="color:#e63946;">the full backtest</a>.</p>
     <div style="border-top:1px solid #eee;margin:22px 0 0;padding-top:18px;">
       <p style="margin:0 0 12px;font-size:13px;color:#888;">First and only time I'll mention this in a week. Then it lives in the footer where you can ignore it.</p>
       <p style="margin:0 0 12px;">Here's the honest limit of what you bought. The plan is a <em>snapshot</em> — my levels, my ladder, this cycle. What it doesn't teach is how to derive your own levels when this cycle ends and every number is different. That's what <a href="https://liftoffr.com/system?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_system" style="color:#e63946;">The Cycle System</a> is: the framework rather than the snapshot, $197 once, and your $29 counts toward it.</p>
       <p style="margin:0;font-size:13px;color:#666;">If the plan alone is what you wanted, that's a complete purchase. Nothing in it expires and nothing is held back.</p>
     </div>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "See the receipts →", "https://liftoffr.com/receipts.html?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_cta");
}
function plan7Text() {
  return ["The thing that makes this plan worth anything isn't the wins. It's that the losses are on the same page.","",
    "In 2021 my own indicators told me to scale out. I didn't. Through 2022 I round-tripped roughly $30,000 — the entire gain — because I had conviction and no written exit.","",
    "Everything since exists so that decision gets made while I'm calm instead of euphoric. In 2025 I laddered out early on a rule written months earlier, and being early cost me the last leg — no personal number on that, because it's the one thing here you couldn't check.","",
    "What you CAN check is the model, and I am giving it to you with the edges left on: it crossed into its exit zone on 27 June 2025 at $107,091, three months before the $124,824 top, and entered that zone three times in twelve months, dropping back out of it three times. In Nov 2017 it called exit at $7,729 and BTC rose 149% over the next thirty days.","",
    "Public and checkable:",
    "  https://liftoffr.com/receipts.html?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_receipts",
    "  https://liftoffr.com/track-record?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_track","",
    "---","",
    "First and only time I'll mention this in a week, then it lives in the footer where you can ignore it.","",
    "The honest limit of what you bought: the plan is a snapshot — my levels, my ladder, this cycle. What it doesn't teach is how to derive your own levels when this cycle ends and every number is different. That's The Cycle System: the framework rather than the snapshot, $197 once, and your $29 counts toward it.",
    "  https://liftoffr.com/system?utm_source=resend&utm_medium=email&utm_campaign=plan&utm_content=d7_system","",
    "If the plan alone is what you wanted, that's a complete purchase. Nothing in it expires and nothing is held back.","",
    "— Torin"].join("\n");
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

function plan21HTML() {
  return planShell("Plan · Day 21",
    `<p style="margin:0 0 16px;">Three weeks since you got the plan. Long enough to know whether it did anything.</p>
     <p style="margin:0 0 16px;"><strong>Did you actually write your levels down?</strong> That's the only question that matters. Not whether you liked the document &mdash; whether it changed what you'll do when price moves.</p>
     <p style="margin:0 0 16px;"><strong>If yes:</strong> a review on Whop takes two minutes and does more for this than anything else you could do. Whatever it says. I'm not asking for a good one, I'm asking for a real one.</p>
     <p style="margin:0 0 16px;"><strong>If no &mdash; or if it wasn't worth the $29 &mdash; tell me that instead.</strong> Reply to this email and I'll refund you, and I'd genuinely rather have the correction than the money.</p>
     <p style="margin:0 0 16px;">To leave one: open Whop, go to your Hub, find LiftOffr, tap the three dots and choose <strong>Leave a Review</strong>.</p>
     <p style="margin:24px 0 0;">&mdash; Torin</p>`,
    "Open my Whop Hub &rarr;", "https://whop.com/hub");
}
function plan21Text() {
  return ["Three weeks since you got the plan. Long enough to know whether it did anything.","",
    "Did you actually write your levels down? That's the only question that matters. Not whether you liked the document — whether it changed what you'll do when price moves.","",
    "If yes: a review on Whop takes two minutes and does more for this than anything else you could do. Whatever it says. I'm not asking for a good one, I'm asking for a real one.","",
    "If no — or if it wasn't worth the $29 — tell me that instead. Reply to this email and I'll refund you, and I'd genuinely rather have the correction than the money.","",
    "To leave one: open Whop, go to your Hub (https://whop.com/hub), find LiftOffr, tap the three dots and choose Leave a Review.","",
    "— Torin"].join("\n");
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
    <p style="margin:0 0 16px;">Quick one, and it is the least comfortable email in this sequence.</p>
    <p style="margin:0 0 16px;">A threshold model has one failure mode, and you should hear it from me before you rely on the number for anything.</p>
    <p style="margin:0 0 22px;font-weight:700;color:#080808;">Between 16 November 2024 and 21 October 2025, the Score crossed into the exit zone three times and retreated out of it three times. Six transitions in twelve months.</p>
    <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:16px 0;font-size:13.5px;line-height:1.8;font-family:ui-monospace,Menlo,monospace;color:#333;">
      <div>16 Nov 2024 &nbsp;into exit zone &nbsp;&nbsp;BTC $90,568</div>
      <div>18 Feb 2025 &nbsp;back out &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BTC $95,444</div>
      <div>&nbsp;8 May 2025 &nbsp;into exit zone &nbsp;&nbsp;BTC $103,070</div>
      <div>19 Jun 2025 &nbsp;back out &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BTC $104,710</div>
      <div>27 Jun 2025 &nbsp;into exit zone &nbsp;&nbsp;BTC $107,091</div>
      <div>21 Oct 2025 &nbsp;back out &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BTC $108,700</div>
    </div>
    <p style="margin:18px 0 16px;">Three entries, three retreats — <strong>six transitions, not six signals</strong>. Two of the three entries did not contain a top. The top was 6 October 2025 at $124,824, and the Score left the exit zone for the last time fifteen days <em>after</em> it.</p>
    <p style="margin:0 0 16px;">Any rule of the form "above X, do something" will flip back and forth around X. That is not a broken threshold — it is what thresholds do. Which means the number is only usable if <strong>you have decided in advance what a crossing means to you</strong>, because acting in full on each of those six would have meant six reversals in a year.</p>
    <p style="margin:0 0 16px;">I am not going to tell you what a crossing should mean for your position. I do not know your size, your tax situation or your timeline, and anyone who hands you a percentage without knowing those is guessing at your expense. For what it is worth: I exited early, and it cost me.</p>
    <p style="margin:0 0 16px;">The nine indicators the Score is built from are all public, each with its weight, today's reading, and a section on where it has been wrong. No signup, nothing gated.</p>
    <p style="margin:24px 0 0;">— Torin</p>
  </div>
  <div style="padding:0 28px 32px;">
    <a href="https://liftoffr.com/indicators?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day3_indicators" style="display:block;background:#e63946;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:800;font-size:15px;">See every indicator, live →</a>
  </div>
  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6;">
    ${disclosureHTML("")}<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
  </div>
</div></body></html>`;
}

function email2Text() {
  return [
    "Quick one, and it is the least comfortable email in this sequence.",
    "",
    "A threshold model has one failure mode, and you should hear it from me before you rely on the number for anything.",
    "",
    "Between 16 Nov 2024 and 21 Oct 2025 the Score crossed into the exit zone three times and retreated out of it three times. Six transitions in twelve months:",
    "",
    "  16 Nov 2024  into exit zone   BTC $90,568",
    "  18 Feb 2025  back out         BTC $95,444",
    "   8 May 2025  into exit zone   BTC $103,070",
    "  19 Jun 2025  back out         BTC $104,710",
    "  27 Jun 2025  into exit zone   BTC $107,091",
    "  21 Oct 2025  back out         BTC $108,700",
    "",
    "Three entries, three retreats - six transitions, not six signals. Two of the three entries did not contain a top. The top was 6 Oct 2025 at $124,824, and the Score left the exit zone for the last time fifteen days AFTER it.",
    "",
    "Any rule of the form 'above X, do something' will flip back and forth around X. That is not a broken threshold, it is what thresholds do. Which means the number is only usable if you have decided in advance what a crossing means to you - acting in full on each of those six would have meant six reversals in a year.",
    "",
    "I am not going to tell you what a crossing should mean for your position. I do not know your size, your tax situation or your timeline. For what it is worth: I exited early, and it cost me.",
    "",
    "The nine indicators behind the Score are all public — the weight, today's reading, and where each one has been wrong:",
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
    ${disclosureHTML("")}<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
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
// Day 1. REWRITTEN 20 Aug 2026: this said "yesterday you grabbed the buy-zone
// plan", a document that no longer exists — day 0 now delivers "Read the Bitcoin
// Cycle Yourself" — and it said "all 8" twice, one sentence after saying nine.
// Its band names (buy zone / neutral / top zone) were a scheme the site retired.
// The six bands are the only ones that exist: exit 85+, warning 70-85, mid-cycle
// 50-70, re-accumulation 30-50, accumulation 15-30, deep accumulation under 15.
function quickWinHTML() {
  return shell("Welcome · Day 1",
    `<p style="margin:0 0 16px;">Yesterday you got <strong>Read the Bitcoin Cycle Yourself</strong>. Behind it sits one number, built from nine weighted components.</p>
     <p style="margin:0 0 16px;">Reading all nine yourself takes about 15 minutes a week — the PDF walks you through it, and the point is that you can. Here's the shortcut for the other six days: the live page weights all nine into <strong>one number, 0–100</strong>, recomputed daily from the same free public source.</p>
     <p style="margin:0 0 16px;">Open it and you'll see where the cycle sits today, and which of the six bands that is. Ten seconds, no charts to decode. What the bands have meant historically is on the page; what any of it means for you is yours.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "See today's Score →", "https://liftoffr.com/score?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day1_quickwin");
}
function quickWinText() {
  return ["Yesterday you got READ THE BITCOIN CYCLE YOURSELF. Behind it sits one number, built from nine weighted components.","",
    "Reading all nine yourself takes ~15 min a week - the PDF walks you through it, and the point is that you can. The shortcut for the other six days: the live page weights all nine into one number, 0-100, recomputed daily from the same free public source.","",
    "Open it and you'll see where the cycle sits today, and which of the six bands that is. Ten seconds. What the bands have meant historically is on the page; what any of it means for you is yours.","",
    "See today's Score: https://liftoffr.com/score?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day1_quickwin","","— Torin"].join("\n");
}

// ── Day 5: Proof — REWRITTEN 2026-08-16 ──
// This email previously led with "$24,450 contributed -> $1.88M", "+7,602% over
// plain DCA" and "100% win rate across 417 start dates", and its subject line
// was "$50/week became $1.88M". Those are the exact claims removed from every
// page of the site in the same pass, and they were still going out daily to the
// whole free list — a live send is a worse exposure than a page, not a better
// one. Same rule applies here: no income claims, no unqualified percentages,
// no "calls". Do not reinstate a currency or ROI figure in this email.
function proofHTML() {
  return shell("Welcome · Day 5",
    `<p style="margin:0 0 16px;">I want to explain something about my own receipts page, because most people in this industry won't and it matters.</p>
     <p style="margin:0 0 16px;">There are <strong>64 scored zone changes</strong> on that page, running back to 2011. Thirty-five were followed by a higher Bitcoin price 30 days later &mdash; but that is not a hit rate and I will not relabel it as one, because the 64 mix opposing signal types: a rise after an EXIT crossing is a miss, not a hit. Scored directionally, the model was right on <strong>21 of 46</strong> at 30 days and <strong>25 of 46</strong> at 180, and neither is distinguishable from chance. All 64 are up there with the dates and the outcomes.</p>
     <p style="margin:0 0 16px;"><strong>Every one of them is a backtest.</strong></p>
     <p style="margin:0 0 16px;">That means I built the formula, then ran it against history. It is not a record of calls I made at the time. I mark every row that way, because here's the uncomfortable thing about backtests: a formula tested against the same history it was designed on will always look better than it deserves to. Mine included. That's not a criticism of my model, it's a property of all of them — and anyone showing you a clean backtest without saying so is either careless or counting on you not to ask.</p>
     <p style="margin:0 0 16px;">So here's what I'm <em>not</em> going to do: promise you a live track record I'd then have to remember to keep. <strong>Here's what you can check instead, today.</strong></p>
     <p style="margin:0 0 16px;">The Score is computed from <a href="https://colintalkscrypto.com/cbbi/" style="color:#e63946;">CBBI's public daily data</a> using the weights published on every indicator page. Pick any date on the receipts page, pull the same source, and recompute it. That's better than a log I keep myself, because it doesn't require trusting me to keep it honestly.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "Read the receipts →", "https://liftoffr.com/receipts?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day5_receipts");
}
function proofText() {
  return ["I want to explain something about my own receipts page, because most people in this industry won't and it matters.","",
    "There are 64 scored zone changes on that page, running back to 2011. Thirty-five were followed by a higher Bitcoin price 30 days later - but that is not a hit rate and I will not relabel it as one, because the 64 mix opposing signal types: a rise after an EXIT crossing is a miss, not a hit. Scored directionally, the model was right on 21 of 46 at 30 days and 25 of 46 at 180, and neither is distinguishable from chance. All 64 are up there with the dates and the outcomes.","",
    "EVERY ONE OF THEM IS A BACKTEST.","",
    "That means I built the formula, then ran it against history. It is not a record of calls I made at the time. I mark every row that way, because here's the uncomfortable thing about backtests: a formula tested against the same history it was designed on will always look better than it deserves to. Mine included. That's a property of all of them — and anyone showing you a clean backtest without saying so is either careless or counting on you not to ask.","",
    "So here's what I'm NOT going to do: promise you a live track record I'd then have to remember to keep. Here's what you can check instead, today.","",
    "The Score is computed from CBBI's public daily data (colintalkscrypto.com/cbbi) using the weights published on every indicator page. Pick any date on the receipts page, pull the same source, and recompute it. That's better than a log I keep myself, because it doesn't require trusting me to keep it honestly.","",
    "Read the receipts: https://liftoffr.com/receipts?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day5_receipts","","— Torin"].join("\n");
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
       <div><strong>One charting app</strong> — for drawing my tier levels and setting my own price notifications. Nothing else.</div>
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
    "  • One charting app — for drawing tier levels and setting my own price notifications. Nothing else.","",
    "What's NOT on the list matters more: no exchange referrals, no trading bots, no leverage platforms. Exchange sign-ups pay the best commissions in this niche and I turned them down — they'd pay me more the more you trade, and this whole thing argues you should trade less.","",
    "Full page has what each is for, roughly what it costs, and where I'd tell you to skip it. Some links earn me a commission and every one says so underneath it:",
    "https://liftoffr.com/stack?utm_source=resend&utm_medium=email&utm_campaign=welcome&utm_content=day9_stack","","— Torin"].join("\n");
}

// ── Day 18: Re-engagement (timely buy-zone angle → trial) ──
// Day 18. REWRITTEN 20 Aug 2026. This hardcoded "right now the cycle's in the
// accumulation zone" and shipped under the subject "We're in the buy zone —
// here's the play". Three problems: "buy zone" is not one of the six bands,
// "here's the play" is instruction framing on a site whose whole register rule
// is that it never tells anyone what to do, and the band assertion was simply
// false by the time anyone read it — accumulation is 15-30 and the Score was
// 36.1, which is re-accumulation. A static claim about a number that moves every
// morning is wrong by default; it just takes a while to notice.
//
// It now reads the live Score at send time. If the fetch fails, `sc` is null and
// the band sentence does not render at all — the email still sends, minus a
// claim. Never reinstate a hardcoded band here.
function reengageBand(sc) {
  if (!sc || typeof sc.score !== "number" || !sc.zone) return null;
  return { score: sc.score.toFixed(1), zone: String(sc.zone).replace(/-/g, " ") };
}
function reengageHTML(sc) {
  const b = reengageBand(sc);
  const bandHTML = b
    ? `<p style="margin:0 0 16px;">As I write this the Score is <strong>${b.score}</strong> — the <strong>${b.zone}</strong> band. What that band has meant historically is on the page, with every date. What it means for you is yours to decide, and I am not going to pretend I know your position.</p>`
    : "";
  return shell("LiftOffr · checking in",
    `<p style="margin:0 0 16px;">I went quiet after the welcome series on purpose — no daily spam. But this one's worth a nudge.</p>
     ${bandHTML}
     <p style="margin:0 0 16px;">If you'd rather not freelance the accumulation side of it, the buy ladder I'm running with my own money — nine tiers, timestamped receipts on every fire, and a worksheet for building your own at whatever size you're actually working with — is $29, once. No subscription. It's a description of what I did, not an instruction for what you should.</p>
     <p style="margin:0 0 16px;">If now's not the time, no worries — you'll still get the Score every Sunday.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "See the plan — $29 once →", "https://liftoffr.com/plan");
}
function reengageText(sc) {
  const b = reengageBand(sc);
  const band = b
    ? [`As I write this the Score is ${b.score} - the ${b.zone} band. What that band has meant historically is on the page, with every date. What it means for you is yours to decide.`, ""]
    : [];
  return ["I went quiet after the welcome series on purpose — no daily spam. But this one's worth a nudge.","",
    ...band,
    "If you'd rather not freelance the accumulation side of it, the buy ladder I'm running with my own money - nine tiers, timestamped receipts, and a worksheet for building your own - is $29, once. No subscription. It's a description of what I did, not an instruction for what you should.","",
    "If now's not the time, no worries — you'll still get the Score every Sunday.","",
    "See the plan ($29, once): https://liftoffr.com/plan","","— Torin"].join("\n");
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
    <!-- This menu rides on every plan-buyer email, including the two whose whole
         job is selling the System — which was the one rung missing from it. -->
    <p style="margin:0 0 6px;font-weight:700;color:#444;">Whenever you're ready, 4 ways I can help:</p>
    <p style="margin:0 0 2px;">1. <a href="https://liftoffr.com/cycle?utm_source=resend&utm_medium=email&utm_campaign=nurture&utm_content=menu_cycle" style="color:#e63946;">Check the live cycle dashboard</a> — free, always current</p>
    <p style="margin:0 0 2px;">2. <a href="https://liftoffr.com/plan?utm_source=resend&utm_medium=email&utm_campaign=nurture&utm_content=menu_plan" style="color:#e63946;">Get My Bear Market Buy Plan</a> — $29, once</p>
    <p style="margin:0 0 2px;">3. <a href="https://liftoffr.com/system?utm_source=resend&utm_medium=email&utm_campaign=nurture&utm_content=menu_system" style="color:#e63946;">Learn the whole framework</a> — The Cycle System, $197 once</p>
    <p style="margin:0 0 14px;">4. <a href="https://liftoffr.com/playbook?utm_source=resend&utm_medium=email&utm_campaign=nurture&utm_content=menu_playbook" style="color:#e63946;">Build your exact cycle plan with me</a> — the Cycle Playbook</p>
  </div>
  <div style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;line-height:1.6;">
    ${disclosureHTML("")}<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
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
     <p style="margin:0 0 16px;">The record is public if you want to check it: all 64 scored zone changes since 2011, with what BTC actually did next — including the ones that went the wrong way. It is a backtest and every row says so.</p>
     <p style="margin:24px 0 0;">Four days left. And if you already know it's a keeper, don't wait for the day-6 reminder — lock in your founder rate now. It holds whether you do it today or Friday.</p>
     <p style="margin:18px 0 0;">— Torin</p>`,
    "Lock in my membership →", TRIAL_CHECKOUT);
}
function trial2Text() {
  return ["Halfway through your trial. Quick gut-check.","",
    "If you've read the daily brief, you've seen the thing most people pay to learn the hard way: the read changes, and you don't have to guess.","",
    "If you haven't opened it — that's the product. One post, 8am MT, weekdays: Score, zone, what it means today. Three minutes.","",
    "The record is public if you want to check it: all 64 scored zone changes since 2011, with what BTC actually did next — including the ones that went the wrong way. It is a backtest and every row says so.","",
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
     <p style="margin:18px 0 0;font-size:13px;color:#888;">P.S. Want to go deeper than the membership? The <a href="https://liftoffr.com/playbook" style="color:#e63946;">Cycle Playbook</a> is a private session where we build your full buy + sell plan together.</p>`,
    "Keep my access — go Pro →", TRIAL_CHECKOUT);
}
function trial3Text() {
  return ["Straight with you: tomorrow your free week ends and access just switches off. No card on file, so nothing gets charged — it simply lapses unless you keep it.","",
    "Tomorrow you lose: the daily 8am brief, the live dashboard + Score, real-time signal alerts, the 36-lesson course, and the private Discord.","",
    "1. KEEP IT — keep all of it with Pro ($99/mo; or Core $49 if you mostly want the daily read):",
    "   " + TRIAL_CHECKOUT,
    "2. LET IT LAPSE — do nothing, access ends tomorrow. Nothing charged, no hard feelings.","",
    "No trick, no auto-charge waiting to bite you. But if the daily read's been worth 3 minutes of your morning — keep it before it ends.","","— Torin, Founder LiftOffr","",
    "P.S. Want to go deeper? The Cycle Playbook — a private session: https://liftoffr.com/playbook"].join("\n");
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

// ═════════════════════════════════════════════════════════════════════════════
// QUIZ SEQUENCE — the segmented 7-email nurture (04-email-sequence.md)
//
// Entry point is the cycle-position quiz at /quiz. Email 1 (Day 0, "the result")
// is sent inline by api/subscribe.js on submit; emails 2-7 are fired from here
// off the contact's age, exactly like every other sequence in this file.
//
// Cadence: Day 1, 3, 5, 7, 10, 14. Then the segment drops to the Sunday Score.
//
// DORMANT until RESEND_QUIZ_AUDIENCE_ID is set in Vercel. That is deliberate:
// the audience has to exist before anything can be sent to it, and the whole
// documented advantage of this structure is that ONLY the segment that raised
// its hand gets pitched. Running it against the untagged free list would make
// it a newsletter and throw away the mechanism. See QUIZ_SETUP.md.
//
// Compliance applied to every email below: no dollar outcomes, no percentages
// presented as achievable, no "called", educational framing, disclaimer in the
// footer of every send.
// ═════════════════════════════════════════════════════════════════════════════
const QSUBJECT_2 = "i built this because i lost $30,000";
const QSUBJECT_3 = "don't trust my backtest";
const QSUBJECT_4 = "the two-sided problem nobody sells a fix for";
const QSUBJECT_5 = "the nine levels i'm actually buying at";
const QSUBJECT_6 = "no. (a reply to the most common question i get)";
const QSUBJECT_7 = "last one from me about this";

// Per-segment paragraph swaps. Emails 2 and 5 are the only ones that change —
// everything else is identical across segments, which keeps the sequence
// maintainable and keeps the personalisation where it actually earns its keep.
const QSEG_E2 = {
  ROUNDTRIPPED: "You told me in the quiz you've been through this. Then you already know the part I'm describing, and you know it isn't about information.",
  SITTING: "You said you're holding and not sure what to do. That's exactly where I was. It doesn't feel like a decision, which is what makes it dangerous — doing nothing is a position.",
  ACCUMULATING: "You said you're still buying. Good — that's the easy half. The hard half is the one nobody writes down, and you'll need it sooner than feels necessary.",
  NEW: "You said you're early in this. Genuinely the best possible time to hear it, because you can build the rule before you have anything at stake in it.",
};
const QSEG_E5 = {
  ROUNDTRIPPED: "Given what you told me in the quiz, the part I'd point you at is the fallback rule — for when price never touches a level and you have no plan for that. That's the failure mode that gets people who've already been burned once.",
  NEW: "Honestly: you probably don't need this yet. The free layer has the score, the brief and the framework, and it'll still be free in six months. I'd rather you use that for a while first.",
  SITTING: "",
  ACCUMULATING: "",
};

const QL = (path, content) =>
  `https://liftoffr.com${path}?utm_source=resend&utm_medium=email&utm_campaign=quiz&utm_content=${content}`;

// Text bodies are assembled from arrays with optional segment paragraphs, so a
// blank segment would otherwise leave a triple newline. Normalise on the way out.
function tjoin(lines) {
  return lines.filter((l) => l !== null && l !== undefined).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function scoreLine(sc) {
  if (!sc || typeof sc.score !== "number") return "";
  return `<p style="margin:0 0 16px;">Today's score: <strong>${sc.score.toFixed(1)}</strong> — ${sc.zone}. <a href="${QL("/cycle", "score_link")}" style="color:#e63946;">See it live →</a></p>`;
}
function scoreLineText(sc) {
  if (!sc || typeof sc.score !== "number") return "";
  return `Today's score: ${sc.score.toFixed(1)} — ${sc.zone}. ${QL("/cycle", "score_link")}\n`;
}

function quiz2HTML(seg, sc) {
  return shell("Day 1",
    `<p style="margin:0 0 16px;">In 2021 I had every indicator I now publish sitting on a screen in front of me. They were flashing. I knew what they meant.</p>
     <p style="margin:0 0 16px;">I did nothing. Then I did nothing for a while longer. Then it was 2022 and about <strong>$30,000</strong> had gone up and come all the way back down, and the only thing I'd actually done was watch.</p>
     <p style="margin:0 0 16px;">Here's what I got wrong, and it isn't the part people expect. <strong>I wasn't wrong about the data. I was wrong about myself.</strong> I assumed that when the moment came I'd act on what I knew, and it turns out that's not how anyone works. In the moment there's always a reason it's different this time, and the reason is always available, and it's always convincing.</p>
     ${QSEG_E2[seg] ? `<p style="margin:0 0 16px;color:#555;font-style:italic;">${QSEG_E2[seg]}</p>` : ""}
     <p style="margin:0 0 16px;">The fix wasn't more data. It was writing the decision down before the moment arrived, when I was calm and nothing was happening.</p>
     ${scoreLine(sc)}
     <p style="margin:24px 0 0;">— Torin</p>`,
    "", "");
}
function quiz2Text(seg, sc) {
  return tjoin(["In 2021 I had every indicator I now publish sitting on a screen in front of me. They were flashing. I knew what they meant.","",
    "I did nothing. Then I did nothing for a while longer. Then it was 2022 and about $30,000 had gone up and come all the way back down, and the only thing I'd actually done was watch.","",
    "Here's what I got wrong, and it isn't the part people expect. I wasn't wrong about the data. I was wrong about myself. I assumed that when the moment came I'd act on what I knew, and it turns out that's not how anyone works. In the moment there's always a reason it's different this time, and the reason is always available, and it's always convincing.","",
    QSEG_E2[seg] || null, QSEG_E2[seg] ? "" : null,
    "The fix wasn't more data. It was writing the decision down before the moment arrived, when I was calm and nothing was happening.","",
    scoreLineText(sc) || null, "— Torin"]);
}

function quiz3HTML(seg, sc) {
  return shell("Day 3",
    `<p style="margin:0 0 16px;">I want to explain something about my own receipts page, because most people in this industry won't and it matters.</p>
     <p style="margin:0 0 16px;">There are <strong>64 scored zone changes</strong> on that page, running back to 2011. Thirty-five were followed by a higher Bitcoin price 30 days later &mdash; but that is not a hit rate and I will not relabel it as one, because the 64 mix opposing signal types: a rise after an EXIT crossing is a miss, not a hit. Scored directionally, the model was right on <strong>21 of 46</strong> at 30 days and <strong>25 of 46</strong> at 180, and neither is distinguishable from chance. All 64 are up there with the dates and the outcomes.</p>
     <p style="margin:0 0 16px;"><strong>Every one of them is a backtest.</strong></p>
     <p style="margin:0 0 16px;">That means I built the formula, then ran it against history. It is not a record of calls I made at the time. I mark every row that way, because here's the uncomfortable thing about backtests: a formula tested against the same history it was designed on will always look better than it deserves to. Mine included. That's not a criticism of my model, it's a property of all of them, and anyone showing you a clean backtest without saying so is either careless or counting on you not to ask.</p>
     <p style="margin:0 0 16px;">So here's what I'm <em>not</em> going to do: promise you a live track record I'd then have to remember to keep. <strong>Here's what you can check instead, today.</strong></p>
     <p style="margin:0 0 16px;">The Score is computed from <a href="https://colintalkscrypto.com/cbbi/" style="color:#e63946;">CBBI's public daily data</a> using the weights published on every indicator page. Pick any date on the receipts page, pull the same source, and recompute it. That's better than a log I keep myself, because it doesn't require trusting me to keep it honestly.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "Go read it →", QL("/receipts", "e3_receipts"));
}
function quiz3Text() {
  return tjoin(["I want to explain something about my own receipts page, because most people in this industry won't and it matters.","",
    "There are 64 scored zone changes on that page, running back to 2011. Thirty-five were followed by a higher Bitcoin price 30 days later - but that is not a hit rate and I will not relabel it as one, because the 64 mix opposing signal types: a rise after an EXIT crossing is a miss, not a hit. Scored directionally, the model was right on 21 of 46 at 30 days and 25 of 46 at 180, and neither is distinguishable from chance. All 64 are up there with the dates and the outcomes.","",
    "EVERY ONE OF THEM IS A BACKTEST.","",
    "That means I built the formula, then ran it against history. It is not a record of calls I made at the time. I mark every row that way, because a formula tested against the same history it was designed on will always look better than it deserves to. Mine included. That's a property of all of them, and anyone showing you a clean backtest without saying so is either careless or counting on you not to ask.","",
    "So here's what I'm NOT going to do: promise you a live track record I'd then have to remember to keep. Here's what you can check instead, today.","",
    "The Score is computed from CBBI's public daily data (colintalkscrypto.com/cbbi) using the weights published on every indicator page. Pick any date on the receipts page, pull the same source, and recompute it. That's better than a log I keep myself, because it doesn't require trusting me to keep it honestly.","",
    "Go read it: " + QL("/receipts", "e3_receipts"),"","— Torin"]);
}

function quiz4HTML(seg, sc) {
  return shell("Day 5",
    `<p style="margin:0 0 16px;">There's an enormous amount of content telling you when to buy. There's almost none telling you when to stop.</p>
     <p style="margin:0 0 16px;">That's not an accident. <em>"Buy"</em> is easy to publish — it's shareable, it's optimistic, and nobody can prove you wrong for years. <em>"Here's the price where I sell"</em> is a number people can hold you to next month.</p>
     <p style="margin:0 0 16px;">So most people arrive at the top of a cycle with a lot of conviction and no exit, and they give it back. That's what happened in 2017. It's what happened to me in 2021. It'll happen again, because the mechanism that causes it isn't information, it's the absence of a written rule.</p>
     <p style="margin:0 0 10px;">What I actually do about it, in three parts:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:0 0 18px;font-size:14px;line-height:1.8;color:#333;">
       <div><strong>One number.</strong> Nine indicators, weighted, 0 to 100. Not nine charts to interpret — one number and a verdict.</div>
       <div><strong>Written levels.</strong> Prices decided in advance, in writing, when nothing is happening.</div>
       <div><strong>A rule for doing nothing.</strong> Most days the score says nothing changed. That's the system working. The point is to stop you acting on days when nothing changed.</div>
     </div>
     ${scoreLine(sc)}
     <p style="margin:24px 0 0;">— Torin</p>`,
    "", "");
}
function quiz4Text(seg, sc) {
  return tjoin(["There's an enormous amount of content telling you when to buy. There's almost none telling you when to stop.","",
    "That's not an accident. 'Buy' is easy to publish — shareable, optimistic, and nobody can prove you wrong for years. 'Here's the price where I sell' is a number people can hold you to next month.","",
    "So most people arrive at the top of a cycle with a lot of conviction and no exit, and they give it back. That's what happened in 2017. It's what happened to me in 2021. The mechanism isn't information, it's the absence of a written rule.","",
    "What I actually do about it, in three parts:",
    "  ONE NUMBER. Nine indicators, weighted, 0 to 100. Not nine charts to interpret — one number and a verdict.",
    "  WRITTEN LEVELS. Prices decided in advance, in writing, when nothing is happening.",
    "  A RULE FOR DOING NOTHING. Most days the score says nothing changed. That's the system working.","",
    scoreLineText(sc) || null, "— Torin"]);
}

function quiz5HTML(seg, sc) {
  return shell("Day 7",
    `<p style="margin:0 0 16px;">Everything I've sent you so far is free and stays free. <strong>This is the one email where I tell you about the thing that isn't.</strong></p>
     <p style="margin:0 0 16px;">I keep a document with nine price levels — the exact prices I'm buying at through the rest of this bear market, the reason each level exists, and what I actually do when one hits. When a level fires you get the alert and the updated document.</p>
     <p style="margin:0 0 16px;">It's <strong>$29, once.</strong> Not a subscription. Nothing renews.</p>
     <p style="margin:0 0 10px;"><strong>What it isn't</strong>, because this matters more than what it is:</p>
     <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:18px 20px;margin:0 0 18px;font-size:14px;line-height:1.75;color:#333;">
       <div style="margin-bottom:10px;">It isn't a course. There are 54,000 words of education behind it and this is not that — this is the output. What my money does, at what price, and what happens next.</div>
       <div style="margin-bottom:10px;">It isn't a prediction that those levels get hit. It's a decision I made while I was calm instead of while I was scared. That's the part that survives being wrong.</div>
       <div>It isn't advice for you. It's a record of what I'm doing, published with timestamps. You decide what to do with your own money.</div>
     </div>
     ${QSEG_E5[seg] ? `<p style="margin:0 0 16px;color:#555;font-style:italic;">${QSEG_E5[seg]}</p>` : ""}
     <p style="margin:0 0 16px;"><strong>And the direct version:</strong> if $29 is money you'd notice missing right now, don't spend it here. I mean that. The free side has the score, the brief and the framework, and it isn't going anywhere.</p>
     <p style="margin:0 0 16px;">30 days to change your mind, no form, no reason needed.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "If it's useful — $29, once →", QL("/plan", "e5_plan"));
}
function quiz5Text(seg, sc) {
  return tjoin(["Everything I've sent you so far is free and stays free. This is the one email where I tell you about the thing that isn't.","",
    "I keep a document with nine price levels — the exact prices I'm buying at through the rest of this bear market, the reason each level exists, and what I actually do when one hits. When a level fires you get the alert and the updated document.","",
    "It's $29, once. Not a subscription. Nothing renews.","",
    "WHAT IT ISN'T, because this matters more than what it is:",
    "  It isn't a course. There are 54,000 words of education behind it and this is not that — this is the output.",
    "  It isn't a prediction that those levels get hit. It's a decision I made while calm instead of scared.",
    "  It isn't advice for you. It's a record of what I'm doing, published with timestamps.","",
    QSEG_E5[seg] || null, QSEG_E5[seg] ? "" : null,
    "And the direct version: if $29 is money you'd notice missing right now, don't spend it here. I mean that. The free side has the score, the brief and the framework, and it isn't going anywhere.","",
    "If it's useful: " + QL("/plan", "e5_plan"),
    "30 days to change your mind, no form, no reason needed.","","— Torin"]);
}

function quiz6HTML(seg, sc) {
  return shell("Day 10",
    `<p style="margin:0 0 16px;">Three things people write back with. All fair.</p>
     <p style="margin:0 0 8px;"><strong>"I can get these indicators free."</strong></p>
     <p style="margin:0 0 16px;color:#555;">You can, and you should. CBBI, LookIntoBitcoin and Bitbo are free and they're good — my score is built on the same public data. I'm not selling you the numbers. What none of those sites will give you is a verdict, because none of them has a person attached who can be held to one. I publish one number, what I think it means, and what I'm doing about it with my own money, with my name on it.</p>
     <p style="margin:0 0 8px;"><strong>"How do I know this isn't a scam?"</strong></p>
     <p style="margin:0 0 16px;color:#555;">You don't, yet, and that's the correct default for a faceless crypto account asking you for money. So check before you pay. The score is public. The receipts are public and the losses are on them. The Discord is free to read. And I'll never tell you what you'll make, because I don't know and neither does anyone who says otherwise.</p>
     <p style="margin:0 0 8px;"><strong>"What if the levels never get hit?"</strong></p>
     <p style="margin:0 0 16px;color:#555;">Then I don't buy, and neither do you, and we both keep our money. A level that doesn't fire is a level doing its job. There's a fallback rule in the document for exactly this, because the most common way a ladder fails isn't being wrong — it's price running away while you have no rule for it.</p>
     ${scoreLine(sc)}
     <p style="margin:24px 0 0;">— Torin</p>`,
    "", "");
}
function quiz6Text(seg, sc) {
  return tjoin(["Three things people write back with. All fair.","",
    "\"I CAN GET THESE INDICATORS FREE.\"",
    "You can, and you should. CBBI, LookIntoBitcoin and Bitbo are free and they're good — my score is built on the same public data. I'm not selling you the numbers. What none of those sites will give you is a verdict, because none of them has a person attached who can be held to one.","",
    "\"HOW DO I KNOW THIS ISN'T A SCAM?\"",
    "You don't, yet, and that's the correct default for a faceless crypto account asking you for money. So check before you pay. The score is public. The receipts are public and the losses are on them. The Discord is free to read. And I'll never tell you what you'll make, because I don't know and neither does anyone who says otherwise.","",
    "\"WHAT IF THE LEVELS NEVER GET HIT?\"",
    "Then I don't buy, and neither do you, and we both keep our money. A level that doesn't fire is a level doing its job. There's a fallback rule in the document for exactly this.","",
    scoreLineText(sc) || null, "— Torin"]);
}

function quiz7HTML(seg, sc) {
  const zone = sc && typeof sc.score === "number" ? `<strong>${sc.score.toFixed(1)}</strong>, which is ${sc.zone}` : "on the dashboard";
  return shell("Day 14 · last one",
    `<p style="margin:0 0 16px;">This is the last email I'll send you about the $29 plan. After this you'll get the Sunday score and nothing else, unless you ask.</p>
     <p style="margin:0 0 16px;">Where things stand: the score is ${zone}.</p>
     <p style="margin:0 0 16px;">If you want the levels I'm buying at, they're <a href="${QL("/plan", "e7_plan")}" style="color:#e63946;">here</a> — $29 once, 30 days to change your mind.</p>
     <p style="margin:0 0 16px;">If you don't, that's genuinely fine. The score stays free, the brief stays free, the Discord stays open, and the receipts stay up including the ones that went the wrong way. That was all true before you got this email and it'll be true in six months.</p>
     <p style="margin:0 0 16px;">The only thing I'd actually push you on, and it costs nothing: <strong>write down the price you'd sell at.</strong> Not the price you think it'll hit — the price at which you'd take money off the table. Put it in your notes app. Do it on a boring day when nothing's happening, because that's the only time anyone can think clearly about it.</p>
     <p style="margin:0 0 16px;">That one habit is worth more than anything I sell.</p>
     <p style="margin:24px 0 0;">— Torin</p>`,
    "", "");
}
function quiz7Text(seg, sc) {
  const zone = sc && typeof sc.score === "number" ? `${sc.score.toFixed(1)}, which is ${sc.zone}` : "on the dashboard";
  return tjoin(["This is the last email I'll send you about the $29 plan. After this you'll get the Sunday score and nothing else, unless you ask.","",
    `Where things stand: the score is ${zone}.`,"",
    "If you want the levels I'm buying at: " + QL("/plan", "e7_plan") + " — $29 once, 30 days to change your mind.","",
    "If you don't, that's genuinely fine. The score stays free, the brief stays free, the Discord stays open, and the receipts stay up including the ones that went the wrong way. That was all true before you got this email and it'll be true in six months.","",
    "The only thing I'd actually push you on, and it costs nothing: WRITE DOWN THE PRICE YOU'D SELL AT. Not the price you think it'll hit — the price at which you'd take money off the table. Put it in your notes app. Do it on a boring day when nothing's happening, because that's the only time anyone can think clearly about it.","",
    "That one habit is worth more than anything I sell.","","— Torin"]);
}

// Resolve a contact's quiz segment. Preferred source is a per-segment audience
// (RESEND_QUIZ_AUDIENCE_ROUNDTRIPPED etc). With a single pooled audience there
// is no per-contact tag available from the Resend contacts API, so the sequence
// falls back to the neutral copy — every email still reads correctly without a
// segment, the two personalised paragraphs simply don't render.
const QUIZ_SEGMENTS = ["ROUNDTRIPPED", "ACCUMULATING", "SITTING", "NEW"];

async function fetchScoreSafe() {
  try {
    const r = await fetch("https://liftoffr.com/api/cycle-score");
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
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
      p0: plan0HTML, p1: plan1HTML, p3: plan3HTML, p7: plan7HTML, p14: plan14HTML, p21: plan21HTML,
      q2: () => quiz2HTML("ROUNDTRIPPED", null), q3: () => quiz3HTML("ROUNDTRIPPED", null),
      q4: () => quiz4HTML("ROUNDTRIPPED", null), q5: () => quiz5HTML("NEW", null),
      q6: () => quiz6HTML("SITTING", null), q7: () => quiz7HTML("ACCUMULATING", null),
      t1: trial1HTML, t2: trial2HTML, t3: trial3HTML, t4: trial4HTML,
    };
    const fn = map[preview];
    if (!fn) return res.status(400).json({ error: "unknown preview", options: Object.keys(map) });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(fn());
  }

  // Config check — `?check=1`. Answers one question: did the audience env vars
  // actually take effect in this deployment? Sends nothing, fetches no contacts,
  // and never echoes an ID back (they are secrets); it reports set/not-set only.
  // Exists because the alternative way to find out whether RESEND_QUIZ_AUDIENCE_ID
  // landed was to wait for the next 17:00 UTC cron and read the counts.
  if (_url.searchParams.get("check")) {
    if (!authed) return res.status(401).json({ error: "Unauthorized" });
    const seen = (v) => (v ? "set" : "NOT SET");
    const segs = ["ROUNDTRIPPED", "ACCUMULATING", "SITTING", "NEW"];
    const perSegment = {};
    for (const sg of segs) perSegment[sg] = seen(process.env[`RESEND_QUIZ_AUDIENCE_${sg}`]);
    const pooled = process.env.RESEND_QUIZ_AUDIENCE_ID;
    const anySeg = segs.some((sg) => process.env[`RESEND_QUIZ_AUDIENCE_${sg}`]);
    return res.status(200).json({
      resend_api_key: seen(process.env.RESEND_API_KEY),
      free_audience: seen(process.env.RESEND_AUDIENCE_ID),
      plan_audience: seen(process.env.RESEND_PLAN_AUDIENCE_ID),
      quiz_pooled_audience: seen(pooled),
      quiz_per_segment: perSegment,
      quiz_emails_2_to_7: pooled || anySeg ? "ACTIVE" : "DORMANT — set RESEND_QUIZ_AUDIENCE_ID",
      quiz_mode: anySeg ? "per-segment (Option B)" : pooled ? "pooled, neutral copy (Option A)" : "off",
      mailing_address: seen(process.env.LIFTOFFR_MAILING_ADDRESS),
    });
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
    // One fetch for the whole run. reengageHTML/Text are the only templates that
    // reference the live number; they render without the band claim if this is null.
    const liveScore = await fetchScoreSafe();
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
      if (age >= 18.0 && age < 19.0) { await fire(c, SUBJECT_REENGAGE, reengageText(liveScore), reengageHTML(liveScore), "welcome-reengage", "day18", "reengage_sent", "reengage_failed"); continue; }
      results.skipped++;
    }

    // ── Plan-buyer sequence (master plan §5). LIVE -- the audience id is set in
    // Production. Age-banded and idempotent; see the note at the top of the file.
    const planAud = process.env.RESEND_PLAN_AUDIENCE_ID || null;
    let planSeq = null;
    if (planAud) {
      planSeq = { p0_sent: 0, p1_sent: 0, p3_sent: 0, p7_sent: 0, p14_sent: 0, p21_sent: 0, failed: 0, skipped: 0, total: 0, errors: [] };
      const buyers = await fetchAudience(planAud);
      planSeq.total = buyers.length;
      const steps = [
        { lo: 0.0,  hi: 1.0,  subj: PSUBJECT_0,  html: plan0HTML,  text: plan0Text,  key: "p0",  k: "p0_sent" },
        { lo: 1.0,  hi: 2.0,  subj: PSUBJECT_1,  html: plan1HTML,  text: plan1Text,  key: "p1",  k: "p1_sent" },
        { lo: 3.0,  hi: 4.0,  subj: PSUBJECT_3,  html: plan3HTML,  text: plan3Text,  key: "p3",  k: "p3_sent" },
        { lo: 7.0,  hi: 8.0,  subj: PSUBJECT_7,  html: plan7HTML,  text: plan7Text,  key: "p7",  k: "p7_sent" },
        { lo: 14.0, hi: 15.0, subj: PSUBJECT_14, html: plan14HTML, text: plan14Text, key: "p14", k: "p14_sent" },
        { lo: 21.0, hi: 22.0, subj: PSUBJECT_21, html: plan21HTML, text: plan21Text, key: "p21", k: "p21_sent" },
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

    // ── Quiz sequence (04-email-sequence.md). Emails 2-7; email 1 goes out
    // inline from api/subscribe.js on quiz submit. Dormant until the audience
    // exists — see QUIZ_SETUP.md for the four dashboard steps.
    //
    // Reads either four per-segment audiences (personalised paragraphs render)
    // or one pooled audience (neutral copy, everything else identical).
    let quizSeq = null;
    const quizPooled = process.env.RESEND_QUIZ_AUDIENCE_ID || null;
    const quizPerSeg = QUIZ_SEGMENTS
      .map((s) => ({ seg: s, aud: process.env[`RESEND_QUIZ_AUDIENCE_${s}`] || null }))
      .filter((x) => x.aud);
    if (quizPooled || quizPerSeg.length) {
      quizSeq = { q2_sent: 0, q3_sent: 0, q4_sent: 0, q5_sent: 0, q6_sent: 0, q7_sent: 0, failed: 0, skipped: 0, total: 0, errors: [] };
      const sc = await fetchScoreSafe();
      const steps = [
        { lo: 1.0,  hi: 2.0,  subj: QSUBJECT_2, html: quiz2HTML, text: quiz2Text, key: "q2", k: "q2_sent" },
        { lo: 3.0,  hi: 4.0,  subj: QSUBJECT_3, html: quiz3HTML, text: quiz3Text, key: "q3", k: "q3_sent" },
        { lo: 5.0,  hi: 6.0,  subj: QSUBJECT_4, html: quiz4HTML, text: quiz4Text, key: "q4", k: "q4_sent" },
        { lo: 7.0,  hi: 8.0,  subj: QSUBJECT_5, html: quiz5HTML, text: quiz5Text, key: "q5", k: "q5_sent" },
        { lo: 10.0, hi: 11.0, subj: QSUBJECT_6, html: quiz6HTML, text: quiz6Text, key: "q6", k: "q6_sent" },
        { lo: 14.0, hi: 15.0, subj: QSUBJECT_7, html: quiz7HTML, text: quiz7Text, key: "q7", k: "q7_sent" },
      ];
      // Per-segment audiences take precedence; the pooled audience is the
      // fallback and runs with seg = null (neutral copy).
      const buckets = quizPerSeg.length
        ? quizPerSeg
        : [{ seg: null, aud: quizPooled }];

      for (const b of buckets) {
        const people = await fetchAudience(b.aud);
        quizSeq.total += people.length;
        for (const c of people) {
          const age = ageDays(c.created_at);
          const step = steps.find((s) => age >= s.lo && age < s.hi);
          if (!step) { quizSeq.skipped++; continue; }
          try {
            await sendResend({
              to: c.email,
              subject: step.subj,
              text: step.text(b.seg, sc),
              html: step.html(b.seg, sc),
              idempotencyKey: `quiz-${step.key}-${c.id}`,
              tag: step.key,
              campaign: "quiz",
            });
            quizSeq[step.k]++;
          } catch (e) {
            quizSeq.failed++;
            quizSeq.errors.push({ id: c.id, step: step.key, err: String(e).slice(0, 200) });
          }
          await new Promise((r) => setTimeout(r, 600));
        }
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
      quiz: quizSeq,
      trial,
    });
  } catch (err) {
    console.error("cron-welcome-followups error", err);
    return res.status(500).json({ error: err.message });
  }
}
