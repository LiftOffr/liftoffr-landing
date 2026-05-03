// Whop webhook → GA4 Measurement Protocol bridge.
// Receives membership.activated / payment.succeeded from Whop,
// verifies signature, then fires a `purchase` event to GA4 with the
// stored UTM context so we can attribute paid signups by source.
//
// Env required (set in Vercel project settings):
//   WHOP_WEBHOOK_SECRET    – signing secret from Whop dashboard
//   GA4_MEASUREMENT_ID     – e.g. G-015PKWM24J
//   GA4_API_SECRET         – generated in GA4 Admin → Data Streams → Measurement Protocol API secrets
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

    // Only fire GA4 purchase on the events that represent a successful paid signup.
    const isPaid =
      type === "payment.succeeded" ||
      type === "membership.activated" ||
      type === "membership.went_valid";

    if (!isPaid) {
      console.log(`[whop-webhook] ignoring event type=${type}`);
      res.status(200).json({ ok: true, ignored: type });
      return;
    }

    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;
    if (!measurementId || !apiSecret) {
      console.warn("[whop-webhook] GA4 env not set, skipping forward");
      res.status(200).json({ ok: true, ga4: "skipped" });
      return;
    }

    // Whop payload shapes vary by event type; extract defensively.
    const utm = {
      source: data.utm_source || data.metadata?.utm_source || data.referral?.utm_source,
      medium: data.utm_medium || data.metadata?.utm_medium || data.referral?.utm_medium,
      campaign: data.utm_campaign || data.metadata?.utm_campaign || data.referral?.utm_campaign,
      content: data.utm_content || data.metadata?.utm_content || data.referral?.utm_content,
    };

    const value = (data.amount_after_fees ?? data.subtotal ?? data.amount ?? 0) / 100 || 49;
    const currency = (data.currency || "USD").toUpperCase();
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

    console.log(`[whop-webhook] forwarded ${type} → GA4 status=${ga.status} value=${value} ${currency} utm=${JSON.stringify(utm)}`);
    res.status(200).json({ ok: true, type, ga4_status: ga.status });
  } catch (err) {
    console.error("[whop-webhook] error:", err);
    res.status(500).json({ error: "internal", detail: String(err?.message || err) });
  }
}
