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
              item_name: productName || "LiftOffr Elite",
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
      const value = (data.amount_after_fees ?? data.subtotal ?? data.amount ?? 0) / 100 || 29;
      const currency = (data.currency || "USD").toUpperCase();

      // Discord new-member alert
      const opsWebhook = process.env.DISCORD_OPS_WEBHOOK;
      if (opsWebhook) {
        try {
          await postNewMemberAlert(opsWebhook, type, data);
        } catch (e) {
          console.warn("[whop-webhook] discord new-member alert failed:", e?.message || e);
        }
      }

      if (!measurementId || !apiSecret) {
        console.warn("[whop-webhook] GA4 env not set, skipping GA4 forward");
        res.status(200).json({ ok: true, ga4: "skipped" });
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
        productName: data.plan?.product?.name || data.product?.name || data.plan_name || "LiftOffr Elite",
      });
      console.log(`[whop-webhook] purchase forwarded type=${type} ga4=${ga.status} value=${value} ${currency} utm=${JSON.stringify(utm)}`);
      res.status(200).json({ ok: true, type, ga4_status: ga.status });
      return;
    }

    if (isChurn) {
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
