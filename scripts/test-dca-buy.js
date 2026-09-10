#!/usr/bin/env node
// scripts/test-dca-buy.js — HUMAN-TRIGGERED, one-shot DCA proof.
//
// Places a small BTC-USDC market buy through the EXACT production code path
// (resolveDcaCredential + placeMarketBuy + sendDcaResultToDiscord), reads the
// fill back, and posts to #auto-buy-log the same way the daily cron does — so a
// green run proves the real chain, not a lookalike. It does NOT touch the
// schedule, and it uses a distinct idempotency key so it can never collide with
// — or be mistaken for — the real daily order.
//
// USAGE
//   node scripts/test-dca-buy.js 10           # DRY RUN — prints the plan, places NOTHING
//   node scripts/test-dca-buy.js 10 --live    # places it, after you type the amount to confirm
//
// CREDENTIALS
//   Reads COINBASE_API_KEY_ID / COINBASE_API_SECRET (and DISCORD_BOT_TOKEN) from
//   the environment. If the Coinbase pair is not set, it prompts for them with
//   echo OFF — nothing is written to disk or shell history. Copy them from
//   https://portal.cdp.coinbase.com/access/api (the LiftOffrDCA key).
//   DISCORD_BOT_TOKEN is read from ~/.openclaw/secrets/discord.env if not in env.

import fs from "node:fs";
import os from "node:os";
import readline from "node:readline";
import {
  resolveDcaCredential, placeMarketBuy, sendDcaResultToDiscord, cbApi,
} from "../api/cron-weekly-score.js";
import { DCA_MAX_QUOTE_SIZE, dcaForToday } from "../api/_buy-plan.js";
import { AUTO_BUY_LOG_CHANNEL } from "../api/_alerts.js";

const PRODUCT = "BTC-USDC";
const TEST_CEILING = 25;  // hard cap for THIS script — far under the $250 order cap
const FALLBACK_MIN = 1;   // used only if the public min-size lookup fails

const args = process.argv.slice(2);
const live = args.includes("--live");
const amountArg = args.find((a) => /^\d+(\.\d+)?$/.test(a));
const amount = Number(amountArg);

const die = (m) => { console.error("\n✖ " + m + "\n"); process.exit(1); };
const line = () => console.log("─".repeat(62));

if (!amountArg) die("Usage: node scripts/test-dca-buy.js <amount> [--live]   e.g.  10");
if (!Number.isFinite(amount) || amount <= 0) die(`Amount "${amountArg}" is not a positive number.`);
if (amount > TEST_CEILING) die(`Amount $${amount} exceeds this test's ceiling of $${TEST_CEILING}. This is a small proof, not a real buy.`);

function loadEnvFile(path, keys) {
  try {
    const txt = fs.readFileSync(path, "utf8");
    for (const k of keys) {
      if (process.env[k]) continue;
      const m = txt.match(new RegExp("^(?:export\\s+)?" + k + "\\s*=\\s*(.*)$", "m"));
      if (m) {
        let v = m[1].trim();
        if (v.length >= 2 && v[0] === v[v.length - 1] && (v[0] === '"' || v[0] === "'")) v = v.slice(1, -1);
        process.env[k] = v;
      }
    }
  } catch { /* file absent is fine */ }
}

function ask(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (a) => { rl.close(); resolve(a.trim()); });
  });
}

function promptHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (s) => { if (!muted) rl.output.write(s); };
    process.stdout.write(query);
    muted = true;
    rl.question("", (val) => { muted = false; rl.close(); process.stdout.write("\n"); resolve(val.trim()); });
  });
}

async function main() {
  loadEnvFile(os.homedir() + "/.openclaw/secrets/discord.env", ["DISCORD_BOT_TOKEN", "OWNER_DISCORD_ID"]);

  console.log("\nLiftOffr — manual DCA test buy (human-triggered)\n");
  line();

  // ── [1] Credential resolution (identical to the cron) ────────────────────
  const haveCreds = (process.env.COINBASE_API_KEY_ID && process.env.COINBASE_API_SECRET) ||
                    (process.env.COINBASE_TRADE_KEY_ID && process.env.COINBASE_TRADE_SECRET);
  if (!haveCreds) {
    console.log("Coinbase credential not in the environment.");
    console.log("Paste it from https://portal.cdp.coinbase.com/access/api (the LiftOffrDCA key).");
    console.log("Input is hidden; nothing is written to disk or shell history.\n");
    const kid = await promptHidden("  COINBASE_API_KEY_ID (UUID): ");
    const sec = await promptHidden("  COINBASE_API_SECRET (base64): ");
    if (!kid || !sec) die("No credential entered.");
    process.env.COINBASE_API_KEY_ID = kid.split("/").pop();  // accept bare UUID or org/.../apiKeys/UUID
    process.env.COINBASE_API_SECRET = sec;
  }
  const cred = resolveDcaCredential();
  const credOk = !!(cred.keyId && cred.secret);
  console.log(`[1] credential resolution : ${credOk ? "OK" : "FAILED"}   (source: ${cred.credentialSource})`);
  if (!credOk) die(`Missing ${cred.missing.join(" and ")}. Provide the Coinbase key and retry.`);

  // ── Minimum order size (public, read-only) ───────────────────────────────
  let quoteMin = FALLBACK_MIN;
  try {
    const r = await fetch(`https://api.coinbase.com/api/v3/brokerage/market/products/${PRODUCT}`);
    if (r.ok) {
      const p = await r.json();
      const q = Number(p.quote_min_size ?? p?.product?.quote_min_size);
      if (Number.isFinite(q) && q > 0) quoteMin = q;
    } else {
      console.log(`    (could not read Coinbase min size: HTTP ${r.status}; using $${FALLBACK_MIN} floor)`);
    }
  } catch (e) {
    console.log(`    (min-size lookup failed: ${e.message}; using $${FALLBACK_MIN} floor)`);
  }
  if (amount < quoteMin) {
    die(`$${amount} is below Coinbase's minimum order for ${PRODUCT} ($${quoteMin}). ` +
        `Re-run with an amount of at least $${quoteMin} (and ≤ $${TEST_CEILING}).`);
  }

  const clientOrderId = `liftoffr-dcatest-${PRODUCT}-${Date.now()}`;
  const sched = dcaForToday();
  line();
  console.log("ABOUT TO PLACE  (real money on Coinbase):");
  console.log(`  product          : ${PRODUCT}`);
  console.log(`  amount           : $${amount.toFixed(2)}   (test ceiling $${TEST_CEILING}; order-path cap $${DCA_MAX_QUOTE_SIZE}; Coinbase min $${quoteMin})`);
  console.log(`  credential       : ${cred.credentialSource}`);
  console.log(`  idempotency id   : ${clientOrderId}`);
  console.log(`                     (distinct from the daily "liftoffr-dca-${PRODUCT}-<date>" — no collision, not counted as the daily DCA)`);
  console.log(`  daily schedule   : USDC $${sched.usdc}/day — UNCHANGED by this test`);
  console.log(`  alert to         : #auto-buy-log (channel ${AUTO_BUY_LOG_CHANNEL}) via the bot`);
  line();

  if (!live) {
    console.log("DRY RUN — nothing was placed. Re-run with  --live  to actually buy.\n");
    process.exit(0);
  }

  const confirm = await ask(`Type the amount (${amount}) to place this REAL buy, or anything else to cancel: `);
  if (confirm !== String(amount)) die("Cancelled — confirmation did not match.");

  // ── [2] Order placement (the real placeMarketBuy) ────────────────────────
  let order = null, orderErr = null;
  try {
    order = await placeMarketBuy({
      productId: PRODUCT, quoteSize: amount,
      dateIso: new Date().toISOString().slice(0, 10),
      keyId: cred.keyId, secret: cred.secret, clientOrderId,
    });
  } catch (e) { orderErr = e.message; }
  const orderOk = !!(order && order.orderId);
  console.log(`\n[2] order placement       : ${orderOk ? "OK" : "FAILED"}`);
  if (orderOk) console.log(`    order id: ${order.orderId}`);
  if (orderErr) console.log(`    Coinbase said (verbatim): ${orderErr}`);

  // Read the fill back (best-effort, read-only)
  let fill = null;
  if (orderOk) {
    for (let i = 0; i < 4 && !fill; i++) {
      try {
        const d = await cbApi("GET", `/api/v3/brokerage/orders/historical/${order.orderId}`, cred.keyId, cred.secret);
        const o = d.order || d;
        if (o && (o.filled_size || o.average_filled_price || o.status === "FILLED")) fill = o;
      } catch { /* keep polling */ }
      if (!fill) await new Promise((r) => setTimeout(r, 2000));
    }
    if (fill) {
      console.log(`    filled: ${fill.filled_size} BTC @ ~$${fill.average_filled_price} ` +
                  `(total $${fill.total_value_after_fees || "?"}, status ${fill.status})`);
    } else {
      console.log("    fill still settling — the size/price will show in #auto-buy-log and Coinbase shortly.");
    }
  }

  // ── [3] Discord post via the identical alerting path ─────────────────────
  const dcaResult = {
    ts: new Date().toISOString(), test: true, notify: true,
    fatal: !orderOk, reason: orderOk ? "ok" : "order-failed",
    credentialSource: cred.credentialSource, intendedUsdc: amount,
    results: [{ dca: "USDC-TEST", ok: orderOk, productId: PRODUCT, quoteSize: amount, orderId: order?.orderId, error: orderErr }],
  };
  let post;
  try { post = await sendDcaResultToDiscord(dcaResult); }
  catch (e) { post = { sent: false, error: e.message }; }
  console.log(`\n[3] #auto-buy-log post     : ${post && post.sent ? "OK" : "FAILED"}` +
              `${post && post.status ? `  (HTTP ${post.status})` : ""}${post && post.error ? `  (${post.error})` : ""}`);
  if (!(post && post.sent) && !process.env.DISCORD_BOT_TOKEN) {
    console.log("    DISCORD_BOT_TOKEN not found — set it, or source ~/.openclaw/secrets/discord.env");
  }

  line();
  console.log(`SUMMARY   credential: ${credOk ? "OK" : "FAIL"}   order: ${orderOk ? "OK" : "FAIL"}   discord: ${post && post.sent ? "OK" : "FAIL"}`);
  console.log(orderOk
    ? "\n✅ Test buy placed. This exercised the exact production path end to end.\n"
    : "\n✖ Test did not place — see [2] above for Coinbase's exact reason.\n");
  process.exit(orderOk ? 0 : 1);
}

main().catch((e) => die(e.message));
