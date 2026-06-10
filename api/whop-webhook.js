// Whop webhook → GA4 Measurement Protocol bridge + churn ops alerts.
//
// Handles:
//   payment.succeeded / membership.activated / membership.went_valid
//     → fires GA4 `purchase` event with UTM attribution
//   payment.failed / membership.went_invalid / membership.cancel_at_period_end_changed
//     → fires GA4 `subscription_event` event + posts ops alert to Discord
//
// Env required (set in Vercel project settings):
//   WHOP_WEBHOOK_SECRET    – signing secret from Whop dashboard
//   GA4_MEASUREMENT_ID     – e.g. G-015PKWM24J
//   GA4_API_SECRET         – GA4 Admin → Data Streams → Measurement Protocol API secrets
//   DISCORD_OPS_WEBHOOK    – (optional) Discord webhook URL for ops channel alerts on churn events
//   DISCORD_BOT_TOKEN      – (optional) Mission Control bot token, enables public welcome + DM on new sub
//   DISCORD_WELCOME_CHANNEL_ID – (optional) channel id for public welcome; defaults to #elite-announcements
//   DISCORD_HOW_TO_USE_CHANNEL_ID – (optional) channel id mentioned in welcome message; defaults to #how-to-use-this-course
//   DISCORD_ELITE_QNA_CHANNEL_ID – (optional) channel id mentioned in welcome message; defaults to #elite-qna
//
// Vercel auto-routes this file to /api/whop-webhook (Node serverless).

import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

function timingSafeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Standard Webhooks signature verification.
// Header format: `webhook-signature: v1,<base64sig> v1,<base64sig2>`
// HMAC body: `${id}.${timestamp}.${rawBody}` with secret as raw bytes.
function verifyStandardWebhook(rawBody, headers, secret) {
  const id = headers["webhook-id"];
  const timestamp = headers["webhook-timestamp"];
  const signatureHeader = headers["webhook-signature"];
  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, reason: "missing webhook headers" };
  }

  // Reject if too old (5 min tolerance) to prevent replay attacks.
  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad timestamp" };
  const ageSec = Math.abs(Date.now() / 1000 - ts);
  if (ageSec > 300) return { ok: false, reason: `timestamp ${ageSec.toFixed(0)}s out of tolerance` };

  const toSign = `${id}.${timestamp}.${rawBody}`;
  const computed = crypto.createHmac("sha256", Buffer.from(secret, "utf8")).update(toSign).digest("base64");

  // Header may have multiple "v1,sig" entries separated by spaces.
  const parts = signatureHeader.split(" ");
  for (const p of parts) {
    const [version, sig] = p.split(",");
    if (version !== "v1" || !sig) continue;
    if (timingSafeEqual(sig, computed)) return { ok: true };
  }
  return { ok: false, reason: "no signature matched" };
}

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// Send a generic event to GA4 via Measurement Protocol.
async function sendGa4Event({ measurementId, apiSecret, name, clientId, userId, params }) {
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const payload = {
    client_id: clientId || `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`,
    user_id: userId || undefined,
    non_personalized_ads: false,
    events: [{ name, params: params || {} }],
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: r.status, ok: r.ok };
}

async function postDiscordAlert(webhookUrl, lines) {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: lines.filter(Boolean).join("\n"),
      allowed_mentions: { parse: [] },
    }),
  });
}

// Default channel IDs (overridable via env)
const DEFAULT_WELCOME_CHANNEL    = "1380272240150708326"; // #announcements
const DEFAULT_HOW_TO_USE_CHANNEL = "1442207394439626802"; // #how-to-use-this-course
const DEFAULT_ELITE_QNA_CHANNEL  = "1442207548156416020"; // #elite-qna

// --- Discord tier-role assignment (Core/Pro/Elite) ---
// We assign roles in code (not via Whop's native Discord role mapping) so each
// plan grants exactly the right tier, swaps cleanly on upgrade/downgrade, and
// is stripped on cancel/expiry. Whop's Discord integration still LINKS the
// account (gives us the discord id); this owns the role itself.
const DISCORD_GUILD_ID = "1380245793780531351";
const TIER_ROLES = {
  core:  "1514064479950737459",
  pro:   "1514064481720733736",
  elite: "1514064483276951592",
};
// Which tier each NEW plan grants. Legacy plans are intentionally ABSENT →
// their members' roles are never touched (grandfathered LiftOffr/Founding Circle).
const PLAN_TIER = {
  plan_yi7i0rC444Ssk: "core",  plan_kBe5idN105Ipc: "core",   // Core monthly / annual
  plan_JnWiKWtwzlTVR: "pro",   plan_nFxTZFYUqmMkx: "pro",     // Pro monthly / annual
  plan_dMb9YIKbWN7ck: "elite", plan_b0whXHoSzqDL1: "elite",   // Elite monthly / annual
  plan_uIpPdsPTSHdTp: "pro",   // Cycle Playbook (one-time) → full (Pro) access
  plan_zNprCbJjAquZ6: "pro",   // cardless 7-day trial → Pro taste
};

// Pull a likely Discord user ID from a Whop membership payload.
// Whop's payload shape varies: try common locations.
function extractDiscordId(data) {
  const u = data.user || {};
  return (
    data.discord?.id ||            // Whop membership shape: top-level discord object
    data.discord?.user_id ||
    u.discord?.id ||
    u.discord_id ||
    u.discord_user_id ||
    data.discord_id ||
    data.discord_user_id ||
    u.social_accounts?.discord?.id ||
    null
  );
}

// Fallback: if the webhook payload lacks the Discord id, fetch the membership
// from Whop's API (which returns discord.id, as verified 2026-06-09).
async function fetchDiscordIdFromWhop(membershipId) {
  const key = process.env.WHOP_API_KEY;
  if (!key || !membershipId) return null;
  try {
    const r = await fetch(`https://api.whop.com/api/v2/memberships/${membershipId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return null;
    const m = await r.json();
    return m?.discord?.id || m?.user?.discord?.id || null;
  } catch { return null; }
}

// Resolve the buyer's Discord id from payload, then Whop API as fallback.
async function resolveDiscordId(data) {
  return extractDiscordId(data) || (await fetchDiscordIdFromWhop(data.membership_id || data.id));
}

function extractUsername(data) {
  const u = data.user || {};
  return (
    u.username ||
    u.name ||
    u.discord_username ||
    u.email?.split("@")[0] ||
    data.email?.split("@")[0] ||
    "new member"
  );
}

async function setDiscordRole(botToken, discordId, roleId, add) {
  const url = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}/roles/${roleId}`;
  const r = await fetch(url, {
    method: add ? "PUT" : "DELETE",
    headers: { "Authorization": `Bot ${botToken}`, "User-Agent": "DiscordBot (liftoffr.com, 1.0)" },
  });
  return r.status; // 204 = ok; 404 = member/role absent (safe to ignore)
}

// Assign the tier role for a purchased plan + strip the other tier roles so a
// member holds exactly one tier (clean upgrade/downgrade). No-ops for unmapped
// (legacy) plans, so grandfathered members are never modified.
async function applyTierRole(botToken, discordId, planId) {
  if (!botToken || !discordId) return { skipped: "no bot token or discord id" };
  const tier = PLAN_TIER[planId];
  if (!tier) return { skipped: `unmapped plan ${planId}` };
  const target = TIER_ROLES[tier];
  const out = { tier };
  try {
    out.add = await setDiscordRole(botToken, discordId, target, true);
    for (const [name, rid] of Object.entries(TIER_ROLES)) {
      if (rid !== target) out[`rm_${name}`] = await setDiscordRole(botToken, discordId, rid, false);
    }
  } catch (e) { out.error = e?.message || String(e); }
  return out;
}

// On churn/expiry (incl. cardless-trial day-7 expiry), remove all tier roles.
async function clearTierRoles(botToken, discordId) {
  if (!botToken || !discordId) return { skipped: "no bot token or discord id" };
  const out = {};
  for (const [name, rid] of Object.entries(TIER_ROLES)) {
    try { out[name] = await setDiscordRole(botToken, discordId, rid, false); }
    catch (e) { out[name] = e?.message || String(e); }
  }
  return out;
}

async function postPublicWelcome(botToken, channelId, discordId, username) {
  const howTo = process.env.DISCORD_HOW_TO_USE_CHANNEL_ID || DEFAULT_HOW_TO_USE_CHANNEL;
  const qna   = process.env.DISCORD_ELITE_QNA_CHANNEL_ID  || DEFAULT_ELITE_QNA_CHANNEL;
  const mention = discordId ? `<@${discordId}>` : `**${username}**`;

  const content =
    `🎉  Welcome to LiftOffr, ${mention}!\n\n` +
    `Start here → <#${howTo}>\n\n` +
    `Read the 3 pinned messages, then work through Module 1 in order. ` +
    `Questions? Drop them in <#${qna}> or DM me anytime.\n\n` +
    `Glad you're in. — Torin`;

  const r = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      allowed_mentions: { parse: ["users"] },
    }),
  });
  return { status: r.status, ok: r.ok };
}

async function sendWelcomeDM(botToken, discordId, username) {
  if (!discordId) return { ok: false, reason: "no discord id" };

  // Step 1: open a DM channel with the user
  const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST",
    headers: {
      "Authorization": `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: String(discordId) }),
  });
  if (!dmRes.ok) {
    return { ok: false, reason: `open DM failed: ${dmRes.status}` };
  }
  const dm = await dmRes.json();

  const content =
    `Hey ${username} — welcome to LiftOffr.\n\n` +
    `Torin here. This DM is automated but I personally read every reply.\n\n` +
    `The course lives in the **ELITE-HUB** category. Start with **#how-to-use-this-course** — ` +
    `the 3 pinned messages walk you through the whole thing.\n\n` +
    `If you have a question about a lesson, an indicator, or anything crypto-related — ` +
    `reply here or ping me in **#elite-qna**. I'll get back to you fast.\n\n` +
    `Glad you're in.`;

  const sendRes = await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  return { ok: sendRes.ok, status: sendRes.status };
}

async function postNewMemberAlert(webhookUrl, eventType, data) {
  const email = data.user?.email || data.email || "(no email)";
  const username = data.user?.username || data.user?.name || "(unknown user)";
  const plan = data.plan?.name || data.plan_id || data.product?.name || "?";
  const value = data.amount_after_fees ?? data.subtotal ?? data.amount;
  const valueStr = value ? `$${(value / 100).toFixed(2)}` : "";
  const utmSource = data.utm_source || data.referral?.utm_source || data.metadata?.utm_source;

  await postDiscordAlert(webhookUrl, [
    `🎉 **New member joined!**`,
    `• User: \`${username}\` · ${email}`,
    `• Plan: ${plan}`,
    valueStr ? `• Amount: ${valueStr}` : null,
    utmSource ? `• Source: ${utmSource}` : null,
    ``,
    `[View in Whop](https://dash.whop.com/memberships)`,
  ]);
}

// Post a churn-event alert to a Discord webhook so the operator can act fast
// (eg failed-payment recovery DM, save-offer outreach).
async function postChurnAlertToDiscord(webhookUrl, eventType, data) {
  const labels = {
    "payment.failed": "🔴 Payment failed",
    "membership.went_invalid": "⚠️ Membership invalid (cancel or failed payment)",
    "membership.deactivated": "❌ Membership deactivated",
    "membership.cancel_at_period_end_changed": "⏳ Cancel scheduled",
  };
  const headline = labels[eventType] || `Whop event: ${eventType}`;
  const email = data.user?.email || data.email || "(no email)";
  const username = data.user?.username || data.user?.name || "(unknown user)";
  const memberId = data.membership_id || data.id || "?";
  const plan = data.plan?.name || data.plan_id || data.product?.name || "?";
  const reason = data.cancel_reason || data.reason || "";
  const value = data.amount_after_fees ?? data.amount;
  const valueStr = value ? `$${(value / 100).toFixed(2)}` : "";
  const utmSource = data.utm_source || data.referral?.utm_source || data.metadata?.utm_source;

  await postDiscordAlert(webhookUrl, [
    `**${headline}**`,
    `• Member: \`${username}\` · ${email}`,
    `• Plan: ${plan}`,
    memberId ? `• Membership ID: \`${memberId}\`` : null,
    valueStr ? `• Amount: ${valueStr}` : null,
    reason ? `• Reason: ${reason}` : null,
    utmSource ? `• Original source: ${utmSource}` : null,
    ``,
    `[View in Whop](https://dash.whop.com/memberships)`,
  ]);
}

// Send a `purchase` event to GA4 via Measurement Protocol.
async function sendGa4Purchase({ measurementId, apiSecret, clientId, userId, transactionId, value, currency, utm, productName }) {
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const payload = {
    client_id: clientId || `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`,
    user_id: userId || undefined,
    non_personalized_ads: false,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: transactionId,
          value,
          currency,
          source: utm.source || "(direct)",
          medium: utm.medium || "(none)",
          campaign: utm.campaign || "(none)",
          content: utm.content || "(none)",
          items: [
            {
              item_id: "liftoffr-elite",
              item_name: productName || "LiftOffr",
              price: value,
              quantity: 1,
            },
          ],
        },
      },
    ],
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: r.status, ok: r.ok };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  try {
    const raw = await readRawBody(req);
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    if (!secret) {
      console.error("WHOP_WEBHOOK_SECRET not set");
      res.status(500).json({ error: "server misconfigured" });
      return;
    }
    const verify = verifyStandardWebhook(raw, req.headers, secret);
    if (!verify.ok) {
      console.warn("[whop-webhook] signature verification failed:", verify.reason);
      res.status(401).json({ error: "signature invalid", reason: verify.reason });
      return;
    }

    const event = JSON.parse(raw);
    const type = event.type || event.event;
    const data = event.data || {};

    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    // Whop payload shapes vary by event type; extract defensively.
    const utm = {
      source: data.utm_source || data.metadata?.utm_source || data.referral?.utm_source,
      medium: data.utm_medium || data.metadata?.utm_medium || data.referral?.utm_medium,
      campaign: data.utm_campaign || data.metadata?.utm_campaign || data.referral?.utm_campaign,
      content: data.utm_content || data.metadata?.utm_content || data.referral?.utm_content,
    };

    // The $49/mo plan carries a 7-day free trial (initial_price $0).
    // A trial START arrives as membership.activated with $0 collected — it is
    // NOT revenue, so it must fire `begin_trial`, never `purchase` (otherwise the
    // `|| 29` fallback below would log a phantom $29 sale for every free trial).
    // Two trial front doors, both $0-at-signup:
    //   - card trial:     $49/mo plan with 7 trial days, card required, auto-charges day 8
    //   - cardless trial: $0 one_time plan, no card, Whop auto-expires access at day 7
    // Both arrive as membership.activated @ $0 → begin_trial (never a purchase).
    const CARD_TRIAL_PLAN_ID = "plan_aYmWvRCWPXqdB";
    const CARDLESS_TRIAL_PLAN_ID = "plan_zNprCbJjAquZ6";
    const TRIAL_PLAN_IDS = [CARD_TRIAL_PLAN_ID, CARDLESS_TRIAL_PLAN_ID];
    const planId = data.plan?.id || data.plan_id || (typeof data.plan === "string" ? data.plan : null);
    const isTrialPlan = TRIAL_PLAN_IDS.includes(planId);
    const collected = (data.amount_after_fees ?? data.subtotal ?? data.amount ?? 0) / 100;
    const isTrialStart = type === "membership.activated" && isTrialPlan && collected === 0;

    const isPaid =
      type === "payment.succeeded" ||
      type === "membership.activated" ||
      type === "membership.went_valid";

    const isChurn =
      type === "payment.failed" ||
      type === "membership.went_invalid" ||
      type === "membership.deactivated" ||
      type === "membership.cancel_at_period_end_changed";

    if (isPaid) {
      const value = collected || (isTrialPlan ? 49 : 29);
      const currency = (data.currency || "USD").toUpperCase();

      // Discord new-member alert to ops channel (private notification for Torin)
      const opsWebhook = process.env.DISCORD_OPS_WEBHOOK;
      if (opsWebhook) {
        try {
          await postNewMemberAlert(opsWebhook, type, data);
        } catch (e) {
          console.warn("[whop-webhook] discord new-member alert failed:", e?.message || e);
        }
      }

      // Public welcome in #elite-announcements + DM the new member.
      // Only fires on membership.activated (the actual "they joined" event) —
      // payment.succeeded fires on every renewal too and we don't want to spam.
      const botToken = process.env.DISCORD_BOT_TOKEN;
      if (botToken && type === "membership.activated") {
        const discordId = extractDiscordId(data);
        const username  = extractUsername(data);

        // Public welcome
        try {
          const welcomeCh = process.env.DISCORD_WELCOME_CHANNEL_ID || DEFAULT_WELCOME_CHANNEL;
          const pub = await postPublicWelcome(botToken, welcomeCh, discordId, username);
          console.log(`[whop-webhook] public welcome status=${pub.status} for ${username}`);
        } catch (e) {
          console.warn("[whop-webhook] public welcome failed:", e?.message || e);
        }

        // DM (best-effort — fails if user has DMs disabled)
        if (discordId) {
          try {
            const dm = await sendWelcomeDM(botToken, discordId, username);
            console.log(`[whop-webhook] welcome DM ok=${dm.ok} reason=${dm.reason || "sent"}`);
          } catch (e) {
            console.warn("[whop-webhook] welcome DM failed:", e?.message || e);
          }
        } else {
          console.log(`[whop-webhook] no discord_id in payload for ${username}, skipping DM`);
        }
      }

      // Assign the correct Discord tier role from the plan purchased.
      // Runs for trial starts AND purchases; self-heals on renewals;
      // swaps cleanly on upgrade/downgrade. No-op for legacy/unmapped plans.
      if (botToken) {
        try {
          const tierRes = await applyTierRole(botToken, await resolveDiscordId(data), planId);
          console.log(`[whop-webhook] tier role: ${JSON.stringify(tierRes)}`);
        } catch (e) {
          console.warn("[whop-webhook] tier role assignment failed:", e?.message || e);
        }
      }

      if (!measurementId || !apiSecret) {
        console.warn("[whop-webhook] GA4 env not set, skipping GA4 forward");
        res.status(200).json({ ok: true, ga4: "skipped" });
        return;
      }

      // Free-trial START → `begin_trial`, NOT a purchase (no money changed hands).
      // The welcome/DM above already fired so the new trialist gets onboarded immediately.
      if (isTrialStart) {
        // Add the trialist to the Resend "LiftOffr Trial" audience so the
        // day-1/3/6 trial-nurture cron can email them before the day-7 charge.
        // No-op unless RESEND_TRIAL_AUDIENCE_ID is set (feature-flagged).
        const trialAud = process.env.RESEND_TRIAL_AUDIENCE_ID;
        const resendKey = process.env.RESEND_API_KEY;
        const trialEmail = data.user?.email || data.email;
        if (trialAud && resendKey && trialEmail) {
          try {
            await fetch(`https://api.resend.com/audiences/${trialAud}/contacts`, {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                email: trialEmail,
                first_name: (data.user?.username || data.user?.name || "").split(" ")[0] || undefined,
                unsubscribed: false,
              }),
            });
          } catch (e) {
            console.warn("[whop-webhook] trial audience add failed:", e?.message || e);
          }
        }
        const ga = await sendGa4Event({
          measurementId, apiSecret,
          name: "begin_trial",
          clientId: data.user_id || data.user?.id || undefined,
          userId: data.user?.id,
          params: {
            plan_id: planId, value: 0, currency,
            source: utm.source || "(direct)", medium: utm.medium || "(none)",
            campaign: utm.campaign || "(none)", content: utm.content || "(none)",
          },
        });
        console.log(`[whop-webhook] begin_trial forwarded ga4=${ga.status} utm=${JSON.stringify(utm)}`);
        res.status(200).json({ ok: true, type, event: "begin_trial", ga4_status: ga.status });
        return;
      }

      const transactionId = data.id || data.payment_id || data.membership_id || `whop-${Date.now()}`;
      const ga = await sendGa4Purchase({
        measurementId,
        apiSecret,
        clientId: data.user_id || data.user?.id || undefined,
        userId: data.user?.id,
        transactionId,
        value,
        currency,
        utm,
        productName: data.plan?.product?.name || data.product?.name || data.plan_name || "LiftOffr",
      });

      // A successful payment on the trial plan = the trial converted to paid.
      // NOTE: this also fires on monthly renewals (stateless webhook can't tell
      // first charge from renewal); at current volume that's visually obvious in
      // GA4. Revisit with membership age if renewals start to muddy the metric.
      if (type === "payment.succeeded" && isTrialPlan) {
        try {
          await sendGa4Event({
            measurementId, apiSecret,
            name: "trial_converted",
            clientId: data.user_id || data.user?.id || undefined,
            userId: data.user?.id,
            params: {
              plan_id: planId, value, currency,
              source: utm.source || "(direct)", medium: utm.medium || "(none)",
            },
          });
        } catch (e) {
          console.warn("[whop-webhook] trial_converted forward failed:", e?.message || e);
        }
      }

      console.log(`[whop-webhook] purchase forwarded type=${type} ga4=${ga.status} value=${value} ${currency} utm=${JSON.stringify(utm)}`);
      res.status(200).json({ ok: true, type, ga4_status: ga.status });
      return;
    }

    if (isChurn) {
      // Strip tier roles on churn/expiry (cardless-trial day-7 expiry lands here too)
      const churnBot = process.env.DISCORD_BOT_TOKEN;
      if (churnBot) {
        try {
          const clr = await clearTierRoles(churnBot, await resolveDiscordId(data));
          console.log(`[whop-webhook] cleared tier roles: ${JSON.stringify(clr)}`);
        } catch (e) {
          console.warn("[whop-webhook] clear tier roles failed:", e?.message || e);
        }
      }

      // Send GA4 event so we can build retention reports
      if (measurementId && apiSecret) {
        await sendGa4Event({
          measurementId,
          apiSecret,
          name: "subscription_event",
          clientId: data.user_id || data.user?.id || `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`,
          userId: data.user?.id,
          params: {
            whop_event: type,
            value: ((data.amount_after_fees ?? data.amount ?? 0) / 100) || 49,
            currency: (data.currency || "USD").toUpperCase(),
            cancel_reason: data.cancel_reason || data.reason || "unknown",
            membership_id: data.membership_id || data.id,
            plan_id: data.plan?.id || data.plan_id,
            source: utm.source || "(direct)",
            medium: utm.medium || "(none)",
          },
        });
      }

      // Post ops alert to Discord so user can react in real time (failed payment recovery, save outreach, etc.)
      const opsWebhook = process.env.DISCORD_OPS_WEBHOOK;
      if (opsWebhook) {
        try {
          await postChurnAlertToDiscord(opsWebhook, type, data);
        } catch (e) {
          console.warn("[whop-webhook] discord ops alert failed:", e?.message || e);
        }
      }

      console.log(`[whop-webhook] churn event handled type=${type} member=${data.user?.email || data.user?.id || "?"}`);
      res.status(200).json({ ok: true, type, churn: true });
      return;
    }

    console.log(`[whop-webhook] ignoring event type=${type}`);
    res.status(200).json({ ok: true, ignored: type });
  } catch (err) {
    console.error("[whop-webhook] error:", err);
    res.status(500).json({ error: "internal", detail: String(err?.message || err) });
  }
}
